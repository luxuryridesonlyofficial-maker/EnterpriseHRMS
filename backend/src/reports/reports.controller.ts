import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

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
