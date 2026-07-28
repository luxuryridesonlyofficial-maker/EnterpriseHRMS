import { IsString, IsNotEmpty } from 'class-validator';

export class EnrollDto {
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsString()
  @IsNotEmpty()
  employeeId: string;
}
