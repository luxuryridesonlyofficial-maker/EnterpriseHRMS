import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AttendanceService } from './attendance.service';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
import { CheckInDto } from './dto/check-in.dto';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';

interface AuthenticatedAttendanceUser {
  employeeId: string | null;
  role: UserRole;
}

type AuthenticatedRequest = Request & {
  user: AuthenticatedAttendanceUser;
};

const ATTENDANCE_MANAGEMENT_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.COMPANY_ADMIN,
  UserRole.HR_MANAGER,
  UserRole.HR_EXECUTIVE,
  UserRole.MANAGER,
  UserRole.TEAM_LEAD,
];

const ATTENDANCE_ACTION_ROLES: UserRole[] = [
  ...ATTENDANCE_MANAGEMENT_ROLES,
  UserRole.EMPLOYEE,
];

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Roles(...ATTENDANCE_MANAGEMENT_ROLES)
  @Post()
  async create(@Body() createAttendanceDto: CreateAttendanceDto) {
    return await this.attendanceService.create(createAttendanceDto);
  }

  @Roles(...ATTENDANCE_MANAGEMENT_ROLES)
  @Get()
  async findAll(@Query() query: AttendanceQueryDto) {
    return await this.attendanceService.findAll(query);
  }

  @Roles(...ATTENDANCE_MANAGEMENT_ROLES)
  @Get(':id')
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return await this.attendanceService.findOne(id);
  }

  @Roles(...ATTENDANCE_MANAGEMENT_ROLES)
  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateAttendanceDto: UpdateAttendanceDto,
  ) {
    return await this.attendanceService.update(id, updateAttendanceDto);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER)
  @Delete(':id')
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return await this.attendanceService.remove(id);
  }

  @Roles(...ATTENDANCE_ACTION_ROLES)
  @Post('check-in')
  async checkIn(
    @Req() request: AuthenticatedRequest,
    @Body() checkInDto: CheckInDto,
  ) {
    const employeeId = this.resolveEmployeeId(
      request.user,
      checkInDto.employeeId,
    );

    return await this.attendanceService.checkIn(employeeId);
  }

  @Roles(...ATTENDANCE_ACTION_ROLES)
  @Patch('check-out/:employeeId')
  async checkOut(
    @Req() request: AuthenticatedRequest,
    @Param('employeeId', new ParseUUIDPipe()) requestedEmployeeId: string,
  ) {
    const employeeId = this.resolveEmployeeId(
      request.user,
      requestedEmployeeId,
    );

    return await this.attendanceService.checkOut(employeeId);
  }

  @Roles(...ATTENDANCE_ACTION_ROLES)
  @Post('break-out/:attendanceId')
  async breakOut(
    @Req() request: AuthenticatedRequest,
    @Param('attendanceId', new ParseUUIDPipe()) attendanceId: string,
  ) {
    await this.assertAttendanceAccess(request.user, attendanceId);

    return await this.attendanceService.breakOut(attendanceId);
  }

  @Roles(...ATTENDANCE_ACTION_ROLES)
  @Patch('break-in/:breakId')
  async breakIn(
    @Req() request: AuthenticatedRequest,
    @Param('breakId', new ParseUUIDPipe()) breakId: string,
  ) {
    await this.assertBreakAccess(request.user, breakId);

    return await this.attendanceService.breakIn(breakId);
  }

  private resolveEmployeeId(
    user: AuthenticatedAttendanceUser,
    requestedEmployeeId?: string,
  ): string {
    if (user.role !== UserRole.EMPLOYEE) {
      if (!requestedEmployeeId) {
        throw new BadRequestException(
          'employeeId is required for non-employee users',
        );
      }

      return requestedEmployeeId;
    }

    if (!user.employeeId) {
      throw new ForbiddenException(
        'The authenticated user is not linked to an employee',
      );
    }

    if (requestedEmployeeId && requestedEmployeeId !== user.employeeId) {
      throw new ForbiddenException(
        'Employees can only manage their own attendance',
      );
    }

    return user.employeeId;
  }

  private async assertAttendanceAccess(
    user: AuthenticatedAttendanceUser,
    attendanceId: string,
  ): Promise<void> {
    if (user.role !== UserRole.EMPLOYEE) {
      return;
    }

    const employeeId = this.resolveEmployeeId(user);
    const attendance = await this.attendanceService.findOne(attendanceId);

    if (attendance.employeeId !== employeeId) {
      throw new ForbiddenException(
        'Employees can only manage their own attendance',
      );
    }
  }

  private async assertBreakAccess(
    user: AuthenticatedAttendanceUser,
    breakId: string,
  ): Promise<void> {
    if (user.role !== UserRole.EMPLOYEE) {
      return;
    }

    const employeeId = this.resolveEmployeeId(user);
    const attendanceBreak = await this.attendanceService.findBreak(breakId);

    if (attendanceBreak.attendance.employeeId !== employeeId) {
      throw new ForbiddenException(
        'Employees can only manage their own attendance',
      );
    }
  }
}
