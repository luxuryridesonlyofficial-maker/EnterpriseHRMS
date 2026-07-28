import { Controller, Get, Query, Header } from '@nestjs/common';
import { ImportExportService } from './importexport.service';

@Controller('export')
export class ImportExportController {
  constructor(private readonly svc: ImportExportService) {}

  @Get('employees')
  @Header('Content-Type','text/csv')
  @Header('Content-Disposition','attachment; filename="employees.csv"')
  async exportEmployees() {
    return this.svc.exportEmployeesCsv();
  }

  @Get('payroll')
  @Header('Content-Type','text/csv')
  @Header('Content-Disposition','attachment; filename="payroll.csv"')
  async exportPayroll(@Query('month') month: string) {
    return this.svc.exportPayrollCsv(month);
  }

  @Get('attendance')
  @Header('Content-Type','text/csv')
  @Header('Content-Disposition','attachment; filename="attendance.csv"')
  async exportAttendance(@Query('month') month: string) {
    return this.svc.exportAttendanceCsv(month);
  }
}
