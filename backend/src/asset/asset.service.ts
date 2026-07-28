import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssetDto } from './dto/create-asset.dto';

@Injectable()
export class AssetService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAssetDto) {
    // validate branch
    if (dto.branchId) {
      const b = await this.prisma.branch.findUnique({ where: { id: dto.branchId } });
      if (!b) throw new NotFoundException('Branch not found');
    }
    if (dto.employeeId) {
      const e = await this.prisma.employee.findUnique({ where: { id: dto.employeeId } });
      if (!e) throw new NotFoundException('Employee not found');
    }
    return this.prisma.asset.create({ data: dto as any });
  }

  async findAll() {
    return this.prisma.asset.findMany({ include: { branch: true, employee: true }, orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const a = await this.prisma.asset.findUnique({ where: { id }, include: { branch: true, employee: true } });
    if (!a) throw new NotFoundException('Asset not found');
    return a;
  }

  async update(id: string, dto: Partial<CreateAssetDto>) {
    await this.findOne(id);
    return this.prisma.asset.update({ where: { id }, data: dto as any });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.asset.delete({ where: { id } });
  }
}
