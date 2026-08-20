<div align="center">

  <img src="public/images/Logo_voluntrip.png" alt="Voluntrip Logo" width="220" />

  # 🌴 Voluntrip
  **Plan your journey, share the fun**

  *Aplikasi Perencana Trip, Rundown Perjalanan Interaktif & Manajemen Budget Kelompok*

  [![Next.js](https://img.shields.io/badge/Next.js-16_App_Router-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
  [![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
  [![PWA Ready](https://img.shields.io/badge/PWA-Supported-FF6F61?style=for-the-badge&logo=pwa)](https://web.dev/progressive-web-apps/)

</div>

---

## 📌 Tentang Voluntrip

**Voluntrip** adalah platform perencana perjalanan modern yang dirancang untuk mempermudah traveler dan kelompok perjalanan dalam menyusun jadwal kegiatan (*rundown*), mengelola anggaran (*budgeting*), dan melacak pengeluaran secara real-time. Dengan antarmuka interaktif yang intuitif, Voluntrip memastikan itinerary Anda bebas bentrok jam, fleksibel untuk diubah, dan mudah dibagikan ke anggota trip lainnya.

---

## ✨ Fitur Unggulan

### 🗓️ 1. Interactive Itinerary & Rundown Builder
* **Drag & Drop Activity Reordering**: Pindahkan urutan kegiatan harian dengan fitur *long-press* 500ms dan efek gelembung melayang (*bubble overlay*) yang mulus di perangkat desktop maupun HP (*PointerSensor*).
* **Auto-Reschedule Sekuensial**: Perubahan urutan kegiatan secara otomatis merestrukturisasi jam mulai & jam selesai tanpa mengubah durasi asli setiap kegiatan dan bebas tabrakan jam (dengan validasi batas 23:59).
* **Auto-Fill Jam Mulai**: Menambah agenda baru otomatis menggunakan jam selesai dari agenda terakhir pada hari tersebut.
* **Autocomplete Lokasi (Photon OpenStreetMap)**: Cari lokasi destinasi dengan pencarian otomatis dari Photon OSM API (`photon.komoot.io`) dan simpan koordinat lintang & bujur (latitude & longitude) secara otomatis.
* **Integrasi Peta Interaktif**: Tampilan peta Leaflet untuk visualisasi titik lokasi kegiatan.

### 🧳 2. Trip Management & Penyesuaian Hari Aman
* **Manajemen Trip**: Buat trip baru dengan nama, destinasi, tanggal mulai, tanggal selesai, estimasi budget, dan foto cover.
* **Edit Tanggal Aman**: Saat mengubah rentang tanggal trip yang mengurangi jumlah hari, Voluntrip menyediakan dialog konfirmasi untuk memilih hari mana yang ingin dihapus tanpa mengacaukan urutan hari tersisa.

### 💰 3. Expense Tracker, Budgeting & Split Bill
* **Manajemen Pengeluaran**: Catat pengeluaran perjalanan berdasarkan kategori (Akomodasi, Transportasi, Kuliner, Tiket, dll).
* **Split Bill & Pembagian Biaya**: Dukungan perhitungan pembagian tagihan rata (*equal share*) untuk setiap peserta trip dengan kalkulator otomatis.
* **Sinkronisasi Biaya Itinerary & Manual**: Lacak akumulasi biaya kegiatan itinerary serta pengeluaran manual secara akurat.
* **Indikator Real-time Budget**: Pantau sisa anggaran trip secara langsung.

### 🔒 4. Autentikasi & Keamanan Sesi
* **Keamanan JWT & Cookie**: Autentikasi menggunakan JWT terenskripsi dengan HTTP-only cookie.
* **Fitur "Ingat Saya 30 Hari"**: Opsi sesi persisten 30 hari atau *browser session cookie* yang otomatis terhapus saat browser ditutup.
* **Instant Logout (0ms)**: Logout cepat tanpa jeda jaringan.
* **Reset Password**: Fitur lupa password berbasis verifikasi username & email terdaftar.

### 📱 5. Progressive Web App (PWA) & Splash Screen
* **Dukungan PWA Standalone**: Dapat di-install di HP/Desktop seperti aplikasi native tanpa address bar browser.
* **Traveloka-Style Splash Screen**: Animasi splash screen bersih berlatar putih dengan indikator garis bergerak yang elegan saat aplikasi dibuka.
* **Public Share Link**: Bagikan link rundown perjalanan Anda ke publik menggunakan token unik.

---

## 🛠️ Teknologi yang Digunakan

* **Core Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
* **Bahasa Pemrograman**: [TypeScript](https://www.typescriptlang.org/)
* **Styling & UI**: [Tailwind CSS](https://tailwindcss.com/), Lucide Icons, Glassmorphism & Custom Keyframe Animations
* **Database & Client**: [Supabase PostgreSQL](https://supabase.com/) (`postgres` SQL client)
* **Autentikasi**: JSON Web Token (JWT) & `bcryptjs`
* **Drag & Drop**: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
* **Location Search**: [Photon Komoot API](https://photon.komoot.io/)
* **PWA Plugin**: `@ducanh2912/next-pwa`
* **Validasi Schema**: [Zod](https://zod.dev/)

---

## 📁 Struktur Folder Project

```text
Voluntrip/
├── prd/                       # Product Requirements Document & Desain Sistem
│   ├── PRD.md                 # Dokumentasi Lengkap PRD & Diagram Mermaid
│   ├── README.md              # Ringkasan PRD & Panduan Diagram
│   └── diagrams/              # File PlantUML (.puml) Dedicated
├── public/
│   ├── icon-192x192.png       # Ikon PWA 192px
│   ├── icon-512x512.png       # Ikon PWA 512px
│   ├── manifest.json          # Konfigurasi PWA Manifest
│   └── images/
│       └── Logo_voluntrip.png # Logo Utama Voluntrip
├── scripts/                   # Skrip Utilitas & Migrasi
│   ├── schema.sql             # Skrip DDL Skema Supabase PostgreSQL
│   └── setup-db.js            # Runner Otomatis Inisialisasi Database
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # Auth Pages (Login, Register)
│   │   ├── (dashboard)/       # Dashboard & Trip Management Pages
│   │   │   └── trips/         # Trips, Rundown Editor, & Expenses
│   │   ├── api/               # API Routes (Auth, Trips, Rundown, Expenses, Profile, Share)
│   │   ├── layout.tsx         # Root Layout & PWA Metadata
│   │   └── page.tsx           # Entry Page & Splash Screen Handler
│   ├── components/            # Reusable UI Components
│   │   ├── shared/            # LocationAutocomplete, SplashScreen, SidebarLayout, ConfirmDateChangeDialog, dll.
│   │   └── ui/                # Base Components (Button, Card, Input, Dialog, Label)
│   └── lib/                   # Utility Functions, Database Connection, & Zod Schemas
│       ├── auth.ts            # JWT Signing & Session Verifier
│       ├── supabase.ts        # Supabase Postgres Client Connection
│       └── validators/        # Zod Schemas (trip, rundown, expense)
├── next.config.ts             # Konfigurasi Next.js & PWA Plugin
└── package.json               # Dependensi Project
```

---

## 🚀 Panduan Instalasi & Memulai (Getting Started)

### 1. Prasyarat System
* Node.js v18.x atau versi terbaru
* NPM / Yarn / PNPM

### 2. Kloning Repository & Install Dependensi
```bash
# Clone repository ini
git clone https://github.com/moch-firmansyahh/Voluntrip.git

# Masuk ke direktori project
cd Voluntrip

# Install seluruh dependensi
npm install
```

### 3. Konfigurasi Environment Variable
Buat file `.env` di root direktori project dan tambahkan kredensial berikut:

```env
DATABASE_URL=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
JWT_SECRET=voluntrip_jwt_secret_key_random_string
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

### 4. Eksekusi Skema Database
Anda dapat menjalankan inisialisasi skema database secara otomatis melalui terminal:
```bash
npm run db:setup
```
Atau salin dan jalankan isi query SQL dari file [scripts/schema.sql](file:///c:/Users/Firman/Documents/WebDev/Website/Voluntrip/scripts/schema.sql) langsung di **SQL Editor Supabase** Anda untuk membuat tabel:
* `users`
* `trips`
* `rundown_days`
* `rundown_activities`
* `expense_categories`
* `expenses`
* `expense_participants`

### 5. Jalankan Server Pengembang (Development)
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) pada browser Anda.

---

## 🧪 Perintah Build & Linting

```bash
# Verifikasi type check & buat bundle produksi
npm run build

# Menjalankan server produksi hasil build
npm run start

# Menjalankan linter
npm run lint
```

---

## 🌐 Deployment (Vercel)

Aplikasi Voluntrip siap di-deploy secara langsung ke platform **Vercel**:
1. Hubungkan repository GitHub ini ke dashboard Vercel.
2. Masukkan Environment Variables (`DATABASE_URL`, `JWT_SECRET`, dll) pada pengaturan Vercel Project Settings.
3. Vercel akan otomatis melakukan proses *build* dan *deployment*.

---

## 📄 Lisensi & Kontribusi

Proyek ini dikembangkan oleh **Moch Firmansyah** untuk Voluntrip. Kontribusi, masukan, dan saran sangat dialukan!

---

<div align="center">
  <sub>Dibuat dengan ❤️ untuk pengalaman trip yang lebih menyenangkan. © Voluntrip</sub>
</div>
