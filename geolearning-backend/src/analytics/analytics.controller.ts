import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
// @ts-ignore
import { AnalyticsService } from './analytics.service';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('teacher/analytics')
@UseGuards(SupabaseAuthGuard)
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly prisma: PrismaService,
  ) {}

  // Middleware-like check: Validate if teacher owns the class
  private async validateClassOwnership(teacherId: string, classId: string) {
    const cls = await this.prisma.class.findUnique({
      where: { id: classId },
      select: { teacher_id: true },
    });
    if (!cls) throw new NotFoundException('Class not found');
    if (cls.teacher_id !== teacherId)
      throw new ForbiddenException('You do not own this class');
  }

  // Middleware-like check: Validate if teacher owns the student's class
  private async validateStudentAccess(teacherId: string, studentId: string) {
    const enrollments = await this.prisma.classStudent.findMany({
      where: { student_id: studentId },
      include: { class: true },
    });
    const hasAccess = enrollments.some((e) => e.class.teacher_id === teacherId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this student');
    }
  }

  @Get('class/:classId/summary')
  async getClassSummary(@Req() req: any, @Param('classId') classId: string) {
    await this.validateClassOwnership(req.user.id, classId);
    return this.analyticsService.getClassSummary(classId);
  }

  @Get('class/:classId/topic-performance')
  async getTopicPerformance(
    @Req() req: any,
    @Param('classId') classId: string,
  ) {
    await this.validateClassOwnership(req.user.id, classId);
    return this.analyticsService.getTopicPerformance(classId);
  }

  @Get('class/:classId/quiz-question-stats')
  async getQuizQuestionStats(
    @Req() req: any,
    @Param('classId') classId: string,
  ) {
    await this.validateClassOwnership(req.user.id, classId);
    return this.analyticsService.getQuizQuestionStats(classId);
  }

  @Get('class/:classId/students')
  async getClassStudents(@Req() req: any, @Param('classId') classId: string) {
    await this.validateClassOwnership(req.user.id, classId);
    return this.analyticsService.getClassStudents(classId);
  }

  @Get('student/:userId/score-trend')
  async getScoreTrend(@Req() req: any, @Param('userId') userId: string) {
    await this.validateStudentAccess(req.user.id, userId);
    return this.analyticsService.getScoreTrend(userId);
  }

  @Get('student/:userId/xp-trend')
  async getXpTrend(@Req() req: any, @Param('userId') userId: string) {
    await this.validateStudentAccess(req.user.id, userId);
    return this.analyticsService.getXpTrend(userId);
  }

  @Get('student/:userId/badge-timeline')
  async getBadgeTimeline(@Req() req: any, @Param('userId') userId: string) {
    await this.validateStudentAccess(req.user.id, userId);
    return this.analyticsService.getBadgeTimeline(userId);
  }

  @Get('student/:userId/topic-breakdown')
  async getTopicBreakdown(@Req() req: any, @Param('userId') userId: string) {
    await this.validateStudentAccess(req.user.id, userId);
    return this.analyticsService.getTopicBreakdown(userId, req.user.id);
  }

  @Get('student/:userId/interventions')
  async getInterventions(@Req() req: any, @Param('userId') userId: string) {
    await this.validateStudentAccess(req.user.id, userId);
    return this.analyticsService.getInterventions(userId);
  }

  @Get('student/:userId/profile')
  async getStudentProfile(@Req() req: any, @Param('userId') userId: string) {
    await this.validateStudentAccess(req.user.id, userId);

    // Use raw query with ::text cast because of Postgres UUID mismatch issues
    const users: any[] = await this.prisma.$queryRaw`
      SELECT id, name, level, xp, avatar_url, current_streak, longest_streak 
      FROM users 
      WHERE id::text = ${userId}
    `;

    if (!users || users.length === 0) {
      throw new NotFoundException('Student not found for id: ' + userId);
    }

    return {
      id: users[0].id,
      name: users[0].name,
      level: users[0].level,
      xp: Number(users[0].xp),
      avatar_url: users[0].avatar_url,
      current_streak: Number(users[0].current_streak),
      longest_streak: Number(users[0].longest_streak),
    };
  }

  @Post('student/:userId/interventions')
  async createIntervention(
    @Req() req: any,
    @Param('userId') userId: string,
    @Body() body: { message: string; type?: string },
  ) {
    await this.validateStudentAccess(req.user.id, userId);
    return this.analyticsService.createIntervention(
      req.user.id,
      userId,
      body.message,
      body.type,
    );
  }

  @Get('student/:userId/module-progress')
  async getModuleProgress(@Req() req: any, @Param('userId') userId: string) {
    await this.validateStudentAccess(req.user.id, userId);
    return this.analyticsService.getModuleProgress(userId, req.user.id);
  }
}
