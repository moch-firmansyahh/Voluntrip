# Product Requirements Document (PRD)
## Voluntrip - Aplikasi Perencanaan Perjalanan

**Versi:** 1.0
**Tanggal:** 17 Juli 2026
**Status:** Draft

---

## 1. Overview

Voluntrip adalah aplikasi web untuk membantu pengguna merencanakan perjalanan secara terstruktur, mencakup perencanaan pengeluaran (budget) dan perencanaan rundown kegiatan (itinerary). Aplikasi ini ditujukan untuk individu maupun kelompok yang ingin mengatur trip dengan lebih rapi tanpa harus mengandalkan spreadsheet manual.

---

## 2. Tech Stack

### Frontend
- Next.js (App Router) sebagai framework utama
- TypeScript untuk type safety
- Tailwind CSS untuk styling
- Shadcn UI sebagai base component library
- Aceternity UI / Magic UI untuk komponen dengan aksen animasi di bagian tertentu (hero section, card destinasi)
- Framer Motion untuk animasi dan micro interaction
- Lucide Icons untuk ikon
- Recharts untuk visualisasi data pengeluaran
- dnd kit untuk drag and drop rundown kegiatan
- React Day Picker untuk kalender dan date range
- React Hook Form dan Zod untuk form handling dan validasi

### Backend
- Next.js API Routes untuk kebutuhan umum (auth, CRUD trip, expense, rundown)
- Express dapat dipisah nantinya apabila ada kebutuhan proses yang lebih kompleks (contoh: generate laporan PDF, integrasi eksternal)

### Database
- Supabase (PostgreSQL) sebagai database utama
- Supabase Storage untuk penyimpanan aset seperti foto trip atau bukti struk pengeluaran

### Autentikasi
- Sistem login custom menggunakan username dan password (bukan Supabase Auth default), karena akun user hanya dapat dibuat oleh developer, bukan melalui self-registration
- Password di-hash menggunakan bcrypt sebelum disimpan ke database
- Session management menggunakan JWT yang disimpan di HTTP only cookie

### Catatan Keamanan
- Connection string database tidak boleh ditulis langsung di kode maupun dokumen yang masuk ke repository
- Semua credential database disimpan di file `.env` dan didaftarkan di `.gitignore`
- Contoh environment variable yang dibutuhkan:

```
DATABASE_URL=postgresql://postgres:PASSWORD_DISINI@db.xxxxxxxx.supabase.co:5432/postgres
JWT_SECRET=isi_dengan_string_acak_yang_panjang
NEXT_PUBLIC_SUPABASE_URL=isi_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=isi_anon_key
```

Karena password yang sempat dibagikan sudah pernah terekspos di percakapan ini, disarankan untuk mengganti password database Supabase sebelum aplikasi dikembangkan lebih lanjut.

---

## 3. Goals

### Goals Utama
- Membantu pengguna merencanakan pengeluaran trip dengan fleksibel, baik untuk perjalanan sendiri maupun bersama teman
- Membantu pengguna menyusun rundown kegiatan harian secara visual dan mudah diatur ulang
- Menyediakan tampilan yang menyenangkan dan tidak kaku, sesuai dengan konteks penggunaan yaitu liburan
- Memberikan akses yang aman dan terkontrol, karena akun hanya dibuat oleh developer

### Goals User
- User dapat login dan langsung melihat daftar trip yang dimiliki
- User dapat membuat trip baru lengkap dengan tanggal, tujuan, dan budget awal
- User dapat mencatat pengeluaran dengan model yang sesuai kebutuhannya (per trip saja, atau dengan split biaya bersama teman)
- User dapat menyusun rundown kegiatan per hari dan mengatur ulang urutannya dengan drag and drop
- User dapat membagikan rundown trip ke orang lain dalam mode lihat saja, tanpa orang tersebut perlu login

---

## 4. Scope

### In Scope
- Autentikasi login menggunakan username dan password
- Manajemen trip (create, read, update, delete)
- Perencanaan pengeluaran dengan beberapa opsi model (per trip dan split biaya)
- Perencanaan rundown kegiatan dengan drag and drop
- Fitur share rundown dalam mode view only menggunakan link publik
- Dashboard ringkasan trip dan pengeluaran
- Responsive design (desktop first, tetap optimal di mobile)

### Out of Scope (untuk versi 1.0)
- Self-registration akun oleh user
- Multi role seperti admin panel di sisi user (pembuatan akun tetap manual oleh developer)
- Kolaborasi edit bersama (real time multi-editing) pada satu trip
- Integrasi pembayaran atau payment gateway
- Aplikasi mobile native (iOS/Android)
- Notifikasi push atau email

---

## 5. Functional Requirements

### 5.1 Autentikasi
- FR-1: User login menggunakan username dan password
- FR-2: Akun user hanya dapat dibuat oleh developer melalui seeder atau panel internal, tidak ada halaman registrasi publik
- FR-3: Sistem menyimpan session menggunakan JWT dengan masa berlaku tertentu (contoh 7 hari)
- FR-4: User dapat logout dan session akan invalid

### 5.2 Manajemen Trip
- FR-5: User dapat membuat trip baru dengan nama, destinasi, tanggal mulai, tanggal selesai, dan cover image opsional
- FR-6: User dapat melihat daftar seluruh trip miliknya dalam bentuk card
- FR-7: User dapat mengedit dan menghapus trip
- FR-8: User dapat melihat detail trip yang berisi ringkasan budget dan rundown

### 5.3 Perencanaan Pengeluaran
- FR-9: Saat membuat rencana pengeluaran, user dapat memilih salah satu model berikut:
  - Model per trip: seluruh pengeluaran dicatat untuk kebutuhan trip itu sendiri tanpa pembagian
  - Model split biaya: pengeluaran dapat dibagi ke beberapa nama peserta trip, dengan pembagian rata atau custom per item
- FR-10: User dapat menambahkan kategori pengeluaran (contoh: transportasi, akomodasi, makan, aktivitas, lainnya)
- FR-11: User dapat menambahkan item pengeluaran dengan nominal, kategori, tanggal, dan catatan
- FR-12: Sistem menampilkan total pengeluaran, sisa budget, dan breakdown per kategori dalam bentuk chart
- FR-13: Untuk model split biaya, sistem menampilkan ringkasan berapa yang harus dibayar atau diterima oleh masing masing peserta

### 5.4 Perencanaan Rundown Kegiatan
- FR-14: User dapat membuat rundown per hari dalam satu trip
- FR-15: User dapat menambahkan kegiatan dengan waktu mulai, waktu selesai, lokasi, dan catatan
- FR-16: User dapat mengatur ulang urutan kegiatan dalam satu hari menggunakan drag and drop
- FR-17: User dapat memindahkan kegiatan antar hari
- FR-18: Sistem menampilkan rundown dalam tampilan timeline per hari

### 5.5 Sharing
- FR-19: User dapat generate link publik untuk satu trip agar bisa dilihat orang lain tanpa login
- FR-20: Halaman yang diakses melalui link publik bersifat view only, tidak dapat mengedit apapun
- FR-21: User dapat menonaktifkan link publik kapan saja

### 5.6 Dashboard
- FR-22: Dashboard utama menampilkan ringkasan seluruh trip aktif, total pengeluaran bulan berjalan, dan trip terdekat berdasarkan tanggal

---

## 6. Non Functional Requirements

- NFR-1: Aplikasi harus responsive dan tetap nyaman digunakan di ukuran layar mobile meskipun didesain desktop first
- NFR-2: Waktu loading halaman utama tidak lebih dari 2 detik pada koneksi standar
- NFR-3: Password user disimpan dalam bentuk hash, tidak pernah dalam bentuk plain text
- NFR-4: Seluruh komunikasi antara client dan server menggunakan HTTPS
- NFR-5: Sistem harus mampu menangani minimal 50 trip aktif per user tanpa penurunan performa signifikan
- NFR-6: Kode harus terstruktur dan konsisten mengikuti folder structure yang telah ditentukan agar mudah dikembangkan
- NFR-7: Link share publik harus menggunakan token acak yang sulit ditebak, bukan berbasis ID trip langsung
- NFR-8: Aplikasi harus tetap dapat diakses meski salah satu fitur (contoh chart) gagal dimuat, tidak boleh membuat seluruh halaman crash

---

## 7. Design System

### Style Direction
Playful and vibrant, sesuai konteks aplikasi liburan, namun tetap terstruktur dan tidak berlebihan agar tetap nyaman dipakai untuk kebutuhan serius seperti mengatur budget.

### Warna
- Primary: oranye atau coral (nuansa sunset), digunakan untuk tombol aksi utama dan highlight angka penting
- Secondary: teal atau turquoise, digunakan untuk aksen dan status positif
- Background: warm neutral (cream atau off white), bukan putih polos agar terasa lebih hangat
- Warning dan error tetap menggunakan warna standar (kuning dan merah) untuk konsistensi feedback

### Tipografi
- Heading: Plus Jakarta Sans atau Poppins, memberi kesan playful tapi tetap rapi
- Body text: Inter, untuk kenyamanan membaca konten panjang seperti detail rundown

### Komponen
- Card-based layout dengan rounded corner besar dan shadow lembut
- Progress bar dan chart menggunakan palet warna yang senada dengan tema utama
- Layout desktop menggunakan sidebar navigasi di kiri, collapse menjadi bottom navigation di mobile
- Animasi halus menggunakan Framer Motion pada transisi antar halaman dan saat data pengeluaran ter-update

---

## 8. Folder Structure

```
voluntrip/
  src/
    app/
      (auth)/
        login/
          page.tsx
      (dashboard)/
        dashboard/
          page.tsx
        trips/
          page.tsx
          [tripId]/
            page.tsx
            expenses/
              page.tsx
            rundown/
              page.tsx
      (public)/
        share/
          [token]/
            page.tsx
      api/
        auth/
          login/
            route.ts
          logout/
            route.ts
        trips/
          route.ts
          [tripId]/
            route.ts
        expenses/
          route.ts
          [expenseId]/
            route.ts
        rundown/
          route.ts
          [activityId]/
            route.ts
        share/
          route.ts
      layout.tsx
      globals.css
    components/
      ui/
      trip/
      expense/
      rundown/
      dashboard/
      shared/
    lib/
      supabase.ts
      auth.ts
      utils.ts
      validators/
        trip.schema.ts
        expense.schema.ts
        rundown.schema.ts
    hooks/
      use-trip.ts
      use-expense.ts
      use-rundown.ts
    types/
      trip.ts
      expense.ts
      rundown.ts
      user.ts
    middleware.ts
  public/
    images/
  .env
  .env.example
  next.config.js
  tailwind.config.ts
  tsconfig.json
  package.json
```

---

## 9. Database Schema (Ringkasan)

### users
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | primary key |
| username | text | unique |
| password_hash | text | hasil bcrypt |
| full_name | text | |
| created_at | timestamp | |

### trips
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | primary key |
| user_id | uuid | foreign key ke users |
| name | text | |
| destination | text | |
| start_date | date | |
| end_date | date | |
| cover_image | text | url ke supabase storage |
| budget_total | numeric | |
| expense_mode | text | 'per_trip' atau 'split' |
| share_token | text | nullable, untuk fitur share |
| is_public | boolean | default false |
| created_at | timestamp | |

### expense_categories
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | primary key |
| trip_id | uuid | foreign key ke trips |
| name | text | |

### expenses
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | primary key |
| trip_id | uuid | foreign key ke trips |
| category_id | uuid | foreign key ke expense_categories |
| amount | numeric | |
| note | text | |
| expense_date | date | |
| created_at | timestamp | |

### expense_participants
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | primary key |
| expense_id | uuid | foreign key ke expenses |
| participant_name | text | |
| share_amount | numeric | |

### rundown_days
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | primary key |
| trip_id | uuid | foreign key ke trips |
| day_date | date | |
| order_index | integer | |

### rundown_activities
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | primary key |
| rundown_day_id | uuid | foreign key ke rundown_days |
| title | text | |
| location | text | |
| start_time | time | |
| end_time | time | |
| note | text | |
| order_index | integer | |

---

## 10. Deployment

- Frontend dan backend (Next.js) di-deploy ke Vercel
- Database menggunakan Supabase (PostgreSQL) dengan koneksi melalui environment variable
- Environment variable diatur langsung melalui dashboard Vercel, tidak disimpan di kode
- Supabase Storage digunakan untuk menyimpan cover image trip
- Disarankan menggunakan branch terpisah untuk staging dan production agar perubahan skema database bisa diuji dulu sebelum masuk ke production

---

## 11. Open Points untuk Iterasi Selanjutnya

- Detail UI mockup per halaman (dashboard, detail trip, form pengeluaran, rundown) akan dibuat secara terpisah setelah PRD ini disetujui
- Perlu ditentukan apakah expense_mode bisa diganti setelah trip dibuat, atau harus ditentukan di awal
- Perlu ditentukan format token untuk share link (contoh: nanoid dengan panjang tertentu)
