const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`ALTER PUBLICATION supabase_realtime ADD TABLE notifications;`);
    console.log("Success: Added notifications to supabase_realtime publication.");
  } catch (error) {
    console.error("Error (might already exist):", error.message);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
