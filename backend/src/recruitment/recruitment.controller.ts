import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { RecruitmentService } from './recruitment.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { CreateInterviewDto } from './dto/create-interview.dto';

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
