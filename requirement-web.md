Build a full-stack web application named **Lost And Found — Platform Pelaporan Barang Hilang & Ditemukan Mahasiswa Universitas Pradita**.

Purpose:
Menyediakan platform terpusat bagi mahasiswa aktif, dosen, staf akademik, serta petugas keamanan dan fasilitas Universitas Pradita untuk melaporkan, mencari, mencocokkan, dan mengembalikan barang yang hilang atau ditemukan di area kampus. Platform mengelola katalog publik, komunikasi klaim yang menjaga privasi, verifikasi kepemilikan, serta status penyelesaian laporan.

Use this stack:
* Frontend: React, TypeScript, Vite, dan CSS Modules/CSS variables; SPA dengan React Router.
* Backend: Node.js 20+ dan TypeScript dengan Express.
* Database: SQLite sebagai database relasional utama, disimpan sebagai file persisten di server.
* ORM: Prisma ORM dengan Prisma Migrate dan Prisma Client.
* API style: REST API berformat JSON dengan prefix `/api`; gunakan camelCase untuk properti JSON.
* Validation: Zod untuk validasi request dan response di batas API.
* Authentication: sesi server-side dengan token acak pada cookie `HttpOnly`, `SameSite=Lax`, dan `Secure` di production; simpan hash token pada tabel Session, bukan token mentah.
* Passwords: Argon2id atau bcrypt dengan parameter aman; jangan pernah menyimpan kata sandi plaintext.
* Image uploads: multipart upload ke penyimpanan filesystem lokal dengan nama file acak; simpan path relatif di SQLite, bukan data URL/base64. Batasi ukuran, MIME type, dan ekstensi.
* Tooling: npm workspaces, Git, `.env.example`, dan Docker Compose opsional untuk menjalankan aplikasi; SQLite tidak memerlukan database server terpisah. Node.js 20+ memenuhi panduan Node.js 18+ pada README.

Code rules:
* Gunakan TypeScript strict mode di frontend dan backend; pisahkan komponen, views, domain logic, API, dan persistence layer.
* Gunakan PascalCase untuk komponen React, class, type, interface, dan model Prisma; gunakan camelCase untuk variabel, fungsi, field, serta JSON properties.
* Hindari komentar yang tidak diperlukan dan jaga baris kode di bawah 150 karakter jika praktis.
* Semua validasi, otorisasi, dan aturan domain wajib ditegakkan di backend; validasi frontend hanya untuk pengalaman pengguna.
* Semua waktu disimpan sebagai UTC ISO-8601; tanggal dan jam kejadian juga tersedia untuk ditampilkan dalam zona waktu lokal kampus.
* Batasi akses untuk komunitas Universitas Pradita. Mahasiswa menggunakan `@student.pradita.ac.id`; dosen/staf menggunakan `@pradita.ac.id`. Pemeriksaan domain saja bukan bukti bahwa seseorang benar-benar civitas aktif; jangan menyebut akun telah terverifikasi institusi tanpa integrasi SSO/email verification.
* Jangan menyimpan session token, password, atau data rahasia dalam `localStorage`; gunakan cookie sesi dan API backend.
* Lakukan logging tanpa kata sandi, token, isi ciri rahasia, atau data kontak pribadi yang tidak diperlukan.

Main entities:
1. User
   * `id` (CUID/string primary key), `name`, `email` (unik dan lowercase), `studentNumber` (opsional, unik bila diisi), `phone`, `role`, `avatarInitials`, `bio`, `passwordHash`, `createdAt`, `updatedAt`, `lastLoginAt`.
   * Role berupa string tervalidasi: `student`, `faculty_staff`, atau `campus_staff`; registrasi publik tidak boleh memilih role staf secara bebas. Role staf dibuat melalui seed/provisioning tepercaya.
2. Item
   * `id`, `reporterId` (FK User), `title`, `category`, `reportType`, `status`, `description`, `additionalInfo`, `location`, `incidentDate`, `incidentTime`, `imagePath`, `createdAt`, `updatedAt`, `returnedAt`, `deletedAt`.
   * `reportType`: `lost` atau `found`; `status`: `lost`, `found`, atau `returned`. Saat dibuat, status sama dengan reportType. Status `returned` menandai penyelesaian dan reportType tetap menyimpan jenis laporan asal.
   * `additionalInfo` adalah ciri rahasia untuk verifikasi klaim, tidak pernah dikirim pada response katalog/detail publik.
3. Inquiry
   * `id`, `itemId` (FK Item), `senderId` (FK User), `recipientId` (FK User/pelapor barang), `kind`, `message`, `status`, `createdAt`, `updatedAt`.
   * `kind`: `inquiry` atau `claim`; `status`: `pending`, `replied`, atau `resolved`. Simpan identitas pengirim melalui relasi User; jangan menyalin kontak ke katalog publik.
4. ActivityLog
   * `id`, `userId` (FK User), `itemId` (FK Item opsional), `action`, `createdAt`, `metadata` (JSON opsional dan tanpa data rahasia).
   * Catat aktivitas penting seperti membuat/mengubah laporan, mengirim inquiry, dan mengubah status; pengguna hanya dapat melihat log miliknya.
5. Session
   * `id`, `userId` (FK User), `tokenHash` (unik), `expiresAt`, `createdAt`, `lastSeenAt`.
   * Mendukung autentikasi cookie dan pencabutan sesi saat logout atau penggantian kata sandi.

Database rules:
* Definisikan relasi Prisma: User 1:N Item sebagai reporter; User 1:N Inquiry sebagai sender dan recipient; Item 1:N Inquiry; User 1:N ActivityLog; Item 0..1:N ActivityLog; User 1:N Session.
* Gunakan foreign key SQLite dan `onDelete: Restrict` untuk User yang memiliki laporan/riwayat. Hapus laporan melalui soft delete (`deletedAt`) agar jejak inquiry/audit tidak hilang. Akun tidak menyediakan hard-delete melalui API.
* Tambahkan indeks pada `Item(status, reportType, createdAt)`, `Item(category, location)`, `Item(reporterId, status)`, `Inquiry(itemId, createdAt)`, `ActivityLog(userId, createdAt)`, dan `Session(tokenHash, expiresAt)`; email dinormalisasi lowercase dan unik.
* SQLite tidak mendukung enum Prisma secara konsisten: simpan role/status/kind sebagai `String`, validasi nilai yang diperbolehkan di aplikasi, dan tambahkan CHECK constraints pada migration SQL bila sesuai dengan Prisma/migration workflow.
* Validasi panjang maksimum: nama 120 karakter, email 254, telepon 32, judul 160, lokasi 160, deskripsi 3.000, ciri rahasia 1.000, dan pesan inquiry 2.000. Tolak field tidak dikenal, string kosong untuk field wajib, tanggal tidak valid/masa depan yang tidak masuk akal, serta nilai kategori/status di luar daftar.
* Kategori laporan harus berasal dari: Elektronik & Gadget; KTM & Dompet; Kunci Kendaraan; Buku & Dokumen Kuliah; Pakaian & Jaket Almamater; Kacamata; Lainnya.
* Lokasi harus berupa salah satu zona kampus yang didukung: Perpustakaan Pradita; Laboratorium Komputer & Desain; Ruang Kuliah Teori Lantai 2-5; Student Lounge/Kantin Pradita; Fasilitas Olahraga; Area Parkir; Lobby Utama. Simpan label lokasi; validasi terhadap daftar konfigurasi.
* Terapkan `createdAt`/`updatedAt` secara konsisten, transaksi untuk perubahan status beserta ActivityLog, dan pagination untuk katalog, inquiry, serta aktivitas.
* Gunakan migration files yang dilacak Git; perintah wajib tersedia untuk `prisma migrate dev`, `prisma migrate deploy`, dan seed. Seed harus idempotent dan tidak mereset database atau menghapus laporan yang ada.
* Simpan SQLite DB dan uploads di volume/direktori persisten yang tidak masuk Git; sediakan backup/restore sederhana dan dokumentasikan bahwa satu file SQLite cocok untuk deployment satu host dengan volume persisten.
* Data lama `localStorage` dari README tidak dimigrasikan otomatis kecuali disediakan fitur import yang eksplisit; jangan menganggap key `laf_*` sebagai tabel database.

Backend features:
1. Autentikasi: registrasi dengan email `@student.pradita.ac.id` atau `@pradita.ac.id`; tetapkan role otomatis berdasarkan domain dan jangan sediakan pilihan role bebas. Role `campus_staff` hanya dibuat melalui seed/provisioning tepercaya. Sediakan login/logout, endpoint current user, sesi kedaluwarsa, rate limit login, serta penggantian kata sandi. Domain check tidak mengklaim verifikasi afiliasi kampus.
2. Otorisasi: katalog/detail publik hanya berisi field aman; aksi mengelola Item hanya untuk reporter pemiliknya, inquiry hanya untuk pengirim/penerima terkait, dan ciri rahasia hanya dapat dibaca reporter pemilik laporan. Pengguna tidak boleh menetapkan `reporterId`, role, atau status penyelesaian orang lain.
3. Item CRUD: buat laporan `lost`/`found`, edit laporan milik sendiri, soft delete, detail aman, dan tandai `returned`. Laporan returned dikeluarkan dari pencocokan aktif.
4. Pencarian katalog: pencarian debounced secara client-side dan query server berdasarkan title/description/location; dukung filter report type/status/kategori/lokasi, urutan terbaru/terlama, pagination, dan total hasil.
5. Upload gambar: validasi MIME berdasarkan isi file, ukuran maksimal 5 MB, hanya JPEG/PNG/WebP, nama file acak, cegah path traversal, dan hapus file orphan secara terkendali. Tampilkan 8 preset demo sebagai aset statis: Laptop, Earphone, Kunci Motor, Dompet, Ransel, Kacamata, Tumbler, Kalkulator Ilmiah.
6. Match Engine deterministik: bandingkan hanya pasangan laporan aktif dengan `reportType` berlawanan; kategori cocok +40, token kata kunci judul/deskripsi +20 sampai +40, lokasi cocok +25; rekomendasikan skor minimal 30. Hindari pencocokan item yang sama atau milik reporter yang sama bila relevan. Kembalikan skor dan alasan yang aman, bukan ciri rahasia.
7. Inquiry/klaim: kirim pesan terkait Item kepada pelapor tanpa mengekspos nomor telepon; validasi penerima, status item, batas panjang, serta pembatasan frekuensi. Penerima dapat melihat pesan dan menandai selesai/dibalas; jangan mengirim ciri rahasia dalam respons kepada pengklaim.
8. Dashboard beranda: hitung laporan lost aktif, found aktif, dan returned; laporan terbaru. Dashboard personal: hitung lost/found milik pengguna, rekomendasi match, dan laporan selesai.
9. Profil dan aktivitas: baca/perbarui nama, telepon, dan bio; tampilkan avatar inisial/joined date; daftar ActivityLog milik pengguna dengan pagination.
10. Keamanan API: HTTPS di production, CORS dibatasi ke origin frontend, Helmet, rate limiting, validasi body/query, error response konsisten, proteksi CSRF untuk mutasi cookie-session, dan jangan membocorkan stack trace ke client.

Frontend pages:
1. Beranda: hero dan tombol lapor kehilangan/temuan, pencarian, statistik lost aktif/found aktif/returned, laporan terbaru, serta panduan alur Laporkan, Cari & Cocokkan, Verifikasi, Serah Terima.
2. Katalog/pencarian: live debounced search untuk nama, deskripsi, dan lokasi; segmented filter semua/lost/found; filter kategori/lokasi; urutan terbaru/terlama; active filter chips dan reset; paginasi serta empty/loading/error states.
3. Form laporan: pilihan lost/found; judul, kategori, lokasi, tanggal/jam kejadian, deskripsi, ciri rahasia, foto upload/preset; data kontak diambil dari profil; validasi dan pemberitahuan potensi match.
4. Detail item: foto resolusi tinggi dengan fallback, ID referensi, kategori, lokasi, waktu, deskripsi publik, panduan verifikasi, inquiry/claim form; tombol edit/hapus/mark returned hanya bagi reporter.
5. Dashboard pengguna: metrik lost/found pribadi, rekomendasi, riwayat selesai; tab laporan dengan filter semua/aktif/selesai; rekomendasi side-by-side dengan persentase/skor dan alasan kecocokan.
6. Profil dan aktivitas: profil akademik, role/NIM, avatar inisial, joined date, edit bio/telepon, ganti kata sandi, dan timeline aktivitas.
7. Autentikasi: login, registrasi, logout, validasi dan pesan error berbahasa Indonesia; tombol akses demo hanya pada environment development/demo.

UI requirements:
* Semua label, tombol, pesan sukses/error, validasi, konfirmasi, dan empty state menggunakan Bahasa Indonesia.
* Pertahankan bahasa visual minimalis institusional pada README: Plus Jakarta Sans, layout responsif untuk desktop/tablet/mobile, dan drawer navigasi mobile.
* Gunakan CSS custom properties/design tokens: background `#ffffff`, `#f8fafc`, `#f1f5f9`; teks `#0f172a`, `#334155`; aksen `#2563eb`, hover `#1d4ed8`.
* Badge status: Lost merah (`#fef2f2`, `#991b1b`, `#fecaca`); Found hijau (`#f0fdf4`, `#166534`, `#bbf7d0`); Returned slate (`#f8fafc`, `#475569`, `#cbd5e1`).
* Gunakan tabel/kartu/form yang sederhana, dialog konfirmasi sebelum hapus, toast feedback, dan loading/empty/error states. Jangan tambahkan chart pada versi awal.
* Jangan tampilkan telepon/email personal atau `additionalInfo` secara terbuka di katalog/detail publik. Gunakan inquiry sebagai jalur kontak.
* Demo seed development: Alex Rivera (`alex.rivera@student.pradita.ac.id`) dan Dr. Sarah Jenkins (`sarah.jenkins@pradita.ac.id`), password `password123` hanya untuk development. Jangan aktifkan kredensial tetap tersebut di production.

Required API routes:
* `POST /api/auth/register` — registrasi dengan email domain mahasiswa atau dosen/staf; role ditetapkan server berdasarkan domain.
* `POST /api/auth/login`
* `POST /api/auth/logout`
* `GET /api/auth/me`
* `PUT /api/auth/password`
* `GET /api/items` — query `q`, `reportType`, `status`, `category`, `location`, `sort`, `page`, `pageSize`.
* `POST /api/items` — authenticated; multipart form untuk optional image.
* `GET /api/items/:id` — response publik tanpa `additionalInfo`, kontak pribadi, atau data sensitif.
* `PUT /api/items/:id` — reporter only; optional image replacement.
* `DELETE /api/items/:id` — reporter only; soft delete.
* `POST /api/items/:id/return` — reporter only; set status `returned` dan buat ActivityLog atomically.
* `GET /api/dashboard/summary` — statistik katalog publik.
* `GET /api/dashboard/me` — ringkasan laporan dan match milik user aktif.
* `GET /api/matches` — rekomendasi match milik user aktif; optional `itemId`, pagination.
* `POST /api/items/:id/inquiries` — authenticated; buat inquiry/claim.
* `GET /api/inquiries` — daftar inquiry yang dikirim/diterima oleh user aktif.
* `GET /api/inquiries/:id`
* `PATCH /api/inquiries/:id` — penerima memperbarui status `pending`/`replied`/`resolved`.
* `GET /api/profile`
* `PUT /api/profile` — ubah nama, telepon, dan bio; email/role/NIM bukan field yang dapat diubah lewat endpoint ini.
* `GET /api/activities` — ActivityLog milik user aktif, paginated.
* API errors menggunakan bentuk konsisten `{ "error": { "code": "...", "message": "...", "fields": {} } }`; list response berisi `{ "data": [], "pagination": { "page": 1, "pageSize": 20, "total": 0 } }`.

Deliverables:
* Aplikasi React SPA, REST API Express, dan database SQLite melalui Prisma.
* Prisma schema, migration SQL, idempotent development seed, serta `.env.example` tanpa rahasia.
* Akun demo dan data barang/inquiry demonstrasi; seed aman untuk development dan tidak menimpa data existing.
* Upload/fallback/preset gambar, pencarian/filter, Match Engine, dashboard, autentikasi, inquiry, profil, dan aktivitas.
* Unit tests untuk validasi, otorisasi, status lifecycle, dan algoritma match; API integration tests untuk endpoint utama; frontend build/typecheck.
* README instalasi lokal, migration/seed, menjalankan frontend/backend, konfigurasi upload/SQLite, backup, serta catatan deployment.

Project structure:
```text
lost-and-found/
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
├── docker-compose.yml
├── apps/
│   ├── web/
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── src/
│   │       ├── api/
│   │       ├── components/
│   │       ├── pages/
│   │       ├── styles/
│   │       ├── App.tsx
│   │       └── main.tsx
│   └── api/
│       ├── package.json
│       ├── prisma/
│       │   ├── migrations/
│       │   ├── schema.prisma
│       │   └── seed.ts
│       └── src/
│           ├── middleware/
│           ├── routes/
│           ├── services/
│           ├── validators/
│           ├── app.ts
│           └── server.ts
├── packages/
│   └── shared/
│       └── src/                 # shared DTO, schema, dan konstanta tanpa akses DB
├── data/                        # SQLite file; ignored by Git, persisted by volume
└── uploads/                     # file gambar; ignored by Git, persisted by volume
```

Shared package requirements:
* Gunakan `packages/shared` hanya untuk DTO/type API, schema validasi yang lintas frontend/backend, konstanta kategori/lokasi/status, dan helper murni yang tidak bergantung pada Prisma atau browser.
* Jangan mengekspos Prisma models langsung ke frontend; bentuk response melalui DTO yang menghilangkan passwordHash, token/session data, kontak pribadi publik, dan `additionalInfo`.
