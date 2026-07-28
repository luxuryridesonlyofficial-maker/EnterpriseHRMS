import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { UpdateHolidayDto } from './dto/update-holiday.dto';
import { PaginationDto } from '../common/pagination.dto';
import { buildPaginationOptions } from '../common/pagination.util';
@Injectable()
export class HolidayService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createHolidayDto: CreateHolidayDto) {
    const branch = await this.prisma.branch.findUnique({
      where: { id: createHolidayDto.branchId },
    });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    return this.prisma.holiday.create({
      data: createHolidayDto,
    });
  }

  async findAll(query: Partial<PaginationDto> = {}) {
    const { page, limit, skip, orderBy } = buildPaginationOptions(query);
    const where: any = {};
    if (query.dateFrom || query.dateTo) {
      const df = query.dateFrom ? new Date(query.dateFrom) : undefined;
      const dt = query.dateTo ? new Date(query.dateTo) : undefined;
      where.date = {} as any;
      if (df) where.date.gte = df;
      if (dt) where.date.lte = dt;
    }

    const [total, data] = await Promise.all([
      this.prisma.holiday.count({ where }),
      this.prisma.holiday.findMany({ where, include: { branch: true }, skip, take: limit, orderBy: query.sort ? { [query.sort]: query.order || 'asc' } : { date: 'asc' } }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return { data, meta: { total, page, limit, totalPages } };
  }

  async findByBranch(branchId: string) {
    return this.prisma.holiday.findMany({
      where: { branchId },
      orderBy: { date: 'asc' },
    });
  }

  async findOne(id: string) {
    const holiday = await this.prisma.holiday.findUnique({
      where: { id },
      include: { branch: true },
    });
    if (!holiday) {
      throw new NotFoundException('Holiday not found');
    }
    return holiday;
  }

  async update(id: string, updateHolidayDto: UpdateHolidayDto) {
    await this.findOne(id);
    return this.prisma.holiday.update({
      where: { id },
      data: updateHolidayDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.holiday.delete({
      where: { id },
    });
  }
}
