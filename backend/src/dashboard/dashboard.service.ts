import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  private startOfTodayUTC() {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }

  private endOfTodayUTC() {
    const start = this.startOfTodayUTC();
    return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
  }

  private startOfMonthUTC(date = new Date()) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  }

  private endOfMonthUTC(date = new Date()) {
    const start = this.startOfMonthUTC(date);
    return new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1) - 1);
  }

  async getGlobalSummary() {
    const [totalCompanies, totalBranches, totalDepartments, totalEmployees, activeEmployees, inactiveEmployees] = await Promise.all([
      this.prisma.company.count(),
      this.prisma.branch.count(),
      this.prisma.department.count(),
      this.prisma.employee.count(),
      this.prisma.employee.count({ where: { status: 'ACTIVE' } }),
      this.prisma.employee.count({ where: { status: 'INACTIVE' } }),
    ]);

    const todayStart = this.startOfTodayUTC();
    const todayEnd = this.endOfTodayUTC();

    const newEmployeesThisMonth = await this.prisma.employee.count({
      where: {
        createdAt: {
          gte: this.startOfMonthUTC(),
          lt: this.endOfMonthUTC(),
        },
      },
    });

    const employeesJoinedToday = await this.prisma.employee.count({
      where: {
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    const employeesLeft = await this.prisma.employee.count({ where: { status: { in: ['RESIGNED', 'TERMINATED'] } } });

    return {
      totalCompanies,
      totalBranches,
      totalDepartments,
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      newEmployeesThisMonth,
      employeesJoinedToday,
      employeesLeft,
    };
  }

  async getAttendanceOverview() {
    const todayStart = this.startOfTodayUTC();
    const todayEnd = this.endOfTodayUTC();

    const [attendancesToday, attendanceRecords] = await Promise.all([
      this.prisma.attendance.findMany({
        where: { date: { gte: todayStart, lte: todayEnd } },
        include: { breaks: true },
      }),
      this.prisma.attendance.findMany({
        where: { date: { gte: this.startOfMonthUTC(), lte: this.endOfMonthUTC() } },
        select: { status: true },
      }),
    ]);

    const presentToday = attendancesToday.filter(a => a.status === 'PRESENT').length;
    const absentToday = attendancesToday.filter(a => a.status === 'ABSENT').length;
    const checkedOut = attendancesToday.filter(a => a.checkOut !== null).length;
    const onBreak = attendancesToday.flatMap(a => a.breaks).filter(b => b.breakIn === null).length;
    const lateToday = attendancesToday.filter(a => a.lateMinutes > 0).length;

    const averageWorkingMinutes = attendancesToday.length ? Math.round(attendancesToday.reduce((sum, a) => sum + (a.netWorkingMinutes ?? 0), 0) / attendancesToday.length) : 0;

    // Monthly attendance %: percent of attendance records in month that are PRESENT
    const monthTotal = attendanceRecords.length;
    const monthPresent = attendanceRecords.filter(r => r.status === 'PRESENT').length;
    const monthlyAttendancePercent = monthTotal === 0 ? 0 : Math.round((monthPresent / monthTotal) * 100);

    // Weekly attendance %: last 7 days records
    const sevenDaysAgo = new Date(this.startOfTodayUTC().getTime() - 6 * 24 * 60 * 60 * 1000);
    const weeklyRecords = await this.prisma.attendance.findMany({ where: { date: { gte: sevenDaysAgo, lte: todayEnd } }, select: { status: true } });
    const weeklyTotal = weeklyRecords.length;
    const weeklyPresent = weeklyRecords.filter(r => r.status === 'PRESENT').length;
    const weeklyAttendancePercent = weeklyTotal === 0 ? 0 : Math.round((weeklyPresent / weeklyTotal) * 100);

    // Attendance trend: last 7 days counts
    const trendStart = sevenDaysAgo;
    const trendRecords = await this.prisma.attendance.findMany({ where: { date: { gte: trendStart, lte: todayEnd } }, select: { date: true, status: true } });

    const trendMap: Record<string, { present: number; absent: number }> = {};

    for (let d = 6; d >= 0; d--) {
      const day = new Date(this.startOfTodayUTC().getTime() - d * 24 * 60 * 60 * 1000);
      const key = day.toISOString().slice(0,10);
      trendMap[key] = { present: 0, absent: 0 };
    }

    for (const r of trendRecords) {
      const key = r.date.toISOString().slice(0,10);
      if (!trendMap[key]) trendMap[key] = { present: 0, absent: 0 };
      if (r.status === 'PRESENT') trendMap[key].present += 1;
      if (r.status === 'ABSENT') trendMap[key].absent += 1;
    }

    const attendanceTrend = Object.keys(trendMap).map(k => ({ date: k, ...trendMap[k] }));

    return {
      presentToday,
      absentToday,
      lateToday,
      onBreak,
      checkedOut,
      averageWorkingMinutes,
      monthlyAttendancePercent,
      weeklyAttendancePercent,
      attendanceTrend,
    };
  }

  async getLeaveOverview() {
    const [pendingLeaves, approvedLeaves, rejectedLeaves] = await Promise.all([
      this.prisma.leave.count({ where: { status: 'PENDING' } }),
      this.prisma.leave.count({ where: { status: 'APPROVED' } }),
      this.prisma.leave.count({ where: { status: 'REJECTED' } }),
    ]);

    const today = this.startOfTodayUTC();
    const endToday = this.endOfTodayUTC();

    const employeesOnLeaveToday = await this.prisma.leave.findMany({ where: { status: 'APPROVED', fromDate: { lte: endToday }, toDate: { gte: today } }, include: { employee: true } });

    // Leave trend: last 6 months counts per month
    const months: { label: string; count: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setUTCMonth(d.getUTCMonth() - i);
      const start = this.startOfMonthUTC(d);
      const end = this.endOfMonthUTC(d);
      const count = await this.prisma.leave.count({ where: { createdAt: { gte: start, lte: end } } });
      months.push({ label: `${start.getUTCFullYear()}-${String(start.getUTCMonth()+1).padStart(2,'0')}`, count });
    }

    return {
      pendingLeaves,
      approvedLeaves,
      rejectedLeaves,
      employeesOnLeaveToday: employeesOnLeaveToday.length,
      leaveTrend: months,
    };
  }

  async getHolidayOverview() {
    const todayStart = this.startOfTodayUTC();
    const todayEnd = this.endOfTodayUTC();
    const monthStart = this.startOfMonthUTC();
    const monthEnd = this.endOfMonthUTC();

    const upcoming = await this.prisma.holiday.findMany({ where: { date: { gte: todayStart } }, orderBy: { date: 'asc' }, take: 10, include: { branch: true } });
    const today = await this.prisma.holiday.findMany({ where: { date: { gte: todayStart, lte: todayEnd } }, include: { branch: true } });
    const thisMonth = await this.prisma.holiday.findMany({ where: { date: { gte: monthStart, lte: monthEnd } }, include: { branch: true } });

    return {
      upcomingHolidays: upcoming,
      todaysHoliday: today,
      thisMonthHolidays: thisMonth,
    };
  }

  async getShiftOverview() {
    const employees = await this.prisma.employee.findMany({ select: { shiftId: true } });
    const shiftMap: Record<string, number> = {};
    for (const e of employees) {
      const key = e.shiftId ?? 'UNASSIGNED';
      shiftMap[key] = (shiftMap[key] ?? 0) + 1;
    }

    const shifts = await this.prisma.shift.findMany();
    const distribution = shifts.map(s => ({ shiftId: s.id, name: s.name, count: shiftMap[s.id] ?? 0 }));

    if (shiftMap['UNASSIGNED']) distribution.push({ shiftId: 'UNASSIGNED', name: 'Unassigned', count: shiftMap['UNASSIGNED'] });

    return { distribution };
  }

  async getCompanyOverview() {
    const companies = await this.prisma.company.findMany({ include: { branches: { include: { employees: { select: { id: true } } } } } });

    const companyCounts = companies.map(c => ({ companyId: c.id, name: c.name, employeeCount: c.branches.reduce((s, b) => s + (b.employees?.length ?? 0), 0) }));

    return { companyCounts };
  }

  async getBranchOverview() {
    const branches = await this.prisma.branch.findMany({ include: { employees: { select: { id: true } } } });
    const result = branches.map(b => ({ branchId: b.id, name: b.name, employeeCount: b.employees?.length ?? 0 }));
    return { branches: result };
  }

  async getDepartmentOverview() {
    const departments = await this.prisma.department.findMany({ include: { designations: { include: { employees: { select: { id: true } } } } } });
    const result = departments.map(d => ({ departmentId: d.id, name: d.name, employeeCount: d.designations.reduce((s, des) => s + (des.employees?.length ?? 0), 0) }));
    return { departments: result };
  }

  async getDesignationOverview() {
    const designations = await this.prisma.designation.findMany({ include: { employees: { select: { id: true } } } });
    const result = designations.map(d => ({ designationId: d.id, name: d.name, employeeCount: d.employees?.length ?? 0 }));
    return { designations: result };
  }

  async getRecentActivity(limit = 50) {
    // Collect recent events from multiple sources
    const employees = await this.prisma.employee.findMany({ orderBy: { createdAt: 'desc' }, take: 20, select: { id: true, firstName: true, lastName: true, createdAt: true } });
    const users = await this.prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, mobile: true, createdAt: true } });
    const leaves = await this.prisma.leave.findMany({ orderBy: { updatedAt: 'desc' }, take: 20, select: { id: true, employeeId: true, status: true, updatedAt: true } });
    const attendances = await this.prisma.attendance.findMany({ orderBy: { updatedAt: 'desc' }, take: 20, select: { id: true, employeeId: true, checkIn: true, checkOut: true, updatedAt: true } });

    const feed: { type: string; timestamp: Date; payload: any }[] = [];

    for (const e of employees) feed.push({ type: 'EmployeeAdded', timestamp: e.createdAt, payload: { id: e.id, name: `${e.firstName} ${e.lastName ?? ''}` } });
    for (const u of users) feed.push({ type: 'UserCreated', timestamp: u.createdAt, payload: { id: u.id, mobile: u.mobile } });
    for (const l of leaves) feed.push({ type: 'LeaveUpdated', timestamp: l.updatedAt, payload: { id: l.id, employeeId: l.employeeId, status: l.status } });
    for (const a of attendances) feed.push({ type: 'AttendanceUpdated', timestamp: a.updatedAt, payload: { id: a.id, employeeId: a.employeeId, checkIn: a.checkIn, checkOut: a.checkOut } });

    // Sort and limit
    feed.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return feed.slice(0, limit);
  }

  async getCharts() {
    // Example: monthly employee join trend (last 6 months)
    const months: { label: string; joins: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setUTCMonth(d.getUTCMonth() - i);
      const start = this.startOfMonthUTC(d);
      const end = this.endOfMonthUTC(d);
      const joins = await this.prisma.employee.count({ where: { createdAt: { gte: start, lte: end } } });
      months.push({ label: `${start.getUTCFullYear()}-${String(start.getUTCMonth()+1).padStart(2,'0')}`, joins });
    }

    return { monthlyJoins: months };
  }

  async getToday() {
    const todayStart = this.startOfTodayUTC();
    const todayEnd = this.endOfTodayUTC();

    const [presentToday, employeesJoinedToday, todaysHoliday] = await Promise.all([
      this.prisma.attendance.count({ where: { date: { gte: todayStart, lte: todayEnd }, status: 'PRESENT' } }),
      this.prisma.employee.count({ where: { createdAt: { gte: todayStart, lte: todayEnd } } }),
      this.prisma.holiday.findMany({ where: { date: { gte: todayStart, lte: todayEnd } }, include: { branch: true } }),
    ]);

    return { presentToday, employeesJoinedToday, todaysHoliday };
  }
}
