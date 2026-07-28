import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { PaginationDto, } from '../common/pagination.dto';
import { buildPaginationOptions } from '../common/pagination.util';

@Injectable()
export class EmployeeService {
  private readonly employeeInclude = {
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
    shift: true,
  } satisfies Prisma.EmployeeInclude;

  constructor(private readonly prisma: PrismaService) {}

  async create(createEmployeeDto: CreateEmployeeDto) {
    await this.validateEmployeeRelationships(
      createEmployeeDto.branchId,
      createEmployeeDto.designationId,
      createEmployeeDto.shiftId,
    );

    try {
      return await this.prisma.employee.create({
        data: createEmployeeDto,
        include: this.employeeInclude,
      });
    } catch (error) {
      this.throwEmployeeConflictError(error);
    }
  }

  async findAll(query: Partial<PaginationDto> & any = {}) {
    const { page, limit, skip, orderBy } = buildPaginationOptions(query);

    const where: any = {};
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { employeeCode: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.departmentId) where.designation = { some: { departmentId: query.departmentId } };
    if (query.designationId) where.designationId = query.designationId;
    if (query.branchId) where.branchId = query.branchId;
    if (query.status) where.status = query.status;
    if (query.employeeCode) where.employeeCode = query.employeeCode;

    const [total, data] = await Promise.all([
      this.prisma.employee.count({ where }),
      this.prisma.employee.findMany({
        where,
        include: this.employeeInclude,
        skip,
        take: limit,
        orderBy,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return { data, meta: { total, page, limit, totalPages } };
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: this.employeeInclude,
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return employee;
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const branchId = updateEmployeeDto.branchId ?? employee.branchId;
    const designationId =
      updateEmployeeDto.designationId ?? employee.designationId;
    const shiftId = updateEmployeeDto.shiftId ?? employee.shiftId ?? undefined;

    await this.validateEmployeeRelationships(branchId, designationId, shiftId);

    try {
      return await this.prisma.employee.update({
        where: { id },
        data: updateEmployeeDto,
        include: this.employeeInclude,
      });
    } catch (error) {
      this.throwEmployeeConflictError(error);
    }
  }

  async remove(id: string) {
    await this.findOne(id);

    return await this.prisma.employee.delete({
      where: { id },
    });
  }

  private async validateEmployeeRelationships(
    branchId: string,
    designationId: string,
    shiftId?: string,
  ): Promise<void> {
    const [branch, designation, shift] = await Promise.all([
      this.prisma.branch.findUnique({
        where: { id: branchId },
      }),
      this.prisma.designation.findUnique({
        where: { id: designationId },
        include: {
          department: true,
        },
      }),
      shiftId
        ? this.prisma.shift.findUnique({
            where: { id: shiftId },
          })
        : Promise.resolve(null),
    ]);

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    if (!designation) {
      throw new NotFoundException('Designation not found');
    }

    if (designation.department.branchId !== branch.id) {
      throw new ConflictException(
        'Designation must belong to the selected branch',
      );
    }

    if (shift && shift.branchId !== branch.id) {
      throw new ConflictException('Shift must belong to the selected branch');
    }

    if (shiftId && !shift) {
      throw new NotFoundException('Shift not found');
    }
  }

  private throwEmployeeConflictError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Employee code or mobile already exists');
    }

    throw error;
  }
}
