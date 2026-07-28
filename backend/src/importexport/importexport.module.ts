import { Module } from '@nestjs/common';
import { ImportExportService } from './importexport.service';
import { ImportExportController } from './importexport.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ImportExportService],
  controllers: [ImportExportController],
})
export class ImportExportModule {}
