import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDesignationDto } from './dto/create-designation.dto';
import { UpdateDesignationDto } from './dto/update-designation.dto';

@Injectable()
export class DesignationService {
  constructor(private prisma: PrismaService) {}

  async create(createDesignationDto: CreateDesignationDto) {
    const department = await this.prisma.department.findUnique({
      where: {
        id: createDesignationDto.departmentId,
      },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    const exists = await this.prisma.designation.findFirst({
      where: {
        OR: [
          { code: createDesignationDto.code },
          { name: createDesignationDto.name },
        ],
      },
    });

    if (exists) {
      throw new ConflictException(
        'Designation code or designation name already exists',
      );
    }

    return this.prisma.designation.create({
      data: createDesignationDto,
      include: {
        department: {
          include: {
            branch: {
              include: {
                company: true,
              },
            },
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.designation.findMany({
      include: {
        department: {
          include: {
            branch: {
              include: {
                company: true,
              },
            },
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const designation = await this.prisma.designation.findUnique({
      where: { id },
      include: {
        department: {
          include: {
            branch: {
              include: { company: true },
            },
          },
        },
      },
    });

    if (!designation) {
      throw new NotFoundException('Designation not found');
    }

    return designation;
  }

  async update(id: string, updateDesignationDto: UpdateDesignationDto) {
    await this.findOne(id);

    return this.prisma.designation.update({
      where: {
        id,
      },
      data: updateDesignationDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.designation.delete({
      where: {
        id,
      },
    });
  }
}
