import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { PaginationDto } from '../common/pagination.dto';
import { buildPaginationOptions } from '../common/pagination.util';

@Injectable()
export class ShiftService {
  private readonly shiftInclude = {
    branch: {
      include: {
        company: true,
      },
    },
  } satisfies Prisma.ShiftInclude;

  constructor(private readonly prisma: PrismaService) {}

  async create(createShiftDto: CreateShiftDto) {
    const name = this.normalizeName(createShiftDto.name);
    await this.ensureBranchExists(createShiftDto.branchId);
    await this.ensureShiftNameIsAvailable(createShiftDto.branchId, name);
    this.validateShiftTimes(createShiftDto.startTime, createShiftDto.endTime);

    try {
      return await this.prisma.shift.create({
        data: {
          ...createShiftDto,
          name,
        },
        include: this.shiftInclude,
      });
    } catch (error) {
      this.throwShiftConflictError(error);
    }
  }

  async findAll(query: Partial<PaginationDto> = {}) {
    const { page, limit, skip, orderBy } = buildPaginationOptions(query);
    const [total, data] = await Promise.all([
      this.prisma.shift.count(),
      this.prisma.shift.findMany({ include: this.shiftInclude, skip, take: limit, orderBy }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return { data, meta: { total, page, limit, totalPages } };
  }

  async findOne(id: string) {
    const shift = await this.prisma.shift.findUnique({
      where: { id },
      include: this.shiftInclude,
    });

    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    return shift;
  }

  async update(id: string, updateShiftDto: UpdateShiftDto) {
    const shift = await this.findOne(id);
    const branchId = updateShiftDto.branchId ?? shift.branchId;
    const name = updateShiftDto.name
      ? this.normalizeName(updateShiftDto.name)
      : shift.name;
    const startTime = updateShiftDto.startTime ?? shift.startTime;
    const endTime = updateShiftDto.endTime ?? shift.endTime;

    await this.ensureBranchExists(branchId);
    await this.ensureShiftNameIsAvailable(branchId, name, id);
    this.validateShiftTimes(startTime, endTime);

    try {
      return await this.prisma.shift.update({
        where: { id },
        data: {
          branchId,
          name,
          startTime,
          endTime,
        },
        include: this.shiftInclude,
      });
    } catch (error) {
      this.throwShiftConflictError(error);
    }
  }

  async remove(id: string) {
    await this.findOne(id);

    return await this.prisma.shift.delete({
      where: { id },
      include: this.shiftInclude,
    });
  }

  private async ensureBranchExists(branchId: string): Promise<void> {
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
  }

  private async ensureShiftNameIsAvailable(
    branchId: string,
    name: string,
    excludedShiftId?: string,
  ): Promise<void> {
    const existingShift = await this.prisma.shift.findFirst({
      where: {
        branchId,
        name,
        ...(excludedShiftId
          ? {
              id: {
                not: excludedShiftId,
              },
            }
          : {}),
      },
    });

    if (existingShift) {
      throw new ConflictException(
        'A shift with this name already exists in the selected branch',
      );
    }
  }

  private validateShiftTimes(startTime: string, endTime: string): void {
    if (this.toSeconds(startTime) === this.toSeconds(endTime)) {
      throw new BadRequestException(
        'startTime and endTime must not represent the same time',
      );
    }
  }

  private toSeconds(value: string): number {
    const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);

    if (!match) {
      throw new BadRequestException(
        'Shift time must use HH:mm or HH:mm:ss format',
      );
    }

    const hour = Number(match[1]);
    const minute = Number(match[2]);
    const second = Number(match[3] ?? 0);

    if (hour > 23 || minute > 59 || second > 59) {
      throw new BadRequestException('Shift time contains an invalid value');
    }

    return hour * 3_600 + minute * 60 + second;
  }

  private normalizeName(name: string): string {
    return name.trim().replace(/\s+/g, ' ');
  }

  private throwShiftConflictError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        'A shift with this name already exists in the selected branch',
      );
    }

    throw error;
  }
}
