/**
 * Prisma Seed Script
 *
 * Populates the 'badges' master table with all badge definitions
 * from the BADGE_RULES constant. Run with:
 *
 *   npx prisma db seed
 *
 * Or automatically after every migration via:
 *   npx prisma migrate dev
 *
 * This is idempotent — re-running will not duplicate rows (upsert).
 */

import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { BADGE_RULES } from '../src/gamification/constants/badge-rules';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding badges master table...\n');

  let created = 0;
  let skipped = 0;

  for (const rule of BADGE_RULES) {
    const result = await prisma.badge.upsert({
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
      },
    });

    const wasCreated = result.created_at.getTime() === new Date(result.created_at).getTime();
    console.log(`  ${rule.icon}  ${rule.id.padEnd(18)} → "${rule.name}"`);

    // Count as created if the row is fresh (within last 2 seconds)
    const isNew = Date.now() - result.created_at.getTime() < 2000;
    if (isNew) {
      created++;
    } else {
      skipped++;
    }
  }

  console.log(`\n✅ Seed complete: ${BADGE_RULES.length} badges processed`);
  console.log(`   Created/Updated: ${created + skipped} rows in 'badges' table`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
