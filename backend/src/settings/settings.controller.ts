import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly svc: SettingsService) {}

  @Get()
  getAll() {
    return this.svc.getAll();
  }

  @Get(':key')
  get(@Param('key') key: string) {
    return this.svc.get(key);
  }

  @Post(':key')
  set(@Param('key') key: string, @Body() body: any) {
    return this.svc.set(key, body.value);
  }
}
