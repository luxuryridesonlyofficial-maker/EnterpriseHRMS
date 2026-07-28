import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
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

  // Assign an asset to an employee atomically and log audit
  async assignAsset(assetId: string, employeeId: string, assignedBy?: string) {
    const asset = await this.findOne(assetId);
    if (asset.status !== 'AVAILABLE') {
      throw new ConflictException('Asset is not available for assignment');
    }

    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw new NotFoundException('Employee not found');

    const updated = await this.prisma.$transaction(async (tx) => {
      const a = await tx.asset.update({ where: { id: assetId }, data: { employeeId, status: 'ASSIGNED', assignedAt: new Date() } });
      await tx.auditLog.create({ data: { userId: assignedBy ?? undefined, employeeCode: employee.employeeCode, action: 'assign_asset', module: 'asset', description: `Asset ${asset.serialNumber} assigned to ${employee.employeeCode}` } });
      return a;
    });

    return this.prisma.asset.findUnique({ where: { id: updated.id }, include: { branch: true, employee: true } });
  }

  // Return an asset atomically and log audit
  async returnAsset(assetId: string, returnedBy?: string) {
    const asset = await this.findOne(assetId);
    if (asset.status !== 'ASSIGNED') {
      throw new ConflictException('Asset is not currently assigned');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const a = await tx.asset.update({ where: { id: assetId }, data: { employeeId: null, status: 'AVAILABLE', returnedAt: new Date() } });
      await tx.auditLog.create({ data: { userId: returnedBy ?? undefined, employeeCode: asset.employee?.employeeCode ?? undefined, action: 'return_asset', module: 'asset', description: `Asset ${asset.serialNumber} returned` } });
      return a;
    });

    return this.prisma.asset.findUnique({ where: { id: updated.id }, include: { branch: true, employee: true } });
  }

  // Transfer asset to another employee atomically and log audit
  async transferAsset(assetId: string, toEmployeeId: string, transferredBy?: string) {
    const asset = await this.findOne(assetId);
    if (asset.status !== 'ASSIGNED') {
      throw new ConflictException('Asset must be assigned to transfer');
    }

    const toEmployee = await this.prisma.employee.findUnique({ where: { id: toEmployeeId } });
    if (!toEmployee) throw new NotFoundException('Target employee not found');

    const updated = await this.prisma.$transaction(async (tx) => {
      const a = await tx.asset.update({ where: { id: assetId }, data: { employeeId: toEmployeeId, assignedAt: new Date() } });
      await tx.auditLog.create({ data: { userId: transferredBy ?? undefined, employeeCode: toEmployee.employeeCode, action: 'transfer_asset', module: 'asset', description: `Asset ${asset.serialNumber} transferred to ${toEmployee.employeeCode}` } });
      return a;
    });

    return this.prisma.asset.findUnique({ where: { id: updated.id }, include: { branch: true, employee: true } });
  }

  // Dispose asset atomically and log audit
  async disposeAsset(assetId: string, disposedBy?: string) {
    const asset = await this.findOne(assetId);
    if (asset.status === 'RETIRED') {
      throw new ConflictException('Asset already disposed');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const a = await tx.asset.update({ where: { id: assetId }, data: { employeeId: null, status: 'RETIRED', returnedAt: new Date() } });
      await tx.auditLog.create({ data: { userId: disposedBy ?? undefined, employeeCode: asset.employee?.employeeCode ?? undefined, action: 'dispose_asset', module: 'asset', description: `Asset ${asset.serialNumber} disposed` } });
      return a;
    });

    return this.prisma.asset.findUnique({ where: { id: updated.id }, include: { branch: true, employee: true } });
  }
}
