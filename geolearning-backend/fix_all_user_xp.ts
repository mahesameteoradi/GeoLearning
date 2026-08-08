import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({ where: { role: 'STUDENT' } });
  
  for (const user of users) {
    let totalXp = 0;
    
    // 1. Quizzes
    const quizAttempts = await prisma.quizAttempt.findMany({
      where: { user_id: user.id, completed_at: { not: null } }
    });
    const bestQuizXp = new Map<string, number>();
    for (const attempt of quizAttempts) {
      if (attempt.quiz_id) {
        const currentBest = bestQuizXp.get(attempt.quiz_id) || 0;
        if ((attempt.xp_earned || 0) > currentBest) {
          bestQuizXp.set(attempt.quiz_id, attempt.xp_earned || 0);
        }
      }
    }
    const quizXp = Array.from(bestQuizXp.values()).reduce((sum, xp) => sum + xp, 0);
    totalXp += quizXp;
    
    // 2. Materials
    const materialCompletions = await prisma.materialCompletion.findMany({
      where: { user_id: user.id }
    });
    totalXp += materialCompletions.length * 15;
    
    // 3. Projects
    const projectSubmissions = await prisma.projectSubmission.findMany({
      where: { user_id: user.id }
    });
    const projectXp = projectSubmissions.reduce((sum, p) => sum + (p.xp_earned || 0), 0);
    totalXp += projectXp;
    
    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: { xp: totalXp }
    });
    
    console.log(`User ${user.name} XP fixed to ${totalXp}`);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
