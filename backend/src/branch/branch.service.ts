import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { PaginationDto } from '../common/pagination.dto';
import { buildPaginationOptions } from '../common/pagination.util';

@Injectable()
export class BranchService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createBranchDto: CreateBranchDto) {
    const company = await this.prisma.company.findUnique({
      where: {
        id: createBranchDto.companyId,
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const branch = await this.prisma.branch.findFirst({
      where: {
        OR: [{ code: createBranchDto.code }, { name: createBranchDto.name }],
      },
    });

    if (branch) {
      throw new ConflictException('Branch code or branch name already exists');
    }

    return this.prisma.branch.create({
      data: createBranchDto,
      include: {
        company: true,
      },
    });
  }

  async findAll(query: Partial<PaginationDto> = {}) {
    const { page, limit, skip, orderBy } = buildPaginationOptions(query);

    const [total, data] = await Promise.all([
      this.prisma.branch.count(),
      this.prisma.branch.findMany({
        include: { company: true },
        skip,
        take: limit,
        orderBy,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return { data, meta: { total, page, limit, totalPages } };
  }

  async findOne(id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
      include: {
        company: true,
      },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    return branch;
  }

  async update(id: string, updateBranchDto: UpdateBranchDto) {
    await this.findOne(id);

    return this.prisma.branch.update({
      where: { id },
      data: updateBranchDto,
      include: {
        company: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.branch.delete({
      where: { id },
    });
  }
}
