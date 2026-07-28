import { Controller, Get, Query } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';

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
