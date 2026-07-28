import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { CreateInterviewDto } from './dto/create-interview.dto';

@Injectable()
export class RecruitmentService {
  constructor(private readonly prisma: PrismaService) {}

  async createCandidate(dto: CreateCandidateDto) {
    return this.prisma.candidate.create({ data: dto as any });
  }

  async listCandidates() {
    return this.prisma.candidate.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findCandidate(id: string) {
    const c = await this.prisma.candidate.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Candidate not found');
    return c;
  }

  async scheduleInterview(dto: CreateInterviewDto) {
    // validate candidate and interviewer
    const candidate = await this.prisma.candidate.findUnique({ where: { id: dto.candidateId } });
    if (!candidate) throw new NotFoundException('Candidate not found');
    const interviewer = await this.prisma.employee.findUnique({ where: { id: dto.interviewerId } });
    if (!interviewer) throw new NotFoundException('Interviewer not found');

    return this.prisma.interview.create({ data: { candidateId: dto.candidateId, interviewerId: dto.interviewerId, scheduledAt: new Date(dto.scheduledAt), mode: dto.mode ?? 'ONLINE', meetingLink: dto.meetingLink } });
  }

  async listInterviews() {
    return this.prisma.interview.findMany({ orderBy: { scheduledAt: 'desc' } });
  }
}
