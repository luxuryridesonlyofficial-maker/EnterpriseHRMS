import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class CreateHolidayDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  // expect date in YYYY-MM-DD
  @IsString()
  @Matches(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/)
  date: string;

  @IsString()
  @IsNotEmpty()
  branchId: string;
}
