import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AwardXpDto {
  @ApiProperty({
    description: 'UUID of the user to receive XP',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Amount of XP to award (must be positive)',
    example: 50,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  xpAmount: number;

  @ApiPropertyOptional({
    description: 'ID of the quiz attempt that triggered this XP award',
    example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  })
  @IsOptional()
  @IsUUID()
  quizAttemptId?: string;

  @ApiPropertyOptional({
    description: 'Quiz score percentage (0–100) — used for badge evaluation',
    example: 95,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  quizScore?: number;

  @ApiPropertyOptional({
    description: "True if this is the user's first ever quiz attempt",
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isFirstQuiz?: boolean;
}
