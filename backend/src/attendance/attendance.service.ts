import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Attendance,
  AttendanceBreak,
  AttendanceStatus,
  Prisma,
  Shift,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';

interface AttendanceMetrics {
  breakMinutes: number;
  earlyExitMinutes: number;
  lateMinutes: number;
  netWorkingMinutes: number;
  overtimeMinutes: number;
  workingMinutes: number;
}

interface AttendanceWithBreaks extends Pick<
  Attendance,
  'checkIn' | 'checkOut' | 'date' | 'employeeId' | 'id'
> {
  breaks: Pick<AttendanceBreak, 'breakIn' | 'breakOut' | 'minutes'>[];
}

@Injectable()
export class AttendanceService {
  private readonly attendanceInclude = {
    employee: {
      include: {
        branch: {
          include: {
            company: true,
          },
        },
        designation: {
          include: {
            department: true,
          },
        },
        shift: true,
      },
    },
    breaks: {
      orderBy: {
        breakOut: 'asc',
      },
    },
  } satisfies Prisma.AttendanceInclude;

  constructor(private readonly prisma: PrismaService) {}

  async create(createAttendanceDto: CreateAttendanceDto) {
    const employee = await this.getEmployeeWithShift(
      this.prisma,
      createAttendanceDto.employeeId,
    );
    const date = this.parseAttendanceDate(createAttendanceDto.date);
    const checkIn = this.parseOptionalDate(
      createAttendanceDto.checkIn,
      'checkIn',
    );
    const checkOut = this.parseOptionalDate(
      createAttendanceDto.checkOut,
      'checkOut',
    );

    this.validateAttendanceTimes(checkIn, checkOut);
    this.validateCheckInAttendanceDate(date, checkIn);

    const duplicateAttendance = await this.prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: employee.id,
          date,
        },
      },
    });

    if (duplicateAttendance) {
      throw new ConflictException(
        'Attendance already exists for this employee and date',
      );
    }

    const metrics = this.calculateAttendanceMetrics(
      {
        id: '',
        employeeId: employee.id,
        date,
        checkIn,
        checkOut,
        breaks: [],
      },
      this.resolveShift(employee),
    );

    try {
      return await this.prisma.attendance.create({
        data: {
          employeeId: employee.id,
          date,
          checkIn,
          checkOut,
          status: createAttendanceDto.status ?? AttendanceStatus.PRESENT,
          remarks: this.normalizeRemarks(createAttendanceDto.remarks),
          ...metrics,
        },
        include: this.attendanceInclude,
      });
    } catch (error) {
      this.throwDuplicateAttendanceError(error);
    }
  }

  async findAll(query: AttendanceQueryDto = {}) {
    const where: Prisma.AttendanceWhereInput = {};

    if (query.employeeId) {
      where.employeeId = query.employeeId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.date) {
      where.date = this.parseAttendanceDate(query.date);
    } else if (query.fromDate || query.toDate) {
      const fromDate = query.fromDate
        ? this.parseAttendanceDate(query.fromDate)
        : undefined;
      const toDate = query.toDate
        ? this.parseAttendanceDate(query.toDate)
        : undefined;

      if (fromDate && toDate && fromDate > toDate) {
        throw new BadRequestException('fromDate must be on or before toDate');
      }

      where.date = {
        ...(fromDate ? { gte: fromDate } : {}),
        ...(toDate ? { lte: toDate } : {}),
      };
    }

    return await this.prisma.attendance.findMany({
      where,
      orderBy: [{ date: 'desc' }, { checkIn: 'desc' }],
      include: this.attendanceInclude,
    });
  }

  async findOne(id: string) {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id },
      include: this.attendanceInclude,
    });

    if (!attendance) {
      throw new NotFoundException('Attendance not found');
    }

    return attendance;
  }

  async findBreak(id: string) {
    const attendanceBreak = await this.prisma.attendanceBreak.findUnique({
      where: { id },
      include: {
        attendance: {
          select: {
            employeeId: true,
          },
        },
      },
    });

    if (!attendanceBreak) {
      throw new NotFoundException('Break not found');
    }

    return attendanceBreak;
  }

  async update(id: string, updateAttendanceDto: UpdateAttendanceDto) {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id },
      include: {
        breaks: {
          orderBy: {
            breakOut: 'asc',
          },
        },
      },
    });

    if (!attendance) {
      throw new NotFoundException('Attendance not found');
    }

    const employeeId = updateAttendanceDto.employeeId ?? attendance.employeeId;
    const employee = await this.getEmployeeWithShift(this.prisma, employeeId);
    const date = updateAttendanceDto.date
      ? this.parseAttendanceDate(updateAttendanceDto.date)
      : attendance.date;
    const checkIn = updateAttendanceDto.checkIn
      ? this.parseOptionalDate(updateAttendanceDto.checkIn, 'checkIn')
      : attendance.checkIn;
    const checkOut = updateAttendanceDto.checkOut
      ? this.parseOptionalDate(updateAttendanceDto.checkOut, 'checkOut')
      : attendance.checkOut;

    this.validateAttendanceTimes(checkIn, checkOut);
    this.validateCheckInAttendanceDate(date, checkIn);

    if (!checkIn && attendance.breaks.length > 0) {
      throw new BadRequestException(
        'Attendance with recorded breaks must have a check-in time',
      );
    }

    if (
      checkOut &&
      attendance.breaks.some((attendanceBreak) => !attendanceBreak.breakIn)
    ) {
      throw new BadRequestException(
        'Cannot check out while an active break exists',
      );
    }

    const metrics = this.calculateAttendanceMetrics(
      {
        id: attendance.id,
        employeeId,
        date,
        checkIn,
        checkOut,
        breaks: attendance.breaks,
      },
      this.resolveShift(employee),
    );

    try {
      return await this.prisma.attendance.update({
        where: { id },
        data: {
          employeeId,
          date,
          checkIn,
          checkOut,
          status: updateAttendanceDto.status ?? attendance.status,
          remarks:
            updateAttendanceDto.remarks === undefined
              ? attendance.remarks
              : this.normalizeRemarks(updateAttendanceDto.remarks),
          ...metrics,
        },
        include: this.attendanceInclude,
      });
    } catch (error) {
      this.throwDuplicateAttendanceError(error);
    }
  }

  async remove(id: string) {
    await this.findOne(id);

    return await this.prisma.$transaction(async (transaction) => {
      await transaction.attendanceBreak.deleteMany({
        where: { attendanceId: id },
      });

      return await transaction.attendance.delete({
        where: { id },
        include: this.attendanceInclude,
      });
    });
  }

  async checkIn(employeeId: string) {
    const employee = await this.getEmployeeWithShift(this.prisma, employeeId);
    const checkIn = new Date();
    const date = this.getAttendanceDate(checkIn);

    const existingAttendance = await this.prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: employee.id,
          date,
        },
      },
    });

    if (existingAttendance) {
      throw new ConflictException('Employee has already checked in today');
    }

    const metrics = this.calculateAttendanceMetrics(
      {
        id: '',
        employeeId: employee.id,
        date,
        checkIn,
        checkOut: null,
        breaks: [],
      },
      this.resolveShift(employee),
    );

    try {
      return await this.prisma.attendance.create({
        data: {
          employeeId: employee.id,
          date,
          checkIn,
          status: AttendanceStatus.PRESENT,
          ...metrics,
        },
        include: this.attendanceInclude,
      });
    } catch (error) {
      this.throwDuplicateAttendanceError(error);
    }
  }

  async checkOut(employeeId: string) {
    return await this.prisma.$transaction(async (transaction) => {
      const attendance = await transaction.attendance.findFirst({
        where: {
          employeeId,
          checkIn: {
            not: null,
          },
          checkOut: null,
        },
        orderBy: {
          date: 'desc',
        },
        include: {
          breaks: {
            orderBy: {
              breakOut: 'asc',
            },
          },
        },
      });

      if (!attendance || !attendance.checkIn) {
        throw new BadRequestException('No open checked-in attendance found');
      }

      if (
        attendance.breaks.some((attendanceBreak) => !attendanceBreak.breakIn)
      ) {
        throw new BadRequestException(
          'Cannot check out while an active break exists',
        );
      }

      const checkOut = new Date();
      this.validateAttendanceTimes(attendance.checkIn, checkOut);

      const employee = await this.getEmployeeWithShift(transaction, employeeId);
      const metrics = this.calculateAttendanceMetrics(
        {
          id: attendance.id,
          employeeId: attendance.employeeId,
          date: attendance.date,
          checkIn: attendance.checkIn,
          checkOut,
          breaks: attendance.breaks,
        },
        this.resolveShift(employee),
      );

      return await transaction.attendance.update({
        where: { id: attendance.id },
        data: {
          checkOut,
          ...metrics,
        },
        include: this.attendanceInclude,
      });
    });
  }

  async breakOut(attendanceId: string) {
    return await this.prisma.$transaction(async (transaction) => {
      const attendance = await transaction.attendance.findUnique({
        where: { id: attendanceId },
        include: {
          breaks: {
            orderBy: {
              breakOut: 'asc',
            },
          },
        },
      });

      if (!attendance) {
        throw new NotFoundException('Attendance not found');
      }

      if (!attendance.checkIn) {
        throw new BadRequestException(
          'Cannot start a break before checking in',
        );
      }

      if (attendance.checkOut) {
        throw new BadRequestException(
          'Cannot start a break after checking out',
        );
      }

      if (
        attendance.breaks.some((attendanceBreak) => !attendanceBreak.breakIn)
      ) {
        throw new ConflictException('An active break already exists');
      }

      const breakOut = new Date();

      if (breakOut < attendance.checkIn) {
        throw new BadRequestException('Break-out time cannot precede check-in');
      }

      return await transaction.attendanceBreak.create({
        data: {
          attendanceId: attendance.id,
          breakOut,
        },
        include: {
          attendance: {
            include: {
              employee: this.attendanceInclude.employee,
            },
          },
        },
      });
    });
  }

  async breakIn(breakId: string) {
    return await this.prisma.$transaction(async (transaction) => {
      const attendanceBreak = await transaction.attendanceBreak.findUnique({
        where: { id: breakId },
        include: {
          attendance: {
            include: {
              breaks: {
                orderBy: {
                  breakOut: 'asc',
                },
              },
            },
          },
        },
      });

      if (!attendanceBreak) {
        throw new NotFoundException('Break not found');
      }

      if (attendanceBreak.breakIn) {
        throw new ConflictException('This break has already been closed');
      }

      if (attendanceBreak.attendance.checkOut) {
        throw new BadRequestException('Cannot close a break after check-out');
      }

      const breakIn = new Date();

      if (breakIn < attendanceBreak.breakOut) {
        throw new BadRequestException(
          'Break-in time cannot precede break-out time',
        );
      }

      const minutes = this.getElapsedMinutes(attendanceBreak.breakOut, breakIn);
      const completedBreaks = attendanceBreak.attendance.breaks.map(
        (breakRecord) =>
          breakRecord.id === attendanceBreak.id
            ? {
                ...breakRecord,
                breakIn,
                minutes,
              }
            : breakRecord,
      );
      const employee = await this.getEmployeeWithShift(
        transaction,
        attendanceBreak.attendance.employeeId,
      );
      const metrics = this.calculateAttendanceMetrics(
        {
          id: attendanceBreak.attendance.id,
          employeeId: attendanceBreak.attendance.employeeId,
          date: attendanceBreak.attendance.date,
          checkIn: attendanceBreak.attendance.checkIn,
          checkOut: attendanceBreak.attendance.checkOut,
          breaks: completedBreaks,
        },
        this.resolveShift(employee),
      );

      await transaction.attendance.update({
        where: { id: attendanceBreak.attendanceId },
        data: metrics,
      });

      return await transaction.attendanceBreak.update({
        where: { id: breakId },
        data: {
          breakIn,
          minutes,
        },
        include: {
          attendance: {
            include: {
              employee: this.attendanceInclude.employee,
            },
          },
        },
      });
    });
  }

  private async getEmployeeWithShift(
    client: PrismaService | Prisma.TransactionClient,
    employeeId: string,
  ) {
    const employee = await client.employee.findUnique({
      where: { id: employeeId },
      include: {
        shift: true,
        branch: {
          include: {
            shifts: {
              orderBy: {
                startTime: 'asc',
              },
            },
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return employee;
  }

  private resolveShift(employee: {
    shift: Shift | null;
    branch: { shifts: Shift[] };
  }): Shift | null {
    return employee.shift ?? employee.branch.shifts[0] ?? null;
  }

  private calculateAttendanceMetrics(
    attendance: AttendanceWithBreaks,
    shift: Shift | null,
  ): AttendanceMetrics {
    const breakMinutes = attendance.breaks.reduce(
      (total, attendanceBreak) => total + attendanceBreak.minutes,
      0,
    );

    const schedule =
      attendance.checkIn && shift
        ? this.getShiftSchedule(attendance.date, shift)
        : null;
    const lateMinutes =
      attendance.checkIn && schedule
        ? Math.max(
            this.getElapsedMinutes(schedule.start, attendance.checkIn),
            0,
          )
        : 0;

    if (!attendance.checkIn || !attendance.checkOut) {
      return {
        breakMinutes,
        workingMinutes: 0,
        netWorkingMinutes: 0,
        overtimeMinutes: 0,
        lateMinutes,
        earlyExitMinutes: 0,
      };
    }

    const workingMinutes = this.getElapsedMinutes(
      attendance.checkIn,
      attendance.checkOut,
    );
    const netWorkingMinutes = Math.max(workingMinutes - breakMinutes, 0);

    if (!shift) {
      return {
        breakMinutes,
        workingMinutes,
        netWorkingMinutes,
        overtimeMinutes: 0,
        lateMinutes: 0,
        earlyExitMinutes: 0,
      };
    }

    const resolvedSchedule = this.getShiftSchedule(attendance.date, shift);

    return {
      breakMinutes,
      workingMinutes,
      netWorkingMinutes,
      overtimeMinutes: Math.max(
        netWorkingMinutes - resolvedSchedule.scheduledMinutes,
        0,
      ),
      lateMinutes: Math.max(
        this.getElapsedMinutes(resolvedSchedule.start, attendance.checkIn),
        0,
      ),
      earlyExitMinutes: Math.max(
        this.getElapsedMinutes(attendance.checkOut, resolvedSchedule.end),
        0,
      ),
    };
  }

  private getShiftSchedule(date: Date, shift: Shift) {
    const startTime = this.parseShiftTime(shift.startTime, 'startTime');
    const endTime = this.parseShiftTime(shift.endTime, 'endTime');
    const dateParts = {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
    };
    const start = this.toZonedDateTime(dateParts, startTime);
    const isOvernight =
      endTime.hour * 60 + endTime.minute + endTime.second / 60 <=
      startTime.hour * 60 + startTime.minute + startTime.second / 60;
    const endDateParts = isOvernight
      ? this.addCalendarDays(dateParts, 1)
      : dateParts;
    const end = this.toZonedDateTime(endDateParts, endTime);

    return {
      start,
      end,
      scheduledMinutes: this.getElapsedMinutes(start, end),
    };
  }

  private parseShiftTime(value: string, fieldName: string) {
    const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);

    if (!match) {
      throw new BadRequestException(
        `Assigned shift ${fieldName} must use HH:mm or HH:mm:ss format`,
      );
    }

    const hour = Number(match[1]);
    const minute = Number(match[2]);
    const second = Number(match[3] ?? 0);

    if (hour > 23 || minute > 59 || second > 59) {
      throw new BadRequestException(
        `Assigned shift ${fieldName} contains an invalid time`,
      );
    }

    return { hour, minute, second };
  }

  private toZonedDateTime(
    dateParts: { year: number; month: number; day: number },
    timeParts: { hour: number; minute: number; second: number },
  ): Date {
    const localTimestamp = Date.UTC(
      dateParts.year,
      dateParts.month - 1,
      dateParts.day,
      timeParts.hour,
      timeParts.minute,
      timeParts.second,
    );
    let timestamp = localTimestamp;

    for (let index = 0; index < 3; index += 1) {
      const offset = this.getTimeZoneOffset(new Date(timestamp));
      const resolvedTimestamp = localTimestamp - offset;

      if (resolvedTimestamp === timestamp) {
        break;
      }

      timestamp = resolvedTimestamp;
    }

    return new Date(timestamp);
  }

  private getTimeZoneOffset(date: Date): number {
    const parts = this.getDateTimeParts(date);
    const zonedTimestamp = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    );

    return zonedTimestamp - date.getTime();
  }

  private getAttendanceDate(date: Date): Date {
    const parts = this.getDateTimeParts(date);

    return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  }

  private parseAttendanceDate(value: string): Date {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

    if (!match) {
      throw new BadRequestException('date must use the YYYY-MM-DD format');
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));

    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      throw new BadRequestException('date is not a valid calendar date');
    }

    return date;
  }

  private parseOptionalDate(
    value: string | undefined,
    fieldName: string,
  ): Date | null {
    if (!value) {
      return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${fieldName} must be a valid ISO date`);
    }

    return date;
  }

  private validateAttendanceTimes(
    checkIn: Date | null,
    checkOut: Date | null,
  ): void {
    if (checkOut && !checkIn) {
      throw new BadRequestException('checkOut requires a checkIn time');
    }

    if (checkIn && checkOut && checkOut <= checkIn) {
      throw new BadRequestException('checkOut must be later than checkIn');
    }
  }

  private validateCheckInAttendanceDate(
    attendanceDate: Date,
    checkIn: Date | null,
  ): void {
    if (!checkIn) {
      return;
    }

    if (
      this.getAttendanceDate(checkIn).getTime() !== attendanceDate.getTime()
    ) {
      throw new BadRequestException(
        'checkIn must fall on the attendance date in the configured attendance timezone',
      );
    }
  }

  private getElapsedMinutes(start: Date, end: Date): number {
    return Math.floor((end.getTime() - start.getTime()) / 60_000);
  }

  private normalizeRemarks(remarks: string | undefined): string | null {
    const normalizedRemarks = remarks?.trim();

    return normalizedRemarks || null;
  }

  private getDateTimeParts(date: Date) {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: this.getAttendanceTimeZone(),
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });
    const formattedParts = formatter.formatToParts(date);
    const values = new Map(
      formattedParts
        .filter((part) => part.type !== 'literal')
        .map((part) => [part.type, Number(part.value)]),
    );

    return {
      year: values.get('year') ?? 0,
      month: values.get('month') ?? 0,
      day: values.get('day') ?? 0,
      hour: values.get('hour') ?? 0,
      minute: values.get('minute') ?? 0,
      second: values.get('second') ?? 0,
    };
  }

  private getAttendanceTimeZone(): string {
    const configuredTimeZone = process.env.ATTENDANCE_TIMEZONE?.trim();

    if (!configuredTimeZone) {
      return 'Asia/Kolkata';
    }

    try {
      new Intl.DateTimeFormat('en-US', {
        timeZone: configuredTimeZone,
      }).format();

      return configuredTimeZone;
    } catch {
      return 'Asia/Kolkata';
    }
  }

  private addCalendarDays(
    dateParts: { year: number; month: number; day: number },
    days: number,
  ) {
    const date = new Date(
      Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day + days),
    );

    return {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
    };
  }

  private throwDuplicateAttendanceError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        'Attendance already exists for this employee and date',
      );
    }

    throw error;
  }
}
