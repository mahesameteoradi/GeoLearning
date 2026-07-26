import { IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GradeProjectDto {
  @ApiProperty({ description: 'Score given for the project submission (0-100)', example: 85 })
  @IsNumber()
  @Min(0)
  @Max(100)
  score: number;
}
