import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateBranchDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUUID()
  @IsNotEmpty()
  companyId: string;
}
