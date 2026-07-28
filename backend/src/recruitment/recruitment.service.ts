import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
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

  // Hire candidate: create employee and onboarding, update candidate status, and audit atomically
  async hireCandidate(candidateId: string, employeeData: any, userId?: string) {
    const candidate = await this.prisma.candidate.findUnique({ where: { id: candidateId } });
    if (!candidate) throw new NotFoundException('Candidate not found');

    // create employee, onboarding and update candidate in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // create employee
      const emp = await tx.employee.create({ data: employeeData });

      // create onboarding
      await tx.onboarding.create({ data: { employeeId: emp.id, taskList: [], status: 'PENDING', startDate: new Date() } });

      // update candidate status
      await tx.candidate.update({ where: { id: candidateId }, data: { status: 'ONBOARDED' } });

      // audit log
      await tx.auditLog.create({ data: { userId: userId ?? undefined, employeeCode: emp.employeeCode, action: 'hire_candidate', module: 'recruitment', description: `Hired candidate ${candidate.email} as ${emp.employeeCode}` } });

      return emp;
    });

    return this.prisma.employee.findUnique({ where: { id: result.id }, include: { branch: true, designation: true } });
  }

  // Convert candidate to employee without onboarding
  async convertCandidate(candidateId: string, employeeData: any, userId?: string) {
    const candidate = await this.prisma.candidate.findUnique({ where: { id: candidateId } });
    if (!candidate) throw new NotFoundException('Candidate not found');

    const result = await this.prisma.$transaction(async (tx) => {
      const emp = await tx.employee.create({ data: employeeData });
      await tx.candidate.update({ where: { id: candidateId }, data: { status: 'ONBOARDED' } });
      await tx.auditLog.create({ data: { userId: userId ?? undefined, employeeCode: emp.employeeCode, action: 'convert_candidate', module: 'recruitment', description: `Converted candidate ${candidate.email} to employee ${emp.employeeCode}` } });
      return emp;
    });

    return this.prisma.employee.findUnique({ where: { id: result.id }, include: { branch: true, designation: true } });
  }

  // Accept offer: mark candidate as SELECTED and audit
  async acceptOffer(candidateId: string, userId?: string) {
    const candidate = await this.prisma.candidate.findUnique({ where: { id: candidateId } });
    if (!candidate) throw new NotFoundException('Candidate not found');

    const updated = await this.prisma.$transaction(async (tx) => {
      const c = await tx.candidate.update({ where: { id: candidateId }, data: { status: 'SELECTED' } });
      await tx.auditLog.create({ data: { userId: userId ?? undefined, employeeCode: undefined, action: 'accept_offer', module: 'recruitment', description: `Offer accepted for candidate ${candidate.email}` } });
      return c;
    });

    return updated;
  }
}
