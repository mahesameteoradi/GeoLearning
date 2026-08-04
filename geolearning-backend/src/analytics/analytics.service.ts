import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getClassSummary(classId: string) {
    const students = await this.prisma.classStudent.findMany({
      where: { class_id: classId },
      select: { student_id: true },
    });
    const studentIds = students.map((s) => s.student_id);

    const quizAttempts = await this.prisma.quizAttempt.findMany({
      where: {
        user_id: { in: studentIds },
        quiz: { class_id: classId },
        completed_at: { not: null },
      },
    });

    const bestAttempts = new Map<string, number>();
    quizAttempts.forEach((a) => {
      const key = `${a.user_id}_${a.quiz_id}`;
      const currentMax = bestAttempts.get(key) || -1;
      if (a.score > currentMax) bestAttempts.set(key, a.score);
    });

    const averageScore =
      bestAttempts.size > 0
        ? Array.from(bestAttempts.values()).reduce(
            (sum, score) => sum + score,
            0,
          ) / bestAttempts.size
        : 0;

    // A student is considered active if they have completed a quiz in this class, otherwise passive.
    const activeStudentIds = new Set(quizAttempts.map((a) => a.user_id));

    // Total quizzes available for this class
    const totalQuizzes = await this.prisma.quiz.count({
      where: { class_id: classId },
    });

    let completionRate = 0;
    if (studentIds.length > 0 && totalQuizzes > 0) {
      const totalPossibleAttempts = studentIds.length * totalQuizzes;
      completionRate = (bestAttempts.size / totalPossibleAttempts) * 100;
    }

    return {
      rata_rata_skor: averageScore,
      completion_rate: completionRate,
      siswa_aktif: activeStudentIds.size,
      siswa_pasif: studentIds.length - activeStudentIds.size,
    };
  }

  async getTopicPerformance(classId: string) {
    const data: any[] = await this.prisma.$queryRaw`
      WITH best_qa AS (
        SELECT user_id, quiz_id, MAX(score) as max_score
        FROM quiz_attempts
        WHERE completed_at IS NOT NULL
        GROUP BY user_id, quiz_id
      )
      SELECT m.title as topic, AVG(bqa.max_score) as rata_rata_skor
      FROM best_qa bqa
      JOIN quizzes q ON q.id = bqa.quiz_id
      JOIN modules m ON m.id = q.module_id
      WHERE m.class_id::text = ${classId}
      GROUP BY m.title
    `;
    return data.map((d) => ({
      topic: d.topic,
      rata_rata_skor: parseFloat(d.rata_rata_skor) || 0,
    }));
  }

  async getQuizQuestionStats(classId: string) {
    // Get all quizzes for this class with their questions and attempt answers
    const data: any[] = await this.prisma.$queryRaw`
      SELECT 
        q.id as quiz_id,
        q.title as quiz_title,
        qs.id as question_id,
        qs.text as question_text,
        COUNT(qaa.id) as total_attempts,
        SUM(CASE WHEN qaa.is_correct THEN 1 ELSE 0 END) as correct_count
      FROM quizzes q
      LEFT JOIN modules m ON m.id = q.module_id
      JOIN questions qs ON qs.quiz_id = q.id
      JOIN quiz_attempt_answers qaa ON qaa.question_id = qs.id
      JOIN quiz_attempts qa ON qa.id = qaa.attempt_id AND qa.completed_at IS NOT NULL
      WHERE (q.class_id::text = ${classId} OR m.class_id::text = ${classId})
      GROUP BY q.id, q.title, qs.id, qs.text
      ORDER BY q.title, correct_count DESC
    `;

    // Group by quiz
    const quizMap = new Map<string, any>();
    for (const row of data) {
      if (!quizMap.has(row.quiz_id)) {
        quizMap.set(row.quiz_id, {
          quiz_id: row.quiz_id,
          quiz_title: row.quiz_title,
          questions: [],
        });
      }
      const total = Number(row.total_attempts);
      const correct = Number(row.correct_count);
      quizMap.get(row.quiz_id).questions.push({
        question_id: row.question_id,
        question_text: row.question_text,
        total_attempts: total,
        correct_count: correct,
        incorrect_count: total - correct,
        correct_rate: total > 0 ? Math.round((correct / total) * 100) : 0,
      });
    }

    return Array.from(quizMap.values()).map((quiz) => {
      const questions = quiz.questions;
      if (questions.length === 0)
        return { ...quiz, most_correct: null, most_incorrect: null };
      const sorted = [...questions].sort(
        (a: any, b: any) => b.correct_rate - a.correct_rate,
      );
      return {
        quiz_id: quiz.quiz_id,
        quiz_title: quiz.quiz_title,
        total_questions: questions.length,
        most_correct: sorted[0],
        most_incorrect: sorted[sorted.length - 1],
        all_questions: sorted,
      };
    });
  }

  async getClassStudents(classId: string) {
    const data: any[] = await this.prisma.$queryRaw`
      WITH class_quizzes AS (
        SELECT q.id FROM quizzes q
        LEFT JOIN modules m ON m.id = q.module_id
        WHERE q.class_id::text = ${classId} OR m.class_id::text = ${classId}
      ),
      best_qa AS (
        SELECT user_id, quiz_id, MAX(score) as max_score
        FROM quiz_attempts
        WHERE completed_at IS NOT NULL AND quiz_id IN (SELECT id FROM class_quizzes)
        GROUP BY user_id, quiz_id
      )
      SELECT 
        u.id as user_id, 
        u.name as nama, 
        u.level, 
        u.xp, 
        u.avatar_url,
        COALESCE(AVG(bqa.max_score), 0) as rata_rata_skor, 
        COUNT(bqa.quiz_id) as jumlah_kuis_selesai
      FROM users u
      JOIN class_students cs ON cs.student_id = u.id
      LEFT JOIN best_qa bqa ON bqa.user_id = u.id
      WHERE cs.class_id::text = ${classId}
      GROUP BY u.id, u.name, u.level, u.xp, u.avatar_url
    `;
    return data.map((d) => {
      const avgScore = parseFloat(d.rata_rata_skor);
      return {
        user_id: d.user_id,
        nama: d.nama,
        level: d.level,
        xp: Number(d.xp),
        avatar_url: d.avatar_url,
        rata_rata_skor: avgScore,
        jumlah_kuis_selesai: Number(d.jumlah_kuis_selesai),
        status:
          avgScore >= 70
            ? 'baik'
            : avgScore >= 50
              ? 'perlu dipantau'
              : 'perlu perhatian',
      };
    });
  }

  async getScoreTrend(userId: string) {
    const attempts = await this.prisma.quizAttempt.findMany({
      where: { user_id: userId, completed_at: { not: null } },
      include: { quiz: true },
      orderBy: { completed_at: 'asc' },
    });
    return attempts.map((a) => ({
      tanggal: a.completed_at,
      skor: a.score,
      quiz_title: a.quiz.title,
    }));
  }

  async getXpTrend(userId: string) {
    const data: any[] = await this.prisma.$queryRaw`
      SELECT created_at AS tanggal,
             SUM(amount) OVER (ORDER BY created_at ASC) AS xp_kumulatif
      FROM xp_logs
      WHERE user_id::text = ${userId}
      ORDER BY created_at ASC;
    `;
    return data.map((d) => ({
      tanggal: d.tanggal,
      xp_kumulatif: Number(d.xp_kumulatif),
    }));
  }

  async getBadgeTimeline(userId: string) {
    const badges = await this.prisma.userBadge.findMany({
      where: { user_id: userId },
      include: { badge: true },
      orderBy: { earned_at: 'asc' },
    });
    return badges.map((b) => ({
      badge_id: b.badge.id,
      badge_name: b.badge.display_name,
      earned_at: b.earned_at,
      icon: b.badge.icon,
    }));
  }

  async getTopicBreakdown(userId: string, teacherId: string) {
    // 1. Kuis (Rata-rata skor kuis siswa)
    const attempts = await this.prisma.quizAttempt.findMany({
      where: { user_id: userId, completed_at: { not: null } },
    });
    const bestAttempts = new Map<string, number>();
    attempts.forEach((a) => {
      const current = bestAttempts.get(a.quiz_id) || -1;
      if (a.score > current) bestAttempts.set(a.quiz_id, a.score);
    });

    const avgScore =
      bestAttempts.size > 0
        ? Array.from(bestAttempts.values()).reduce(
            (acc, curr) => acc + curr,
            0,
          ) / bestAttempts.size
        : 0;

    // 2. XP (Diasumsikan 1000 XP = 100% untuk visualisasi)
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const xpScore = Math.min(100, ((user?.xp || 0) / 500) * 100);

    // 3. Keaktifan (Dihitung dari rutinitas absen/kuis - mock data untuk keaktifan membaca)
    const activeScore = Math.min(100, 40 + bestAttempts.size * 15);

    return [
      { topic: 'Skor Kuis', rata_rata_skor_siswa: avgScore },
      { topic: 'Keaktifan Membaca', rata_rata_skor_siswa: activeScore },
      { topic: 'Perolehan XP', rata_rata_skor_siswa: xpScore },
    ];
  }

  async getInterventions(userId: string) {
    const interventions = await this.prisma.intervention.findMany({
      where: { student_id: userId },
      orderBy: { created_at: 'desc' },
    });
    return interventions.map((i) => ({
      message: i.note,
      created_at: i.created_at,
      status: i.resolved ? 'completed' : 'pending',
    }));
  }

  async createIntervention(
    teacherId: string,
    studentId: string,
    message: string,
    type: any = 'ACADEMIC',
  ) {
    const intervention = await this.prisma.intervention.create({
      data: {
        teacher_id: teacherId,
        student_id: studentId,
        note: message,
        type: type,
        resolved: false,
      },
    });
    return {
      message: intervention.note,
      created_at: intervention.created_at,
      status: intervention.resolved ? 'completed' : 'pending',
    };
  }

  async getModuleProgress(userId: string, teacherId: string) {
    const enrollments = await this.prisma.classStudent.findMany({
      where: {
        student_id: userId,
        class: { teacher_id: teacherId },
      },
      select: { class_id: true },
    });
    const classIds = enrollments.map((e) => e.class_id);

    const modules = await this.prisma.module.findMany({
      where: { class_id: { in: classIds } },
      include: {
        materials: { select: { id: true } },
        quizzes: { select: { id: true } },
      },
      orderBy: { order: 'asc' },
    });

    // materials completed by user in these modules
    const materialCompletions: any[] = await this.prisma.$queryRaw`
      SELECT material_id FROM material_completions WHERE user_id::text = ${userId}
    `;
    const completedMaterialIds = new Set(
      materialCompletions.map((mc) => mc.material_id),
    );

    // quiz attempts by user
    const quizAttempts = await this.prisma.quizAttempt.findMany({
      where: { user_id: userId, completed_at: { not: null } },
    });

    const result = modules.map((mod) => {
      const totalMaterials = mod.materials.length;
      let readMaterials = 0;
      for (const mat of mod.materials) {
        if (completedMaterialIds.has(mat.id)) readMaterials++;
      }
      // If there are no materials, we can say keaktifan is 0 or ignore it. Let's say 0.
      const keaktifan =
        totalMaterials > 0 ? (readMaterials / totalMaterials) * 100 : 0;

      const modQuizIds = new Set(mod.quizzes.map((q) => q.id));
      const modAttempts = quizAttempts.filter((qa) =>
        modQuizIds.has(qa.quiz_id),
      );

      const bestAttempts = new Map<string, number>();
      modAttempts.forEach((a) => {
        const current = bestAttempts.get(a.quiz_id) || -1;
        if (a.score > current) bestAttempts.set(a.quiz_id, a.score);
      });

      const kemampuan =
        bestAttempts.size > 0
          ? Array.from(bestAttempts.values()).reduce(
              (sum, score) => sum + score,
              0,
            ) / bestAttempts.size
          : 0;

      return {
        module_id: mod.id,
        title: mod.title,
        keaktifan: Math.round(keaktifan),
        kemampuan: Math.round(kemampuan),
        materials_read: readMaterials,
        materials_total: totalMaterials,
        quizzes_taken: bestAttempts.size,
        quizzes_total: mod.quizzes.length,
      };
    });

    return result;
  }
}
