import React, { useState, useEffect } from 'react';
import { getUserGamification } from '../../lib/gamificationService';

export function GamificationBadge({ user, refreshTrigger }) {
  const [gamification, setGamification] = useState(null);

  useEffect(() => {
    if (user) {
      getUserGamification(user.id).then(data => {
        if (data) setGamification(data);
      }).catch(console.error);
    }
  }, [user, refreshTrigger]);

  if (!gamification || gamification.current_streak === 0) return null;

  const streak = gamification.current_streak;
  
  let Icon = '🔥';
  let badgeColor = 'var(--color-primary)';
  let textColor = 'var(--color-text-primary)';
  let shakeClass = '';

  if (streak >= 30) {
    Icon = '👑';
    badgeColor = 'var(--color-warning)'; // Gold/Yellow
    shakeClass = 'animate-pulse';
  } else if (streak >= 7) {
    Icon = '⭐';
    badgeColor = 'var(--color-success)'; // Green
  }

  return (
    <div 
      className={`flex items-center gap-2 px-3 py-1 border-2 border-border rounded-full ${shakeClass}`}
      style={{ 
        backgroundColor: badgeColor, 
        color: textColor,
        boxShadow: '2px 2px 0px var(--color-text-primary)',
        transform: 'rotate(-2deg)'
      }}
      title={`Streak Terpanjang: ${gamification.longest_streak} Hari`}
    >
      <span className="text-sm font-bold">{Icon} {streak} Hari Hemat!</span>
    </div>
  );
}
