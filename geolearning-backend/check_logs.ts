import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const logs = await prisma.xpLog.findMany({ 
    where: { user_id: '7e782876-46aa-4aec-a532-7806a3580fe8' } 
  });
  console.log(logs);
}
main().finally(() => prisma.$disconnect());
