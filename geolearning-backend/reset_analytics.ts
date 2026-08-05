import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('no db');
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.quizAttempt.deleteMany({});
  await prisma.projectSubmission.deleteMany({});
  console.log('Reset analytics data completely');
}

main().catch(console.error).finally(async () => { await prisma.$disconnect(); });
