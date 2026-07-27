import { IsNotEmpty, IsString } from 'class-validator';

export class ApprovePayrollDto {
  @IsString()
  @IsNotEmpty()
  approverId: string;

  @IsString()
  @IsNotEmpty()
  remarks: string;
}
