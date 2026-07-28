import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { CreateReviewDto } from './dto/create-review.dto';

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
