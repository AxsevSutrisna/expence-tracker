import { Bell, Plus } from 'lucide-react';
import { Button } from '@shared/ui';
import { formatCurrency } from '@shared/utils/format';
import { computeSavingsPlan, isDueForReminder } from '../services/savingsPlan';
import type { SavingsCadence, SavingsGoal } from '@shared/types';

export interface SavingsNudgeProps {
  goals: SavingsGoal[];
  onContribute: (goal: SavingsGoal) => void;
}

const CADENCE_WORD: Record<SavingsCadence, string> = {
  daily: 'hari ini',
  weekly: 'minggu ini',
  monthly: 'bulan ini',
};

const suggestionFor = (goal: SavingsGoal): number => {
  const plan = computeSavingsPlan(goal);
  if (goal.cadence === 'daily') return plan.perDay;
  if (goal.cadence === 'weekly') return plan.perWeek;
  return plan.perMonth;
};

export function SavingsNudge({ goals, onContribute }: SavingsNudgeProps) {
  const due = goals.filter((g) => isDueForReminder(g));
  if (due.length === 0) return null;

  return (
    <div className="savings-nudge">
      <div className="savings-nudge-head">
        <Bell size={18} /> Waktunya menabung ({due.length})
      </div>
      {due.map((g) => {
        const suggest = suggestionFor(g);
        return (
          <div className="savings-nudge-row" key={g.id}>
            <div style={{ minWidth: 0 }}>
              <div className="snr-main">
                {g.emoji ? `${g.emoji} ` : ''}
                {g.name}
              </div>
              <div className="snr-sub">
                Belum menabung {CADENCE_WORD[g.cadence]}
                {suggest > 0 ? ` · saran ${formatCurrency(suggest)}` : ''}
              </div>
            </div>
            <Button
              variant="dark"
              onClick={() => onContribute(g)}
              className="flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Plus size={16} /> Setor
            </Button>
          </div>
        );
      })}
    </div>
  );
}
