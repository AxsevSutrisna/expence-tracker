import { PiggyBank, Pencil, Plus, Check, AlertTriangle, TrendingUp, CalendarClock, Bell } from 'lucide-react';
import { Card, Button, Progress, ConfirmDeleteButton } from '@shared/ui';
import { formatCurrency } from '@shared/utils/format';
import { formatDateShort } from '@shared/utils/date';
import { computeSavingsPlan } from '../services/savingsPlan';
import type { SavingsCadence, SavingsGoal } from '@shared/types';

export interface SavingsGoalCardProps {
  goal: SavingsGoal;
  onContribute: (goal: SavingsGoal) => void;
  onEdit: (goal: SavingsGoal) => void;
  onDelete: (goal: SavingsGoal) => void;
}

const CADENCE_LABEL: Record<SavingsCadence, string> = {
  daily: 'Harian',
  weekly: 'Mingguan',
  monthly: 'Bulanan',
};

export function SavingsGoalCard({ goal, onContribute, onEdit, onDelete }: SavingsGoalCardProps) {
  const plan = computeSavingsPlan(goal);
  const barColor = plan.reached || plan.onTrack ? '#10b981' : plan.overdue ? '#ef4444' : '#f59e0b';

  let badge = null;
  if (plan.reached) {
    badge = (
      <span className="goal-badge is-reached">
        <Check size={12} /> Tercapai
      </span>
    );
  } else if (plan.overdue) {
    badge = (
      <span className="goal-badge is-overdue">
        <AlertTriangle size={12} /> Lewat tenggat
      </span>
    );
  } else if (plan.hasDeadline && !plan.onTrack) {
    badge = (
      <span className="goal-badge is-behind">
        <AlertTriangle size={12} /> Perlu dikejar
      </span>
    );
  } else if (plan.hasDeadline) {
    badge = (
      <span className="goal-badge is-ontrack">
        <TrendingUp size={12} /> On track
      </span>
    );
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="goal-head">
        <div className="goal-title">
          <span className="goal-emoji">{goal.emoji || <PiggyBank size={18} />}</span>
          <span className="truncate">{goal.name}</span>
        </div>
        {badge}
      </div>

      <div className="flex flex-col gap-2">
        <div className="goal-amounts">
          <div>
            <span className="ga-current">{formatCurrency(goal.current_amount)}</span>
            <span className="ga-target"> / {formatCurrency(goal.target_amount)}</span>
          </div>
          <span className="ga-pct" style={{ color: barColor }}>
            {Math.round(plan.percent)}%
          </span>
        </div>
        <Progress value={plan.percent} indicatorColor={barColor} />
      </div>

      {plan.hasDeadline ? (
        <div className="plan-tiles">
          <div className={`plan-tile ${goal.cadence === 'daily' ? 'is-active' : ''}`}>
            <span className="pt-label">Per Hari</span>
            <span className="pt-amount">{formatCurrency(plan.perDay)}</span>
          </div>
          <div className={`plan-tile ${goal.cadence === 'weekly' ? 'is-active' : ''}`}>
            <span className="pt-label">Per Minggu</span>
            <span className="pt-amount">{formatCurrency(plan.perWeek)}</span>
          </div>
          <div className={`plan-tile ${goal.cadence === 'monthly' ? 'is-active' : ''}`}>
            <span className="pt-label">Per Bulan</span>
            <span className="pt-amount">{formatCurrency(plan.perMonth)}</span>
          </div>
        </div>
      ) : (
        <p className="goal-meta">
          <CalendarClock size={14} /> Tambahkan tenggat (Edit) untuk melihat rencana per hari/minggu/bulan.
        </p>
      )}

      <div className="goal-meta">
        {plan.hasDeadline && (
          <span>
            <CalendarClock size={14} style={{ verticalAlign: '-2px' }} /> Tenggat {formatDateShort(goal.target_date)} ·{' '}
            {plan.overdue ? 'sudah lewat' : `${plan.daysLeft} hari lagi`}
          </span>
        )}
        <span>
          <Bell size={14} style={{ verticalAlign: '-2px' }} /> Ingatkan: {CADENCE_LABEL[goal.cadence]}
        </span>
        <span>
          {goal.last_contributed_at
            ? `Setoran terakhir ${formatDateShort(goal.last_contributed_at)}`
            : 'Belum ada setoran'}
        </span>
        {plan.behindBy > 0 && !plan.reached && (
          <span style={{ color: 'var(--color-text-expense)', fontWeight: 800 }}>
            Tertinggal {formatCurrency(plan.behindBy)} dari jadwal
          </span>
        )}
      </div>

      <div className="goal-actions">
        {!plan.reached && (
          <Button
            variant="primary"
            onClick={() => onContribute(goal)}
            className="savings-cta flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Tambah Setoran
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => onEdit(goal)}
          className="flex items-center justify-center gap-2"
        >
          <Pencil size={16} /> Edit
        </Button>
        <ConfirmDeleteButton
          className="px-3"
          onConfirm={() => onDelete(goal)}
          title="Hapus Target?"
          description={`Target "${goal.name}" akan dihapus permanen.`}
        />
      </div>
    </Card>
  );
}
