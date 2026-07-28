import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { PaginationDto } from '../common/pagination.dto';
import { buildPaginationOptions } from '../common/pagination.util';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const employee = await this.prisma.employee.findUnique({
      where: {
        id: createUserDto.employeeId,
      },
      include: {
        user: true,
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    if (employee.user) {
      throw new ConflictException('Employee already has a user account');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: {
        mobile: createUserDto.mobile,
      },
    });

    if (existingUser) {
      throw new ConflictException('Mobile already exists');
    }

    // Password Hash
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    return this.prisma.user.create({
      data: {
        mobile: createUserDto.mobile,
        password: hashedPassword,
        role: createUserDto.role,
        employeeId: createUserDto.employeeId,
      },
      include: {
        employee: {
          include: {
            branch: {
              include: {
                company: true,
              },
            },
            designation: {
              include: {
                department: true,
              },
            },
          },
        },
      },
    });
  }

  async findAll(query: Partial<PaginationDto> & any = {}) {
    const { page, limit, skip, orderBy } = buildPaginationOptions(query);

    const where: any = {};
    if (query.search) {
      where.OR = [{ mobile: { contains: query.search, mode: 'insensitive' } }, { role: { contains: query.search, mode: 'insensitive' } }];
    }

    const [total, data] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        include: {
          employee: {
            include: {
              branch: { include: { company: true } },
              designation: { include: { department: true } },
            },
          },
        },
        skip,
        take: limit,
        orderBy,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return { data, meta: { total, page, limit, totalPages } };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      include: {
        employee: {
          include: {
            branch: {
              include: {
                company: true,
              },
            },
            designation: {
              include: {
                department: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.findOne(id);

    const data: Prisma.UserUpdateInput = { ...updateUserDto };

    if (updateUserDto.password) {
      data.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    return this.prisma.user.update({
      where: {
        id,
      },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.user.delete({
      where: {
        id,
      },
    });
  }
}
