// Edge Function: menerima update dari Telegram Bot, memahami pesan, lalu mencatat transaksi.
// Dideploy dengan --no-verify-jwt (Telegram tak mengirim JWT Supabase); keamanan via secret header.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// @ts-ignore Deno global
const env = (k: string): string => Deno.env.get(k) ?? '';

const TELEGRAM_TOKEN = env('TELEGRAM_BOT_TOKEN');
const WEBHOOK_SECRET = env('TELEGRAM_WEBHOOK_SECRET');
const GEMINI_API_KEY = env('GEMINI_API_KEY');

const supabase = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));

const EXPENSE_CATS = ['food', 'transport', 'shopping', 'bills', 'health', 'housing', 'investment', 'other_expense'];
const INCOME_CATS = ['salary', 'bonus', 'investment', 'other_income'];

const pad = (n: number) => String(n).padStart(2, '0');
const todayISO = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

async function tg(method: string, body: unknown) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
const reply = (chatId: number, text: string) =>
  tg('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true });

interface Parsed {
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
}

// --- Parser cadangan (regex) bila AI tidak tersedia/gagal ---
function parseFallback(text: string): Parsed {
  const lower = text.toLowerCase();
  let amount = 0;
  const m = lower.match(/(\d[\d.,]*)\s*(jt|juta|rb|ribu|k)?/);
  if (m) {
    let n = parseFloat(m[1].replace(/\./g, '').replace(/,/g, '.'));
    const unit = m[2];
    if (unit === 'jt' || unit === 'juta') n *= 1_000_000;
    else if (unit === 'rb' || unit === 'ribu' || unit === 'k') n *= 1_000;
    amount = Math.round(n);
  }
  const incomeHints = ['gaji', 'gajian', 'bonus', 'masuk', 'pemasukan', 'terima', 'dapat', 'untung', 'dividen', 'thr'];
  const type: 'income' | 'expense' = incomeHints.some((h) => lower.includes(h)) ? 'income' : 'expense';
  let title = text.replace(/(\d[\d.,]*)\s*(jt|juta|rb|ribu|k)?/i, '').trim();
  if (!title) title = type === 'income' ? 'Pemasukan' : 'Pengeluaran';
  title = title.charAt(0).toUpperCase() + title.slice(1);
  return { title, amount, type, category: type === 'income' ? 'other_income' : 'other_expense', date: todayISO() };
}

// --- Parser AI (Gemini, reuse pola process-receipt) ---
async function parseWithAI(text: string): Promise<Parsed | null> {
  if (!GEMINI_API_KEY) return null;
  const prompt = `Ekstrak satu transaksi keuangan dari pesan bahasa Indonesia ini menjadi JSON.
Pesan: "${text}"
Balas HANYA JSON valid tanpa markdown dengan struktur:
{"title": string singkat, "amount": number (rupiah, angka saja tanpa titik), "type": "income" atau "expense", "category": string slug, "date": "YYYY-MM-DD" atau null}
Aturan:
- "amount" wajib angka > 0. "100rb"=100000, "4jt"=4000000, "1,5jt"=1500000.
- type "income" untuk gaji/bonus/pemasukan; selain itu "expense".
- category pengeluaran salah satu: ${EXPENSE_CATS.join(', ')}.
- category pemasukan salah satu: ${INCOME_CATS.join(', ')}.
- jika kategori tak jelas: "other_expense" (atau "other_income").`;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0, responseMimeType: 'application/json' },
        }),
      }
    );
    const data = await res.json();
    if (!res.ok) return null;
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) return null;
    let p;
    try {
      p = JSON.parse(raw);
    } catch {
      p = JSON.parse(String(raw).replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
    }
    const amount = Number(p.amount);
    if (!Number.isFinite(amount) || amount <= 0) return null;
    const type: 'income' | 'expense' = p.type === 'income' ? 'income' : 'expense';
    const valid = type === 'income' ? INCOME_CATS : EXPENSE_CATS;
    const category = valid.includes(p.category) ? p.category : type === 'income' ? 'other_income' : 'other_expense';
    return {
      title: String(p.title || 'Transaksi').slice(0, 100),
      amount: Math.round(amount),
      type,
      category,
      date: typeof p.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(p.date) ? p.date : todayISO(),
    };
  } catch {
    return null;
  }
}

async function parseMessage(text: string): Promise<Parsed> {
  return (await parseWithAI(text)) ?? parseFallback(text);
}

async function handleLink(chatId: number, code: string, firstName: string) {
  const { data: codeRow } = await supabase
    .from('telegram_link_codes')
    .select('user_id, expires_at')
    .eq('code', code)
    .maybeSingle();

  if (!codeRow) {
    await reply(chatId, '❌ Kode tidak valid. Buat kode baru di web Tracker.io.');
    return;
  }
  if (new Date(codeRow.expires_at) < new Date()) {
    await supabase.from('telegram_link_codes').delete().eq('code', code);
    await reply(chatId, '⌛ Kode sudah kedaluwarsa. Buat kode baru di web.');
    return;
  }
  await supabase.from('telegram_links').upsert({ chat_id: chatId, user_id: codeRow.user_id }, { onConflict: 'chat_id' });
  await supabase.from('telegram_link_codes').delete().eq('code', code); // sekali pakai
  const name = firstName ? ` ${firstName}` : '';
  await reply(
    chatId,
    `✅ Akun berhasil terhubung${name}!\n\nSekarang cukup ketik transaksimu, mis:\n• <code>bensin 100rb</code>\n• <code>gaji 4jt</code>\n• <code>makan siang 25000</code>`
  );
}

const HELP =
  'Halo! 👋 Aku bot pencatat Tracker.io.\n\n' +
  '1️⃣ Hubungkan akun: buka web Tracker.io → <b>Telegram</b> → kirim <code>/link KODE</code>.\n' +
  '2️⃣ Setelah terhubung, catat transaksi dengan mengetik, mis:\n' +
  '• <code>bensin 100rb</code>\n• <code>gaji 4jt</code>\n• <code>kopi 25000</code>';

// @ts-ignore Deno global
Deno.serve(async (req: Request) => {
  // Keamanan: pastikan request benar-benar dari Telegram (secret token di setWebhook).
  if (WEBHOOK_SECRET && req.headers.get('x-telegram-bot-api-secret-token') !== WEBHOOK_SECRET) {
    return new Response('forbidden', { status: 403 });
  }

  let update: Record<string, unknown>;
  try {
    update = await req.json();
  } catch {
    return new Response('ok');
  }

  const msg = (update.message ?? update.edited_message) as Record<string, unknown> | undefined;
  const chat = msg?.chat as Record<string, unknown> | undefined;
  const chatId = chat?.id as number | undefined;
  const text = String((msg?.text as string) ?? '').trim();
  if (!chatId || !text) return new Response('ok');

  const from = msg?.from as Record<string, unknown> | undefined;
  const firstName = String((from?.first_name as string) ?? '');

  // /start CODE atau /link CODE
  const linkMatch = text.match(/^\/(?:start|link)\s+([A-Za-z0-9]{4,12})$/);
  if (linkMatch) {
    await handleLink(chatId, linkMatch[1].toUpperCase(), firstName);
    return new Response('ok');
  }
  if (text === '/start' || text === '/help') {
    await reply(chatId, HELP);
    return new Response('ok');
  }

  // Harus sudah terhubung
  const { data: link } = await supabase.from('telegram_links').select('user_id').eq('chat_id', chatId).maybeSingle();
  if (!link) {
    await reply(chatId, '⚠️ Akun belum terhubung. Buka web Tracker.io → <b>Telegram</b> untuk dapat kode, lalu kirim <code>/link KODE</code>.');
    return new Response('ok');
  }

  const t = await parseMessage(text);
  if (!t.amount || t.amount <= 0) {
    await reply(chatId, '❓ Aku tidak menemukan nominal. Contoh: <code>kopi 20rb</code> atau <code>gaji 4jt</code>.');
    return new Response('ok');
  }

  const { error } = await supabase.from('transactions').insert({
    user_id: link.user_id,
    title: t.title,
    amount: t.amount,
    type: t.type,
    category: t.category,
    date: t.date,
  });
  if (error) {
    console.error('Insert error:', error);
    await reply(chatId, '❌ Gagal menyimpan transaksi. Coba lagi sebentar lagi.');
    return new Response('ok');
  }

  const emoji = t.type === 'income' ? '🟢 Pemasukan' : '🔴 Pengeluaran';
  const sign = t.type === 'income' ? '+' : '−';
  await reply(
    chatId,
    `✅ Tercatat — ${emoji}\n<b>${t.title}</b>\n${sign} Rp ${t.amount.toLocaleString('id-ID')}\n🏷️ ${t.category} · 📅 ${t.date}`
  );
  return new Response('ok');
});
