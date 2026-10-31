# PANDUAN SAFE LOGGING & TROUBLESHOOTING

Dokumen ini mendefinisikan standar pencatatan aktivitas (*logging*) yang aman, bebas dari kebocoran data sensitif (*Safe Logging Policy*), serta panduan diagnosis dan perbaikan masalah operasional (*Troubleshooting Guide*) pada platform Lost And Found Universitas Pradita.

---

## BAGIAN A: STANDAR SAFE LOGGING

Sistem wajib mematuhi prinsip sanitasi log untuk melindungi data civitas akademika dan integritas sistem:
- **DILARANG KERAS** mencatat kata sandi, hash kata sandi, token mentah sesi, atau signature rahasia.
- **DILARANG KERAS** mencatat string koneksi database yang memuat kredensial, kunci HMAC (`SESSION_SECRET`), atau file path absolut internal server di luar kebutuhan diagnostik terenkapsulasi.
- **DILARANG KERAS** membocorkan nomor telepon, email pribadi, atau nomor identitas mahasiswa (NIM) ke dalam log publik.
- Log harus terstruktur dan menyertakan level signifikansi (`INFO`, `WARN`, `ERROR`), timestamp ISO, komponen terkait, dan konteks penelusuran.

### Contoh Format Safe Log (Data Sintetis)

#### 1. Application Startup (Inisialisasi Server API)
```text
[2026-10-31T08:00:00.120Z] [INFO] [API Server] Lost And Found API listening on http://localhost:3000
[2026-10-31T08:00:00.125Z] [INFO] [Environment] NODE_ENV: development, WEB_ORIGIN: http://localhost:5173
[2026-10-31T08:00:00.130Z] [INFO] [Storage] Upload directory initialized at uploads/
```

#### 2. Database Connection (Koneksi Prisma SQLite)
```text
[2026-10-31T08:00:00.145Z] [INFO] [Database] Prisma client successfully connected to SQLite datasource
[2026-10-31T08:00:00.150Z] [INFO] [Database] Migrations verified; 7 migrations active
```

#### 3. Successful Authentication (Autentikasi Berhasil)
*Catatan: Password tidak pernah dicatat. Hanya ID anonim dan peran yang dicatat.*
```text
[2026-10-31T08:05:22.410Z] [INFO] [Auth] Login successful for user_id: usr_9f81a7b2 (role: student, domain: @student.pradita.ac.id)
[2026-10-31T08:05:22.415Z] [INFO] [Auth] Session created: sess_***7e2b, expires_at: 2026-11-07T08:05:22.415Z
[2026-10-31T08:05:22.418Z] [INFO] [ActivityLog] Action recorded: Memperbarui waktu login terakhir
```

#### 4. Failed Authentication (Percobaan Autentikasi Gagal)
*Catatan: Kata sandi yang dicoba tidak dicatat. Alasan kegagalan dicatat secara aman.*
```text
[2026-10-31T08:12:05.882Z] [WARN] [Auth] Login rejected: Invalid credentials for target user domain @student.pradita.ac.id from IP 127.0.0.1
[2026-10-31T08:12:05.885Z] [WARN] [Security] Remaining login attempts before rate limit: 8
```

#### 5. API Request & Rate Limiting
```text
[2026-10-31T08:15:30.010Z] [INFO] [Router] GET /api/items?status=lost&category=Elektronik 200 OK (duration: 14ms)
[2026-10-31T08:15:45.302Z] [WARN] [RateLimiter] Rate limit warning for client IP 127.0.0.1 on /api/auth/login: limit exceeded (status: 429)
```

#### 6. Validation Error (Kesalahan Validasi Data Klien)
```text
[2026-10-31T08:20:11.750Z] [WARN] [Validation] POST /api/items rejected with 400 VALIDATION_ERROR: fields=[meetUpTime: Waktu penyerahan/pertemuan harus antara 09:00 dan 19:00 WIB]
```

#### 7. Internal Server Error (Safe Sanitized Fallback)
```text
[2026-10-31T08:25:01.320Z] [ERROR] [Server] Request ID req_c19a: Internal processing error occurred. Sanitized response returned to client with code INTERNAL_ERROR. Stack trace retained only in secure server diagnostic storage.
```

---

## BAGIAN B: ANALISIS ERROR & DIAGNOSIS OPERASIONAL

Berikut adalah katalog error sistem, penyebab potensial, dampak, serta langkah diagnosis dan tindakan perbaikannya:

### 1. `INVALID_JSON` (HTTP 400)
- **Pesan:** `"Format payload JSON tidak valid."`
- **Penyebab:** Klien mengirim body permintaan mutasi dengan format JSON rusak/terpotong (sintaks cacat).
- **Komponen:** `apps/api/src/lib/errors.ts`, `express.json()` middleware.
- **Dampak:** Permintaan ditolak dengan aman tanpa menyebabkan server crash atau memory leak.
- **Langkah Diagnosis:** Periksa payload request pada inspect network peramban atau script klien. Pastikan header `Content-Type: application/json` digunakan bersama serialization `JSON.stringify()`.
- **Tindakan Perbaikan:** Perbaiki format request dari frontend/klien.

### 2. `AUTH_REQUIRED` / `SESSION_EXPIRED` (HTTP 401)
- **Pesan:** `"Silakan masuk untuk melanjutkan."` / `"Sesi berakhir. Silakan masuk kembali."`
- **Penyebab:** Cookie sesi tidak disertakan, cookie telah melewati batas kedaluwarsa 7 hari, atau pengguna telah melakukan logout dari perangkat lain.
- **Komponen:** `apps/api/src/middleware/auth.ts`, `apps/web/src/auth/session-state.ts`.
- **Dampak:** Akses rute terlindungi dibatasi. Frontend mengalihkan pengguna ke halaman login secara terkontrol.
- **Langkah Diagnosis:** Periksa nilai cookie sesi di tab Storage DevTools. Verifikasi keberadaan token pada tabel `Session` di database SQLite.
- **Tindakan Perbaikan:** Lakukan login ulang menggunakan akun resmi Pradita.

### 3. `CSRF_INVALID` (HTTP 403)
- **Pesan:** `"Token keamanan permintaan tidak valid."`
- **Penyebab:** Header `x-csrf-token` tidak cocok dengan nilai terdekripsi/HMAC dari cookie `laf_csrf`, atau cookie CSRF terhapus.
- **Komponen:** `apps/api/src/middleware/security.ts`, `apps/web/src/api/client.ts`.
- **Dampak:** Operasi mutasi data (create, update, delete) digagalkan demi mencegah serangan Cross-Site Request Forgery.
- **Langkah Diagnosis:** Periksa apakah klien peramban mengizinkan pembacaan cookie `laf_csrf` (non-HttpOnly) dan menyertakan header `x-csrf-token` pada fetch POST/PUT/DELETE.
- **Tindakan Perbaikan:** Muat ulang halaman untuk menyinkronkan token keamanan atau panggil `GET /api/auth/me`.

### 4. `INVALID_ORIGIN` (HTTP 403)
- **Pesan:** `"Permintaan berasal dari origin yang tidak diizinkan."`
- **Penyebab:** Header `Origin` pada HTTP request tidak sesuai dengan konfigurasi `WEB_ORIGIN` atau whitelist lokal (`localhost`/`127.0.0.1`).
- **Komponen:** `apps/api/src/middleware/security.ts`.
- **Dampak:** Permintaan mutasi dari situs asing atau domain tidak sah diblokir seketika.
- **Langkah Diagnosis:** Periksa nilai `WEB_ORIGIN` di file `.env` dan bandingkan dengan origin peramban klien.
- **Tindakan Perbaikan:** Sesuaikan variabel `WEB_ORIGIN` di `.env` agar sesuai dengan domain frontend yang digunakan.

### 5. `OUTSIDE_OPERATING_HOURS` (HTTP 400)
- **Pesan:** `"Waktu penyerahan/pertemuan harus antara 09:00 dan 19:00 WIB."`
- **Penyebab:** Pengguna mencoba membuat laporan barang temuan dengan waktu serah-terima di luar jam operasional kampus Pradita.
- **Komponen:** `apps/api/src/routes/items.routes.ts`.
- **Dampak:** Formulir pelaporan ditolak.
- **Langkah Diagnosis:** Periksa nilai input waktu (`meetUpTime`) yang dikirimkan.
- **Tindakan Perbaikan:** Pilih jam antara pukul 09:00 hingga 19:00 WIB.

### 6. `RATE_LIMITED` (HTTP 429)
- **Pesan:** `"Terlalu banyak percobaan. Coba kembali beberapa menit lagi."`
- **Penyebab:** Klien melampaui ambang batas request (10 percobaan login per 15 menit atau 10 pesan inquiry per jam).
- **Komponen:** `apps/api/src/routes/auth.routes.ts`, `apps/api/src/routes/domain.routes.ts`.
- **Dampak:** Request diblokir sementara untuk melindungi sistem dari serangan brute-force atau spamming.
- **Langkah Diagnosis:** Periksa header respon `RateLimit-Reset` atau `Retry-After`.
- **Tindakan Perbaikan:** Tunggu hingga jendela waktu rate limit berakhir sebelum mencoba kembali.

### 7. `INSTITUTION_EMAIL_REQUIRED` (HTTP 400)
- **Pesan:** `"Gunakan email resmi Universitas Pradita."`
- **Penyebab:** Registrasi akun menggunakan email publik (seperti @gmail.com atau @yahoo.com).
- **Komponen:** `apps/api/src/routes/auth.routes.ts`.
- **Dampak:** Akun tidak dapat dibuat.
- **Langkah Diagnosis:** Periksa domain email yang diisi pada formulir registrasi.
- **Tindakan Perbaikan:** Gunakan akhiran `@student.pradita.ac.id` untuk mahasiswa atau `@pradita.ac.id` untuk dosen/staf.

---

## BAGIAN C: PERBAIKAN PENANGANAN ERROR YANG DILAKUKAN

1. **Pencegahan Unhandled SyntaxError pada Parser JSON:**
   - **Sebelum:** Pengiriman payload mutasi berupa JSON malformed menghasilkan stack trace unhandled error di konsol dan error HTTP 500.
   - **Sesudah:** Ditambahkan penanganan khusus pada `errorHandler` Express untuk `SyntaxError` (status 400), merespon dengan status 400 dan kode error `INVALID_JSON`.
2. **Pembersihan File Sampah Otomatis Saat Transaksi Gagal:**
   - Pada `POST /api/items` dan `PUT /api/items/:id`, jika penyimpanan record database gagal setelah file gambar diunggah ke disk, blok `catch` secara otomatis memanggil `removeImage()` untuk menghapus file orphan agar kapasitas penyimpanan server tetap terjaga.
3. **Penyelarasan Respon Cache Control:**
   - Endpoint autentikasi dan error sesi/CSRF secara konsisten menyertakan header `Cache-Control: no-store` untuk mencegah browser/proxy menyimpan data sesi sensitif.