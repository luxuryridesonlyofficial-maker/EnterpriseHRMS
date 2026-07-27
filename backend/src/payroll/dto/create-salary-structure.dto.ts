import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateSalaryStructureDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsNumber()
  @Min(0)
  basic: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  hra?: number = 0;

  @IsNumber()
  @IsOptional()
  @Min(0)
  da?: number = 0;

  @IsNumber()
  @IsOptional()
  @Min(0)
  medical?: number = 0;

  @IsNumber()
  @IsOptional()
  @Min(0)
  travel?: number = 0;

  @IsNumber()
  @IsOptional()
  @Min(0)
  otherAllowances?: number = 0;

  @IsNumber()
  @IsOptional()
  @Min(0)
  incentives?: number = 0;

  @IsNumber()
  @IsOptional()
  @Min(0)
  overtimeRatePerHour?: number = 0;

  // Deductions as absolute amounts for simplicity
  @IsNumber()
  @IsOptional()
  @Min(0)
  pf?: number = 0;

  @IsNumber()
  @IsOptional()
  @Min(0)
  esi?: number = 0;

  @IsNumber()
  @IsOptional()
  @Min(0)
  professionalTax?: number = 0;

  @IsNumber()
  @IsOptional()
  @Min(0)
  tds?: number = 0;

  @IsNumber()
  @IsOptional()
  @Min(0)
  advanceDeduction?: number = 0;

  @IsNumber()
  @IsOptional()
  @Min(0)
  loanDeduction?: number = 0;

  @IsNumber()
  @IsOptional()
  @Min(0)
  otherDeductions?: number = 0;
}
