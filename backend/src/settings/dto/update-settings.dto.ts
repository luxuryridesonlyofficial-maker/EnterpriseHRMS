import { IsOptional, IsString } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  key?: string;

  @IsOptional()
  value?: any;
}
