import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import { TrainingService } from './training.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { EnrollDto } from './dto/enroll.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('training')
@ApiBearerAuth()
@Controller('training')
export class TrainingController {
  constructor(private readonly svc: TrainingService) {}

  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: 'Create a training course' })
  @ApiResponse({ status: 201, description: 'Course created' })
  @Post('courses')
  createCourse(@Body() dto: CreateCourseDto) {
    return this.svc.createCourse(dto);
  }

  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER, UserRole.EMPLOYEE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all training courses' })
  @ApiResponse({ status: 200, description: 'Courses list' })
  @Get('courses')
  listCourses() {
    return this.svc.listCourses();
  }

  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER, UserRole.EMPLOYEE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Enroll in a course' })
  @ApiResponse({ status: 201, description: 'Enrollment successful' })
  @Post('enroll')
  enroll(@Body() dto: EnrollDto) {
    return this.svc.enroll(dto);
  }

  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER)
  @ApiOperation({ summary: 'List enrollments for a course' })
  @ApiResponse({ status: 200, description: 'List of enrollments' })
  @Get('enrollments')
  listEnrollments(@Query('courseId') courseId: string) {
    return this.svc.listEnrollments(courseId);
  }
}
