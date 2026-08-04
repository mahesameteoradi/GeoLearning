import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const classId = '7e782876-46aa-4aec-a532-7806a3580fe8'; // Found in logs
  
  const data = await prisma.$queryRaw`
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
  
  console.log('Result:', data);
}

main().catch(console.error).finally(() => prisma.$disconnect());
