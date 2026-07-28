import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Injectable()
export class DocumentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDocumentDto) {
    if (dto.employeeId) {
      const emp = await this.prisma.employee.findUnique({ where: { id: dto.employeeId } });
      if (!emp) throw new NotFoundException('Employee not found');
    }
    return this.prisma.document.create({ data: { ...dto } as any });
  }

  async findAll() {
    return this.prisma.document.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const d = await this.prisma.document.findUnique({ where: { id } });
    if (!d) throw new NotFoundException('Document not found');
    return d;
  }

  async update(id: string, dto: UpdateDocumentDto) {
    await this.findOne(id);
    return this.prisma.document.update({ where: { id }, data: dto as any });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.document.delete({ where: { id } });
  }
}
