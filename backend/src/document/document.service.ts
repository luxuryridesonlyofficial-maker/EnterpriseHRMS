import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { PaginationDto } from '../common/pagination.dto';
import { buildPaginationOptions } from '../common/pagination.util';

@Injectable()
export class DocumentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDocumentDto, uploadedBy?: string) {
    if (dto.employeeId) {
      const emp = await this.prisma.employee.findUnique({ where: { id: dto.employeeId } });
      if (!emp) throw new NotFoundException('Employee not found');
    }

    // create document and audit in a transaction
    const created = await this.prisma.$transaction(async (tx) => {
      const doc = await tx.document.create({ data: { ...dto } as any });
      await tx.auditLog.create({ data: { userId: uploadedBy ?? undefined, employeeCode: dto.employeeId ? ((await this.prisma.employee.findUnique({ where: { id: dto.employeeId } }))?.employeeCode) : undefined, action: 'create_document', module: 'document', description: `Document ${doc.id} uploaded` } });
      return doc;
    });

    return created;
  }

  async findAll(query: Partial<PaginationDto> = {}) {
    const { page, limit, skip, orderBy } = buildPaginationOptions(query);
    const where: any = {};
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.document.count({ where }),
      this.prisma.document.findMany({ where, orderBy, skip, take: limit }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return { data, meta: { total, page, limit, totalPages } };
  }

  async findOne(id: string) {
    const d = await this.prisma.document.findUnique({ where: { id } });
    if (!d) throw new NotFoundException('Document not found');
    return d;
  }

  async update(id: string, dto: UpdateDocumentDto, updatedBy?: string) {
    await this.findOne(id);

    const updated = await this.prisma.$transaction(async (tx) => {
      const u = await tx.document.update({ where: { id }, data: dto as any });
      await tx.auditLog.create({ data: { userId: updatedBy ?? undefined, employeeCode: u.employeeId ? ((await this.prisma.employee.findUnique({ where: { id: u.employeeId } }))?.employeeCode) : undefined, action: 'update_document', module: 'document', description: `Document ${id} updated` } });
      return u;
    });

    return updated;
  }

  async remove(id: string, removedBy?: string) {
    await this.findOne(id);

    const deleted = await this.prisma.$transaction(async (tx) => {
      const d = await tx.document.delete({ where: { id } });
      await tx.auditLog.create({ data: { userId: removedBy ?? undefined, employeeCode: d.employeeId ? ((await this.prisma.employee.findUnique({ where: { id: d.employeeId } }))?.employeeCode) : undefined, action: 'delete_document', module: 'document', description: `Document ${id} deleted` } });
      return d;
    });

    return deleted;
  }
}
