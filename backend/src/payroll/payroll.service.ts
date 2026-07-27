import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSalaryStructureDto } from './dto/create-salary-structure.dto';
import { GeneratePayrollDto } from './dto/generate-payroll.dto';

@Injectable()
export class PayrollService {
  constructor(private readonly prisma: PrismaService) {}

  private startOfMonthUTC(year: number, month: number) {
    return new Date(Date.UTC(year, month - 1, 1));
  }

  private endOfMonthUTC(year: number, month: number) {
    return new Date(Date.UTC(year, month, 1) - 1);
  }

  async upsertSalaryStructure(dto: CreateSalaryStructureDto, userId?: string) {
    const employee = await this.prisma.employee.findUnique({ where: { id: dto.employeeId } });
    if (!employee) throw new NotFoundException('Employee not found');

    let structure = await this.prisma.salaryStructure.findUnique({ where: { employeeId: dto.employeeId } }).catch(() => null);

    if (!structure) {
      structure = await this.prisma.salaryStructure.create({
        data: {
          employeeId: dto.employeeId,
          createdBy: userId,
        },
      });
    }

    // create a revision
    const revisions = await this.prisma.salaryRevision.findMany({ where: { salaryStructureId: structure.id }, orderBy: { version: 'desc' }, take: 1 });
    const version = (revisions[0]?.version ?? 0) + 1;
    const components = {
      basic: dto.basic,
      hra: dto.hra ?? 0,
      da: dto.da ?? 0,
      medical: dto.medical ?? 0,
      travel: dto.travel ?? 0,
      otherAllowances: dto.otherAllowances ?? 0,
      incentives: dto.incentives ?? 0,
      overtimeRatePerHour: dto.overtimeRatePerHour ?? 0,
      deductions: {
        pf: dto.pf ?? 0,
        esi: dto.esi ?? 0,
        professionalTax: dto.professionalTax ?? 0,
        tds: dto.tds ?? 0,
        advanceDeduction: dto.advanceDeduction ?? 0,
        loanDeduction: dto.loanDeduction ?? 0,
        otherDeductions: dto.otherDeductions ?? 0,
      },
    };

    const revision = await this.prisma.salaryRevision.create({
      data: {
        salaryStructureId: structure.id,
        version,
        effectiveFrom: new Date(),
        components,
        createdBy: userId,
      },
    });

    return { structure, revision };
  }

  async getSalaryStructure(employeeId: string) {
    const structure = await this.prisma.salaryStructure.findUnique({ where: { employeeId }, include: { revisions: { orderBy: { version: 'desc' }, take: 1 } } });
    if (!structure) throw new NotFoundException('Salary structure not found');
    return structure;
  }

  private async countWorkingDaysInMonth(year: number, month: number, branchId?: string) {
    const start = this.startOfMonthUTC(year, month);
    const end = this.endOfMonthUTC(year, month);
    const holidays = branchId ? await this.prisma.holiday.findMany({ where: { branchId, date: { gte: start, lte: end } }, select: { date: true } }) : [];
    const holidaySet = new Set(holidays.map(h => h.date.toISOString().slice(0,10)));
    let count = 0;
    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate()+1)) {
      const day = d.getUTCDay();
      if (day === 0 || day === 6) continue;
      const key = d.toISOString().slice(0,10);
      if (holidaySet.has(key)) continue;
      count++;
    }
    return count;
  }

  private async getAttendanceCounts(employeeId: string, year: number, month: number) {
    const start = this.startOfMonthUTC(year, month);
    const end = this.endOfMonthUTC(year, month);
    const records = await this.prisma.attendance.findMany({ where: { employeeId, date: { gte: start, lte: end } }, select: { status: true, netWorkingMinutes: true } });
    const present = records.filter(r => r.status === 'PRESENT').length;
    const absent = records.filter(r => r.status === 'ABSENT').length;
    const totalWorkingMinutes = records.reduce((s, r) => s + (r.netWorkingMinutes ?? 0), 0);
    return { present, absent, totalWorkingMinutes };
  }

  async generatePayroll(dto: GeneratePayrollDto, userId?: string) {
    // determine target employees
    let employees: any[] = [];
    if (dto.employeeId) {
      const e = await this.prisma.employee.findUnique({ where: { id: dto.employeeId } });
      if (!e) throw new NotFoundException('Employee not found');
      employees = [e];
    } else if (dto.branchId) {
      employees = await this.prisma.employee.findMany({ where: { branchId: dto.branchId } });
    } else if (dto.companyId) {
      employees = await this.prisma.employee.findMany({ where: { branch: { companyId: dto.companyId } } });
    } else {
      employees = await this.prisma.employee.findMany();
    }

    const [yearStr, monthStr] = dto.month.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);

    const createdPayrolls = [] as any[];

    for (const emp of employees) {
      // fetch latest salary revision
      const structure = await this.prisma.salaryStructure.findUnique({ where: { employeeId: emp.id } });
      if (!structure) continue;
      const revision = await this.prisma.salaryRevision.findFirst({ where: { salaryStructureId: structure.id }, orderBy: { version: 'desc' } });
      if (!revision) continue;

      // Prevent duplicate payroll
      const existing = await this.prisma.payroll.findUnique({ where: { employeeId_month: { employeeId: emp.id, month: dto.month } } }).catch(() => null);
      if (existing) continue;

      const workingDays = await this.countWorkingDaysInMonth(year, month, emp.branchId);
      const attendance = await this.getAttendanceCounts(emp.id, year, month);
      const presentDays = attendance.present;
      const absentDays = Math.max(0, workingDays - presentDays);

      const comps = revision.components as any;
      const gross = Math.round((comps.basic ?? 0) + (comps.hra ?? 0) + (comps.da ?? 0) + (comps.medical ?? 0) + (comps.travel ?? 0) + (comps.otherAllowances ?? 0) + (comps.incentives ?? 0));
      const proratedGross = workingDays === 0 ? gross : Math.round((gross * presentDays) / workingDays);

      const standardMinutes = presentDays * 8 * 60;
      const overtimeMinutes = Math.max(0, (attendance.totalWorkingMinutes ?? 0) - standardMinutes);
      const overtimeHours = overtimeMinutes / 60;
      const overtimePay = Math.round(overtimeHours * (comps.overtimeRatePerHour ?? 0));

      const deductionsObj = comps.deductions ?? {};
      const pf = deductionsObj.pf ?? 0;
      const esi = deductionsObj.esi ?? 0;
      const professionalTax = deductionsObj.professionalTax ?? 0;
      const tds = deductionsObj.tds ?? 0;
      const advance = deductionsObj.advanceDeduction ?? 0;
      const loan = deductionsObj.loanDeduction ?? 0;
      const other = deductionsObj.otherDeductions ?? 0;

      const absentDeduction = workingDays === 0 ? 0 : Math.round((gross * absentDays) / workingDays);
      const totalDeductions = pf + esi + professionalTax + tds + advance + loan + other + absentDeduction;
      const net = Math.max(0, proratedGross + overtimePay - totalDeductions);

      // create payroll
      const payroll = await this.prisma.payroll.create({
        data: {
          month: dto.month,
          employeeId: emp.id,
          companyId: emp.branch?.companyId ?? undefined,
          branchId: emp.branchId,
          gross: proratedGross + overtimePay,
          totalDeductions,
          net,
          createdBy: userId,
        },
      });

      // create items
      const items = [
        { type: 'EARNING', name: 'Basic', amount: comps.basic ?? 0 },
        { type: 'EARNING', name: 'HRA', amount: comps.hra ?? 0 },
        { type: 'EARNING', name: 'DA', amount: comps.da ?? 0 },
        { type: 'EARNING', name: 'Medical', amount: comps.medical ?? 0 },
        { type: 'EARNING', name: 'Travel', amount: comps.travel ?? 0 },
        { type: 'EARNING', name: 'Other Allowances', amount: comps.otherAllowances ?? 0 },
        { type: 'EARNING', name: 'Incentives', amount: comps.incentives ?? 0 },
        { type: 'EARNING', name: 'Overtime', amount: overtimePay },
        { type: 'DEDUCTION', name: 'PF', amount: pf },
        { type: 'DEDUCTION', name: 'ESI', amount: esi },
        { type: 'DEDUCTION', name: 'Professional Tax', amount: professionalTax },
        { type: 'DEDUCTION', name: 'TDS', amount: tds },
        { type: 'DEDUCTION', name: 'Advance', amount: advance },
        { type: 'DEDUCTION', name: 'Loan', amount: loan },
        { type: 'DEDUCTION', name: 'Absent Deduction', amount: absentDeduction },
        { type: 'DEDUCTION', name: 'Other Deductions', amount: other },
      ];

      for (const it of items) {
        await this.prisma.payrollItem.create({ data: { payrollId: payroll.id, type: it.type as any, name: it.name, amount: it.amount } });
      }

      // create payslip content
      await this.prisma.payslip.create({ data: { payrollId: payroll.id, content: { gross: payroll.gross, deductions: totalDeductions, net: payroll.net, components: comps } } });

      // history
      await this.prisma.payrollHistory.create({ data: { payrollId: payroll.id, action: 'GENERATED', actorId: userId } });

      createdPayrolls.push(payroll);
    }

    return createdPayrolls;
  }

  async getPayroll(id: string) {
    const p = await this.prisma.payroll.findUnique({ where: { id }, include: { items: true, payslip: true } });
    if (!p) throw new NotFoundException('Payroll not found');
    return p;
  }

  async listPayrolls(employeeId?: string, month?: string) {
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (month) where.month = month;
    return await this.prisma.payroll.findMany({ where, include: { items: true } });
  }

  async approvePayroll(id: string, approverId: string) {
    const p = await this.prisma.payroll.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Payroll not found');
    if (p.status === 'LOCKED') throw new ConflictException('Payroll is locked');
    if (p.status === 'APPROVED') throw new ConflictException('Payroll already approved');
    const updated = await this.prisma.payroll.update({ where: { id }, data: { status: 'APPROVED', approvedAt: new Date(), updatedBy: approverId } });
    await this.prisma.payrollApproval.create({ data: { payrollId: id, approverId, remarks: '' } });
    await this.prisma.payrollHistory.create({ data: { payrollId: id, action: 'APPROVED', actorId: approverId } });
    return updated;
  }

  async lockPayroll(id: string, userId?: string) {
    const p = await this.prisma.payroll.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Payroll not found');
    const updated = await this.prisma.payroll.update({ where: { id }, data: { status: 'LOCKED', lockedAt: new Date(), updatedBy: userId } });
    await this.prisma.payrollHistory.create({ data: { payrollId: id, action: 'LOCKED', actorId: userId } });
    return updated;
  }

  async unlockPayroll(id: string, userId?: string) {
    const p = await this.prisma.payroll.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Payroll not found');
    const updated = await this.prisma.payroll.update({ where: { id }, data: { status: 'DRAFT', lockedAt: null, updatedBy: userId } });
    await this.prisma.payrollHistory.create({ data: { payrollId: id, action: 'UNLOCKED', actorId: userId } });
    return updated;
  }
}
