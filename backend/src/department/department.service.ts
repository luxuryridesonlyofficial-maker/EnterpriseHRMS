import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDepartmentDto: CreateDepartmentDto) {
    const branch = await this.prisma.branch.findUnique({
      where: {
        id: createDepartmentDto.branchId,
      },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    const exists = await this.prisma.department.findFirst({
      where: {
        OR: [
          { code: createDepartmentDto.code },
          { name: createDepartmentDto.name },
        ],
      },
    });

    if (exists) {
      throw new ConflictException(
        'Department code or department name already exists',
      );
    }

    return this.prisma.department.create({
      data: createDepartmentDto,
      include: {
        branch: {
          include: {
            company: true,
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.department.findMany({
      include: {
        branch: {
          include: {
            company: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        branch: {
          include: {
            company: true,
          },
        },
      },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    return department;
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    await this.findOne(id);

    return this.prisma.department.update({
      where: { id },
      data: dto,
      include: {
        branch: {
          include: {
            company: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.department.delete({
      where: { id },
    });
  }
}
