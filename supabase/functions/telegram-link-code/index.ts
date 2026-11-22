// Edge Function: dipanggil frontend (pengguna login) untuk membuat kode hubungkan Telegram.
// Dideploy dengan verifikasi JWT aktif (default) — hanya pengguna login yang bisa memanggil.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// @ts-ignore Deno global
const env = (k: string): string => Deno.env.get(k) ?? '';

const BOT_USERNAME = env('TELEGRAM_BOT_USERNAME'); // tanpa "@", mis. "xtrrrr_bot"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

// Kode ramah-baca (tanpa 0/O/1/I) agar mudah diketik ulang.
function randomCode(len = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  let out = '';
  for (let i = 0; i < len; i++) out += chars[bytes[i] % chars.length];
  return out;
}

// @ts-ignore Deno global
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) return json({ error: 'Unauthorized' }, 401);

    // Client service-role untuk operasi DB; token dipakai untuk mengidentifikasi user.
    const supabase = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser(token);
    if (userErr || !user) return json({ error: 'Unauthorized' }, 401);

    // Sudah terhubung?
    const { data: existing } = await supabase
      .from('telegram_links')
      .select('chat_id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (existing) return json({ linked: true, botUsername: BOT_USERNAME });

    // Bersihkan kode lama milik user, lalu buat satu kode baru (5 menit).
    await supabase.from('telegram_link_codes').delete().eq('user_id', user.id);
    const code = randomCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const { error: insErr } = await supabase
      .from('telegram_link_codes')
      .insert({ code, user_id: user.id, expires_at: expiresAt });
    if (insErr) throw insErr;

    return json({
      linked: false,
      code,
      botUsername: BOT_USERNAME,
      deepLink: BOT_USERNAME ? `https://t.me/${BOT_USERNAME}?start=${code}` : null,
      expiresInSeconds: 300,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return json({ error: message }, 500);
  }
});
