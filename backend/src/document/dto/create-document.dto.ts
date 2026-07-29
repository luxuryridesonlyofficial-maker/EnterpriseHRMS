import { IsNotEmpty, IsOptional, IsString, IsUUID, IsArray } from 'class-validator';

export class CreateDocumentDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  filePath: string;

  @IsOptional()
  @IsUUID()
  uploadedBy?: string;

  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
