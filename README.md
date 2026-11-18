# Expense Tracker (React + Supabase)

Aplikasi web pencatatan keuangan pribadi (pemasukan & pengeluaran) dengan autentikasi multi-user, data real-time per-pengguna, dan antarmuka bergaya **Neo-Brutalism**. Selain pencatatan dasar, aplikasi ini dilengkapi analitik visual, manajemen budget, transaksi berulang (langganan), gamifikasi streak, pemindai struk berbasis AI (Google Gemini), serta ekspor laporan ke Excel.

---

## Daftar Isi
- [Fitur](#fitur)
- [Tech Stack](#tech-stack)
- [Struktur Proyek](#struktur-proyek)
- [Persiapan & Instalasi](#persiapan--instalasi)
- [Konfigurasi Database (SQL Schema Lengkap)](#konfigurasi-database-sql-schema-lengkap)
- [Konfigurasi Supabase Storage (Struk)](#konfigurasi-supabase-storage-struk)
- [Konfigurasi Edge Function (AI Scan Struk)](#konfigurasi-edge-function-ai-scan-struk)
- [Setup Login dengan Google OAuth](#setup-login-dengan-google-oauth)
- [Menjalankan & Build](#menjalankan--build)
- [Deployment (Vercel)](#deployment-vercel)
- [Model Data (Ringkasan)](#model-data-ringkasan)

---

## Fitur
- **Autentikasi**: Email/Password & Login dengan Google (Supabase Auth). Rute dilindungi `ProtectedRoute`.
- **Pencatatan Transaksi**: Tambah/Edit/Hapus pemasukan & pengeluaran, difilter per **bulan/tahun** (query sisi server).
- **Pencarian & Filter**: Pencarian kata kunci (ter-*debounce*) dan filter rentang nominal (min/maks).
- **Kategori Kustom**: Tambah kategori sendiri (emoji + warna) di samping kategori bawaan.
- **Analitik**: Donut chart pengeluaran per kategori & bar chart arus kas (Recharts).
- **Budget Bulanan**: Setel limit per kategori + progress bar dengan status warna dan peringatan *over budget*.
- **Langganan / Recurring**: Transaksi berulang harian/mingguan/bulanan/tahunan yang dibuat otomatis saat jatuh tempo.
- **Gamifikasi**: Streak "hari hemat" + badge milestone (3/7/30 hari).
- **Scan Struk (AI)**: Foto struk → kompresi gambar → Google Gemini mengekstrak judul, nominal, tanggal, dan kategori → mengisi form otomatis. Gambar struk disimpan di Supabase Storage.
- **Ekspor Excel**: Laporan `.xlsx` ber-styling (header, tabel, baris total) via ExcelJS.
- **Tema Terang/Gelap**: Preferensi disimpan di `localStorage`.

## Tech Stack
| Lapisan | Teknologi |
|---|---|
| Framework | React 19 + Vite 8 |
| Bahasa | TypeScript (strict) |
| Arsitektur | Feature-Sliced (`app` / `pages` / `features` / `shared`) |
| Routing | React Router DOM 7 |
| Backend / DB / Auth / Storage | Supabase (PostgreSQL) |
| AI (OCR struk) | Google Gemini (`gemini-1.5-flash`) via Supabase Edge Function (Deno) |
| Styling | Vanilla CSS + CSS Variables (tema Neo-Brutalism), utility classes lokal |
| Komponen aksesibel | Radix UI (`alert-dialog`, `popover`, `progress`), `emoji-picker-react` |
| Grafik | Recharts |
| Ekspor | ExcelJS + FileSaver |
| Ikon | Lucide React |
| Deploy | Vercel |

> **Catatan dependensi**: proyek memakai `legacy-peer-deps=true` (lihat `.npmrc`) karena beberapa paket belum sepenuhnya menandai dukungan React 19 di `peerDependencies`.

## Struktur Proyek

Proyek memakai **arsitektur Feature-Sliced**: lapisan `shared` (dipakai bersama), `features` (per-domain), `pages` (komposisi), dan `app` (bootstrap). Arah dependensi satu arah: `shared ← features ← pages ← app`. Setiap fitur mengekspor API publiknya lewat `index.ts` (barrel).

```text
expence-tracker/
├── public/                       # Aset statis (logo, favicon, ikon)
├── src/
│   ├── app/                      # Bootstrap: App.tsx (router), ProtectedRoute.tsx
│   ├── pages/                    # Komposisi halaman: DashboardPage.tsx, LoginPage.tsx
│   ├── features/                 # Modul per-domain (components / hooks / services / context + index.ts)
│   │   ├── auth/                 # AuthContext, useAuth
│   │   ├── transactions/         # useTransactions, useTransactionSummary, Form, List, transactionService
│   │   ├── budgets/              # BudgetManager, BudgetProgress, budgetService
│   │   ├── categories/           # CategoryManager, categoryService
│   │   ├── recurring/            # RecurringManager, recurringService
│   │   ├── gamification/         # GamificationBadge, gamificationService
│   │   ├── receipts/             # ReceiptScanner, imageService, storageService
│   │   └── analytics/            # Analytics (Recharts)
│   ├── shared/
│   │   ├── ui/                   # Design system (Button, Input, Select, Card, Modal, Calendar, Popover, Progress, AlertDialog) + CSS
│   │   ├── lib/                  # supabase client, cn()
│   │   ├── hooks/                # useDebounce
│   │   ├── utils/                # format, exportUtils
│   │   ├── config/               # constants (TRANSACTION_TYPES, CATEGORIES default)
│   │   └── types/                # Tipe domain bersama (Transaction, Category, Budget, dll)
│   ├── index.css                 # Tema global & variabel Neo-Brutalism
│   ├── main.tsx                  # Entry point React
│   └── vite-env.d.ts             # Tipe env Vite (VITE_SUPABASE_*)
├── supabase/
│   └── functions/
│       └── process-receipt/      # Edge Function: OCR struk via Gemini
│           └── index.ts
├── .env                          # Kredensial lokal (diabaikan git)
├── .env.example                  # Contoh format environment
├── tsconfig.json                 # Konfigurasi TypeScript (strict + path alias)
├── vercel.json                   # SPA rewrite untuk Vercel
└── vite.config.ts                # Konfigurasi Vite (alias @/@app/@pages/@features/@shared, port 3000)
```

**Path alias** (didefinisikan di `tsconfig.json` & `vite.config.ts`): `@/*` → `src/*`, `@app/*`, `@pages/*`, `@features/*`, `@shared/*`.

---

## Persiapan & Instalasi

### 1. Prasyarat
- **Node.js** (disarankan v18+).
- Akun & proyek **Supabase**.
- (Opsional, untuk fitur Scan Struk) **Supabase CLI** dan **Google Gemini API Key**.

### 2. Kloning & Instal Dependensi
```bash
npm install
# atau, bila ada konflik peer dependency:
npm install --legacy-peer-deps
```

### 3. Konfigurasi Environment
Salin `.env.example` menjadi `.env`, lalu isi dari **Supabase Dashboard → Project Settings → API**:
```env
VITE_SUPABASE_URL=https://<ID-PROJECT>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-public-key>
```

---

## Konfigurasi Database (SQL Schema Lengkap)

Buka **Supabase Dashboard → SQL Editor**, tempel seluruh skrip berikut, lalu **Run**. Skrip ini membuat **5 tabel** beserta Row Level Security (RLS) agar setiap pengguna hanya dapat mengakses datanya sendiri.

```sql
-- =========================================================
-- 1) TABEL: transactions
-- =========================================================
create table if not exists public.transactions (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users not null,
  title       text not null,
  amount      numeric not null,
  date        date not null,
  type        text not null check (type in ('income', 'expense')),
  category    text,                 -- id kategori bawaan (mis. 'food') atau UUID kategori kustom
  receipt_url text,                 -- URL publik gambar struk (opsional)
  created_at  timestamptz default timezone('utc', now()) not null
);

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, date desc);

alter table public.transactions enable row level security;

create policy "transactions_select_own" on public.transactions
  for select using (auth.uid() = user_id);
create policy "transactions_insert_own" on public.transactions
  for insert with check (auth.uid() = user_id);
create policy "transactions_update_own" on public.transactions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "transactions_delete_own" on public.transactions
  for delete using (auth.uid() = user_id);

-- =========================================================
-- 2) TABEL: categories (kategori kustom buatan pengguna)
-- =========================================================
create table if not exists public.categories (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users not null,
  type       text not null check (type in ('income', 'expense')),
  label      text not null,
  emoji      text,
  color      text,
  created_at timestamptz default timezone('utc', now()) not null
);

create index if not exists categories_user_idx on public.categories (user_id);

alter table public.categories enable row level security;

create policy "categories_select_own" on public.categories
  for select using (auth.uid() = user_id);
create policy "categories_insert_own" on public.categories
  for insert with check (auth.uid() = user_id);
create policy "categories_update_own" on public.categories
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "categories_delete_own" on public.categories
  for delete using (auth.uid() = user_id);

-- =========================================================
-- 3) TABEL: budgets (limit pengeluaran per kategori)
-- =========================================================
create table if not exists public.budgets (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references auth.users not null,
  category     text not null,       -- id kategori bawaan atau UUID kategori kustom
  amount_limit numeric not null,
  created_at   timestamptz default timezone('utc', now()) not null,
  unique (user_id, category)        -- satu limit per kategori per pengguna
);

create index if not exists budgets_user_idx on public.budgets (user_id);

alter table public.budgets enable row level security;

create policy "budgets_select_own" on public.budgets
  for select using (auth.uid() = user_id);
create policy "budgets_insert_own" on public.budgets
  for insert with check (auth.uid() = user_id);
create policy "budgets_update_own" on public.budgets
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "budgets_delete_own" on public.budgets
  for delete using (auth.uid() = user_id);

-- =========================================================
-- 4) TABEL: recurring_transactions (langganan / transaksi berulang)
-- =========================================================
create table if not exists public.recurring_transactions (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users not null,
  title      text not null,
  amount     numeric not null,
  category   text,
  type       text not null check (type in ('income', 'expense')),
  frequency  text not null default 'monthly'
             check (frequency in ('daily', 'weekly', 'monthly', 'yearly')),
  start_date date not null,
  next_date  date not null,         -- tanggal jatuh tempo berikutnya
  is_active  boolean not null default true,
  created_at timestamptz default timezone('utc', now()) not null
);

create index if not exists recurring_user_next_idx
  on public.recurring_transactions (user_id, next_date);

alter table public.recurring_transactions enable row level security;

create policy "recurring_select_own" on public.recurring_transactions
  for select using (auth.uid() = user_id);
create policy "recurring_insert_own" on public.recurring_transactions
  for insert with check (auth.uid() = user_id);
create policy "recurring_update_own" on public.recurring_transactions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "recurring_delete_own" on public.recurring_transactions
  for delete using (auth.uid() = user_id);

-- =========================================================
-- 5) TABEL: user_gamification (streak & badge)
-- =========================================================
create table if not exists public.user_gamification (
  user_id            uuid primary key references auth.users not null,
  current_streak     integer not null default 0,
  longest_streak     integer not null default 0,
  last_activity_date date,
  badges             text[] not null default '{}',
  updated_at         timestamptz default timezone('utc', now()) not null
);

alter table public.user_gamification enable row level security;

create policy "gamification_select_own" on public.user_gamification
  for select using (auth.uid() = user_id);
create policy "gamification_insert_own" on public.user_gamification
  for insert with check (auth.uid() = user_id);
create policy "gamification_update_own" on public.user_gamification
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

> **Catatan**: kolom `transactions.category` dan `budgets.category` menyimpan **id kategori sebagai teks**. Untuk kategori bawaan nilainya adalah slug (mis. `food`, `salary` — lihat `src/utils/constants.js`); untuk kategori kustom nilainya adalah UUID baris di tabel `categories`.

---

## Konfigurasi Supabase Storage (Struk)

Fitur Scan Struk mengunggah gambar ke bucket **`receipts`** dengan pola path `<user_id>/<file>`. Buat bucket dan policy-nya lewat **SQL Editor**:

```sql
-- Bucket publik untuk gambar struk (agar getPublicUrl bisa dibaca)
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do nothing;

-- Pengguna hanya boleh mengunggah ke folder miliknya sendiri (<user_id>/...)
create policy "receipts_insert_own_folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Baca publik untuk bucket receipts
create policy "receipts_public_read"
  on storage.objects for select to public
  using (bucket_id = 'receipts');

-- (Opsional) Pengguna boleh menghapus file miliknya
create policy "receipts_delete_own_folder"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

> Alternatif: bucket juga bisa dibuat via **Dashboard → Storage → New bucket** (nama `receipts`, centang **Public**), lalu tambahkan policy di atas.

---

## Konfigurasi Edge Function (AI Scan Struk)

Edge Function `process-receipt` menerima gambar (base64) dari klien, memanggil Google Gemini, dan mengembalikan JSON `{ title, amount, date, category }`.

### 1. Dapatkan Gemini API Key
Buat API key di [Google AI Studio](https://aistudio.google.com/app/apikey).

### 2. Set Secret & Deploy (Supabase CLI)
```bash
# Login & tautkan proyek
supabase login
supabase link --project-ref <ID-PROJECT>

# Simpan API key sebagai secret function
supabase secrets set GEMINI_API_KEY=<gemini-api-key>

# Deploy function
supabase functions deploy process-receipt
```

> Fungsi dapat diuji dari klien lewat `supabase.functions.invoke('process-receipt', { body: { imageBase64, mimeType } })` (lihat `src/components/tracker/ReceiptScanner.jsx`). CORS sudah di-set permisif (`*`) untuk kemudahan pengembangan — perketat `Access-Control-Allow-Origin` untuk produksi bila perlu.

---

## Setup Login dengan Google OAuth

### A. Google Cloud Console
1. Buka [Google Cloud Console](https://console.cloud.google.com/) → buat proyek.
2. **APIs & Services → OAuth consent screen**: pilih **External**, isi App name & email.
3. **APIs & Services → Credentials → + CREATE CREDENTIALS → OAuth client ID → Web application**.
4. Pada **Authorized redirect URIs**, masukkan Callback URL dari Supabase (lihat langkah B), mis. `https://<ID-PROJECT>.supabase.co/auth/v1/callback`.
5. **Create**, lalu salin **Client ID** dan **Client Secret**.

### B. Supabase Dashboard
1. **Authentication → Providers → Google**: aktifkan.
2. Masukkan **Client ID** & **Client Secret** dari Google.
3. Salin **Callback URL (for OAuth)** ke *Authorized redirect URIs* di Google Cloud (langkah A.4).
4. Simpan di kedua sisi.

> Redirect setelah login diarahkan ke `window.location.origin` (lihat `AuthContext.jsx`). Pastikan URL produksi (mis. domain Vercel) juga terdaftar di **Authentication → URL Configuration → Redirect URLs** di Supabase.

---

## Menjalankan & Build

```bash
npm run dev        # mode pengembangan (Vite, port 3000 -> http://localhost:3000)
npm run build      # type-check (tsc --noEmit) lalu build produksi ke folder dist/
npm run typecheck  # hanya pengecekan tipe TypeScript
npm run preview    # pratinjau hasil build
npm run lint       # ESLint (JS/TS/TSX)
```

> Catatan: `vite.config.js` men-set `server.port = 3000`. (README lama menyebut 5173 — gunakan **3000**.)

---

## Deployment (Vercel)

Proyek siap deploy ke Vercel sebagai SPA (`vercel.json` sudah berisi rewrite semua rute ke `/index.html`).

1. Import repo ke Vercel.
2. Framework preset: **Vite**. Build command: `npm run build`. Output dir: `dist`.
3. Tambahkan Environment Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
4. Deploy.
5. Daftarkan domain Vercel di Supabase **Authentication → URL Configuration** agar OAuth/redirect bekerja.

---

## Model Data (Ringkasan)

| Tabel | Kolom kunci | Keterangan |
|---|---|---|
| `transactions` | `user_id, title, amount, date, type, category, receipt_url` | Catatan pemasukan/pengeluaran utama |
| `categories` | `user_id, type, label, emoji, color` | Kategori kustom per pengguna |
| `budgets` | `user_id, category, amount_limit` | Limit pengeluaran per kategori (unik per pengguna+kategori) |
| `recurring_transactions` | `user_id, title, amount, type, category, frequency, start_date, next_date, is_active` | Transaksi berulang/langganan |
| `user_gamification` | `user_id, current_streak, longest_streak, last_activity_date, badges` | Streak & badge |

**Storage**: bucket publik `receipts`, path `<user_id>/<timestamp>_<rand>.jpg`.
**Edge Function**: `process-receipt` (secret: `GEMINI_API_KEY`).

---

© Tracker.io — Expense Tracker Project
