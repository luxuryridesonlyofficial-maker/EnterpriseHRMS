import { IsString, IsNotEmpty } from 'class-validator';

export class CreateDesignationDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  departmentId: string;
}
