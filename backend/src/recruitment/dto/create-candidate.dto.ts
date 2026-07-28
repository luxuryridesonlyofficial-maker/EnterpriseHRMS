import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
  mobile: string;

  @IsOptional()
  @IsString()
  resumeUrl?: string;

  @IsString()
  positionAppliedFor: string;
}
