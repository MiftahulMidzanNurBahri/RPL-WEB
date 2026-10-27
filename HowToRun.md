# Panduan Menjalankan Aplikasi (HowToRun.md)
**Lost And Found — Platform Pelaporan Barang Hilang & Ditemukan Mahasiswa Universitas Pradita**

Dokumen ini memuat petunjuk teknis lengkap untuk menyiapkan, mengonfigurasi, menjalankan, dan menguji aplikasi secara menyeluruh dari kondisi repositori bersih (*clean state*).

---

## 1. Prasyarat Lingkungan Sistem

Sebelum memulai, pastikan sistem pengembang telah memenuhi spesifikasi berikut:

- **Node.js**: Versi `20.x` LTS atau lebih baru (direkomendasikan Node.js 20+; didukung minimal v18+).
- **npm**: Versi `10.x` atau lebih baru (menggunakan arsitektur `npm workspaces`).
- **Sistem Operasi**: Windows, macOS, atau Linux.
- **SQLite Engine**: Terbawa otomatis melalui driver Prisma Client (tidak memerlukan instalasi server database eksternal).

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
# Path SQLite relatif terhadap apps/api/prisma/schema.prisma
DATABASE_URL="file:../../../data/lost-and-found.db"

# Session secret untuk enkripsi dan penandatanganan cookie CSRF (min. 32 karakter)
SESSION_SECRET="05989abd7d25f5879aff7158a14bc3664bbb42bcea588ac5c6f750e908ce32e9"

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
Pastikan folder `data/` dan `uploads/` tersedia di root repositori:
```bash
# Pastikan folder ada (sudah memiliki .gitkeep)
mkdir -p data uploads
```

### Langkah 3: Sinkronisasi Skema Database & Migrasi Prisma
Jalankan migrasi database SQLite untuk membuat seluruh tabel dan indeks:
```bash
npm run db:migrate
```

*Catatan: Perintah di atas sekaligus menjalankan `prisma generate` untuk memperbarui Prisma Client.*

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
*Output mencakup 16 test cases terotomasi yang mencakup:*
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
