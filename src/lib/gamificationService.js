import { supabase } from './supabase';

export const getUserGamification = async (userId) => {
  const { data, error } = await supabase
    .from('user_gamification')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data || null;
};

export const updateStreak = async (userId, hasStayedUnderBudget) => {
  // Get current gamification state
  const gamification = await getUserGamification(userId);
  
  const today = new Date().toISOString().split('T')[0];

  // If already updated today, do nothing to prevent infinite loops or double counts
  if (gamification && gamification.last_activity_date === today) {
    return gamification;
  }

  let currentStreak = gamification ? gamification.current_streak : 0;
  let longestStreak = gamification ? gamification.longest_streak : 0;
  let badges = gamification ? gamification.badges : [];

  if (hasStayedUnderBudget) {
    currentStreak += 1;
    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }
  } else {
    // Streak broken!
    currentStreak = 0;
  }

  // Assign badges based on streak milestones
  const newBadges = [...badges];
  if (currentStreak >= 3 && !newBadges.includes('3_day_streak')) newBadges.push('3_day_streak');
  if (currentStreak >= 7 && !newBadges.includes('7_day_streak')) newBadges.push('7_day_streak');
  if (currentStreak >= 30 && !newBadges.includes('30_day_streak')) newBadges.push('30_day_streak');

  const payload = {
    user_id: userId,
    current_streak: currentStreak,
    longest_streak: longestStreak,
    last_activity_date: today,
    badges: newBadges,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('user_gamification')
    .upsert(payload, { onConflict: 'user_id' })
    .select();

  if (error) throw error;
  return data[0];
};
