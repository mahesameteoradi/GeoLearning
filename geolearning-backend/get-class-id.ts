import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const c = await prisma.class.findFirst({ where: { name: 'GEO_XI_A' } });
  console.log("CLASS:", c);
}

main().finally(() => prisma.$disconnect());
