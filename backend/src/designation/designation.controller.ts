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

import { DesignationService } from './designation.service';
import { CreateDesignationDto } from './dto/create-designation.dto';
import { UpdateDesignationDto } from './dto/update-designation.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('designation')
export class DesignationController {
  constructor(private readonly designationService: DesignationService) {}

  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @Post()
  create(@Body() createDesignationDto: CreateDesignationDto) {
    return this.designationService.create(createDesignationDto);
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
  findAll() {
    return this.designationService.findAll();
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
  findOne(@Param('id') id: string) {
    return this.designationService.findOne(id);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDesignationDto: UpdateDesignationDto,
  ) {
    return this.designationService.update(id, updateDesignationDto);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.designationService.remove(id);
  }
}
