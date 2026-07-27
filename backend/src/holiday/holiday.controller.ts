import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { HolidayService } from './holiday.service';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { UpdateHolidayDto } from './dto/update-holiday.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('holiday')
export class HolidayController {
  constructor(private readonly holidayService: HolidayService) {}

  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.HR_EXECUTIVE)
  @Post()
  async create(@Body() createHolidayDto: CreateHolidayDto) {
    return await this.holidayService.create(createHolidayDto);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.HR_EXECUTIVE, UserRole.MANAGER, UserRole.TEAM_LEAD, UserRole.EMPLOYEE)
  @Get()
  async findAll() {
    return await this.holidayService.findAll();
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.HR_EXECUTIVE, UserRole.MANAGER, UserRole.TEAM_LEAD, UserRole.EMPLOYEE)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.holidayService.findOne(id);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateHolidayDto: UpdateHolidayDto) {
    return await this.holidayService.update(id, updateHolidayDto);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.holidayService.remove(id);
  }
}
