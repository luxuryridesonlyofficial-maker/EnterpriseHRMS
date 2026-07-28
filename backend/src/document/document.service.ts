import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

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

  async findAll() {
    return this.prisma.document.findMany({ orderBy: { createdAt: 'desc' } });
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
