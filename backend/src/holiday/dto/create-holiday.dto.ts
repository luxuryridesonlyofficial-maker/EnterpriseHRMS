import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsString, MaxLength, IsUUID } from 'class-validator';

export class CreateHolidayDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title!: string;

  @Type(() => Date)
  @IsDate()
  date!: Date;

  @IsUUID()
  @IsNotEmpty()
  branchId!: string;
}
