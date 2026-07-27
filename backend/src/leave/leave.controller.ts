import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { Request } from 'express';

import { LeaveService } from './leave.service';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveDto } from './dto/update-leave.dto';
import { ApproveLeaveDto } from './dto/approve-leave.dto';
import { RejectLeaveDto } from './dto/reject-leave.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

interface AuthenticatedLeaveUser {
  employeeId: string | null;
  role: UserRole;
}

type AuthenticatedRequest = Request & {
  user: AuthenticatedLeaveUser;
};

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('leave')
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Roles(UserRole.EMPLOYEE)
  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() createLeaveDto: CreateLeaveDto,
  ) {
    const employeeId = this.resolveEmployeeId(request.user);

    return this.leaveService.create(employeeId, createLeaveDto);
  }

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_ADMIN,
    UserRole.HR_MANAGER,
    UserRole.HR_EXECUTIVE,
  )
  @Get()
  findAll() {
    return this.leaveService.findAll();
  }

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_ADMIN,
    UserRole.HR_MANAGER,
    UserRole.HR_EXECUTIVE,
    UserRole.EMPLOYEE,
  )
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.leaveService.findOne(id);
  }

  @Roles(UserRole.EMPLOYEE)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateLeaveDto: UpdateLeaveDto,
  ) {
    return this.leaveService.update(id, updateLeaveDto);
  }

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_ADMIN,
    UserRole.HR_MANAGER,
  )
  @Patch(':id/approve')
  approve(
    @Req() request: Request,
    @Param('id') id: string,
    @Body() approveLeaveDto: ApproveLeaveDto,
  ) {
    const approverId = (request as any).user?.id ?? null;
    return this.leaveService.approve(id, approveLeaveDto, approverId);
  }

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_ADMIN,
    UserRole.HR_MANAGER,
  )
  @Patch(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() rejectLeaveDto: RejectLeaveDto,
  ) {
    return this.leaveService.reject(id, rejectLeaveDto);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.leaveService.remove(id);
  }

  private resolveEmployeeId(user: AuthenticatedLeaveUser): string {
    if (!user.employeeId) {
      throw new ForbiddenException(
        'Authenticated user is not linked to an employee',
      );
    }

    return user.employeeId;
  }
}