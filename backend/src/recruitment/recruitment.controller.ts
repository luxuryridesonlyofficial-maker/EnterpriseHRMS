import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { RecruitmentService } from './recruitment.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('recruitment')
export class RecruitmentController {
  constructor(private readonly svc: RecruitmentService) {}

  @Post('candidates')
  createCandidate(@Body() dto: CreateCandidateDto) {
    return this.svc.createCandidate(dto);
  }

  @Get('candidates')
  listCandidates() {
    return this.svc.listCandidates();
  }

  @Get('candidates/:id')
  getCandidate(@Param('id') id: string) {
    return this.svc.findCandidate(id);
  }

  @Post('interviews')
  scheduleInterview(@Body() dto: CreateInterviewDto) {
    return this.svc.scheduleInterview(dto);
  }

  @Get('interviews')
  listInterviews() {
    return this.svc.listInterviews();
  }
}
