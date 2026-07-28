import { Controller, Post, Body, Get, Query, UseGuards, Req } from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('performance')
export class PerformanceController {
  constructor(private readonly svc: PerformanceService) {}

  @Roles(UserRole.MANAGER, UserRole.HR_MANAGER, UserRole.COMPANY_ADMIN)
  @Post('reviews')
  createReview(@Body() dto: CreateReviewDto, @Req() req: Request) {
    const userId = (req as any).user?.id ?? undefined;
    return this.svc.createReview(dto, userId);
  }

  @Roles(UserRole.MANAGER, UserRole.HR_MANAGER, UserRole.COMPANY_ADMIN)
  @Get('reviews')
  listReviews(@Query('employeeId') employeeId: string) {
    return this.svc.listReviews(employeeId);
  }
}
