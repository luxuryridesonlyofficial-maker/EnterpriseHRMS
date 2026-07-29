import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateCandidateDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9+()\-\s]{7,20}$/)
  mobile: string;

  @IsOptional()
  @IsString()
  resumeUrl?: string;

  @IsString()
  positionAppliedFor: string;
}
