import { IsOptional, IsString } from 'class-validator';

export class CreateAuditLogDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  employeeCode?: string;

  @IsString()
  action: string;

  @IsString()
  module: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;
}
