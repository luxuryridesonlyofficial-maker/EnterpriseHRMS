import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { PayrollService } from './payroll.service';
import { CreateSalaryStructureDto } from './dto/create-salary-structure.dto';
import { GeneratePayrollDto } from './dto/generate-payroll.dto';
import { ApprovePayrollDto } from './dto/approve-payroll.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @Post('structure')
  async upsertStructure(@Body() dto: CreateSalaryStructureDto): Promise<any> {
    return await this.payrollService.upsertSalaryStructure(dto);
  }


  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER)
  @Get('structure/:employeeId')
  async getStructure(@Param('employeeId') employeeId: string): Promise<any> {
    return await this.payrollService.getSalaryStructure(employeeId);
  }


  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER)
  @Post('generate')
  async generate(@Body() dto: GeneratePayrollDto): Promise<any> {
    return await this.payrollService.generatePayroll(dto);
  }


  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER)
  @Get('history')
  async history(@Query() query: any): Promise<any> {
    return await this.payrollService.listPayrolls(query);
  }


  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @Get(':id')
  async get(@Param('id') id: string): Promise<any> {
    return await this.payrollService.getPayroll(id);
  }


  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @Post(':id/approve')
  async approve(@Param('id') id: string, @Body() dto: ApprovePayrollDto): Promise<any> {
    return await this.payrollService.approvePayroll(id, dto.approverId);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Post(':id/lock')
  async lock(@Param('id') id: string): Promise<any> {
    return await this.payrollService.lockPayroll(id);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Post(':id/unlock')
  async unlock(@Param('id') id: string): Promise<any> {
    return await this.payrollService.unlockPayroll(id);
  }
}
