# Laporan Rekapitulasi Masalah & Resolusi Pasca-Deployment (Post-Deployment Issues Report)

**Proyek:** Lost and Found Platform Pelaporan Barang Mahasiswa Universitas Pradita (RPL WEB)  
**Repositori:** [MiftahulMidzanNurBahri/RPL-WEB](https://github.com/MiftahulMidzanNurBahri/RPL-WEB)  
**Lingkungan Produksi:**
- **Frontend SPA (Vercel):** [https://rpl-web-frontend-miftahul-midzan-nur-bahri.vercel.app](https://rpl-web-frontend-miftahul-midzan-nur-bahri.vercel.app)
- **Backend API (Vercel):** [https://rpl-web-api-miftahul-midzan-nur-bahri.vercel.app](https://rpl-web-api-miftahul-midzan-nur-bahri.vercel.app)
- **Database (Supabase PostgreSQL):** `aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres` (Tenant: `gjcfexztebhcyulixzfq`)

---

## Ringkasan Eksekutif

Dalam rangka memenuhi penugasan rekayasa perangkat lunak pasca-deployment ke platform *cloud serverless* (Vercel) dan *managed database* (Supabase PostgreSQL), dilakukan serangkaian pengujian terdistribusi (*full-story verification*) yang mencakup integrasi frontend, routing API serverless, database pooling, session management, dan file storage.

Dari pengujian tersebut, teridentifikasi **12 permasalahan teknis/bug** kritis dan arsitektural. Seluruh masalah telah dicatatkan ke **GitHub Issues (#6 hingga #17)** dan diselesaikan secara tuntas (**Status: SOLVED / CLOSED**).

Berikut adalah matriks ringkasan ke-12 isu:

| No | GitHub Issue | Komponen | Ringkasan Permasalahan | Status | Commit / PR Solusi |
|---|---|---|---|:---:|---|
| 1 | [#6](https://github.com/MiftahulMidzanNurBahri/RPL-WEB/issues/6) | Build / CI | Missing `@types/*` saat build Vercel API (`NODE_ENV=production`) | **SOLVED** | `1677b0d` |
| 2 | [#7](https://github.com/MiftahulMidzanNurBahri/RPL-WEB/issues/7) | Serverless Entry | `STATIC_BUILD_NO_OUT_DIR` dan absennya handler serverless Vercel | **SOLVED** | `7cb0062` |
| 3 | [#8](https://github.com/MiftahulMidzanNurBahri/RPL-WEB/issues/8) | TypeScript / API | Callable type mismatch import CJS/ESM (`rateLimit`, `helmet`) | **SOLVED** | `44bd8ab` |
| 4 | [#9](https://github.com/MiftahulMidzanNurBahri/RPL-WEB/issues/9) | Frontend SPA | HTTP 404 NOT_FOUND saat refresh halaman rute klien (`/items`, `/login`) | **SOLVED** | `c05cd07` |
| 5 | [#10](https://github.com/MiftahulMidzanNurBahri/RPL-WEB/issues/10) | Deployment / Sec | Vercel Team SSO deployment protection memblokir akses publik API | **SOLVED** | Config API Vercel |
| 6 | [#11](https://github.com/MiftahulMidzanNurBahri/RPL-WEB/issues/11) | Rate Limit / Proxy | `ValidationError: ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` | **SOLVED** | `4249b93` |
| 7 | [#12](https://github.com/MiftahulMidzanNurBahri/RPL-WEB/issues/12) | Auth / Session | Cross-origin cookie drop & gagal login ("Silakan masuk untuk melanjutkan") | **SOLVED** | `0e9ffdf` |
| 8 | [#13](https://github.com/MiftahulMidzanNurBahri/RPL-WEB/issues/13) | Database / Prisma | `DatabaseNotReachable P1001` akibat IPv6-only Supabase direct host | **SOLVED** | Supabase Pooler Config |
| 9 | [#14](https://github.com/MiftahulMidzanNurBahri/RPL-WEB/issues/14) | Pooler Routing | `(ENOTFOUND) tenant/user not found` akibat cluster routing `aws-0` vs `aws-1` | **SOLVED** | Supabase Pooler Config |
| 10 | [#15](https://github.com/MiftahulMidzanNurBahri/RPL-WEB/issues/15) | Health Check | HTTP 500 crash pada health check API saat transient latency DB | **SOLVED** | `4249b93` |
| 11 | [#16](https://github.com/MiftahulMidzanNurBahri/RPL-WEB/issues/16) | Database Schema | Inkompatibilitas migrasi SQLite pada Supabase PostgreSQL | **SOLVED** | `e156edf` |
| 12 | [#17](https://github.com/MiftahulMidzanNurBahri/RPL-WEB/issues/17) | Storage / Media | Upload dan akses foto barang mengembalikan HTTP 403 Forbidden | **SOLVED** | Supabase Storage Config |

---

## Rincian Masalah, Akar Penyebab, dan Solusi Teknis

### Issue #6: Missing TypeScript declaration files in production Vercel build
- **Issue URL:** [#6](https://github.com/MiftahulMidzanNurBahri/RPL-WEB/issues/6)
- **Komponen:** `apps/api/package.json`
- **Gejala / Error:** Build serverless di Vercel gagal dengan pesan error:
  ```
  error TS7016: Could not find a declaration file for module 'cookie-parser'.
  error TS7016: Could not find a declaration file for module 'cors'.
  ```
- **Akar Penyebab:** Di lingkungan Vercel, variabel `NODE_ENV=production` dipasang secara bawaan, sehingga `npm install` melewati paket-paket di dalam `devDependencies`. Akibatnya dependensi tipe `@types/*` dan `typescript` tidak terpasang saat `tsc` dijalankan.
- **Solusi:** Memindahkan dependensi type declaration (`@types/cookie-parser`, `@types/cors`, `@types/express`, `@types/node`, `@types/supertest`) dan `typescript` ke bagian `dependencies` di `apps/api/package.json`.
- **Commit Referensi:** `1677b0d`

---

### Issue #7: STATIC_BUILD_NO_OUT_DIR and missing serverless entrypoint for Express API
- **Issue URL:** [#7](https://github.com/MiftahulMidzanNurBahri/RPL-WEB/issues/7)
- **Komponen:** `apps/api/api/index.ts`, `apps/api/vercel.json`, `apps/api/src/index.ts`
- **Gejala / Error:** Deployment API Vercel gagal dengan kode:
  ```
  Error: STATIC_BUILD_NO_OUT_DIR: No Output Directory named "A" or "public" found.
  ```
- **Akar Penyebab:** Aplikasi Express API dibangun sebagai aplikasi server monolitik (`server.listen(port)`), bukan sebagai AWS Lambda / Vercel Serverless Function, dan tidak memiliki `api/index.ts` atau `vercel.json` untuk konfigurasi runtime `@vercel/node`.
- **Solusi:** 
  1. Membuat handler serverless Vercel `apps/api/api/index.ts` yang mengekspor handler Express.
  2. Menambahkan konfigurasi `apps/api/vercel.json` dengan route rewrite ke `api/index.ts`.
  3. Memisahkan `createApp()` di `src/app.ts` dengan listener lokal di `src/index.ts` agar kompatibel untuk lokal maupun serverless.
- **Commit Referensi:** `7cb0062`

---

### Issue #8: TypeScript callable type mismatch for rateLimit and helmet imports
- **Issue URL:** [#8](https://github.com/MiftahulMidzanNurBahri/RPL-WEB/issues/8)
- **Komponen:** `apps/api/src/app.ts`
- **Gejala / Error:** Kompilasi TypeScript gagal pada saat build production:
  ```
  error TS2349: This expression is not callable.
  Type 'typeof import("express-rate-limit")' has no call signatures.
  ```
- **Akar Penyebab:** Perbedaan resolusi modul CommonJS vs ES Modules pada `esModuleInterop` antara versi TypeScript lokal dan Vercel builder untuk pustaka `express-rate-limit` dan `helmet`.
- **Solusi:** Menggunakan named import `{ rateLimit }` untuk `express-rate-limit` dan casting tipe yang aman untuk middleware `helmet`.
- **Commit Referensi:** `44bd8ab`

---

### Issue #9: HTTP 404 NOT_FOUND on page refresh for React SPA client routes
- **Issue URL:** [#9](https://github.com/MiftahulMidzanNurBahri/RPL-WEB/issues/9)
- **Komponen:** `apps/web/vercel.json`
- **Gejala / Error:** Navigasi di dalam aplikasi berjalan lancar, namun ketika halaman seperti `/items`, `/items/new`, atau `/login` di-refresh (F5) langsung dari browser, Vercel merespon dengan:
  ```
  404 NOT_FOUND: The page could not be found.
  ```
- **Akar Penyebab:** React Router mengandalkan HTML5 History API di sisi peramban. Web server statis Vercel mencari berkas fisik `items.html` yang tidak ada pada direktori build `dist`.
- **Solusi:** Mengonfigurasi Single Page Application routing rewrite di `apps/web/vercel.json`:
  ```json
  {
    "rewrites": [
      { "source": "/(.*)", "destination": "/index.html" }
    ]
  }
  ```
- **Commit Referensi:** `c05cd07`

---

### Issue #10: Vercel Team SSO deployment protection blocking public and automated API access
- **Issue URL:** [#10](https://github.com/MiftahulMidzanNurBahri/RPL-WEB/issues/10)
- **Komponen:** Konfigurasi Proyek Vercel (`rpl-web-api` & `rpl-web-frontend`)
- **Gejala / Error:** Permintaan HTTP ke endpoint frontend dan backend dialihkan (*HTTP 302 Redirect*) ke halaman otentikasi login tim Vercel (`https://vercel.com/login?next=...`), sehingga aplikasi web publik dan integrasi API terblokir.
- **Akar Penyebab:** Fitur *Deployment Protection (Vercel Authentication / SSO)* aktif secara otomatis pada ruang kerja tim di Vercel.
- **Solusi:** Memperbarui konfigurasi proyek Vercel melalui Vercel API Management untuk menonaktifkan *SSO Protection* (`ssoProtection: null`) pada target *production* dan *preview*, sehingga URL dapat diakses secara publik.
- **Commit Referensi:** Konfigurasi Vercel Project Settings

---

### Issue #11: ValidationError ERR_ERL_UNEXPECTED_X_FORWARDED_FOR on reverse proxy requests
- **Issue URL:** [#11](https://github.com/MiftahulMidzanNurBahri/RPL-WEB/issues/11)
- **Komponen:** `apps/api/src/app.ts`
- **Gejala / Error:** Permintaan API menghasilkan HTTP 500 Internal Server Error dengan log:
  ```
  ValidationError: ERR_ERL_UNEXPECTED_X_FORWARDED_FOR: The X-Forwarded-For header was set but express-rate-limit was not configured to trust reverse proxies.
  ```
- **Akar Penyebab:** Karena backend berjalan di balik reverse proxy Vercel Edge Network, header `X-Forwarded-For` disuntikkan secara otomatis, sementara Express belum dikonfigurasi `trust proxy`.
- **Solusi:** 
  1. Menambahkan `app.set("trust proxy", 1);` pada aplikasi Express.
  2. Menambahkan opsi `validate: { xForwardedForHeader: false }` pada konfigurasi `rateLimit`.
- **Commit Referensi:** `4249b93`

---

### Issue #12: Cross-origin cookie dropping and CSRF token mismatch between frontend and API
- **Issue URL:** [#12](https://github.com/MiftahulMidzanNurBahri/RPL-WEB/issues/12)
- **Komponen:** `apps/web/vercel.json`, `apps/web/.env.production`
- **Gejala / Error:** Pengguna berhasil login (input email dan kata sandi benar), namun pada halaman berikutnya muncul pesan error merah:
  ```
  Silakan masuk untuk melanjutkan.
  ```
- **Akar Penyebab:** Frontend dan backend berada pada dua origin Vercel yang berbeda (`rpl-web-frontend-*.vercel.app` dan `rpl-web-api-*.vercel.app`). Atribut cookie keamanan tinggi `__Host-` dan `SameSite=Lax` menolak penyimpanan/pengiriman cookie otentikasi sesi lintas subdomain (*cross-origin cookie drop*).
- **Solusi:**
  1. Mengatur `VITE_API_URL=""` agar peramban memanggil API secara relatif (`/api/...`).
  2. Menambahkan *reverse proxy rewrite* pada Vercel edge di `apps/web/vercel.json`:
     ```json
     {
       "source": "/api/:path*",
       "destination": "https://rpl-web-api-miftahul-midzan-nur-bahri.vercel.app/api/:path*"
     }
     ```
  Dengan konfigurasi ini, seluruh cookie dan CSRF token dikelola sebagai *first-party/same-origin* tanpa pemblokiran browser.
- **Commit Referensi:** `0e9ffdf`

---

### Issue #13: DatabaseNotReachable P1001 due to IPv6-only Supabase direct host in Lambda
- **Issue URL:** [#13](https://github.com/MiftahulMidzanNurBahri/RPL-WEB/issues/13)
- **Komponen:** Konfigurasi Lingkungan `DATABASE_URL` di Vercel API
- **Gejala / Error:** Prisma melempar error koneksi database:
  ```
  PrismaClientInitializationError: Can't reach database server at `db.gjcfexztebhcyulixzfq.supabase.co:5432` (P1001)
  ```
- **Akar Penyebab:** Host direct connection Supabase (`db.[ref].supabase.co`) hanya mengikat alamat IPv6 (AAAA record). Lingkungan AWS Lambda / Vercel Serverless Function tidak memiliki rute keluar (*egress*) native IPv6, sehingga koneksi direct gagal total.
- **Solusi:** Mengganti connection string `DATABASE_URL` ke Supabase Supavisor Connection Pooler yang mendukung jaringan IPv4 pada port `6543` dengan flag `?pgbouncer=true`.
- **Commit Referensi:** Konfigurasi Vercel Environment Variables

---

### Issue #14: Supavisor pooler (ENOTFOUND) tenant/user not found due to wrong cluster routing
- **Issue URL:** [#14](https://github.com/MiftahulMidzanNurBahri/RPL-WEB/issues/14)
- **Komponen:** Konfigurasi Lingkungan `DATABASE_URL` & `DIRECT_URL`
- **Gejala / Error:** Koneksi pooler PostgreSQL ditolak dengan pesan:
  ```
  ClientHandler: (ENOTFOUND) tenant/user postgres.gjcfexztebhcyulixzfq not found
  ```
- **Akar Penyebab:** Format pooler standar yang diasumsikan mengarah ke `aws-0`, padahal infrastruktur region Seoul (`ap-northeast-2`) Supabase menempatkan cluster tenant pada `aws-1-ap-northeast-2.pooler.supabase.com`.
- **Solusi:** Menggunakan host pooler yang tepat:
  ```
  DATABASE_URL="postgresql://postgres.gjcfexztebhcyulixzfq:[PASSWORD]@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
  DIRECT_URL="postgresql://postgres.gjcfexztebhcyulixzfq:[PASSWORD]@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"
  ```
- **Commit Referensi:** Konfigurasi Vercel Environment Variables

---

### Issue #15: Health check endpoint returning HTTP 500 on transient database disconnection
- **Issue URL:** [#15](https://github.com/MiftahulMidzanNurBahri/RPL-WEB/issues/15)
- **Komponen:** `apps/api/src/routes/health.ts`
- **Gejala / Error:** Endpoint `/api/health` mengalami crash HTTP 500 jika terjadi latensi cold-start koneksi pooler database.
- **Akar Penyebab:** Eksekusi raw query `prisma.$queryRaw` tidak dibungkus dengan blok penanganan galat (*try/catch*), sehingga kegagalan koneksi sesaat langsung menghentikan proses HTTP handler.
- **Solusi:** Menambahkan blok *try/catch* di sekitar query pemeriksaan database, mengembalikan status `database: "disconnected"` dengan rincian status yang aman tanpa membocorkan kredensial.
- **Commit Referensi:** `4249b93`

---

### Issue #16: SQLite migration incompatibility on Supabase PostgreSQL deployment
- **Issue URL:** [#16](https://github.com/MiftahulMidzanNurBahri/RPL-WEB/issues/16)
- **Komponen:** `apps/api/prisma/migrations/20261111104121_init/migration.sql`
- **Gejala / Error:** Perintah `prisma migrate deploy` gagal pada Supabase dengan galat sintaks:
  ```
  syntax error at or near "AUTOINCREMENT"
  function datetime('now') does not exist
  ```
- **Akar Penyebab:** Migrasi bawaan repositori dihasilkan untuk dialek SQLite, bukan dialek PostgreSQL yang digunakan oleh Supabase.
- **Solusi:** Menyusun migrasi native PostgreSQL dengan tipe data yang sesuai (`VARCHAR`, `TIMESTAMP(3)`, `BOOLEAN`, serial sequence), menerapkan migrasi skema penuh ke Supabase PostgreSQL, dan mengisi data awal (*seed*).
- **Commit Referensi:** `e156edf`

---

### Issue #17: Item photo uploads returning HTTP 403 due to private Supabase bucket policy
- **Issue URL:** [#17](https://github.com/MiftahulMidzanNurBahri/RPL-WEB/issues/17)
- **Komponen:** Konfigurasi Supabase Storage Bucket `item-images`
- **Gejala / Error:** Foto barang yang diunggah pelapor barang hilang/ditemukan tidak tampil di antarmuka web, peramban menerima kode `HTTP 403 Forbidden`.
- **Akar Penyebab:** Bucket penyimpanan berkas `item-images` di Supabase Storage terbuat dengan kebijakan privat (*private bucket*) tanpa hak akses baca publik.
- **Solusi:** Mengatur atribut bucket `item-images` menjadi publik (`public: true`) dan memperbarui *Row Level Security (RLS) storage policy* untuk mengizinkan akses baca publik ke seluruh URL objek gambar barang.
- **Commit Referensi:** Konfigurasi Supabase Storage Policy

---

## Verifikasi Akhir

Seluruh perbaikan telah diuji secara otomatis dan terverifikasi beroperasi dengan normal:
1. **Health Check:** `GET /api/health` mengembalikan `HTTP 200 OK`:
   ```json
   {
     "success": true,
     "data": {
       "status": "ok",
       "service": "Lost and Found API",
       "database": "ok"
     }
   }
   ```
2. **Autentikasi & Sesi Pengguna:** Pengujian alur login dengan akun demo mahasiswa berhasil menerbitkan cookie terenkripsi dan mengakses profil pengguna `/api/auth/me`.
3. **Frontend SPA Navigation:** Pengujian akses langsung dan *page refresh* pada rute `/items`, `/items/new`, dan `/login` berhasil menampilkan komponen React tanpa galat 404.
4. **GitHub Issue Tracking:** Seluruh 12 issue (#6 sampai #17) telah diselesaikan dan ditutup secara resmi melalui Pull Request penutupan isu.

