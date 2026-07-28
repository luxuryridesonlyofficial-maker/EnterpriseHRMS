import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { PaginationDto } from '../common/pagination.dto';
import { buildPaginationOptions } from '../common/pagination.util';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateNotificationDto) {
    if (createDto.employeeId) {
      const emp = await this.prisma.employee.findUnique({ where: { id: createDto.employeeId } });
      if (!emp) throw new NotFoundException('Employee not found');
    }
    return this.prisma.notification.create({ data: createDto });
  }

  async findAll(query: Partial<PaginationDto> = {}) {
    const { page, limit, skip, orderBy } = buildPaginationOptions(query);

    const [total, data] = await Promise.all([
      this.prisma.notification.count(),
      this.prisma.notification.findMany({ orderBy, skip, take: limit }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return { data, meta: { total, page, limit, totalPages } };
  }

  async findByEmployee(employeeId: string) {
    return this.prisma.notification.findMany({ where: { employeeId }, orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const n = await this.prisma.notification.findUnique({ where: { id } });
    if (!n) throw new NotFoundException('Notification not found');
    return n;
  }

  async update(id: string, dto: UpdateNotificationDto) {
    await this.findOne(id);
    return this.prisma.notification.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.notification.delete({ where: { id } });
  }
}
