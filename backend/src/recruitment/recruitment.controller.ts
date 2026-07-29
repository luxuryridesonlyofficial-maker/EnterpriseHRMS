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
@ApiTags('recruitment')
@ApiBearerAuth()
@Controller('recruitment')
export class RecruitmentController {
  constructor(private readonly svc: RecruitmentService) {}

  @Roles(UserRole.HR_MANAGER, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Create a candidate record' })
  @ApiResponse({ status: 201, description: 'Candidate created' })
  @Post('candidates')
  createCandidate(@Body() dto: CreateCandidateDto) {
    return this.svc.createCandidate(dto);
  }

  @Roles(UserRole.HR_MANAGER, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'List candidates' })
  @ApiResponse({ status: 200, description: 'List of candidates' })
  @Get('candidates')
  listCandidates() {
    return this.svc.listCandidates();
  }

  @Roles(UserRole.HR_MANAGER, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get candidate by id' })
  @ApiResponse({ status: 200, description: 'Candidate details' })
  @Get('candidates/:id')
  getCandidate(@Param('id') id: string) {
    return this.svc.findCandidate(id);
  }

  @Roles(UserRole.HR_MANAGER, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Schedule an interview' })
  @ApiResponse({ status: 201, description: 'Interview scheduled' })
  @Post('interviews')
  scheduleInterview(@Body() dto: CreateInterviewDto) {
    return this.svc.scheduleInterview(dto);
  }

  @Roles(UserRole.HR_MANAGER, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'List interviews' })
  @ApiResponse({ status: 200, description: 'List of interviews' })
  @Get('interviews')
  listInterviews() {
    return this.svc.listInterviews();
  }

  @Roles(UserRole.HR_MANAGER, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Hire a candidate and create an employee' })
  @ApiResponse({ status: 200, description: 'Candidate hired' })
  @Post('candidates/:id/hire')
  hireCandidate(@Param('id') id: string, @Body() employeeData: any, @Req() req: Request) {
    const userId = (req as any).user?.id ?? undefined;
    return this.svc.hireCandidate(id, employeeData, userId);
  }

  @Roles(UserRole.HR_MANAGER, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Convert candidate to employee record' })
  @ApiResponse({ status: 200, description: 'Candidate converted' })
  @Post('candidates/:id/convert')
  convertCandidate(@Param('id') id: string, @Body() employeeData: any, @Req() req: Request) {
    const userId = (req as any).user?.id ?? undefined;
    return this.svc.convertCandidate(id, employeeData, userId);
  }

  @Roles(UserRole.HR_MANAGER, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Candidate accepts an offer' })
  @ApiResponse({ status: 200, description: 'Offer accepted' })
  @Post('candidates/:id/accept-offer')
  acceptOffer(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user?.id ?? undefined;
    return this.svc.acceptOffer(id, userId);
  }
}
