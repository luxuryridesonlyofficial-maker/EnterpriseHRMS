import { Module } from '@nestjs/common';
import { RecruitmentService } from './recruitment.service';
import { RecruitmentController } from './recruitment.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [RecruitmentService],
  controllers: [RecruitmentController],
  exports: [RecruitmentService],
})
export class RecruitmentModule {}
