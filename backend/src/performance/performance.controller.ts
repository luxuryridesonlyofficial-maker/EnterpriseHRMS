import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('performance')
export class PerformanceController {
  constructor(private readonly svc: PerformanceService) {}

  @Post('reviews')
  createReview(@Body() dto: CreateReviewDto) {
    return this.svc.createReview(dto);
  }

  @Get('reviews')
  listReviews(@Query('employeeId') employeeId: string) {
    return this.svc.listReviews(employeeId);
  }
}
