import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly svc: ReportsService) {}

  @Get('employees-summary')
  employeesSummary() {
    return this.svc.employeesSummary();
  }

  @Get('attendance-summary')
  attendanceSummary(@Query('month') month: string) {
    return this.svc.attendanceSummary(month);
  }

  @Get('payroll-summary')
  payrollSummary(@Query('month') month: string) {
    return this.svc.payrollSummary(month);
  }
}
