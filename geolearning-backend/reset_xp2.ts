import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('no db');
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.user.updateMany({
    where: { role: 'STUDENT' },
    data: { xp: 0, level: 1 }
  });
  console.log('Reset users xp');

  await prisma.quizAttempt.updateMany({
    data: { xp_earned: 0 }
  });
  console.log('Reset quiz_attempts xp');

  await prisma.projectSubmission.updateMany({
    data: { xp_earned: 0 }
  });
  console.log('Reset project_submissions xp');
  
  await prisma.xpLog.deleteMany({});
  console.log('Deleted xp_logs');
}

main().catch(console.error).finally(async () => { await prisma.$disconnect(); });
