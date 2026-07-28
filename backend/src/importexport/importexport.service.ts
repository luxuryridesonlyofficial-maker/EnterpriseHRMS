import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ImportExportService {
  constructor(private readonly prisma: PrismaService) {}

  async exportEmployeesCsv() {
    const rows = await this.prisma.employee.findMany();
    const header = ['id','employeeCode','firstName','lastName','email','mobile','status','branchId','designationId','createdAt']
    const lines = [header.join(',')];
    for (const r of rows) {
      lines.push([r.id,r.employeeCode,r.firstName,r.lastName ?? '',r.email ?? '',r.mobile,r.status,r.branchId,r.designationId,r.createdAt.toISOString()].map(v => `"${String(v).replace(/"/g,'""')}"`).join(','));
    }
    return lines.join('\n');
  }

  async exportPayrollCsv(month: string) {
    const rows = await this.prisma.payroll.findMany({ where: { month } });
    const header = ['id','employeeId','month','gross','totalDeductions','net','status','createdAt'];
    const lines = [header.join(',')];
    for (const r of rows) {
      lines.push([r.id,r.employeeId,r.month,r.gross,r.totalDeductions,r.net,r.status,r.createdAt.toISOString()].map(v => `"${String(v).replace(/"/g,'""')}"`).join(','));
    }
    return lines.join('\n');
  }

  async exportAttendanceCsv(month: string) {
    const [yearStr, monthStr] = month.split('-');
    const year = Number(yearStr);
    const m = Number(monthStr);
    const start = new Date(Date.UTC(year, m-1, 1));
    const end = new Date(Date.UTC(year, m, 0, 23,59,59));
    const rows = await this.prisma.attendance.findMany({ where: { date: { gte: start, lte: end } } });
    const header = ['id','employeeId','date','checkIn','checkOut','status','workingMinutes'];
    const lines = [header.join(',')];
    for (const r of rows) {
      lines.push([r.id,r.employeeId,r.date.toISOString(),r.checkIn?.toISOString() ?? '',r.checkOut?.toISOString() ?? '',r.status,r.workingMinutes].map(v => `"${String(v).replace(/"/g,'""')}"`).join(','));
    }
    return lines.join('\n');
  }
}
