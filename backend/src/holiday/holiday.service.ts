import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { UpdateHolidayDto } from './dto/update-holiday.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class HolidayService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly include = {
    branch: true,
  } satisfies Prisma.HolidayInclude;

  private parseDate(value: string): Date {
    const match = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(value);

    if (!match) {
      throw new BadRequestException('date must use the YYYY-MM-DD format');
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    const date = new Date(Date.UTC(year, month - 1, day));

    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      throw new BadRequestException('date is not a valid calendar date');
    }

    return date;
  }

  async create(createHolidayDto: CreateHolidayDto) {
    const date = this.parseDate(createHolidayDto.date);

    // ensure branch exists
    const branch = await this.prisma.branch.findUnique({ where: { id: createHolidayDto.branchId } });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    // Prevent duplicate for same branch and date
    const existing = await this.prisma.holiday.findFirst({
      where: {
        branchId: createHolidayDto.branchId,
        date,
      },
    });

    if (existing) {
      throw new ConflictException('Holiday already exists for this branch on the given date');
    }

    return this.prisma.holiday.create({
      data: {
        title: createHolidayDto.title,
        date,
        branchId: createHolidayDto.branchId,
      },
      include: this.include,
    });
  }

  async findAll() {
    return this.prisma.holiday.findMany({
      include: this.include,
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string) {
    const holiday = await this.prisma.holiday.findUnique({ where: { id }, include: this.include });

    if (!holiday) {
      throw new NotFoundException('Holiday not found');
    }

    return holiday;
  }

  async update(id: string, updateHolidayDto: UpdateHolidayDto) {
    const holiday = await this.findOne(id);

    let date = holiday.date;

    if (updateHolidayDto.date) {
      date = this.parseDate(updateHolidayDto.date as unknown as string);
    }

    if (updateHolidayDto.branchId) {
      const branch = await this.prisma.branch.findUnique({ where: { id: updateHolidayDto.branchId } });
      if (!branch) throw new NotFoundException('Branch not found');
    }

    // Prevent duplicate on updated values
    const existing = await this.prisma.holiday.findFirst({
      where: {
        id: { not: id },
        branchId: updateHolidayDto.branchId ?? holiday.branchId,
        date,
      },
    });

    if (existing) {
      throw new ConflictException('Holiday already exists for this branch on the given date');
    }

    return this.prisma.holiday.update({
      where: { id },
      data: {
        title: updateHolidayDto.title ?? holiday.title,
        date,
        branchId: updateHolidayDto.branchId ?? holiday.branchId,
      },
      include: this.include,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.holiday.delete({ where: { id }, include: this.include });
  }
}
