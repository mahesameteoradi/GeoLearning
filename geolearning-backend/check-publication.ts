import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRaw`
    SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
  `;
  console.log("Realtime Tables:", result);
  
  // Also check if notifications exist in it
  const hasNotifications = (result as any[]).some(r => r.tablename === 'notifications');
  if (!hasNotifications) {
    console.log("Adding notifications to supabase_realtime publication...");
    await prisma.$executeRawUnsafe(`ALTER PUBLICATION supabase_realtime ADD TABLE notifications;`);
    console.log("Added successfully!");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
