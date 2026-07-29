# Product Requirements Document (PRD)
## Voluntrip - Aplikasi Perencanaan Trip, Rundown & Budgeting

**Versi:** 2.0  
**Tanggal:** 29 Juli 2026  
**Status:** Approved & Implemented  
**Pengembang:** Moch Firmansyah  

---

## 📋 Table of Contents
1. [Overview](#1-overview)
2. [Tech Stack](#2-tech-stack)
3. [Goals & Non-Goals](#3-goals--non-goals)
4. [Functional Requirements (FR)](#4-functional-requirements-fr)
5. [Non-Functional Requirements (NFR)](#5-non-functional-requirements-nfr)
6. [Design System & UI/UX Standards](#6-design-system--uiux-standards)
7. [System Architecture & PlantUML Diagrams](#7-system-architecture--plantuml-diagrams)
   - [7.1 Class Diagram](#71-class-diagram)
   - [7.2 Use Case Diagram](#72-use-case-diagram)
   - [7.3 Sequence Diagrams](#73-sequence-diagrams)
   - [7.4 Activity Diagram](#74-activity-diagram)
8. [Database Schema Definition](#8-database-schema-definition)
9. [Folder Structure](#9-folder-structure)
10. [Deployment & Security](#10-deployment--security)

---

## 1. Overview

**Voluntrip** adalah aplikasi perencana perjalanan web (Progressive Web App) modern yang mengintegrasikan perencanaan itinerary/rundown harian interaktif, otomatisasi penjadwalan jam sekuensial bebas tabrakan, autocomplete lokasi peta OpenStreetMap, serta pelacak pengeluaran (*expense tracker*) dan *split bill* kelompok.

Aplikasi ini diciptakan untuk menyelesaikan masalah umum traveler: jadwal bentrok, penghitungan jam manual yang merepotkan, kebingungan koordinat peta, serta transparansi pembagian biaya grup perjalanan.

---

## 2. Tech Stack

* **Frontend Framework**: Next.js 16 (App Router, Turbopack)
* **Bahasa**: TypeScript (100% Strict Type Safety)
* **Styling**: Tailwind CSS, Glassmorphism, Custom Keyframes
* **UI Components**: Lucide Icons, Custom Accessible Components
* **Drag & Drop Reordering**: `@dnd-kit/core` dengan `PointerSensor` (Delay 500ms, Tolerance 8px)
* **Autocomplete & Map**: Photon OpenStreetMap API (`photon.komoot.io`), Leaflet Map
* **Database & Query**: Supabase PostgreSQL (`postgres` SQL client)
* **Autentikasi**: JWT HTTP-Only Cookies, `bcryptjs`
* **PWA Plugin**: `@ducanh2912/next-pwa`
* **Validasi Schema**: Zod (`trip.schema.ts`, `rundown.schema.ts`, `expense.schema.ts`)

---

## 3. Goals & Non-Goals

### 🎯 Core Goals
* **Bebas Bentrok Jam**: Penjadwalan sekuensial otomatis yang menghitung durasi kegiatan tanpa tumpang tindih.
* **Pengalaman Touch Mobile Nyaman**: Drag & drop gelembung melayang dengan long-press 500ms.
* **Kemudahan Akses Lokasi**: Ekstraksi nama tempat & koordinat latitude/longitude secara otomatis.
* **Perhitungan Budget Transparan**: Lacak sisa anggaran & pembagian biaya per peserta.
* **Responsif & Ringan**: Tampilan Traveloka-Style Splash Screen & dukungan PWA standalone.

---

## 4. Functional Requirements (FR)

### 4.1 Autentikasi & Keamanan Sesi
* **FR-1**: User login menggunakan username & password terenkripsi bcrypt.
* **FR-2**: Opsi "Ingat saya selama 30 hari" mengaktifkan cookie persisten `maxAge: 30d`. Tanpa centang, cookie berupa *Session Cookie* (terhapus saat browser ditutup).
* **FR-3**: Fitur Instant Logout (0ms) memicu pembersihan cookie HTTP-Only via request `keepalive`.
* **FR-4**: Reset password akun melalui pencocokan username & email terdaftar.

### 4.2 Manajemen Trip & Pengeditan Tanggal Aman
* **FR-5**: Tambah, edit, dan hapus trip (Nama, Destinasi, Tanggal Mulai, Tanggal Selesai, Budget, Cover Image).
* **FR-6**: Jika pengeditan tanggal mengurangi total durasi hari trip, sistem menampilkan `ConfirmDateChangeDialog` agar user memilih hari mana yang akan dihapus tanpa merusak urutan hari tersisa.

### 4.3 Rundown & Itinerary Interaktif
* **FR-7**: Reorder kegiatan harian via Drag & Drop long-press 500ms dengan visual gelembung melayang (`DragOverlay`).
* **FR-8**: Auto-reschedule otomatis yang menghitung jam kegiatan berikutnya berdasarkan durasi asli kegiatan sebelumnya.
* **FR-9**: Validasi batas 23:59 (reorder ditolak jika akumulasi waktu melebihi batas hari).
* **FR-10**: Autocomplete lokasi berbasis Photon OSM yang otomatis menangkap nilai latitude & longitude.
* **FR-11**: Pre-fill `start_time` kegiatan baru otomatis mengikuti `end_time` kegiatan terakhir.

### 4.4 Pengeluaran & Budgeting
* **FR-12**: Catat pengeluaran manual & otomatis dari kegiatan itinerary.
* **FR-13**: Dukungan mode Split Bill per peserta trip.
* **FR-14**: Penanganan shorthand angka biaya otomatis (misal `200` $\rightarrow$ `200.000` jika $< 10.000$) tanpa bug *auto-multiply* pada mode edit.

### 4.5 Sharing Link Publik
* **FR-15**: Generate link publik menggunakan `share_token` unik untuk tampilan view-only bagi non-user.

---

## 5. Non-Functional Requirements (NFR)

* **NFR-1**: Performance load time $< 1.5$ detik dengan `revalidate = 0` pada rute API dinamis.
* **NFR-2**: Keamanan data password menggunakan salt bcrypt 10 putaran.
* **NFR-3**: PWA Standalone Mode dapat berjalan di iOS dan Android tanpa address bar.
* **NFR-4**: Bebas *hydration mismatch* SSR pada kompilasi Turbopack Next.js 16.

---

## 6. Design System & UI/UX Standards

* **Tema Warna**: Primary `#c17a5f` (Warm Sand/Coral), Accent Teal `#0d9488`, Warm Background `oklch(0.98 0.006 70)`.
* **Visual Animation**: Traveloka-style Splash Screen (Logo & Moving Line Indicator) pada kunjungan web.
* **Mikro-Interaksi**: Scale 1.03x pada kartu yang di-long-press, shadow elevation `shadow-2xl`.

---

## 7. System Architecture & PlantUML Diagrams

### 7.1 Class Diagram
Diagram kelas yang menggambarkan struktur data dan entitas sistem Voluntrip:

```plantuml
@startuml Voluntrip_Class_Diagram
skinparam classAttributeIconSize 0
skinparam backgroundColor #FFFFFF
skinparam packageStyle rectangle

package "Authentication Domain" {
  class User {
    + id: UUID
    + username: String
    + password_hash: String
    + full_name: String
    + email: String
    + avatar_url: String
    + created_at: Timestamp
    + verifyPassword(plainPassword: String): Boolean
    + generateJWT(expiresIn: String): String
  }
}

package "Trip Domain" {
  class Trip {
    + id: UUID
    + user_id: UUID
    + name: String
    + destination: String
    + start_date: Date
    + end_date: Date
    + cover_image: String
    + budget_total: Decimal
    + expense_mode: String
    + share_token: String
    + is_public: Boolean
    + created_at: Timestamp
    + getDurationDays(): Integer
    + generateShareToken(): String
  }

  class RundownDay {
    + id: UUID
    + trip_id: UUID
    + day_date: Date
    + order_index: Integer
  }

  class RundownActivity {
    + id: UUID
    + rundown_day_id: UUID
    + title: String
    + location: String
    + start_time: Time
    + end_time: Time
    + cost: Decimal
    + latitude: Double
    + longitude: Double
    + note: String
    + order_index: Integer
    + getDurationMinutes(): Integer
  }
}

package "Expense Domain" {
  class ExpenseCategory {
    + id: UUID
    + trip_id: UUID
    + name: String
  }

  class Expense {
    + id: UUID
    + trip_id: UUID
    + category_id: UUID
    + amount: Decimal
    + note: String
    + expense_date: Date
    + source: String
    + activity_id: UUID
    + created_at: Timestamp
  }

  class ExpenseParticipant {
    + id: UUID
    + expense_id: UUID
    + participant_name: String
    + share_amount: Decimal
  }
}

' Relationships
User "1" -- "0..*" Trip : owns >
Trip "1" *-- "1..*" RundownDay : contains >
RundownDay "1" *-- "0..*" RundownActivity : contains >
Trip "1" *-- "0..*" ExpenseCategory : defines >
Trip "1" *-- "0..*" Expense : tracks >
ExpenseCategory "1" -- "0..*" Expense : categorizes >
Expense "1" *-- "0..*" ExpenseParticipant : splits >
RundownActivity "0..1" -- "0..1" Expense : syncs cost >

@enduml
```

---

### 7.2 Use Case Diagram
Diagram use case yang menggambarkan interaksi aktor (User, Public Visitor, Developer) dengan sistem:

```plantuml
@startuml Voluntrip_UseCase_Diagram
left to right direction
skinparam packageStyle rect
skinparam backgroundColor #FFFFFF

actor "Traveler / Registered User" as User
actor "Public Visitor (Guest)" as Guest
actor "System Developer" as Dev

rectangle "Voluntrip Application" {
  
  package "Auth & Profile" {
    usecase "UC-1: Login Akun & Remember Me" as UC1
    usecase "UC-2: Logout Instan (0ms)" as UC2
    usecase "UC-3: Reset Password Akun" as UC3
    usecase "UC-4: Kelola Profile Settings" as UC4
  }

  package "Trip & Rundown Management" {
    usecase "UC-5: Kelola Trip (CRUD)" as UC5
    usecase "UC-6: Edit Tanggal Trip Aman (Safe Date Edit)" as UC6
    usecase "UC-7: Long-Press Drag & Drop Reorder" as UC7
    usecase "UC-8: Auto-Reschedule Sekuensial Jam" as UC8
    usecase "UC-9: Autocomplete Lokasi (Photon OSM)" as UC9
    usecase "UC-10: Visualisasi Peta Leaflet" as UC10
  }

  package "Expenses & Sharing" {
    usecase "UC-11: Kelola Biaya & Split Bill" as UC11
    usecase "UC-12: Generate / Revoke Link Share Publik" as UC12
    usecase "UC-13: Lihat Itinerary View-Only" as UC13
  }

  package "System Administration" {
    usecase "UC-14: Provisioning Akun User Baru" as UC14
  }
}

' User Interactions
User --> UC1
User --> UC2
User --> UC3
User --> UC4
User --> UC5
User --> UC6
User --> UC7
User --> UC8
User --> UC9
User --> UC10
User --> UC11
User --> UC12

' Guest Interactions
Guest --> UC13

' Developer Interactions
Dev --> UC14

' Includes & Extends
UC7 .> UC8 : <<includes>>
UC5 .> UC6 : <<extends>>
UC12 .> UC13 : <<enables>>

@enduml
```

---

### 7.3 Sequence Diagrams

#### Sequence 1: Drag & Drop Activity Reorder dengan Auto-Reschedule
```plantuml
@startuml Voluntrip_Sequence_Drag_Reschedule
autonumber
actor User
participant "RundownEditorClient\n(React UI)" as UI
participant "PointerSensor\n(@dnd-kit)" as Sensor
participant "recalculateSchedule\n(Algorithm)" as Algo
participant "API Route\n(/api/rundown/reorder)" as API
database "Supabase PostgreSQL\n(Database)" as DB

User -> UI: Long-press 500ms pada Card Activity
UI -> Sensor: Trigger activation constraint (tolerance 8px)
Sensor --> UI: Activation success (Floating Bubble Overlay active)
User -> UI: Drag & Drop ke posisi urutan baru (index)
UI -> Algo: recalculateSchedule(newActivitiesOrder)
activate Algo

Algo -> Algo: Hitung sekuensial start_time & end_time tiap kegiatan
alt Total waktu > 23:59
  Algo --> UI: Return Validation Error (Exceeds Day Boundary)
  UI --> User: Tampilkan Notifikasi Toast Error
else Waktu valid (<= 23:59)
  Algo --> UI: Return recalculated activities array
  deactivate Algo
  UI -> API: PUT /api/rundown/reorder (Payload JSON)
  activate API
  API -> DB: UPDATE rundown_activities SET order_index, start_time, end_time
  activate DB
  DB --> API: Return Success (Rows Updated)
  deactivate DB
  API --> UI: HTTP 200 OK Response
  deactivate API
  UI --> User: Update UI Timeline Seketika
end

@enduml
```

#### Sequence 2: User Login & Session Persistence
```plantuml
@startuml Voluntrip_Sequence_Login
autonumber
actor User
participant "LoginPage\n(React)" as UI
participant "Auth API\n(/api/auth/login)" as API
participant "Auth Helper\n(auth.ts)" as Auth
database "Supabase DB" as DB

User -> UI: Input Username, Password & Centang "Ingat Saya 30 Hari"
User -> UI: Klik Tombol "Masuk"
UI -> API: POST /api/auth/login { username, password, rememberMe: true }
activate API

API -> DB: SELECT * FROM users WHERE username = ?
activate DB
DB --> API: User Record Data
deactivate DB

API -> Auth: comparePassword(password, hash)
activate Auth
Auth --> API: Password Valid (true)
deactivate Auth

API -> Auth: signToken(payload, '30d')
activate Auth
Auth --> API: JWT Token String
deactivate Auth

API -> API: Set HTTP-Only Cookie voluntrip_session (maxAge: 30d)
API --> UI: HTTP 200 OK { success: true }
deactivate API

UI -> UI: Tampilkan Traveloka-Style Splash Screen (1.2s)
UI -> User: Redirect ke /dashboard

@enduml
```

---

### 7.4 Activity Diagram
Activity Diagram proses penyusunan Rundown & Pengeditan Tanggal Trip Aman (*Safe Date Edit*):

```plantuml
@startuml Voluntrip_Activity_Diagram
skinparam backgroundColor #FFFFFF
start

:User Membuka Halaman Rundown Trip;
:Sistem Memuat Data Days & Activities dari API;

if (Pilihan Aksi User?) then (Drag & Drop Reorder)
  :User Long-Press Card Activity 500ms;
  :Bubble Overlay Aktif;
  :User Menggeser Card ke Urutan Baru;
  :Sistem Menghitung Ulang Jam Sekuensial (recalculateSchedule);
  
  if (Jam Selesai > 23:59?) then (Ya)
    :Batalkan Drag & Tampilkan Notifikasi Error;
  else (Tidak)
    :Kirim Reorder Payload ke API /api/rundown/reorder;
    :Simpan Perubahan ke Database;
    :Update Tampilan Timeline;
  endif

else (Tambah Activity Baru)
  :User Klik "Tambah Agenda";
  :Sistem Auto-Fill start_time dengan end_time Kegiatan Terakhir;
  :User Ketik Lokasi pada LocationAutocomplete;
  :API Photon OSM Mengembalikan Rekomendasi Lokasi & Latitude/Longitude;
  :User Simpan Activity Baru;
  :Simpan Data ke Database;

else (Edit Tanggal Trip)
  :User Mengubah Tanggal Trip di Modal Edit;
  
  if (Total Hari Berkurang?) then (Ya)
    :Tampilkan Modal ConfirmDateChangeDialog;
    :User Memilih Hari yang Ingin Dihapus;
    :Hapus Hari Terpilih & Map Ulang order_index Hari Tersisa;
  else (Tidak)
    :Update Tanggal Trip Langsung;
  endif
  
  :Kirim Request PUT /api/trips/[tripId];
  :Database Update Success;
endif

stop
@enduml
```

---

## 8. Database Schema Definition

Berikut adalah definisi DDL SQL untuk seluruh tabel dalam Supabase PostgreSQL Voluntrip:

```sql
-- 1. Tabel Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabel Trips
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  cover_image TEXT,
  budget_total NUMERIC(12,2) DEFAULT 0,
  expense_mode TEXT DEFAULT 'per_trip',
  share_token TEXT UNIQUE,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabel Rundown Days
CREATE TABLE IF NOT EXISTS rundown_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  day_date DATE NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabel Rundown Activities
CREATE TABLE IF NOT EXISTS rundown_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rundown_day_id UUID NOT NULL REFERENCES rundown_days(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  location TEXT,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  cost NUMERIC(12,2) DEFAULT 0,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  note TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabel Expense Categories
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabel Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL,
  note TEXT,
  expense_date DATE NOT NULL,
  source TEXT DEFAULT 'manual',
  activity_id UUID REFERENCES rundown_activities(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tabel Expense Participants
CREATE TABLE IF NOT EXISTS expense_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  participant_name TEXT NOT NULL,
  share_amount NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 9. Folder Structure

```text
Voluntrip/
├── prd/
│   ├── PRD.md                 # Dokumen PRD Utama & Diagram PlantUML
│   └── README.md              # Ringkasan Eksekutif PRD
├── public/
│   ├── icon-192x192.png       # Ikon PWA 192px
│   ├── icon-512x512.png       # Ikon PWA 512px
│   ├── manifest.json          # Manifest PWA Standalone
│   └── images/
│       └── Logo_voluntrip.png # Asset Logo Utama
├── src/
│   ├── app/
│   │   ├── (auth)/login/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/page.tsx
│   │   │   └── trips/
│   │   │       ├── page.tsx
│   │   │       └── [tripId]/
│   │   │           ├── page.tsx
│   │   │           ├── expenses/_components/ExpensesClient.tsx
│   │   │           └── rundown/_components/RundownEditorClient.tsx
│   │   ├── api/               # Rute API Endpoint (Auth, Trips, Rundown, Expenses, Share, Profile)
│   │   ├── layout.tsx
│   │   └── page.tsx           # Entry Point & Traveloka Splash Handler
│   ├── components/
│   │   ├── shared/            # LocationAutocomplete, SplashScreen, ConfirmDateChangeDialog, SidebarLayout
│   │   └── ui/                # Base Components UI (Button, Input, Card, Dialog)
│   └── lib/
│       ├── auth.ts            # JWT Authentication Manager
│       ├── supabase.ts        # Supabase Postgres Connection
│       └── validators/        # Zod Schemas (trip, rundown, expense)
├── next.config.ts             # Next.js & PWA Config (withPWA, turbopack: {})
├── README.md                  # Dokumentasi Proyek GitHub
└── package.json
```

---

## 10. Deployment & Security

* **Vercel Platform**: Deployment otomatis berbasis Next.js App Router.
* **API Route Caching**: Seluruh rute API dinamis dikonfigurasi dengan `export const revalidate = 0;` untuk mencegah *stale data response*.
* **HTTP-Only Cookies**: JWT disimpan dalam cookie HTTP-only aman berspesifikasi `SameSite=lax`.
* **Database Connection Safety**: Parameter koneksi database Supabase PostgreSQL disimpan secara aman di file `.env`.
