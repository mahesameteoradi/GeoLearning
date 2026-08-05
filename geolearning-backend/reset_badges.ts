import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('no db');
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.user.updateMany({ data: { equipped_badge_id: null } });
  await prisma.userBadge.deleteMany({});
  console.log('Reset user badges');
}

main().catch(console.error).finally(async () => { await prisma.$disconnect(); });
