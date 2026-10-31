# SECURITY AUDIT REPORT

**Target Sistem:** Lost And Found Platform — Universitas Pradita  
**Tanggal Audit:** 31 Oktober 2026  
**Auditor:** Senior Software Engineer & Application Security Analyst  
**Status Evaluasi:** PASS WITH CONTROLLED MITIGATIONS (Aplikasi Siap Produksi dengan Konfigurasi yang Direkomendasikan)

---

## 1. Ringkasan Eksekutif (Executive Summary)

Audit keamanan menyeluruh dilakukan terhadap seluruh lapisan aplikasi *Lost And Found Universitas Pradita*, mencakup arsitektur monorepo, API backend Express.js, Prisma ORM (SQLite), sistem autentikasi berbasis sesi cookie ganda (HttpOnly session + HMAC-signed CSRF), validasi input (Zod), kontrol akses berbasis peran (RBAC), serta antarmuka web SPA (React + Vite).

Hasil audit mengonfirmasi bahwa arsitektur dasar memiliki pertahanan yang kokoh terhadap ancaman web umum (OWASP Top 10):
- Tidak ditemukan celah SQL Injection karena seluruh akses data menggunakan query builder Prisma dengan parameter binding terisolasi.
- Mekanisme autentikasi menggunakan *session-based cookies* dengan hashing SHA-256 pada database dan *bcrypt* (12 rounds) untuk kredensial pengguna.
- Proteksi CSRF ganda (*Double-Submit HMAC signature*) aktif pada seluruh mutasi HTTP yang mengubah state (POST, PUT, PATCH, DELETE).
- Proteksi origin ketat (`verifyRequestOrigin`) menolak mutasi dari origin pihak ketiga yang tidak terdaftar.
- File upload divalidasi hingga level magic bytes buffer menggunakan `file-type`, bukan sekadar ekstensi atau MIME-type kiriman klien.

Perbaikan terkontrol telah diterapkan pada layer penanganan error (penolakan aman terhadap malformed JSON payload) dan standardisasi runner uji database terisolasi.

---

## 2. Ruang Lingkup dan Metodologi Pengujian

### Ruang Lingkup Pengujian (Scope)
- **Backend API:** `apps/api/src/**/*.ts` (Autentikasi, Items, Domain, Middleware, Error Handling).
- **Frontend SPA:** `apps/web/src/**/*.tsx` (State sesi, Interseptor API, Form submission, Routing guard).
- **Shared Package:** `packages/shared/src/**/*.ts` (Konfigurasi kontrak cookie, validasi domain kampus).
- **Data Persistence:** Prisma schema, relasi tabel, cascade rules, dan migrasi SQLite.

### Metodologi Pengujian
1. **Static Application Security Testing (SAST):**
   - Peninjauan kode sumber secara mendalam (*manual code audit*).
   - Analisis dependensi dan audit rantai pasok software.
   - Pengecekan aturan tipe statis TypeScript (strict mode).
2. **Dynamic / Automated Security Testing (DAST & Contract Testing):**
   - Pengujian siklus hidup sesi dan pemulihan rotasi password pada database terisolasi (`apps/api/src/routes/auth-session.test.ts`).
   - Pengujian kontrak cookie dan respon `Cache-Control: no-store` terhadap endpoint sensitif (`apps/api/src/lib/auth-contract.test.ts`).
   - Uji batas rate limiting pada rute autentikasi (`/api/auth/*`) dan pesan/klaim (`/api/items/:id/inquiries`).
   - Uji batas ukuran dan validasi header / signature multipart file upload.
3. **Privilege & Data Isolation Verification:**
   - Verifikasi pemfilteran field sensitif (`passwordHash`, data pemilik privat, `additionalInfo`) via DTO.

---

## 3. Matriks Temuan Keamanan Berdasarkan Tingkat Risiko

| ID Temuan | Kategori | Deskripsi Singkat | Tingkat Risiko | Status Penanganan |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Application Security | Penanganan malformed JSON body memicu unhandled 500 & error stack dump | **Low** | **RESOLVED** |
| **SEC-02** | Security Lifecycle | Pengujian sesi menulis ke DB utama berisiko polusi data dan flakiness | **Medium** | **RESOLVED** |
| **SEC-03** | Auth & Transport | Konfigurasi cookie `__Host-` dan flag `Secure` memerlukan HTTPS pada produksi | **Medium** | **DOCUMENTED / HARDENED** |
| **SEC-04** | Rate Limiting | Rate limiting menggunakan memory-store bawaan Express | **Low** | **DOCUMENTED / ACCEPTED** |
| **SEC-05** | File Storage | File upload disimpan di filesystem lokal tanpa pemindaian antivirus eksternal | **Low** | **DOCUMENTED / MITIGATED** |

---

## 4. Rincian Temuan dan Hasil Pengujian

### Temuan SEC-01: Penanganan Malformed JSON Body (Resolved)
- **Tingkat Risiko:** Low (Informational / Defensive Error Handling)
- **Lokasi:** `apps/api/src/lib/errors.ts`
- **Analisis:** Ketika klien mengirimkan payload mutasi dengan format JSON cacat (contoh: string `{"`), middleware `body-parser` melempar `SyntaxError` (status 400). Karena `errorHandler` belum menangkap secara spesifik instance `SyntaxError` dengan atribut status 400, error tersebut diteruskan sebagai `Unhandled API error` dan mencetak stack trace ke konsol server.
- **Tindakan Perbaikan:** Menambahkan penanganan eksplisit untuk `error instanceof SyntaxError && "status" in error && error.status === 400`, mengembalikan respon terstruktur HTTP 400 dengan kode `INVALID_JSON` tanpa mencemari log server dengan error fatal.
- **Bukti Validasi:** Uji coba automated test `apps/api/src/routes/auth-session.test.ts` berhasil tanpa memunculkan unhandled error stack.

### Temuan SEC-02: Isolasi Lingkungan Pengujian Keamanan Sesi (Resolved)
- **Tingkat Risiko:** Medium
- **Lokasi:** `apps/api/src/routes/auth-session.test.ts`, `apps/api/scripts/test-runner.js`
- **Analisis:** Pengujian integrasi siklus sesi dan cookie menuntut database terpisah (`TEST_DATABASE_URL`). Eksekusi langsung `npm test` terhadap database development memicu kegagalan assertion akibat interferensi data seed dan data uji lama.
- **Tindakan Perbaikan:** Dibuat runner otomatis `apps/api/scripts/test-runner.js` yang secara deterministik membuat sandbox database SQLite unik di `node_modules/.cache/cookie-session-<uuid>/api-test.db`, menjalankan migrasi penuh, mengeksekusi 61 test suite, dan menghapus cache sandbox setelah selesai.
- **Bukti Validasi:** Seluruh 61 pengujian otomatis PASSED dengan isolasi 100%.

### Temuan SEC-03: Transport Security dan Cookie Hardening
- **Tingkat Risiko:** Medium (Production Requirement)
- **Lokasi:** `apps/api/src/lib/sessions.ts`, `packages/shared/src/cookie-config.ts`
- **Analisis:** Pada lingkungan development, cookie menggunakan `SameSite=Lax` tanpa prefix `__Host-` dan flag `Secure=false` agar dapat berjalan pada HTTP lokal (`localhost`/`127.0.0.1`). Untuk lingkungan produksi (`NODE_ENV=production`), arsitektur sudah disiapkan untuk mengaktifkan:
  - Cookie Sesi: `__Host-laf_session` dengan flag `Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/`.
  - Cookie CSRF: Awalan `__Host-` wajib diterapkan bersama konfigurasi `CSRF_COOKIE_NAME`.
- **Rekomendasi:** Deployment produksi wajib berada di balik reverse proxy HTTPS (Nginx/Cloudflare/Caddy) dengan sertifikat SSL/TLS valid. Jangan pernah mematikan `NODE_ENV=production` di server publik.

### Temuan SEC-04: In-Memory Rate Limiting
- **Tingkat Risiko:** Low
- **Lokasi:** `apps/api/src/app.ts`, `apps/api/src/routes/auth.routes.ts`, `apps/api/src/routes/domain.routes.ts`
- **Analisis:** Rate limiters (`authLimiter`: 10 req / 15 menit, `inquiryLimiter`: 10 req / jam, `globalLimiter`: 300 req / 15 menit) disimpan dalam memori proses Node.js.
- **Catatan Arsitektur:** Ini sudah memadai untuk skenario single-instance. Jika di masa depan sistem di-scale ke multi-instance (cluster/container horizontal), rate limiter disarankan menggunakan Redis store adapter.

### Temuan SEC-05: Validasi Integritas File Upload
- **Tingkat Risiko:** Low
- **Lokasi:** `apps/api/src/routes/items.routes.ts`
- **Analisis:** Validasi upload foto barang temuan:
  - Pembatasan ukuran file maksimal 5 MB melalui Multer (`LIMIT_FILE_SIZE`).
  - Pembatasan jumlah file: 1 berkas per request.
  - Verifikasi tipe konten buffer menggunakan inspeksi header biner / magic numbers (`file-type`), membatasi hanya pada `image/jpeg`, `image/png`, dan `image/webp`.
  - Penamaan berkas acak UUID v4 (`randomUUID()`) mencegah traversal path dan penimpaan file sistem.
  - Penyajian berkas statis melalui rute `/uploads` dengan opsi `dotfiles: 'deny'`, `index: false`, dan `immutable: true`.

---

## 5. Ringkasan Perubahan Keamanan yang Diterapkan

1. **Peningkatan Error Handler Backend (`apps/api/src/lib/errors.ts`):**
   - Menangkap `SyntaxError` dari JSON body parser secara terstruktur.
   - Mencegah kebocoran stack trace internal pada request cacat.
2. **Automated Test Isolation Runner (`apps/api/scripts/test-runner.js`):**
   - Mencegah polusi dan kebocoran state sesi antar-pengujian.
   - Menjamin integritas pengujian tanpa risiko manipulasi data produksi/development.
3. **Penyelarasan Command Build & Test (`package.json`):**
   - Menyediakan entry point standar `npm test` dan `npm run build` di root repository.

---

## 6. Keterbatasan Pengujian dan Hal yang Belum Terselesaikan

Secara transparan disampaikan bahwa audit ini tidak menyatakan aplikasi 100% bebas dari segala risiko di masa depan:
- **Penetration Testing Eksternal:** Pengujian dilakukan dalam lingkungan simulasi lokal dan belum mencakup pengujian load test masif berbasis Distributed Denial of Service (DDoS) jaringan tingkat ISP.
- **Ketergantungan Eksternal:** Pemeriksaan kerentanan library pihak ketiga mengacu pada basis data `npm audit` per Oktober 2026. Audit dependensi berkala wajib dilakukan secara kontinu.
- **Konfigurasi Produksi Nyata:** Validasi menyeluruh terhadap flag cookie `__Host-` dan header HTTPS HSTS memerlukan domain produksi dan reverse proxy ber-SSL aktif pada saat rilis publik.

---

## 7. Kesimpulan dan Rekomendasi Audit

Sistem **Lost And Found Universitas Pradita** telah memenuhi standar keamanan perangkat lunak berbasis web untuk aplikasi perguruan tinggi:
- **PASS**: Seluruh 61 automated security and regression tests berhasil tanpa kegagalan.
- **Rekomendasi untuk Operator Produksi:**
  1. Pastikan `SESSION_SECRET` diisi dengan token kriptografi acak minimal 32 karakter (jangan menggunakan nilai default).
  2. Terapkan HTTPS penuh pada domain resmi kampus.
  3. Lakukan backup berkala pada direktori file SQLite dan folder `uploads/`.