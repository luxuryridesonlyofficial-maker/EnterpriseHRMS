import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateDesignationDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUUID()
  @IsNotEmpty()
  departmentId: string;
}
