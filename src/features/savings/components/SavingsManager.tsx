import { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { Plus, PiggyBank } from 'lucide-react';
import { Button, Modal, Loading, Input } from '@shared/ui';
import { formatCurrency, formatRupiahInput, parseRupiah } from '@shared/utils/format';
import { useSavingsGoals } from '../hooks/useSavingsGoals';
import {
  createSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
  contributeToGoal,
} from '../services/savingsService';
import { computeSavingsPlan } from '../services/savingsPlan';
import { SavingsGoalCard } from './SavingsGoalCard';
import { SavingsGoalForm } from './SavingsGoalForm';
import { SavingsNudge } from './SavingsNudge';
import type { NewSavingsGoal, SavingsGoal } from '@shared/types';
import './savings.css';

const QUICK_AMOUNTS = [50_000, 100_000, 250_000, 500_000];

export interface SavingsManagerProps {
  user: User;
}

export function SavingsManager({ user }: SavingsManagerProps) {
  const { items: goals, loading, mutate } = useSavingsGoals(user.id);

  const [formState, setFormState] = useState<{ open: boolean; goal: SavingsGoal | null }>({
    open: false,
    goal: null,
  });
  const [contribGoal, setContribGoal] = useState<SavingsGoal | null>(null);
  const [contribAmount, setContribAmount] = useState('');

  const openCreate = () => setFormState({ open: true, goal: null });
  const openEdit = (goal: SavingsGoal) => setFormState({ open: true, goal });
  const closeForm = () => setFormState({ open: false, goal: null });

  const handleSubmitGoal = (data: NewSavingsGoal) => {
    const editing = formState.goal;
    mutate(async () => {
      if (editing) {
        await updateSavingsGoal(editing.id, {
          name: data.name,
          emoji: data.emoji ?? null,
          target_amount: data.target_amount,
          current_amount: data.current_amount ?? editing.current_amount,
          target_date: data.target_date ?? null,
          cadence: data.cadence,
        });
      } else {
        await createSavingsGoal(user.id, data);
      }
      closeForm();
    }, 'Gagal menyimpan target tabungan');
  };

  const handleDelete = (goal: SavingsGoal) =>
    mutate(() => deleteSavingsGoal(goal.id), 'Gagal menghapus target');

  const openContribute = (goal: SavingsGoal) => {
    setContribGoal(goal);
    const plan = computeSavingsPlan(goal);
    const suggest =
      goal.cadence === 'daily' ? plan.perDay : goal.cadence === 'weekly' ? plan.perWeek : plan.perMonth;
    setContribAmount(suggest > 0 ? formatRupiahInput(String(suggest)) : '');
  };
  const closeContribute = () => {
    setContribGoal(null);
    setContribAmount('');
  };

  const submitContribution = () => {
    const goal = contribGoal;
    const amount = parseRupiah(contribAmount);
    if (!goal || amount <= 0) return;
    mutate(async () => {
      await contributeToGoal(goal, amount);
      closeContribute();
    }, 'Gagal mencatat setoran');
  };

  return (
    <div className="flex flex-col" style={{ gap: '2rem' }}>
      <SavingsNudge goals={goals} onContribute={openContribute} />

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3" style={{ flexWrap: 'wrap' }}>
          <h2 className="savings-step">
            <span className="savings-step-num">
              <PiggyBank size={18} />
            </span>
            Target Tabungan
          </h2>
          <Button
            variant="primary"
            onClick={openCreate}
            className="flex items-center justify-center gap-2"
          >
            <Plus size={18} /> Buat Target
          </Button>
        </div>

        {loading && goals.length === 0 ? (
          <Loading label="Memuat tabungan..." />
        ) : goals.length === 0 ? (
          <div className="savings-empty">
            <PiggyBank size={40} />
            <strong>Belum ada target tabungan</strong>
            <p style={{ margin: 0, maxWidth: '42ch' }}>
              Buat target pertamamu — mis. Dana Darurat atau Liburan — lalu sistem menghitung rencana menabung
              per hari/minggu/bulan dan mengingatkanmu.
            </p>
            <Button
              variant="primary"
              onClick={openCreate}
              className="flex items-center justify-center gap-2"
            >
              <Plus size={18} /> Buat Target
            </Button>
          </div>
        ) : (
          <div className="savings-list">
            {goals.map((g) => (
              <SavingsGoalCard
                key={g.id}
                goal={g}
                onContribute={openContribute}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </section>

      {/* Modal buat/edit target */}
      <Modal
        isOpen={formState.open}
        onClose={closeForm}
        title={formState.goal ? 'Edit Target Tabungan' : 'Buat Target Tabungan'}
        description="Tentukan nama, target nominal & tenggat — sistem menghitung rencana menabung per hari/minggu/bulan."
      >
        <SavingsGoalForm
          goal={formState.goal}
          loading={loading}
          onSubmit={handleSubmitGoal}
          onCancel={closeForm}
        />
      </Modal>

      {/* Modal tambah setoran */}
      <Modal
        isOpen={!!contribGoal}
        onClose={closeContribute}
        title="Tambah Setoran"
        description={contribGoal ? `Setor ke "${contribGoal.name}" — progres & tracking langsung diperbarui.` : ''}
      >
        {contribGoal && (
          <div className="flex flex-col gap-4">
            <div className="goal-amounts">
              <div>
                <span className="ga-current">{formatCurrency(contribGoal.current_amount)}</span>
                <span className="ga-target"> / {formatCurrency(contribGoal.target_amount)}</span>
              </div>
            </div>
            <Input
              label="Nominal Setoran (Rp)"
              type="text"
              inputMode="numeric"
              placeholder="Rp. 100.000"
              hint="Jumlah yang kamu tabung sekarang."
              value={contribAmount}
              onChange={(e) => setContribAmount(formatRupiahInput(e.target.value))}
              autoFocus
            />
            <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
              {QUICK_AMOUNTS.map((amt) => (
                <Button
                  key={amt}
                  type="button"
                  variant="outline"
                  className="px-3"
                  onClick={() => setContribAmount(formatRupiahInput(String(amt)))}
                >
                  +{formatCurrency(amt)}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                variant="primary"
                className="flex-1"
                disabled={loading || parseRupiah(contribAmount) <= 0}
                onClick={submitContribution}
              >
                {loading ? 'Menyimpan...' : 'Simpan Setoran'}
              </Button>
              <Button variant="outline" onClick={closeContribute} disabled={loading}>
                Batal
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
