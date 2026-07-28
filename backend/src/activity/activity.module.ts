import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ActivityController } from './activity.controller';

@Module({
  imports: [AuditModule],
  controllers: [ActivityController],
})
export class ActivityModule {}
