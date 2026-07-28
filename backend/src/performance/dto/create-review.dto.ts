import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class CreateReviewDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsString()
  @IsNotEmpty()
  reviewerId: string;

  @IsDateString()
  reviewPeriodStart: string;

  @IsDateString()
  reviewPeriodEnd: string;

  @IsOptional()
  @IsString()
  feedback?: string;

  @IsOptional()
  @IsNumber()
  score?: number;
}
