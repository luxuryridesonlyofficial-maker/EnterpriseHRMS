import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('activity')
export class ActivityController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  findAll(@Query('limit') limit = '100') {
    return this.audit.findAll(Number(limit));
  }

  @Get('user/:userId')
  findByUser(@Query('userId') userId: string) {
    return this.audit.findByUser(userId);
  }
}
