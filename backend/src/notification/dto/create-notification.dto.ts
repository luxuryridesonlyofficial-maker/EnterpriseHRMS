import { IsOptional, IsString, IsBoolean, IsUUID } from 'class-validator';

export class CreateNotificationDto {
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
}
