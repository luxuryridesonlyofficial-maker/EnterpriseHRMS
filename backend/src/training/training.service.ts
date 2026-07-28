import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { EnrollDto } from './dto/enroll.dto';

@Injectable()
export class TrainingService {
  constructor(private readonly prisma: PrismaService) {}

  async createCourse(dto: CreateCourseDto) {
    return this.prisma.trainingCourse.create({ data: { ...dto, startDate: new Date(dto.startDate), endDate: new Date(dto.endDate) } as any });
  }

  async listCourses() {
    return this.prisma.trainingCourse.findMany({ orderBy: { startDate: 'desc' } });
  }

  async enroll(dto: EnrollDto) {
    const course = await this.prisma.trainingCourse.findUnique({ where: { id: dto.courseId } });
    if (!course) throw new NotFoundException('Course not found');
    const emp = await this.prisma.employee.findUnique({ where: { id: dto.employeeId } });
    if (!emp) throw new NotFoundException('Employee not found');
    return this.prisma.trainingEnrollment.create({ data: { courseId: dto.courseId, employeeId: dto.employeeId } });
  }

  async listEnrollments(courseId?: string) {
    const where: any = {};
    if (courseId) where.courseId = courseId;
    return this.prisma.trainingEnrollment.findMany({ where, include: { course: true, employee: true } });
  }
}
