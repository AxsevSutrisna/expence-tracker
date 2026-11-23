// Edge Function: pengingat menabung via Telegram. Dipicu terjadwal (pg_cron → pg_net).
// Deploy dengan --no-verify-jwt; keamanan via header x-cron-secret (CRON_SECRET).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// @ts-ignore Deno global
const env = (k: string): string => Deno.env.get(k) ?? '';

const TELEGRAM_TOKEN = env('TELEGRAM_BOT_TOKEN');
const CRON_SECRET = env('CRON_SECRET');
const supabase = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));

const pad = (n: number) => String(n).padStart(2, '0');
const todayISO = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const daysBetween = (fromISO: string, toISO: string): number => {
  const [fy, fm, fd] = fromISO.split('-').map(Number);
  const [ty, tm, td] = toISO.split('-').map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000);
};
const startOfWeekISO = (iso: string): string => {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const since = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - since);
  return date.toISOString().slice(0, 10);
};
const rupiah = (n: number) => `Rp ${Math.round(n).toLocaleString('id-ID')}`;

interface Goal {
  id: string;
  user_id: string;
  name: string;
  emoji: string | null;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  cadence: 'daily' | 'weekly' | 'monthly';
  last_contributed_at: string | null;
  last_reminded_at: string | null;
  is_active: boolean;
}

function dueForReminder(g: Goal, today: string): boolean {
  if (!g.is_active) return false;
  if (Number(g.current_amount) >= Number(g.target_amount)) return false;
  if (g.last_reminded_at === today) return false; // sudah diingatkan hari ini
  const last = g.last_contributed_at;
  if (!last) return true;
  if (g.cadence === 'daily') return last !== today;
  if (g.cadence === 'weekly') return last < startOfWeekISO(today);
  return String(last).slice(0, 7) !== today.slice(0, 7);
}

function suggestion(g: Goal, today: string): number {
  if (!g.target_date) return 0;
  const remaining = Math.max(0, Number(g.target_amount) - Number(g.current_amount));
  const daysLeft = Math.max(1, daysBetween(today, g.target_date));
  if (g.cadence === 'daily') return Math.ceil(remaining / daysLeft);
  if (g.cadence === 'weekly') return Math.ceil(remaining / Math.max(1, Math.ceil(daysLeft / 7)));
  return Math.ceil(remaining / Math.max(1, Math.round(daysLeft / 30)));
}

const periodWord = (c: Goal['cadence']) =>
  c === 'daily' ? 'hari ini' : c === 'weekly' ? 'minggu ini' : 'bulan ini';

async function tg(method: string, body: unknown) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });

// @ts-ignore Deno global
Deno.serve(async (req: Request) => {
  if (CRON_SECRET && req.headers.get('x-cron-secret') !== CRON_SECRET) {
    return new Response('forbidden', { status: 403 });
  }

  const today = todayISO();

  const { data: goalsRaw, error } = await supabase
    .from('savings_goals')
    .select(
      'id, user_id, name, emoji, target_amount, current_amount, target_date, cadence, last_contributed_at, last_reminded_at, is_active'
    )
    .eq('is_active', true);
  if (error) return json({ error: error.message }, 500);

  const due = (goalsRaw as Goal[] ?? []).filter((g) => dueForReminder(g, today));
  if (due.length === 0) return json({ sent: 0, due: 0 });

  // Peta user_id → chat_id (satu query).
  const userIds = [...new Set(due.map((g) => g.user_id))];
  const { data: links } = await supabase
    .from('telegram_links')
    .select('chat_id, user_id')
    .in('user_id', userIds);
  const chatByUser = new Map<string, number>(
    ((links as Array<{ chat_id: number; user_id: string }>) ?? []).map((l) => [l.user_id, l.chat_id])
  );

  // Kelompokkan per user → satu pesan ringkas berisi semua target yang due.
  const byUser = new Map<string, Goal[]>();
  for (const g of due) {
    if (!chatByUser.has(g.user_id)) continue; // user belum hubungkan Telegram
    const arr = byUser.get(g.user_id) ?? [];
    arr.push(g);
    byUser.set(g.user_id, arr);
  }

  let sent = 0;
  const remindedIds: string[] = [];
  for (const [userId, userGoals] of byUser) {
    const chatId = chatByUser.get(userId)!;
    const lines = userGoals.map((g) => {
      const s = suggestion(g, today);
      const head = `${g.emoji ? g.emoji + ' ' : '•'} <b>${g.name}</b> — ${rupiah(g.current_amount)} / ${rupiah(g.target_amount)}`;
      const tip = s > 0 ? `\n   Sisihkan ${rupiah(s)} ${periodWord(g.cadence)}` : '';
      return head + tip;
    });
    const text = `💰 <b>Pengingat Menabung</b>\n\nBelum menabung ${userGoals.length > 1 ? 'untuk target ini' : periodWord(userGoals[0].cadence)}:\n\n${lines.join('\n\n')}\n\nAyo semangat capai targetmu! 💪`;
    await tg('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true });
    sent++;
    for (const g of userGoals) remindedIds.push(g.id);
  }

  if (remindedIds.length > 0) {
    await supabase.from('savings_goals').update({ last_reminded_at: today }).in('id', remindedIds);
  }

  return json({ sent, due: due.length, users: byUser.size });
});
