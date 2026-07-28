import { IsNotEmpty, IsString, IsDateString, IsOptional } from 'class-validator';

export class CreateInterviewDto {
  @IsNotEmpty()
  @IsString()
  candidateId: string;

  @IsNotEmpty()
  @IsString()
  interviewerId: string;

  @IsDateString()
  scheduledAt: string;

  @IsOptional()
  @IsString()
  mode?: string;

  @IsOptional()
  @IsString()
  meetingLink?: string;
}
