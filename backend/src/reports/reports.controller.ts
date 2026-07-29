import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly svc: ReportsService) {}

  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Employees summary report' })
  @ApiResponse({ status: 200, description: 'Employees summary data' })
  @Get('employees-summary')
  employeesSummary() {
    return this.svc.employeesSummary();
  }

  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Attendance summary for a month' })
  @ApiResponse({ status: 200, description: 'Attendance summary data' })
  @Get('attendance-summary')
  attendanceSummary(@Query('month') month: string) {
    return this.svc.attendanceSummary(month);
  }

  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Payroll summary for a month' })
  @ApiResponse({ status: 200, description: 'Payroll summary data' })
  @Get('payroll-summary')
  payrollSummary(@Query('month') month: string) {
    return this.svc.payrollSummary(month);
  }
}
