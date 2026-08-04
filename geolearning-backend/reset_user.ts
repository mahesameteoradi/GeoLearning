import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const userId = '7e782876-46aa-4aec-a532-7806a3580fe8';
  
  // Delete map pin and manual xp logs
  await prisma.xpLog.deleteMany({
    where: { user_id: userId }
  });
  
  // Reset user's xp, level, and streak
  await prisma.user.update({
    where: { id: userId },
    data: {
      xp: 0,
      level: 1,
      current_streak: 0,
      longest_streak: 0,
    }
  });

  // Also clear gamification progress if it exists
  try {
    await prisma.$executeRaw`DELETE FROM gamification_progress WHERE user_id = ${userId}`;
  } catch (e) {
    console.log('No gamification_progress table or error:', e);
  }
  
  console.log('Successfully reset user data for', userId);
}
main().finally(() => prisma.$disconnect());
