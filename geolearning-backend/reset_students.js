const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.userBadge.deleteMany();
  await prisma.xpLog.deleteMany();
  await prisma.materialCompletion.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.projectSubmission.deleteMany();
  await prisma.user.updateMany({
    data: {
      xp: 0,
      level: 0,
      current_streak: 0,
      longest_streak: 0,
      equipped_badge_id: null
    }
  });
  console.log('Reset complete!');
}

main().finally(() => prisma.$disconnect());
