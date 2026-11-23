-- ============================================================
-- Fitur Tabungan (Savings Goals) — jalankan sekali di Supabase SQL Editor.
-- ============================================================

create table if not exists public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  emoji text,
  target_amount numeric not null check (target_amount > 0),
  current_amount numeric not null default 0 check (current_amount >= 0),
  target_date date,                       -- tenggat (opsional) untuk menghitung rencana per hari/minggu/bulan
  cadence text not null default 'weekly', -- irama pengingat: 'daily' | 'weekly' | 'monthly'
  last_contributed_at date,               -- setoran terakhir (untuk nudge & pengingat)
  last_reminded_at date,                  -- dedupe pengingat Telegram (diisi oleh cron)
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists savings_goals_user_idx on public.savings_goals (user_id);

alter table public.savings_goals enable row level security;

-- RLS: tiap user hanya bisa mengakses tabungannya sendiri.
drop policy if exists "savings_select_own" on public.savings_goals;
create policy "savings_select_own" on public.savings_goals
  for select using (auth.uid() = user_id);

drop policy if exists "savings_insert_own" on public.savings_goals;
create policy "savings_insert_own" on public.savings_goals
  for insert with check (auth.uid() = user_id);

drop policy if exists "savings_update_own" on public.savings_goals;
create policy "savings_update_own" on public.savings_goals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "savings_delete_own" on public.savings_goals;
create policy "savings_delete_own" on public.savings_goals
  for delete using (auth.uid() = user_id);
