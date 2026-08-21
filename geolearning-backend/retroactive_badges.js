const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { BADGE_RULES } = require('./dist/gamification/constants/badge-rules');

async function main() {
  console.log("Upserting badges from BADGE_RULES...");
  
  // 1. Seed badges to ensure they exist correctly
  for (const rule of BADGE_RULES) {
    await prisma.badge.upsert({
      where: { id: rule.id },
      update: {
        display_name: rule.name,
        description: rule.description,
        icon: rule.icon,
      },
      create: {
        id: rule.id,
        display_name: rule.name,
        description: rule.description,
        icon: rule.icon,
      }
    });
  }
  console.log("Seeded", BADGE_RULES.length, "badges.");

  // 2. Retroactively award badges to all users
  const users = await prisma.user.findMany({
    include: { badges: true }
  });

  console.log(`Checking badges for ${users.length} users...`);

  let newlyAwardedCount = 0;

  for (const user of users) {
    const existingBadgeIds = user.badges.map(b => b.badge_id);
    
    // Check if user is in Top 10 by counting users with more XP
    const higherXpCount = await prisma.user.count({
      where: { xp: { gt: user.xp } }
    });
    const isTopTen = higherXpCount < 10;

    const context = {
      xp: user.xp,
      level: user.level,
      currentStreak: user.current_streak,
      quizScore: 0, // We can't retroactively know their last quiz score easily without querying quiz_attempts, but this is fine for XP/Level badges
      isFirstQuiz: false,
      isTopTen,
    };

    const qualifiedRules = BADGE_RULES.filter(
      (rule) => !existingBadgeIds.includes(rule.id) && rule.evaluate(context)
    );

    for (const rule of qualifiedRules) {
      await prisma.userBadge.create({
        data: { user_id: user.id, badge_id: rule.id }
      });
      console.log(`Awarded badge ${rule.id} to user ${user.id}`);
      newlyAwardedCount++;
    }
  }

  console.log(`Finished! Retroactively awarded ${newlyAwardedCount} badges.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
