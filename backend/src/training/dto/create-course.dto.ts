import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  trainer: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
