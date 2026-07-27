import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { UpdateHolidayDto } from './dto/update-holiday.dto';

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

  async findAll() {
    return this.prisma.holiday.findMany({
      include: {
        branch: true,
      },
      orderBy: {
        date: 'asc',
      },
    });
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
