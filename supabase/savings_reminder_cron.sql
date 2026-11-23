-- ============================================================
-- Jadwal pengingat menabung via Telegram (Edge Function savings-reminder).
-- Prasyarat: tabel savings_goals sudah dibuat (savings_schema.sql),
-- secret CRON_SECRET sudah di-set, dan fungsi savings-reminder sudah di-deploy.
-- Ganti GANTI_DENGAN_CRON_SECRET_ANDA dengan nilai CRON_SECRET yang sama.
-- ============================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Hapus jadwal lama bila ada (aman diulang).
do $$
begin
  perform cron.unschedule('savings-reminder-daily');
exception
  when others then null;
end $$;

-- Jalankan tiap hari 01:00 UTC (±08:00 WIB). Ubah ekspresi cron bila perlu.
select cron.schedule(
  'savings-reminder-daily',
  '0 1 * * *',
  $$
  select net.http_post(
    url := 'https://evtpxrrbymhdocfovsct.supabase.co/functions/v1/savings-reminder',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', 'GANTI_DENGAN_CRON_SECRET_ANDA'
    ),
    body := '{}'::jsonb
  );
  $$
);
