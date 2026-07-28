import { Controller, Post, Body, Get, Param, UseGuards, Req } from '@nestjs/common';
import { RecruitmentService } from './recruitment.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('recruitment')
export class RecruitmentController {
  constructor(private readonly svc: RecruitmentService) {}

  @Roles(UserRole.HR_MANAGER, UserRole.COMPANY_ADMIN)
  @Post('candidates')
  createCandidate(@Body() dto: CreateCandidateDto) {
    return this.svc.createCandidate(dto);
  }

  @Roles(UserRole.HR_MANAGER, UserRole.COMPANY_ADMIN)
  @Get('candidates')
  listCandidates() {
    return this.svc.listCandidates();
  }

  @Roles(UserRole.HR_MANAGER, UserRole.COMPANY_ADMIN)
  @Get('candidates/:id')
  getCandidate(@Param('id') id: string) {
    return this.svc.findCandidate(id);
  }

  @Roles(UserRole.HR_MANAGER, UserRole.COMPANY_ADMIN)
  @Post('interviews')
  scheduleInterview(@Body() dto: CreateInterviewDto) {
    return this.svc.scheduleInterview(dto);
  }

  @Roles(UserRole.HR_MANAGER, UserRole.COMPANY_ADMIN)
  @Get('interviews')
  listInterviews() {
    return this.svc.listInterviews();
  }

  @Roles(UserRole.HR_MANAGER, UserRole.COMPANY_ADMIN)
  @Post('candidates/:id/hire')
  hireCandidate(@Param('id') id: string, @Body() employeeData: any, @Req() req: Request) {
    const userId = (req as any).user?.id ?? undefined;
    return this.svc.hireCandidate(id, employeeData, userId);
  }

  @Roles(UserRole.HR_MANAGER, UserRole.COMPANY_ADMIN)
  @Post('candidates/:id/convert')
  convertCandidate(@Param('id') id: string, @Body() employeeData: any, @Req() req: Request) {
    const userId = (req as any).user?.id ?? undefined;
    return this.svc.convertCandidate(id, employeeData, userId);
  }

  @Roles(UserRole.HR_MANAGER, UserRole.COMPANY_ADMIN)
  @Post('candidates/:id/accept-offer')
  acceptOffer(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user?.id ?? undefined;
    return this.svc.acceptOffer(id, userId);
  }
}
