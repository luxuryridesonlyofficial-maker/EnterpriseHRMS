import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDocumentDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  filePath: string;

  @IsOptional()
  @IsString()
  uploadedBy?: string;

  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsOptional()
  tags?: string[];
}
