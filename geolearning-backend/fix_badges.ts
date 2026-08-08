import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Level calculation formula
function calculateLevel(xp: number): number {
  if (xp < 0) return 1;
  const level = Math.floor(Math.sqrt(xp / 25)) + 1;
  return Math.min(level, 100);
}

async function main() {
  const users = await prisma.user.findMany({ 
    where: { role: 'STUDENT' }, 
    include: { badges: { include: { badge: true } } } 
  });
  
  for (const user of users) {
    const correctLevel = calculateLevel(user.xp);
    
    // Sync level just in case
    if (user.level !== correctLevel) {
      await prisma.user.update({
        where: { id: user.id },
        data: { level: correctLevel }
      });
      console.log(`User ${user.name} level synced to ${correctLevel}`);
    }

    const badgesToRemove: string[] = [];

    for (const ub of user.badges) {
      const bId = ub.badge_id;
      
      let shouldRemove = false;
      if (bId === 'xp_100' && user.xp < 100) shouldRemove = true;
      if (bId === 'xp_500' && user.xp < 500) shouldRemove = true;
      if (bId === 'xp_1000' && user.xp < 1000) shouldRemove = true;
      if (bId === 'xp_5000' && user.xp < 5000) shouldRemove = true;
      
      if (bId === 'level_5' && correctLevel < 5) shouldRemove = true;
      if (bId === 'level_10' && correctLevel < 10) shouldRemove = true;
      if (bId === 'level_20' && correctLevel < 20) shouldRemove = true;
      if (bId === 'level_50' && correctLevel < 50) shouldRemove = true;

      if (shouldRemove) {
        badgesToRemove.push(ub.id);
      }
    }

    if (badgesToRemove.length > 0) {
      // Unequip if currently equipped
      if (user.equipped_badge_id && badgesToRemove.includes(user.equipped_badge_id)) {
        await prisma.user.update({
          where: { id: user.id },
          data: { equipped_badge_id: null }
        });
      }

      await prisma.userBadge.deleteMany({
        where: { id: { in: badgesToRemove } }
      });
      console.log(`User ${user.name}: removed ${badgesToRemove.length} unearned badges`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
