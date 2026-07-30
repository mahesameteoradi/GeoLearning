const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const classId = 'GEO_XI_A'; // Replace with a valid ID if needed, or just let it run
  try {
    const data = await prisma.$queryRaw`
      SELECT 
        u.id as user_id, 
        u.name as nama, 
        u.level, 
        (
          COALESCE((SELECT CAST(SUM(xp_earned) AS INT) FROM quiz_attempts WHERE user_id = u.id AND quiz_id IN (SELECT id FROM quizzes WHERE class_id = ${classId})), 0) +
          COALESCE((SELECT CAST(SUM(xp_earned) AS INT) FROM project_submissions WHERE user_id = u.id AND assignment_id IN (SELECT id FROM project_assignments WHERE class_id = ${classId})), 0)
        ) as xp, 
        COALESCE(AVG(qa.score), 0) as rata_rata_skor, 
        COUNT(qa.id) as jumlah_kuis_selesai
      FROM users u
      JOIN class_students cs ON cs.student_id = u.id
      LEFT JOIN (
        SELECT qa.user_id, qa.id, qa.score
        FROM quiz_attempts qa
        JOIN quizzes q ON q.id = qa.quiz_id
        WHERE q.class_id = ${classId} AND qa.completed_at IS NOT NULL
      ) qa ON qa.user_id = u.id
      WHERE cs.class_id = ${classId}
      GROUP BY u.id, u.name, u.level
    `;
    console.log(data);
  } catch (err) {
    console.error('ERROR:', err);
  }
}

main().finally(() => prisma.$disconnect());
