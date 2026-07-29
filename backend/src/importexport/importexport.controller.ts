import { Controller, Get, Query, Header, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ImportExportService } from './importexport.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('export')
@ApiBearerAuth()
@Controller('export')
export class ImportExportController {
  constructor(private readonly svc: ImportExportService) {}

  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Export employees as CSV' })
  @ApiResponse({ status: 200, description: 'CSV file stream' })
  @Get('employees')
  @Header('Content-Type','text/csv')
  @Header('Content-Disposition','attachment; filename="employees.csv"')
  async exportEmployees() {
    return this.svc.exportEmployeesCsv();
  }

  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Export payroll for a month as CSV' })
  @ApiResponse({ status: 200, description: 'CSV file stream' })
  @Get('payroll')
  @Header('Content-Type','text/csv')
  @Header('Content-Disposition','attachment; filename="payroll.csv"')
  async exportPayroll(@Query('month') month: string) {
    return this.svc.exportPayrollCsv(month);
  }

  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Export attendance for a month as CSV' })
  @ApiResponse({ status: 200, description: 'CSV file stream' })
  @Get('attendance')
  @Header('Content-Type','text/csv')
  @Header('Content-Disposition','attachment; filename="attendance.csv"')
  async exportAttendance(@Query('month') month: string) {
    return this.svc.exportAttendanceCsv(month);
  }
}
