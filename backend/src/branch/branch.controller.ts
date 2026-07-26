import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { BranchService } from './branch.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('branch')
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @Post()
  async create(@Body() createBranchDto: CreateBranchDto) {
    return await this.branchService.create(createBranchDto);
  }

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_ADMIN,
    UserRole.HR_MANAGER,
    UserRole.HR_EXECUTIVE,
    UserRole.MANAGER,
    UserRole.TEAM_LEAD,
  )
  @Get()
  async findAll() {
    return await this.branchService.findAll();
  }

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_ADMIN,
    UserRole.HR_MANAGER,
    UserRole.HR_EXECUTIVE,
    UserRole.MANAGER,
    UserRole.TEAM_LEAD,
  )
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.branchService.findOne(id);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateBranchDto: UpdateBranchDto,
  ) {
    return await this.branchService.update(id, updateBranchDto);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.branchService.remove(id);
  }
}
