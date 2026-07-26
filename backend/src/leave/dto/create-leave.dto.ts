import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { LeaveType } from '@prisma/client';

export class CreateLeaveDto {

  @IsEnum(LeaveType)
  leaveType: LeaveType;

  @Type(() => Date)
  @IsDate()
  fromDate: Date;

  @Type(() => Date)
  @IsDate()
  toDate: Date;

  @IsBoolean()
  @IsOptional()
  isHalfDay?: boolean = false;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  halfDaySession?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}