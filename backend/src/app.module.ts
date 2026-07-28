import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AttendanceModule } from './attendance/attendance.module';
import { AuthModule } from './auth/auth.module';
import { BranchModule } from './branch/branch.module';
import { CompanyModule } from './company/company.module';
import { AuditModule } from './audit/audit.module';
import { DepartmentModule } from './department/department.module';
import { DesignationModule } from './designation/designation.module';
import { EmployeeModule } from './employee/employee.module';
import { PrismaModule } from './prisma/prisma.module';
import { ShiftModule } from './shift/shift.module';
import { UserModule } from './user/user.module';
import { LeaveModule } from './leave/leave.module';
import { HolidayModule } from './holiday/holiday.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { NotificationModule } from './notification/notification.module';
import { AssetModule } from './asset/asset.module';
import { RecruitmentModule } from './recruitment/recruitment.module';
import { TrainingModule } from './training/training.module';
import { PerformanceModule } from './performance/performance.module';
import { ReportsModule } from './reports/reports.module';
import { SettingsModule } from './settings/settings.module';
import { ImportExportModule } from './importexport/importexport.module';
import { ActivityModule } from './activity/activity.module';
import { PayrollModule } from './payroll/payroll.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    CompanyModule,
    AuditModule,
    BranchModule,
    DepartmentModule,
    DesignationModule,
    EmployeeModule,
    UserModule,
    AuthModule,
    AttendanceModule,
    ShiftModule,
    LeaveModule,
    HolidayModule,
    DashboardModule,
    NotificationModule,
    AssetModule,
    RecruitmentModule,
    TrainingModule,
    PerformanceModule,
    ReportsModule,
    SettingsModule,
    ImportExportModule,
    ActivityModule,
    PayrollModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
