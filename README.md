# Expense Tracker (React + Supabase)

Sebuah aplikasi web pencatatan keuangan (pemasukan dan pengeluaran) pribadi, dilengkapi dengan fitur autentikasi, ringkasan saldo, manajemen transaksi secara realtime, dan telah dirombak penuh menggunakan desain antarmuka bergaya **Neo-Brutalism**.

## Tech Stack
Proyek ini dibangun menggunakan teknologi berikut:
- **Frontend Framework:** React.js (menggunakan Vite)
- **Routing:** React Router DOM
- **Styling & UI:** Vanilla CSS dengan arsitektur tema **Neo-Brutalism** (garis tepi tebal, warna kontras tinggi, bayangan *offset* tajam, dan efek *hover* mekanis).
- **Accessible Components:** [Radix UI](https://www.radix-ui.com/) (menggunakan `@radix-ui/react-alert-dialog` untuk modal konfirmasi penghapusan).
- **Database & Authentication:** Supabase (PostgreSQL)
- **Icons:** Lucide React

## Fitur & Pembaruan Terbaru (Update Neo-Brutalism)
- **Desain Neo-Brutalism:** Seluruh antarmuka (termasuk Card, Tombol, Form Login, Modal, dan Dialog Konfirmasi) kini menerapkan gaya visual Neo-Brutalism yang *bold* dan retro.
- **Komponen Struktural:** Implementasi sistem komponen Card yang terstruktur (`Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter`) agar *codebase* lebih solid dan dapat digunakan ulang di seluruh halaman.
- **Alert Dialog Radix UI:** Integrasi modal penghapusan data (Hapus Transaksi) menggunakan pustaka *headless* Radix UI, dikombinasikan dengan sentuhan animasi masuk (*fade-in & zoom*) ala Neo-Brutalism.
- **Interaksi Dinamis:** Penyesuaian efek interaktif ditekan (*pressed effect*) yang sangat halus pada semua tombol aksi.

## Struktur Proyek

```text
expence-tracker/
├── public/                 # Asset statis yang dapat diakses publik
├── src/
│   ├── components/         
│   │   ├── tracker/        # Komponen khusus fitur (TransactionForm, TransactionList)
│   │   └── ui/             # Komponen antarmuka yang dapat digunakan ulang (Button, Input, Card)
│   ├── contexts/           # React Context (AuthContext.jsx untuk manajemen state login)
│   ├── hooks/              # Custom Hooks (useTransactions.js untuk logika fetch Supabase)
│   ├── lib/                # Konfigurasi pihak ketiga (supabase.js)
│   ├── pages/              
│   │   ├── Dashboard.jsx   # Halaman utama aplikasi pencatatan
│   │   └── Login.jsx       # Halaman autentikasi (Login/Register/Google)
│   ├── App.jsx             # Pengaturan Routing & Layout Utama
│   ├── index.css           # Global Styling & Variabel Tema
│   └── main.jsx            # Entry point React
├── .env                    # Kredensial lokal (Dikecualikan di git)
├── .env.example            # Contoh format kredensial environment
└── vite.config.js          # Konfigurasi bundle Vite
```

---

## Persiapan & Instalasi (Setup)

### 1. Kloning dan Instal Dependensi
Pastikan Anda sudah menginstal Node.js. Jalankan perintah berikut di terminal:
```bash
# Install paket dependensi
npm install

or 

npm install --legacy-peer-deps
```

### 2. Konfigurasi Environment & Supabase
Anda membutuhkan sebuah proyek **Supabase** agar aplikasi ini bisa berjalan.
1. Salin file `.env.example` menjadi `.env`.
   ```bash
   cp .env.example .env
   ```
2. Buka dashboard [Supabase](https://supabase.com/), pergi ke **Project Settings > API**, lalu salin **URL** dan **anon public key**.
3. Masukkan nilai tersebut ke dalam file `.env`:
   ```env
   VITE_SUPABASE_URL=https://[ID-PROJECT].supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5c...
   ```

### 3. Konfigurasi Database (SQL Schema)
Buka menu **SQL Editor** di Supabase Dashboard, salin *script* di bawah ini, dan klik **Run** untuk membuat tabel transaksi beserta sistem keamanannya (RLS):

```sql
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  amount numeric not null,
  date date not null,
  type text not null check (type in ('income', 'expense')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Mengaktifkan perlindungan Row Level Security (RLS)
alter table public.transactions enable row level security;

-- Membuat Policy: Pengguna HANYA dapat melihat dan memodifikasi data miliknya sendiri
create policy "Users can view own transactions" on transactions for select using (auth.uid() = user_id);
create policy "Users can insert own transactions" on transactions for insert with check (auth.uid() = user_id);
create policy "Users can update own transactions" on transactions for update using (auth.uid() = user_id);
create policy "Users can delete own transactions" on transactions for delete using (auth.uid() = user_id);
```

---

## Setup Login dengan Google OAuth

Aplikasi ini mendukung *Login with Google*. Berikut cara mengaktifkannya:

### A. Mendapatkan Client ID di Google Cloud Console
1. Buka [Google Cloud Console](https://console.cloud.google.com/).
2. Buat proyek baru *(New Project)*.
3. Pergi ke menu **APIs & Services > OAuth consent screen**.
   - Pilih tipe **External** dan isi informasi dasar seperti *App name* dan *Email support*.
4. Pergi ke menu **APIs & Services > Credentials**.
5. Klik **+ CREATE CREDENTIALS** > **OAuth client ID**.
6. Pilih **Web application**.
7. Di bagian **Authorized redirect URIs**, Anda harus memasukkan URL *Callback* dari Supabase. (URL ini bisa Anda dapatkan di langkah B).
8. Klik **Create**. Google akan memberikan `Client ID` dan `Client Secret`. Salin keduanya.

### B. Memasukkan Kredensial ke Supabase
1. Buka **Supabase Dashboard** proyek Anda.
2. Pergi ke menu **Authentication > Providers**.
3. Cari dan aktifkan opsi **Google**.
4. Masukkan `Client ID` dan `Client Secret` yang baru Anda dapatkan dari Google Cloud.
5. Salin teks yang ada di kotak **Callback URL (for OAuth)** (Misal: `https://[ID-PROJECT].supabase.co/auth/v1/callback`), lalu tempelkan (*paste*) URL tersebut ke bagian *Authorized redirect URIs* di pengaturan Google Cloud Anda (kembali ke poin A.7).
6. Simpan konfigurasi di Google Cloud dan Supabase.

---

## Menjalankan Aplikasi
Setelah konfigurasi di atas selesai, jalankan server pengembangan *(development)*:

```bash
npm run dev
```
Buka `http://localhost:5173` di browser Anda untuk melihat aplikasi yang sedang berjalan.
