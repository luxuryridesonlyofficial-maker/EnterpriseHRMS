import { Controller, Post, Body, Get, Param, Put, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AssetService } from './asset.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import type { Request } from 'express';
import { PaginationDto } from '../common/pagination.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('assets')
@ApiBearerAuth()
@Controller('assets')
export class AssetController {
  constructor(private readonly service: AssetService) {}

  @Roles(UserRole.HR_MANAGER, UserRole.COMPANY_ADMIN)
  @Post()
  create(@Body() dto: CreateAssetDto) {
    return this.service.create(dto);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER)
  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.service.findAll(query);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(UserRole.HR_MANAGER, UserRole.COMPANY_ADMIN)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateAssetDto>) {
    return this.service.update(id, dto);
  }

  @Roles(UserRole.HR_MANAGER, UserRole.COMPANY_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Roles(UserRole.HR_MANAGER, UserRole.COMPANY_ADMIN)
  @Post(':id/assign')
  assign(@Param('id') id: string, @Body() body: { employeeId: string }, @Req() req: Request) {
    const userId = (req as any).user?.id ?? undefined;
    return this.service.assignAsset(id, body.employeeId, userId);
  }

  @Roles(UserRole.HR_MANAGER, UserRole.COMPANY_ADMIN, UserRole.EMPLOYEE)
  @Post(':id/return')
  return(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user?.id ?? undefined;
    return this.service.returnAsset(id, userId);
  }

  @Roles(UserRole.HR_MANAGER, UserRole.COMPANY_ADMIN)
  @Post(':id/transfer')
  transfer(@Param('id') id: string, @Body() body: { toEmployeeId: string }, @Req() req: Request) {
    const userId = (req as any).user?.id ?? undefined;
    return this.service.transferAsset(id, body.toEmployeeId, userId);
  }

  @Roles(UserRole.HR_MANAGER, UserRole.COMPANY_ADMIN)
  @Post(':id/dispose')
  dispose(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user?.id ?? undefined;
    return this.service.disposeAsset(id, userId);
  }
}
