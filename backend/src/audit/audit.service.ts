import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { PaginationDto } from '../common/pagination.dto';
import { buildPaginationOptions, buildDateRangeFilter } from '../common/pagination.util';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAuditLogDto) {
    return this.prisma.auditLog.create({ data: dto });
  }

  async findAll(query: Partial<PaginationDto & { userId?: string; action?: string; module?: string; dateFrom?: string; dateTo?: string }> = {}) {
    const { page, limit, skip, orderBy } = buildPaginationOptions(query);

    const where: any = {};
    if (query.userId) where.userId = query.userId;
    if (query.action) where.action = query.action;
    if (query.module) where.module = query.module;
    const dateFilter = buildDateRangeFilter('createdAt', query.dateFrom, query.dateTo);
    if (dateFilter) Object.assign(where, dateFilter);

    const [total, data] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({ where, orderBy, skip, take: limit }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return { data, meta: { total, page, limit, totalPages } };
  }

  async findByUser(userId: string) {
    return this.prisma.auditLog.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }
}
