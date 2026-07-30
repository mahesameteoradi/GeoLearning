import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getClassSummary(classId: string) {
    const students = await this.prisma.classStudent.findMany({
      where: { class_id: classId },
      select: { student_id: true }
    });
    const studentIds = students.map(s => s.student_id);

    const quizAttempts = await this.prisma.quizAttempt.findMany({
      where: { user_id: { in: studentIds }, quiz: { class_id: classId }, completed_at: { not: null } }
    });

    const averageScore = quizAttempts.length > 0 
      ? quizAttempts.reduce((sum, a) => sum + a.score, 0) / quizAttempts.length 
      : 0;

    // A student is considered active if they have completed a quiz in this class, otherwise passive.
    const activeStudentIds = new Set(quizAttempts.map(a => a.user_id));
    
    // Total quizzes available for this class
    const totalQuizzes = await this.prisma.quiz.count({
      where: { class_id: classId }
    });

    let completionRate = 0;
    if (studentIds.length > 0 && totalQuizzes > 0) {
       const totalPossibleAttempts = studentIds.length * totalQuizzes;
       completionRate = (quizAttempts.length / totalPossibleAttempts) * 100;
    }

    return {
      rata_rata_skor: averageScore,
      completion_rate: completionRate,
      siswa_aktif: activeStudentIds.size,
      siswa_pasif: studentIds.length - activeStudentIds.size
    };
  }

  async getTopicPerformance(classId: string) {
    const data: any[] = await this.prisma.$queryRaw`
      SELECT m.title as topic, AVG(qa.score) as rata_rata_skor
      FROM quiz_attempts qa
      JOIN quizzes q ON q.id = qa.quiz_id
      JOIN modules m ON m.id = q.module_id
      WHERE m.class_id = ${classId} AND qa.completed_at IS NOT NULL
      GROUP BY m.title
    `;
    return data.map(d => ({
      topic: d.topic,
      rata_rata_skor: parseFloat(d.rata_rata_skor) || 0
    }));
  }

  async getClassStudents(classId: string) {
    const data: any[] = await this.prisma.$queryRaw`
      SELECT 
        u.id as user_id, 
        u.name as nama, 
        u.level, 
        u.xp, 
        COALESCE(AVG(qa.score), 0) as rata_rata_skor, 
        COUNT(qa.id) as jumlah_kuis_selesai
      FROM users u
      JOIN class_students cs ON cs.student_id = u.id
      LEFT JOIN quiz_attempts qa ON qa.user_id = u.id AND qa.completed_at IS NOT NULL
      WHERE cs.class_id = ${classId}
      GROUP BY u.id, u.name, u.level, u.xp
    `;
    return data.map(d => {
      const avgScore = parseFloat(d.rata_rata_skor);
      return {
        user_id: d.user_id,
        nama: d.nama,
        level: d.level,
        xp: Number(d.xp),
        rata_rata_skor: avgScore,
        jumlah_kuis_selesai: Number(d.jumlah_kuis_selesai),
        status: avgScore >= 70 ? 'baik' : (avgScore >= 50 ? 'perlu dipantau' : 'perlu perhatian')
      };
    });
  }

  async getScoreTrend(userId: string) {
    const attempts = await this.prisma.quizAttempt.findMany({
      where: { user_id: userId, completed_at: { not: null } },
      include: { quiz: true },
      orderBy: { completed_at: 'asc' }
    });
    return attempts.map(a => ({
      tanggal: a.completed_at,
      skor: a.score,
      quiz_title: a.quiz.title
    }));
  }

  async getXpTrend(userId: string) {
    const data: any[] = await this.prisma.$queryRaw`
      SELECT created_at AS tanggal,
             SUM(amount) OVER (ORDER BY created_at ASC) AS xp_kumulatif
      FROM xp_logs
      WHERE user_id = ${userId}
      ORDER BY created_at ASC;
    `;
    return data.map(d => ({
      tanggal: d.tanggal,
      xp_kumulatif: Number(d.xp_kumulatif)
    }));
  }

  async getBadgeTimeline(userId: string) {
    const badges = await this.prisma.userBadge.findMany({
      where: { user_id: userId },
      include: { badge: true },
      orderBy: { earned_at: 'asc' }
    });
    return badges.map(b => ({
      badge_name: b.badge.display_name,
      earned_at: b.earned_at
    }));
  }

  async getTopicBreakdown(userId: string, teacherId: string) {
    // Assuming teacherId owns classes. Get average for the user and the class on modules taught by the teacher.
    const data: any[] = await this.prisma.$queryRaw`
      SELECT m.title as topic,
             COALESCE(AVG(CASE WHEN qa.user_id = ${userId} THEN qa.score END), 0) AS rata_rata_skor_siswa,
             COALESCE(AVG(qa.score), 0) AS rata_rata_skor_kelas
      FROM quiz_attempts qa
      JOIN quizzes q ON q.id = qa.quiz_id
      JOIN modules m ON m.id = q.module_id
      JOIN classes c ON c.id = m.class_id
      WHERE c.teacher_id = ${teacherId} AND qa.completed_at IS NOT NULL
      GROUP BY m.title;
    `;
    return data.map(d => ({
      topic: d.topic,
      rata_rata_skor_siswa: parseFloat(d.rata_rata_skor_siswa),
      rata_rata_skor_kelas: parseFloat(d.rata_rata_skor_kelas)
    }));
  }

  async getInterventions(userId: string) {
    const interventions = await this.prisma.intervention.findMany({
      where: { student_id: userId },
      orderBy: { created_at: 'desc' }
    });
    return interventions.map(i => ({
      message: i.note,
      created_at: i.created_at,
      status: i.resolved ? 'completed' : 'pending'
    }));
  }
}
