const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const badges = await prisma.badge.findMany();
  console.log("Total badges in DB:", badges.length);
  if (badges.length > 0) {
    console.log("Sample badge:", badges[0]);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
