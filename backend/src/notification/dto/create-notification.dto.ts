import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class CreateNotificationDto {
  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
}
