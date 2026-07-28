import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LeaveStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveDto } from './dto/update-leave.dto';
import { ApproveLeaveDto } from './dto/approve-leave.dto';
import { RejectLeaveDto } from './dto/reject-leave.dto';
import { AuditService } from '../audit/audit.service';
import { PaginationDto } from '../common/pagination.dto';
import { buildPaginationOptions, PaginationResult, buildDateRangeFilter } from '../common/pagination.util';

@Injectable()
export class LeaveService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private readonly leaveInclude = {
    employee: {
      include: {
        branch: true,
        designation: true,
      },
    },
  } satisfies Prisma.LeaveInclude;
    
  async create(employeeId: string, createLeaveDto: CreateLeaveDto) {
    const employee = await this.prisma.employee.findUnique({
      where: {
        id: employeeId,
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    if (createLeaveDto.fromDate > createLeaveDto.toDate) {
      throw new BadRequestException(
        'From Date cannot be greater than To Date',
      );
    }

    const duplicate = await this.prisma.leave.findFirst({
      where: {
        employeeId: employeeId,
        status: {
          not: LeaveStatus.REJECTED,
        },
        fromDate: {
          lte: createLeaveDto.toDate,
        },
        toDate: {
          gte: createLeaveDto.fromDate,
        },
      },
    });

    if (duplicate) {
      throw new ConflictException(
        'Leave already exists for selected dates',
      );
    }

    const totalDays =
      (createLeaveDto.toDate.getTime() -
        createLeaveDto.fromDate.getTime()) /
        (1000 * 60 * 60 * 24) +
      1;

    const year = new Date().getFullYear();
    const startOfYear = new Date(Date.UTC(year, 0, 1));
    const startOfNextYear = new Date(Date.UTC(year + 1, 0, 1));

    const leaveCount = await this.prisma.leave.count({
      where: {
        createdAt: {
          gte: startOfYear,
          lt: startOfNextYear,
        },
      },
    });

    const leaveNumber = `LEV-${year}-${String(leaveCount + 1).padStart(6, '0')}`;

    return this.prisma.leave.create({
      data: {
  ...createLeaveDto,
  employeeId,
  leaveNumber,
  totalDays: createLeaveDto.isHalfDay ? 0.5 : totalDays,
},
      include: this.leaveInclude,
    });
  }

  async findAll(query: Partial<PaginationDto>): Promise<PaginationResult<any>> {
    const { page, limit, skip, orderBy } = buildPaginationOptions(query);

    const where: any = {};

    if (query.search) {
      where.OR = [
        { leaveNumber: { contains: query.search, mode: 'insensitive' } },
        { remarks: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const dateFilter = buildDateRangeFilter('createdAt', query.dateFrom, query.dateTo);
    if (dateFilter) {
      where.AND = where.AND || [];
      where.AND.push(dateFilter);
    }

    const [total, data] = await Promise.all([
      this.prisma.leave.count({ where }),
      this.prisma.leave.findMany({
        where,
        include: this.leaveInclude,
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: { total, page, limit, totalPages },
    };
  }

  async findOne(id: string) {
    const leave = await this.prisma.leave.findUnique({
      where: {
        id,
      },
      include: this.leaveInclude,
    });

    if (!leave) {
      throw new NotFoundException('Leave not found');
    }

    return leave;
  }

    async update(id: string, updateLeaveDto: UpdateLeaveDto) {
      const existingLeave = await this.findOne(id);

      if (existingLeave.status !== LeaveStatus.PENDING) {
        throw new ConflictException('Only pending leaves can be updated');
      }

      if (
        updateLeaveDto.fromDate &&
        updateLeaveDto.toDate &&
        updateLeaveDto.fromDate > updateLeaveDto.toDate
      ) {
        throw new BadRequestException('From Date cannot be greater than To Date');
      }

      // If dates are changing, ensure no overlap with other leaves
      const newFromDate = updateLeaveDto.fromDate ?? existingLeave.fromDate;
      const newToDate = updateLeaveDto.toDate ?? existingLeave.toDate;

      const overlapping = await this.prisma.leave.findFirst({
        where: {
          id: { not: id },
          employeeId: existingLeave.employeeId,
          status: { not: LeaveStatus.REJECTED },
          fromDate: { lte: newToDate },
          toDate: { gte: newFromDate },
        },
      });

      if (overlapping) {
        throw new ConflictException('Leave already exists for selected dates');
      }

      return this.prisma.leave.update({
        where: { id },
        data: updateLeaveDto,
        include: this.leaveInclude,
      });
    }

  async approve(id: string, approveLeaveDto: ApproveLeaveDto, approverId?: string) {
    const leave = await this.findOne(id);

    if (leave.status === LeaveStatus.APPROVED) {
      throw new ConflictException('Leave is already approved');
    }

    // Wrap update and audit creation in a transaction for atomicity
    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedLeave = await tx.leave.update({
        where: { id },
        data: {
          status: LeaveStatus.APPROVED,
          approvedAt: new Date(),
          remarks: approveLeaveDto.remarks ?? leave.remarks,
          approvedBy: approverId ?? leave.approvedBy,
        },
      });

      // create audit log
      await this.auditService.create({
        userId: approverId ?? undefined,
        employeeCode: leave.employee?.employeeCode ?? undefined,
        action: 'approve_leave',
        module: 'leave',
        description: `Leave ${leave.leaveNumber} approved`,
      });

      return updatedLeave;
    });

    return this.prisma.leave.findUnique({ where: { id }, include: this.leaveInclude });
  }

  async reject(id: string, rejectLeaveDto: RejectLeaveDto) {
    const leave = await this.findOne(id);

    if (leave.status === LeaveStatus.REJECTED) {
      throw new ConflictException('Leave is already rejected');
    }

    // Wrap update and audit creation in transaction
    await this.prisma.$transaction(async (tx) => {
      await tx.leave.update({
        where: { id },
        data: {
          status: LeaveStatus.REJECTED,
          rejectionReason: rejectLeaveDto.rejectionReason,
        },
      });

      await this.auditService.create({
        userId: undefined,
        employeeCode: leave.employee?.employeeCode ?? undefined,
        action: 'reject_leave',
        module: 'leave',
        description: `Leave ${leave.leaveNumber} rejected`,
      });
    });

    return this.prisma.leave.findUnique({ where: { id }, include: this.leaveInclude });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.leave.delete({
      where: { id },
      include: this.leaveInclude,
    });
  }
}