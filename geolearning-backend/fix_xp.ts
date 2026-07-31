import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { calculateLevel } from './src/gamification/constants/level-thresholds';
import dotenv from 'dotenv';
dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting XP cleanup and recalculation...');

  const orphanedQuizzes = await prisma.$executeRaw`
    DELETE FROM xp_logs
    WHERE source = 'quiz'
      AND reference_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM quiz_attempts WHERE quiz_attempts.id::text = xp_logs.reference_id
      )
  `;
  console.log(`Deleted ${orphanedQuizzes} orphaned xp_logs from deleted quizzes.`);

  const orphanedProjects = await prisma.$executeRaw`
    DELETE FROM xp_logs
    WHERE source = 'project'
      AND reference_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM project_submissions WHERE project_submissions.id::text = xp_logs.reference_id
      )
  `;
  console.log(`Deleted ${orphanedProjects} orphaned xp_logs from deleted projects.`);
  
  const users = await prisma.user.findMany({
    select: { id: true, xp: true, level: true }
  });

  let updatedCount = 0;

  for (const user of users) {
    const result: any[] = await prisma.$queryRaw`
      SELECT COALESCE(SUM(amount), 0) as total_xp FROM xp_logs WHERE user_id = ${user.id}
    `;
    
    const actualXp = Number(result[0].total_xp);
    const correctLevel = calculateLevel(actualXp);

    if (user.xp !== actualXp || user.level !== correctLevel) {
      await prisma.user.update({
        where: { id: user.id },
        data: { xp: actualXp, level: correctLevel }
      });
      console.log(`Updated User ${user.id}: XP ${user.xp}->${actualXp}, Level ${user.level}->${correctLevel}`);
      updatedCount++;
    }
  }

  console.log(`Recalculation complete. Updated ${updatedCount} users.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
