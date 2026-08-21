const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.$queryRaw`SELECT id, name, xp FROM users LIMIT 1`;
  console.log(users);
}

check().catch(console.error).finally(() => prisma.$disconnect());
