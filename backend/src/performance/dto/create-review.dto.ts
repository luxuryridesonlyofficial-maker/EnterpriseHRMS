import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString, IsUUID, Min, Max } from 'class-validator';

export class CreateReviewDto {
  @IsUUID()
  @IsNotEmpty()
  employeeId: string;

  @IsUUID()
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
  @Min(0)
  @Max(100)
  score?: number;
}
