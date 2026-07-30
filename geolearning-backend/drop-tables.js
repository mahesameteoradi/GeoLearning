const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS forum_posts CASCADE;');
  await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS forum_replies CASCADE;');
  await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS chat_messages CASCADE;');
  console.log("Tables dropped successfully");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
