import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsUUID, Min } from 'class-validator';

export class BoostDto {
  @ApiProperty({ description: 'ID of the student' })
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ description: 'XP Bonus to award' })
  @IsNumber()
  @Min(1)
  xpBonus: number;

  @ApiProperty({ description: 'Motivational note' })
  @IsString()
  @IsNotEmpty()
  note: string;
}

