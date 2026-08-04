const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.$queryRawUnsafe(`
  SELECT 
    COUNT(qaa.id) as total_attempts
  FROM quizzes q
  LEFT JOIN modules m ON m.id = q.module_id
  JOIN questions qs ON qs.quiz_id = q.id
  JOIN quiz_attempt_answers qaa ON qaa.question_id = qs.id
  JOIN quiz_attempts qa ON qa.id = qaa.attempt_id AND qa.completed_at IS NOT NULL
`).then(console.log).finally(() => p.$disconnect());
