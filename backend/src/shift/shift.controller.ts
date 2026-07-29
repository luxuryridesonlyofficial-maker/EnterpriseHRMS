import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { ShiftService } from './shift.service';

const SHIFT_MANAGEMENT_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.COMPANY_ADMIN,
  UserRole.HR_MANAGER,
];

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('shifts')
@ApiBearerAuth()
@Controller('shift')
export class ShiftController {
  constructor(private readonly shiftService: ShiftService) {}

  @Roles(...SHIFT_MANAGEMENT_ROLES)
  @Post()
  async create(@Body() createShiftDto: CreateShiftDto) {
    return await this.shiftService.create(createShiftDto);
  }

  @Roles(...SHIFT_MANAGEMENT_ROLES)
  @Get()
  async findAll() {
    return await this.shiftService.findAll();
  }

  @Roles(...SHIFT_MANAGEMENT_ROLES)
  @Get(':id')
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return await this.shiftService.findOne(id);
  }

  @Roles(...SHIFT_MANAGEMENT_ROLES)
  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateShiftDto: UpdateShiftDto,
  ) {
    return await this.shiftService.update(id, updateShiftDto);
  }

  @Roles(...SHIFT_MANAGEMENT_ROLES)
  @Delete(':id')
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return await this.shiftService.remove(id);
  }
}
