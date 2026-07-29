import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import { TrainingService } from './training.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { EnrollDto } from './dto/enroll.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('training')
export class TrainingController {
  constructor(private readonly svc: TrainingService) {}

  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER)
  @Post('courses')
  createCourse(@Body() dto: CreateCourseDto) {
    return this.svc.createCourse(dto);
  }

  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER, UserRole.EMPLOYEE, UserRole.SUPER_ADMIN)
  @Get('courses')
  listCourses() {
    return this.svc.listCourses();
  }

  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER, UserRole.EMPLOYEE, UserRole.SUPER_ADMIN)
  @Post('enroll')
  enroll(@Body() dto: EnrollDto) {
    return this.svc.enroll(dto);
  }

  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER)
  @Get('enrollments')
  listEnrollments(@Query('courseId') courseId: string) {
    return this.svc.listEnrollments(courseId);
  }
}
