import {
  IsArray,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AddStudentDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  nis_nip?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  no_absen?: number;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}

export class UpdateStudentDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  no_absen?: number;

  @IsOptional()
  @IsString()
  nis_nip?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}

export class BulkRemoveStudentsDto {
  @IsArray()
  @IsString({ each: true })
  studentIds: string[];
}

export class UnlockModuleDto {
  @IsString()
  module_id: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsString()
  teacher_id: string;
}
