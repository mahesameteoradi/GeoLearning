const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("No DATABASE_URL");
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  console.log('Resetting gamification data...');

  await prisma.userBadge.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.intervention.deleteMany({});
  await prisma.xpLog.deleteMany({});
  await prisma.quizAttempt.deleteMany({});
  await prisma.quizAttemptAnswer.deleteMany({});
  await prisma.materialCompletion.deleteMany({});
  await prisma.projectSubmission.deleteMany({});

  await prisma.user.updateMany({
    data: {
      xp: 0,
      level: 0,
      current_streak: 0,
      longest_streak: 0,
      equipped_badge_id: null,
    }
  });

  console.log('Reset complete!');
  await prisma.$disconnect();
}

main().catch(console.error);
