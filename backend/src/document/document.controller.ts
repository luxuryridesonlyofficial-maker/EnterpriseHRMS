import { Controller, Post, Body, Get, Param, Put, Delete, UseGuards, Req } from '@nestjs/common';
import { DocumentService } from './document.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('documents')
export class DocumentController {
  constructor(private readonly svc: DocumentService) {}

  @Roles(UserRole.HR_MANAGER, UserRole.COMPANY_ADMIN)
  @Post()
  create(@Body() dto: CreateDocumentDto, @Req() req: Request) {
    const userId = (req as any).user?.id ?? undefined;
    return this.svc.create(dto, userId);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER)
  @Get()
  findAll() {
    return this.svc.findAll();
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Roles(UserRole.HR_MANAGER, UserRole.COMPANY_ADMIN)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDocumentDto, @Req() req: Request) {
    const userId = (req as any).user?.id ?? undefined;
    return this.svc.update(id, dto, userId);
  }

  @Roles(UserRole.HR_MANAGER, UserRole.COMPANY_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user?.id ?? undefined;
    return this.svc.remove(id, userId);
  }
}
