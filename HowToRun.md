# Panduan Menjalankan Aplikasi (HowToRun.md)
**Lost And Found — Platform Pelaporan Barang Hilang & Ditemukan Mahasiswa Universitas Pradita**

Dokumen ini memuat petunjuk teknis lengkap untuk menyiapkan, mengonfigurasi, menjalankan, dan menguji aplikasi secara menyeluruh dari kondisi repositori bersih (*clean state*).

---

## 1. Prasyarat Lingkungan Sistem

Sebelum memulai, pastikan sistem pengembang telah memenuhi spesifikasi berikut:

- **Node.js**: Versi `20.19+`, `22.12+`, atau lebih baru.
- **npm**: Versi `10.x` atau lebih baru (menggunakan arsitektur `npm workspaces`).
- **Sistem Operasi**: Windows, macOS, atau Linux.
- **PostgreSQL**: Database lokal atau layanan PostgreSQL terkelola seperti Railway.

---

## 2. Struktur Variabel Lingkungan (`.env`)

Aplikasi menggunakan file `.env` pada *root workspace*. Contoh konfigurasi telah disediakan di `.env.example`.

### Langkah Konfigurasi:
Salin file `.env.example` ke `.env` pada root repositori:

```bash
# Salin konfigurasi environment
cp .env.example .env
```

### Konfigurasi Standar `.env`:
```ini
# Connection string PostgreSQL lokal atau Railway
DATABASE_URL="postgresql://postgres:password@localhost:5432/lost_and_found?schema=public"

# Session secret untuk enkripsi dan penandatanganan cookie CSRF (min. 32 karakter)
SESSION_SECRET="<generate-random-secret-at-least-32-characters>"

# Port server REST API
API_PORT=3000

# Origin frontend yang diizinkan untuk CORS dan verifikasi CSRF
WEB_ORIGIN="http://localhost:5173"

# Direktori penyimpanan unggahan foto (relatif terhadap root)
UPLOAD_DIR="uploads"
```

---

## 3. Langkah Demi Langkah dari Kondisi Bersih (*Clean State*)

Ikuti urutan perintah di bawah ini pada direktori root repositori:

### Langkah 1: Instalasi Dependensi
Instal seluruh paket dependensi untuk seluruh *workspace* (root, `apps/api`, `apps/web`, dan `packages/shared`):
```bash
npm install
```

### Langkah 2: Persiapan Direktori Persisten
Pastikan folder `uploads/` tersedia di root repositori:
```bash
# Pastikan folder uploads tersedia (sudah memiliki .gitkeep)
mkdir -p uploads
```

### Langkah 3: Sinkronisasi Skema Database & Migrasi Prisma
Jalankan migrasi PostgreSQL untuk membuat seluruh tabel dan indeks:
```bash
npm run db:migrate:deploy
```

Untuk pengembangan skema lokal, gunakan `npm run db:migrate`. Pastikan `DATABASE_URL` mengarah ke database PostgreSQL yang benar sebelum menjalankan migrasi.

### Langkah 4: Seeding Data Awal (*Development Seed*)
Isi database dengan akun demo, data barang awal, dan riwayat aktivitas demonstrasi:
```bash
npm run db:seed
```

#### Akun Demo Bawaan:
1. **Akun Mahasiswa**:
   - Email: `alex.rivera@student.pradita.ac.id`
   - Password: `password123`
   - Peran: `student` (Mahasiswa Aktif)
2. **Akun Dosen / Staf**:
   - Email: `sarah.jenkins@pradita.ac.id`
   - Password: `password123`
   - Peran: `faculty_staff` (Dosen / Staf Akademik)

---

## 4. Menjalankan Aplikasi

Aplikasi terdiri dari Backend Express API dan Frontend React SPA (Vite). Anda dapat menjalankannya secara terpisah atau bersamaan.

### Menjalankan Backend API:
```bash
npm run dev:api
```
- Server REST API akan berjalan pada: **`http://localhost:3000`**
- Endpoint kesehatan sistem: **`http://localhost:3000/api/health`**

## Deployment Railway

1. Buat layanan PostgreSQL pada proyek Railway.
2. Di layanan API, set `DATABASE_URL` ke variable reference PostgreSQL, misalnya `${{Postgres.DATABASE_URL}}`.
3. Set `SESSION_SECRET` dengan nilai acak minimal 32 karakter dan `WEB_ORIGIN` ke URL frontend production.
4. Gunakan `npm run db:generate && npm run build:api` sebagai build command. Jalankan `npm run db:migrate:deploy` sebelum `npm run start:api` pada setiap deployment.
5. Set health check path ke `/api/health`; endpoint akan menjalankan query `SELECT 1` untuk memverifikasi koneksi database.

Jangan commit connection string atau nilai secret ke repository. Seed akun demo hanya untuk development dan ditolak pada `NODE_ENV=production`.

### Menjalankan Frontend Web:
Buka terminal baru pada root repositori:
```bash
npm run dev:web
```
- Web Application SPA akan berjalan pada: **`http://localhost:5173`**
- Vite telah dikonfigurasi dengan reverse proxy otomatis menuju `http://localhost:3000` untuk rute `/api` dan `/uploads`.

---

## 5. Menjalankan Suite Pengujian (*Testing*)

Repositori telah dilengkapi suite pengujian otomatis mencakup unit test, validasi skema, logika matching, pembersihan retensi, serta integrasi End-to-End (E2E) API.

### A. Menjalankan Seluruh Automated Tests
```bash
npm test --workspace=@lost-and-found/api
```
*Jumlah test mengikuti source terkini; cakupannya antara lain:*
- Validasi metadata laporan barang hilang (*lost*).
- Validasi jam operasional penyerahan barang temuan (*found*).
- Penolakan tanggal insiden masa depan dan tanggal kalender tidak valid.
- Normalisasi query string kosong pada pencarian katalog.
- Sanitasi input profil pengguna.
- Perhitungan jendela retensi kedaluwarsa 14 hari laporan aktif.
- Filter laporan aktif unarchived.
- Penilaian skor deterministik Match Engine (kategori, lokasi, kata kunci).
- Normalisasi lokasi bebas (spasi, tanda baca, huruf besar/kecil).
- Logika retensi dan purge otomatis barang berstatus *returned* (3 hari cutoff).
- **Alur E2E lengkap**: Registrasi institusi, verifikasi sesi, pelaporan barang, inquiry/klaim, otorisasi ciri rahasia, status siklus barang returned, dan isolasi privasi.

### B. Menjalankan Typecheck & Build Validation
Untuk memverifikasi ketiadaan kesalahan TypeScript dan kompatibilitas build produksi:
```bash
# Typecheck TypeScript (Strict Mode)
npm run typecheck:api
npm run typecheck:web

# Build bundle produksi
npm run build:api
npm run build:web
```

## 6. Kontrak Cookie dan Pemulihan Sesi Lokal

Konfigurasi utama nama cookie CSRF adalah `CSRF_COOKIE_NAME` di environment proses atau `.env` root. Jika tidak diberikan pada backend development, default-nya `laf_csrf`. Nilai kosong, karakter tidak valid, konflik dengan nama cookie sesi, atau override frontend yang berbeda akan ditolak.

Vite menggunakan loader environment root yang sama, lalu meneruskan hanya nama cookie sebagai `VITE_CSRF_COOKIE_NAME`. Variabel tersebut tidak perlu diisi terpisah; jika diberikan, nilainya harus sama. Nama tidak ditentukan oleh `import.meta.env.PROD`: frontend hasil build untuk pengujian lokal tetap memakai kontrak lokal. Vite mengekspos konfigurasi publik secara eksplisit; jangan memasukkan secret ke variabel frontend. `VITE_API_URL` opsional tetap tersedia; untuk alur lokal gunakan URL relatif melalui proxy `/api`.

Setelah mengubah konfigurasi cookie, restart API dan Vite; rebuild bundle frontend yang sudah dikompilasi. Jangan memakai override nama cookie khusus mode Vite sebagai sumber terpisah dari konfigurasi backend. Gunakan hostname frontend yang konsisten selama satu sesi browser.

Saat aplikasi dimuat ulang, `/api/auth/me` memverifikasi sesi tanpa bergantung pada keberadaan cookie CSRF. Login/register baru selesai setelah verifikasi ini berhasil. Gangguan jaringan atau timeout verifikasi (10 detik) menampilkan status belum dapat diverifikasi dan tombol **Coba lagi**, bukan logout otomatis. Halaman terlindungi ditahan sampai sesi terkonfirmasi. Mutasi tidak diulang otomatis ketika CSRF gagal.

Respons `/api/auth/*`, `/api/profile`, dan error sesi/CSRF/Origin terkait menggunakan `Cache-Control: no-store`. Cookie sesi tetap HttpOnly; token tidak disimpan di localStorage.

### Pengujian database terisolasi

Integration test menulis data. Jangan arahkan suite ke database development, production, atau Railway. Harness test repository saat ini masih memakai SQLite, sementara Prisma schema dan migrasi sudah PostgreSQL; test database harness perlu diselaraskan sebelum menjalankan integration suite. Typecheck/build dan validasi schema tetap dapat dijalankan secara lokal.

```text
node_modules/.bin/tsx --test apps/api/src/lib/auth-contract.test.ts
node_modules/.bin/tsx --test apps/api/src/routes/auth-session.test.ts
npm test --workspace=@lost-and-found/api
```

Pada Windows gunakan executable `.cmd`. Bersihkan hanya direktori disposable buatan pengujian setelah seluruh proses yang memakainya berhenti.

### Batasan deployment

Production belum dikonfigurasi. Backend production memerlukan `CSRF_COOKIE_NAME` eksplisit yang mempertahankan persyaratan prefix `__Host-`; tidak tersedia default production baru. Tentukan nama, URL frontend/API, origin/proxy, terminasi HTTPS, dan kebutuhan lintas hostname sebelum deployment. Build Vite lokal tidak menetapkan keputusan tersebut. Session cookie production tetap Secure, host-only, dan Path=/; mekanisme HMAC CSRF dan keterbatasan pengikatannya pada sesi tidak diubah oleh pekerjaan ini.
