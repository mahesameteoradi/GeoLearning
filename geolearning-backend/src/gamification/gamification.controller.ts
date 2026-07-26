import { Controller, Post, Body, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { GamificationService, XpResult } from './gamification.service';
import { AwardXpDto } from './dto/award-xp.dto';
import { BoostDto } from './dto/boost.dto';
import { GradeProjectDto } from './dto/grade.dto';
import { CurrentUser } from '../auth/auth.decorator';
import { SupabaseUser } from '../common/types/supabase-user.type';

@ApiTags('Gamification')
@ApiBearerAuth('supabase-jwt')
@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamification: GamificationService) {}

  /**
   * POST /v1/gamification/award-xp
   *
   * Triggers the full gamification pipeline for a user:
   * XP → Level → Streak → Badges → Supabase Realtime broadcasts.
   *
   * In production, this is called internally by QuizAttemptService after
   * a quiz is submitted. Exposed here for testing and admin use.
   */
  @Post('award-xp')
  @ApiOperation({
    summary: 'Award XP and run the full gamification pipeline',
    description:
      'Awards XP to a user, recalculates level and streak, evaluates badge conditions, ' +
      'and broadcasts achievement_unlocked + leaderboard_updated events via Supabase Realtime.',
  })
  @ApiResponse({ status: 201, description: 'XP awarded successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async awardXp(@Body() dto: AwardXpDto): Promise<XpResult> {
    return this.gamification.awardXP(dto.userId, dto.xpAmount, {
      quizScore: dto.quizScore,
      isFirstQuiz: dto.isFirstQuiz,
      quizAttemptId: dto.quizAttemptId,
    });
  }

  /**
   * POST /v1/gamification/boost
   *
   * Sends a motivational boost to a student.
   */
  @Post('boost')
  @ApiOperation({ summary: 'Send motivational boost (XP + Intervention)' })
  async sendBoost(@Body() dto: BoostDto, @CurrentUser() user: SupabaseUser) {
    return this.gamification.sendBoost(user.id, dto.studentId, dto.xpBonus, dto.note);
  }

  /**
   * POST /v1/gamification/project/:id/grade
   *
   * Grades a project submission and awards XP.
   */
  @Post('project/:id/grade')
  @ApiOperation({ summary: 'Grade project submission and award XP' })
  async gradeProject(
    @Param('id', ParseUUIDPipe) submissionId: string,
    @Body() dto: GradeProjectDto,
    @CurrentUser() user: SupabaseUser,
  ) {
    return this.gamification.gradeProject(user.id, submissionId, dto.score);
  }

  /**
   * GET /v1/gamification/profile/:userId
   *
   * Returns the full gamification profile for a user:
   * current XP, level, streak, badges, and progress to next level.
   */
  @Get('profile/:userId')
  @ApiOperation({ summary: 'Get gamification profile for a user' })
  @ApiParam({ name: 'userId', type: String, description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'Gamification profile' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getProfile(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.gamification.getProfile(userId);
  }

  /**
   * GET /v1/gamification/me
   *
   * Returns the authenticated user's own gamification profile.
   */
  @Get('me')
  @ApiOperation({ summary: 'Get my own gamification profile' })
  async getMyProfile(@CurrentUser() user: SupabaseUser) {
    return this.gamification.getProfile(user.id);
  }
}
