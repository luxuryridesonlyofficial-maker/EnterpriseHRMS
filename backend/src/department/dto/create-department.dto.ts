import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUUID()
  @IsNotEmpty()
  branchId: string;
}
