import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { LeaveType } from '@prisma/client';

export class CreateLeavePolicyDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(LeaveType)
  leaveType!: LeaveType;

  @IsInt()
  allowedDays!: number;

  @IsBoolean()
  @IsOptional()
  isCarriedForward?: boolean = false;

  @IsString()
  @IsNotEmpty()
  branchId!: string;
}
