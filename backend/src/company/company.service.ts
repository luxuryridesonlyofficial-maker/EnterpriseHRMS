import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { PaginationDto } from '../common/pagination.dto';
import { buildPaginationOptions } from '../common/pagination.util';

@Injectable()
export class CompanyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCompanyDto: CreateCompanyDto) {
    const company = await this.prisma.company.findFirst({
      where: {
        OR: [{ code: createCompanyDto.code }, { name: createCompanyDto.name }],
      },
    });

    if (company) {
      throw new ConflictException(
        'Company code or company name already exists',
      );
    }

    return this.prisma.company.create({
      data: createCompanyDto,
    });
  }

  async findAll(query: Partial<PaginationDto> = {}) {
    const { page, limit, skip, orderBy } = buildPaginationOptions(query);

    const [total, data] = await Promise.all([
      this.prisma.company.count(),
      this.prisma.company.findMany({ orderBy, skip, take: limit }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return { data, meta: { total, page, limit, totalPages } };
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto) {
    await this.findOne(id);

    return this.prisma.company.update({
      where: { id },
      data: updateCompanyDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.company.delete({
      where: { id },
    });
  }
}
