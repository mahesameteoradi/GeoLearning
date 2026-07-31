const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function retroactivelyAwardBadges() {
  const { data: users, error } = await supabase.from('users').select('id, xp, level, current_streak');
  if (error) {
    console.error(error);
    return;
  }

  for (const user of users) {
    const earnedBadgeIds = [];
    if (user.xp >= 100) earnedBadgeIds.push('xp_100');
    if (user.xp >= 500) earnedBadgeIds.push('xp_500');
    if (user.xp >= 1000) earnedBadgeIds.push('xp_1000');
    if (user.xp >= 5000) earnedBadgeIds.push('xp_5000');
    
    if (user.level >= 5) earnedBadgeIds.push('level_5');
    if (user.level >= 10) earnedBadgeIds.push('level_10');
    if (user.level >= 20) earnedBadgeIds.push('level_20');
    if (user.level >= 50) earnedBadgeIds.push('level_50');
    
    if (user.current_streak >= 3) earnedBadgeIds.push('streak_3');
    if (user.current_streak >= 7) earnedBadgeIds.push('streak_7');
    if (user.current_streak >= 30) earnedBadgeIds.push('streak_30');

    if (user.xp > 0) earnedBadgeIds.push('first_quiz');

    let inserted = 0;
    for (const badgeId of earnedBadgeIds) {
      // check if it exists
      const { data: existing } = await supabase.from('user_badges')
        .select('id').eq('user_id', user.id).eq('badge_id', badgeId).single();
      
      if (!existing) {
        const { error: insertError } = await supabase.from('user_badges').insert({
          id: crypto.randomUUID(),
          user_id: user.id,
          badge_id: badgeId
        });
        if (!insertError) inserted++;
      }
    }
    if (inserted > 0) {
      console.log(`Awarded ${inserted} badges to ${user.id}`);
    }
  }
  console.log('Retroactive badge evaluation completed!');
}
retroactivelyAwardBadges();
