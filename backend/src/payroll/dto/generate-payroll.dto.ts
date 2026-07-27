import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class GeneratePayrollDto {
  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  companyId?: string;

  // month in YYYY-MM format
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}$/)
  month: string;
}
