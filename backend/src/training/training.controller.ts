import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import { TrainingService } from './training.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { EnrollDto } from './dto/enroll.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('training')
export class TrainingController {
  constructor(private readonly svc: TrainingService) {}

  @Post('courses')
  createCourse(@Body() dto: CreateCourseDto) {
    return this.svc.createCourse(dto);
  }

  @Get('courses')
  listCourses() {
    return this.svc.listCourses();
  }

  @Post('enroll')
  enroll(@Body() dto: EnrollDto) {
    return this.svc.enroll(dto);
  }

  @Get('enrollments')
  listEnrollments(@Query('courseId') courseId: string) {
    return this.svc.listEnrollments(courseId);
  }
}
