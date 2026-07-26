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

@Injectable()
export class LeaveService {
  constructor(private readonly prisma: PrismaService) {}

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

const leaveCount = await this.prisma.leave.count();

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

  async findAll() {
    return this.prisma.leave.findMany({
      include: this.leaveInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });
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
    await this.findOne(id);

    return this.prisma.leave.update({
      where: { id },
      data: updateLeaveDto,
      include: this.leaveInclude,
    });
  }

  async approve(id: string, _approveLeaveDto: ApproveLeaveDto) {
    const leave = await this.findOne(id);

    if (leave.status === LeaveStatus.APPROVED) {
      throw new ConflictException('Leave is already approved');
    }

    return this.prisma.leave.update({
      where: { id },
      data: {
        status: LeaveStatus.APPROVED,
        approvedAt: new Date(),
      },
      include: this.leaveInclude,
    });
  }

  async reject(id: string, rejectLeaveDto: RejectLeaveDto) {
    const leave = await this.findOne(id);

    if (leave.status === LeaveStatus.REJECTED) {
      throw new ConflictException('Leave is already rejected');
    }

    return this.prisma.leave.update({
      where: { id },
      data: {
        status: LeaveStatus.REJECTED,
        rejectionReason: rejectLeaveDto.rejectionReason,
      },
      include: this.leaveInclude,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.leave.delete({
      where: { id },
      include: this.leaveInclude,
    });
  }
}