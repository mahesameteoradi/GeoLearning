import { Controller, Get, Param, UseGuards, Req, ForbiddenException, NotFoundException } from '@nestjs/common';
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
      select: { teacher_id: true }
    });
    if (!cls) throw new NotFoundException('Class not found');
    if (cls.teacher_id !== teacherId) throw new ForbiddenException('You do not own this class');
  }

  // Middleware-like check: Validate if teacher owns the student's class
  private async validateStudentAccess(teacherId: string, studentId: string) {
    const enrollments = await this.prisma.classStudent.findMany({
      where: { student_id: studentId },
      include: { class: true }
    });
    const hasAccess = enrollments.some(e => e.class.teacher_id === teacherId);
    if (!hasAccess) throw new ForbiddenException('You do not have access to this student');
  }

  @Get('class/:classId/summary')
  async getClassSummary(@Req() req: any, @Param('classId') classId: string) {
    await this.validateClassOwnership(req.user.id, classId);
    return this.analyticsService.getClassSummary(classId);
  }

  @Get('class/:classId/topic-performance')
  async getTopicPerformance(@Req() req: any, @Param('classId') classId: string) {
    await this.validateClassOwnership(req.user.id, classId);
    return this.analyticsService.getTopicPerformance(classId);
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
}

