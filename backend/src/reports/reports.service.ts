import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async employeesSummary() {
    const total = await this.prisma.employee.count();
    const active = await this.prisma.employee.count({ where: { status: 'ACTIVE' } });
    const inactive = total - active;
    return { total, active, inactive };
  }

  async attendanceSummary(month: string) {
    // month format YYYY-MM
    const [yearStr, monthStr] = month.split('-');
    const year = Number(yearStr);
    const m = Number(monthStr);
    const start = new Date(Date.UTC(year, m-1, 1));
    const end = new Date(Date.UTC(year, m, 0, 23,59,59));
    const total = await this.prisma.attendance.count({ where: { date: { gte: start, lte: end } } });
    const present = await this.prisma.attendance.count({ where: { date: { gte: start, lte: end }, status: 'PRESENT' } });
    const absent = await this.prisma.attendance.count({ where: { date: { gte: start, lte: end }, status: 'ABSENT' } });
    return { total, present, absent };
  }

  async payrollSummary(month: string) {
    const totalPayrolls = await this.prisma.payroll.count({ where: { month } });
    const totalGross = await this.prisma.payroll.aggregate({ _sum: { gross: true }, where: { month } });
    const totalNet = await this.prisma.payroll.aggregate({ _sum: { net: true }, where: { month } });
    return { totalPayrolls, totalGross: totalGross._sum.gross ?? 0, totalNet: totalNet._sum.net ?? 0 };
  }
}
