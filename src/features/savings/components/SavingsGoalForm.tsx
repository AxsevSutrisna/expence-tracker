import { useState } from 'react';
import { Button, Input, Select } from '@shared/ui';
import { formatRupiahInput, parseRupiah } from '@shared/utils/format';
import type { NewSavingsGoal, SavingsCadence, SavingsGoal } from '@shared/types';

const CADENCE_OPTIONS = [
  { value: 'daily', label: 'Harian' },
  { value: 'weekly', label: 'Mingguan' },
  { value: 'monthly', label: 'Bulanan' },
];

export interface SavingsGoalFormProps {
  goal?: SavingsGoal | null;
  loading?: boolean;
  onSubmit: (data: NewSavingsGoal) => void;
  onCancel: () => void;
}

export function SavingsGoalForm({ goal, loading, onSubmit, onCancel }: SavingsGoalFormProps) {
  const [name, setName] = useState(goal?.name ?? '');
  const [emoji, setEmoji] = useState(goal?.emoji ?? '');
  const [target, setTarget] = useState(goal ? formatRupiahInput(String(goal.target_amount)) : '');
  const [current, setCurrent] = useState(goal ? formatRupiahInput(String(goal.current_amount)) : '');
  const [targetDate, setTargetDate] = useState(goal?.target_date ?? '');
  const [cadence, setCadence] = useState<SavingsCadence>(goal?.cadence ?? 'weekly');

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const target_amount = parseRupiah(target);
    if (!name.trim() || target_amount <= 0) return;
    onSubmit({
      name: name.trim(),
      emoji: emoji.trim() || null,
      target_amount,
      current_amount: parseRupiah(current),
      target_date: targetDate || null,
      cadence,
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Input
        label="Nama Target"
        placeholder="Misal: Dana Darurat, Liburan Bali"
        hint="Nama tabungan yang ingin kamu kumpulkan."
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <div className="form-grid-2">
        <Input
          label="Emoji (opsional)"
          placeholder="🎯"
          maxLength={4}
          hint="Ikon kecil untuk target."
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
        />
        <Input
          label="Target Nominal (Rp)"
          type="text"
          inputMode="numeric"
          placeholder="Rp. 10.000.000"
          hint="Total yang ingin dikumpulkan."
          value={target}
          onChange={(e) => setTarget(formatRupiahInput(e.target.value))}
          required
        />
      </div>

      <div className="form-grid-2">
        <Input
          label="Sudah Terkumpul (Rp)"
          type="text"
          inputMode="numeric"
          placeholder="Rp. 0"
          hint="Saldo awal bila sudah ada sebagian."
          value={current}
          onChange={(e) => setCurrent(formatRupiahInput(e.target.value))}
        />
        <Input
          label="Tenggat (opsional)"
          type="date"
          hint="Agar rencana per hari/minggu/bulan muncul."
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
        />
      </div>

      <Select
        label="Irama Pengingat"
        hint="Seberapa sering kamu ingin diingatkan menabung."
        value={cadence}
        onChange={(e) => setCadence(e.target.value as SavingsCadence)}
        options={CADENCE_OPTIONS}
      />

      <div className="flex gap-2">
        <Button type="submit" variant="primary" disabled={loading} className="flex-1">
          {loading ? 'Menyimpan...' : goal ? 'Simpan Perubahan' : 'Buat Target'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Batal
        </Button>
      </div>
    </form>
  );
}
