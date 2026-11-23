import { daysBetween, startOfWeekISO, todayISO } from '@shared/utils/date';
import type { SavingsGoal } from '@shared/types';

export interface SavingsPlan {
  /** Sisa yang perlu dikumpulkan. */
  remaining: number;
  /** Progres 0-100. */
  percent: number;
  reached: boolean;
  hasDeadline: boolean;
  /** Sisa hari ke tenggat (bisa negatif bila lewat). */
  daysLeft: number;
  overdue: boolean;
  /** Nominal yang perlu ditabung agar target tercapai tepat waktu. */
  perDay: number;
  perWeek: number;
  perMonth: number;
  /** Ekspektasi terkumpul "seharusnya sekarang" (linear dari dibuat → tenggat). */
  expectedByNow: number;
  onTrack: boolean;
  behindBy: number;
  /** Perlu diingatkan menabung periode ini (sesuai cadence & setoran terakhir). */
  dueForReminder: boolean;
}

/** Apakah target perlu diingatkan menabung pada periode berjalan. */
export const isDueForReminder = (goal: SavingsGoal, today: string = todayISO()): boolean => {
  if (!goal.is_active) return false;
  if (goal.current_amount >= goal.target_amount) return false;
  const last = goal.last_contributed_at;
  if (!last) return true;
  if (goal.cadence === 'daily') return last !== today;
  if (goal.cadence === 'weekly') return last < startOfWeekISO(today);
  // monthly
  return last.slice(0, 7) !== today.slice(0, 7);
};

/** Hitung seluruh angka rencana & status tracking sebuah target tabungan. */
export const computeSavingsPlan = (goal: SavingsGoal, today: string = todayISO()): SavingsPlan => {
  const remaining = Math.max(0, goal.target_amount - goal.current_amount);
  const percent =
    goal.target_amount > 0 ? Math.min(100, (goal.current_amount / goal.target_amount) * 100) : 0;
  const reached = goal.current_amount >= goal.target_amount;
  const hasDeadline = !!goal.target_date;

  let daysLeft = 0;
  let overdue = false;
  let perDay = 0;
  let perWeek = 0;
  let perMonth = 0;
  let expectedByNow = 0;

  if (hasDeadline && goal.target_date) {
    daysLeft = daysBetween(today, goal.target_date);
    overdue = daysLeft < 0 && !reached;
    const effDays = Math.max(1, daysLeft);
    perDay = Math.ceil(remaining / effDays);
    perWeek = Math.ceil(remaining / Math.max(1, Math.ceil(effDays / 7)));
    perMonth = Math.ceil(remaining / Math.max(1, Math.round(effDays / 30)));

    const createdISO = (goal.created_at ?? today).slice(0, 10);
    const totalDays = Math.max(1, daysBetween(createdISO, goal.target_date));
    const elapsed = Math.min(totalDays, Math.max(0, daysBetween(createdISO, today)));
    expectedByNow = Math.round((goal.target_amount * elapsed) / totalDays);
  }

  const onTrack = reached || goal.current_amount >= expectedByNow;
  const behindBy = Math.max(0, expectedByNow - goal.current_amount);

  return {
    remaining,
    percent,
    reached,
    hasDeadline,
    daysLeft,
    overdue,
    perDay,
    perWeek,
    perMonth,
    expectedByNow,
    onTrack,
    behindBy,
    dueForReminder: isDueForReminder(goal, today),
  };
};
