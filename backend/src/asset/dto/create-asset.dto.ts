import { IsString, IsOptional } from 'class-validator';

export class CreateAssetDto {
  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsString()
  serialNumber: string;

  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsOptional()
  @IsString()
  branchId?: string;
}
