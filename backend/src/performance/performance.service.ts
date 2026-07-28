import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class PerformanceService {
  constructor(private readonly prisma: PrismaService) {}

  async createReview(dto: CreateReviewDto, userId?: string) {
    // validate employees
    const emp = await this.prisma.employee.findUnique({ where: { id: dto.employeeId } });
    if (!emp) throw new NotFoundException('Employee not found');
    const reviewer = await this.prisma.employee.findUnique({ where: { id: dto.reviewerId } });
    if (!reviewer) throw new NotFoundException('Reviewer not found');

    // create review and audit atomically
    const review = await this.prisma.$transaction(async (tx) => {
      const r = await tx.performanceReview.create({ data: { employeeId: dto.employeeId, reviewerId: dto.reviewerId, reviewPeriodStart: new Date(dto.reviewPeriodStart), reviewPeriodEnd: new Date(dto.reviewPeriodEnd), ratings: {}, feedback: dto.feedback ?? '', score: dto.score ?? 0 } as any });

      await tx.auditLog.create({ data: { userId: userId ?? undefined, employeeCode: emp.employeeCode, action: 'create_performance_review', module: 'performance', description: `Created performance review ${r.id} for ${emp.employeeCode}` } });

      return r;
    });

    return this.prisma.performanceReview.findUnique({ where: { id: review.id } });
  }

  async listReviews(employeeId?: string) {
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    return this.prisma.performanceReview.findMany({ where, orderBy: { createdAt: 'desc' } });
  }
}
