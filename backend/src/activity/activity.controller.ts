import { Controller, Get, Query, UseGuards, Param } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('activity')
export class ActivityController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.audit.findAll(query);
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.audit.findByUser(userId);
  }
}
