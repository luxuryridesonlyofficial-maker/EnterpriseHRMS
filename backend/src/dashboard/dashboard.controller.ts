import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { DashboardService } from './dashboard.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.HR_EXECUTIVE, UserRole.MANAGER, UserRole.TEAM_LEAD)
  @Get()
  async getAll() {
    return {
      global: await this.dashboardService.getGlobalSummary(),
      attendance: await this.dashboardService.getAttendanceOverview(),
      leave: await this.dashboardService.getLeaveOverview(),
      holiday: await this.dashboardService.getHolidayOverview(),
      shift: await this.dashboardService.getShiftOverview(),
      company: await this.dashboardService.getCompanyOverview(),
      branch: await this.dashboardService.getBranchOverview(),
      department: await this.dashboardService.getDepartmentOverview(),
      designation: await this.dashboardService.getDesignationOverview(),
      recentActivity: await this.dashboardService.getRecentActivity(),
    };
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.HR_EXECUTIVE, UserRole.MANAGER, UserRole.TEAM_LEAD)
  @Get('cards')
  async cards() {
    return await this.dashboardService.getGlobalSummary();
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.HR_EXECUTIVE, UserRole.MANAGER, UserRole.TEAM_LEAD)
  @Get('charts')
  async charts() {
    return await this.dashboardService.getCharts();
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.HR_EXECUTIVE)
  @Get('attendance')
  async attendance() {
    return await this.dashboardService.getAttendanceOverview();
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.HR_EXECUTIVE)
  @Get('leave')
  async leave() {
    return await this.dashboardService.getLeaveOverview();
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.HR_EXECUTIVE, UserRole.MANAGER, UserRole.TEAM_LEAD, UserRole.EMPLOYEE)
  @Get('holiday')
  async holiday() {
    return await this.dashboardService.getHolidayOverview();
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.HR_EXECUTIVE)
  @Get('shift')
  async shift() {
    return await this.dashboardService.getShiftOverview();
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.HR_EXECUTIVE)
  @Get('company')
  async company() {
    return await this.dashboardService.getCompanyOverview();
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.HR_EXECUTIVE)
  @Get('branch')
  async branch() {
    return await this.dashboardService.getBranchOverview();
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.HR_EXECUTIVE)
  @Get('department')
  async department() {
    return await this.dashboardService.getDepartmentOverview();
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.HR_EXECUTIVE)
  @Get('designation')
  async designation() {
    return await this.dashboardService.getDesignationOverview();
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.HR_EXECUTIVE, UserRole.MANAGER, UserRole.TEAM_LEAD)
  @Get('recent-activity')
  async recentActivity() {
    return await this.dashboardService.getRecentActivity();
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.HR_EXECUTIVE)
  @Get('statistics')
  async statistics() {
    return {
      global: await this.dashboardService.getGlobalSummary(),
      attendance: await this.dashboardService.getAttendanceOverview(),
      leave: await this.dashboardService.getLeaveOverview(),
    };
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.HR_EXECUTIVE)
  @Get('monthly-report')
  async monthlyReport() {
    return await this.dashboardService.getCharts();
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.HR_EXECUTIVE)
  @Get('today')
  async today() {
    return await this.dashboardService.getToday();
  }
}
