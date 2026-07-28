import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

import { LeaveController } from './leave.controller';
import { LeaveService } from './leave.service';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [LeaveController],
  providers: [LeaveService],
  exports: [LeaveService],
})
export class LeaveModule {}