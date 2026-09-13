# 🔍 Lost And Found — Platform Pelaporan Barang Hilang & Ditemukan (RPL WEB)

[![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![CSS3](https://img.shields.io/badge/CSS3-Vanilla%20Design%20System-1572B6?style=flat-square&logo=css3&logoColor=white)](https://www.w3.org/Style/CSS/)
[![License](https://img.shields.io/badge/License-Academic%20%2F%20MIT-green?style=flat-square)](#-lisensi--hak-cipta)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen?style=flat-square)](#)

> **Lost And Found** adalah platform web Single Page Application (SPA) modern, elegan, minimalis, dan berstandar institusional yang dirancang untuk mengatasi permasalahan pelaporan dan penemuan barang tertinggal atau hilang di lingkungan kampus maupun fasilitas publik.

---

## 📑 Daftar Isi

- [Latar Belakang & Masalah](#-latar-belakang--permasalahan)
- [Solusi yang Dihadirkan](#-solusi-yang-dihadirkan)
- [Fitur Utama Aplikasi](#-fitur-utama-aplikasi)
- [Algoritma Pencocokan Otomatis (Match Engine)](#-algoritma-pencocokan-otomatis-match-engine)
- [Alur Kerja Pengguna (User Journey)](#-alur-kerja-pengguna-user-journey)
- [Arsitektur & Konsep Desain](#-arsitektur--konsep-desain)
- [Struktur Data (LocalStorage Schema)](#-struktur-data-localstorage-schema)
- [Struktur Direktori Proyek](#-struktur-direktori-proyek)
- [Panduan Instalasi & Penggunaan](#-panduan-instalasi--menjalankan-aplikasi)
- [Kredensial Akun Demo](#-kredensial-akun-demo)
- [Skenario Pengujian Fitur](#-skenario-pengujian-fitur)
- [Lisensi & Hak Cipta](#-lisensi--hak-cipta)

---

## 🎯 Latar Belakang & Permasalahan

Di area kampus yang luas dan ramai, barang tertinggal atau hilang seperti laptop, kartu mahasiswa (KTM), botol minum, kunci motor, hingga dompet merupakan kejadian sehari-hari. Selama ini, solusi yang digunakan sering kali tidak efektif:

1. **Penyebaran Informasi Terfragmentasi**: Informasi tercecer di berbagai grup chat WhatsApp/Telegram, story Instagram, atau papan pengumuman fisik yang cepat tenggelam.
2. **Tidak Ada Pencarian Terpusat**: Korban kehilangan harus menggulir ratusan pesan tanpa filter kategori, tanggal, atau lokasi.
3. **Risiko Klaim Palsu**: Penemu barang kesulitan memverifikasi apakah orang yang menghubungi benar-benar pemilik sah barang tersebut.
4. **Tidak Ada Status Penyelesaian**: Laporan lama yang barangnya sudah kembali tetap beredar dan menimbulkan kebingungan.

---

## 💡 Solusi yang Dihadirkan

Platform **Lost And Found** hadir sebagai pusat layanan terpadu (*centralized hub*) dengan pendekatan **SaaS Institutional Minimalism**:

- 🗂️ **Katalog Publik Terbuka & Real-time**: Seluruh laporan tersusun rapi dengan status visual yang jelas (*Lost*, *Found*, *Returned*).
- ⚡ **Pencarian Cepat & Filter Multi-Kriteria**: Pencarian kata kunci dengan *live debounce*, filter status, kategori, lokasi gedung, serta pengurutan waktu.
- 🤖 **Automated Match Detection Engine**: Algoritma pencocokan cerdas yang secara otomatis mendeteksi kecocokan antara laporan barang hilang dan temuan berdasarkan kesamaan kategori, teks judul, dan lokasi.
- 🔒 **Verifikasi Kepemilikan yang Aman**: Pelapor dapat menyembunyikan tanda rahasia (seperti nomor seri atau ciri fisik tertentu) yang wajib dibuktikan oleh pihak pengklaim melalui formulir pesan terproteksi.
- 📊 **Dashboard Manajemen Pengguna**: Pengguna memiliki kendali penuh untuk memantau status laporan mereka, mengedit rincian barang, menandai barang yang telah kembali (*Resolved/Returned*), serta meninjau daftar calon barang yang cocok.

---

## 🚀 Fitur Utama Aplikasi

### 1. Halaman Beranda (Landing & Home Page)
- **Hero Banner Interaktif**: Pesan sambutan yang jelas, tombol aksi cepat *"Report Lost Item"* dan *"Report Found Item"*, serta kolom pencarian terintegrasi yang langsung mengarahkan ke katalog.
- **Statistik Dinamis (Live Counter Cards)**: Menampilkan metrik real-time:
  - Total Barang Hilang (*Lost Items Count*)
  - Total Barang Ditemukan (*Found Items Count*)
  - Barang Berhasil Dikembalikan (*Resolved/Returned Count*)
- **Daftar Laporan Terbaru**: Menampilkan kartu barang terkini lengkap dengan badge status visual, tanggal pelaporan, foto, dan lokasi.
- **Panduan Alur 4 Langkah (*How It Works*)**:
  1. *Report an Item* (Laporkan barang hilang atau barang yang Anda temukan)
  2. *Search & Match* (Jelajahi katalog dan manfaatkan deteksi kecocokan sistem)
  3. *Contact & Verify* (Kirim pesan verifikasi kepada pelapor)
  4. *Get It Back* (Lakukan serah terima fisik secara aman)

### 2. Katalog & Pencarian Barang (Search & Directory Page)
- **Live Debounced Search**: Pencarian teks instan pada nama barang, deskripsi, dan catatan khusus tanpa membebani performa browser.
- **Filter Status Tersegmentasi**:
  - `Semua Status` (All Items)
  - `Barang Hilang` (Lost Items Only)
  - `Barang Ditemukan` (Found Items Only)
- **Filter Kategori**: Elektronik, Kartu & ID, Kunci, Dompet & Tas, Buku & Dokumen, Pakaian, Kacamata, dan Lainnya.
- **Filter Lokasi Kampus**: Perpustakaan Pusat, Gedung Kuliah Bersama, Laboratorium Komputer, Kantin / Kafetaria, Lapangan Olahraga, Area Parkir, Musholla/Masjid Kampus.
- **Pengurutan Fleksibel**: Berdasarkan yang terbaru (*Newest First*) atau terlama (*Oldest First*).
- **Active Filter Chips**: Tag visual filter aktif yang dapat dihapus per elemen atau dibersihkan sekaligus melalui tombol *Reset Filters*.
- **Empty State Informatif**: Memberikan saran pencarian ketika tidak ada barang yang sesuai dengan kriteria filter.

### 3. Formulir Pelaporan Barang (Report Item Page)
- **Dua Mode Pelaporan**: Sakelar cepat *"Saya Kehilangan Barang"* (Lost) vs *"Saya Menemukan Barang"* (Found).
- **Formulir Metadata Terstruktur**:
  - Judul / Nama Barang
  - Kategori & Lokasi Spesifik
  - Tanggal & Perkiraan Waktu Kejadian
  - Deskripsi Detail
  - Informasi Rahasia / Tanda Khusus (untuk validasi klaim kepemilikan)
- **Upload Gambar & Demo Foto Cepat**:
  - Mendukung unggah gambar dari penyimpanan lokal dengan konversi instan ke Data URL dan pratinjau langsung (*live preview*).
  - Dilengkapi **8 preset foto demo instan** (Laptop, Earphone, Kunci, Dompet, Ransel, Kacamata, Botol Minum, Kalkulator Ilmiah) untuk kemudahan pengujian tanpa perlu menyiapkan gambar sendiri.
- **Data Kontak Pelapor**: Nama, email institusi, dan nomor telepon kontak yang valid.
- **Deteksi Kecocokan Instan**: Notifikasi cerdas langsung muncul saat pelapor mengisi form jika sistem menemukan barang berlawanan yang berpotensi cocok.

### 4. Modal Detail Barang & Kontak Pelapor (Detail & Claim Modal)
- **Tampilan Gambar Resolusi Tinggi**: Dilengkapi mekanisme *fallback image* jika URL gambar gagal dimuat.
- **Informasi Lengkap Insiden**: Badge status, kategori, ID Referensi unik laporan, lokasi persis, tanggal, dan waktu kejadian.
- **Kotak Verifikasi Klaim**: Panduan bagi pemilik untuk menyebutkan ciri-ciri khusus barang sebelum menghubungi penemu.
- **Banner Rekomendasi Kecocokan**: Menampilkan saran perbandingan dengan barang yang berpotensi merupakan pasangannya.
- **Formulir Kontak Aman**: Kirim pesan verifikasi atau klaim langsung ke pelapor tanpa membocorkan nomor kontak pribadi secara sembarangan.
- **Aksi Khusus Pemilik**:
  - Tandai barang sebagai *Returned / Resolved* (Selesai).
  - Edit informasi laporan secara langsung.
  - Hapus laporan dengan dialog konfirmasi aman.

### 5. Dashboard Pengguna (User Dashboard)
- **Kartu Statistik Personal**:
  - Laporan Barang Hilang Saya
  - Laporan Barang Temuan Saya
  - Potensi Kecocokan Ditemukan
  - Laporan yang Telah Selesai (*Resolved*)
- **Tab 'Laporan Saya'**:
  - Filter status internal (`Semua`, `Aktif`, `Selesai`).
  - Tabel dan kartu interaktif untuk melihat status laporan Anda.
  - Tombol aksi cepat: Lihat Detail, Ubah Status Selesai, Edit, dan Hapus Laporan.
- **Tab 'Barang yang Cocok' (Potential Matches)**:
  - Menampilkan kartu perbandingan berdampingan (*side-by-side*) antara laporan Anda dan laporan orang lain yang dicurigai cocok.
  - Menampilkan skor kecocokan (*Match Score*) dan alasan deteksi sistem (misal: *"Kategori sama: Elektronik"*, *"Kata kunci sama: MacBook"*, *"Lokasi sama: Perpustakaan"*).
  - Tombol langsung untuk meninjau detail dan menghubungi pihak terkait.

### 6. Profil Pengguna & Log Aktivitas (Profile Page)
- **Identitas Terverifikasi**: Menampilkan nama lengkap, peran institusi (Mahasiswa / Dosen / Staf), avatar berbasis inisial warna-warni, serta tanggal bergabung.
- **Pengaturan Profil**: Formulir edit nama, bio, email, dan nomor telepon kontak.
- **Keamanan Akun**: Formulir pergantian password dengan validasi keamanan kata sandi lama dan baru.
- **Linimasa Aktivitas (Activity Timeline)**: Riwayat lengkap setiap tindakan pengguna dalam sistem (melaporkan barang, mengirim pesan, menyelesaikan status laporan, login, dll).

### 7. Autentikasi Pengguna & Akun Demo (Auth View)
- Formulir Masuk (*Login*) dan Daftar Akun Baru (*Register*) yang bersih dan modern.
- **Quick Demo Login (1-Klik)**: Tombol instan untuk masuk langsung sebagai:
  1. **Alex Rivera** (Mahasiswa)
  2. **Dr. Sarah Jenkins** (Dosen)
- Pilihan *"Ingat Saya"* (*Remember Me*) dan tautan simulasi reset kata sandi.

---

## 🤖 Algoritma Pencocokan Otomatis (Match Engine)

Sistem mengimplementasikan mesin pencocokan deterministik berbasis pembobotan (*weighted heuristic scoring*):

```
                       [ Laporan Baru / Target Item ]
                                     │
                                     ▼
                  [ Filter Status Berlawanan ]
               (Lost ◄───► Found / Status: Active)
                                     │
                                     ▼
        ┌────────────────────────────┼────────────────────────────┐
        ▼                            ▼                            ▼
 [ Skor Kategori ]           [ Skor Kata Kunci ]           [ Skor Lokasi ]
   Bobot: +40 poin             Bobot: +20-40 poin            Bobot: +25 poin
  (Jika kategori sama)        (Tokenisasi judul &          (Jika nama lokasi
                               deskripsi cocok)               mengandung kata sama)
        │                            │                            │
        └────────────────────────────┼────────────────────────────┘
                                     ▼
                          [ Total Skor Kecocokan ]
                                     │
                       Skor >= Threshold (30 poin)
                                     │
                                     ▼
                   [ Rekomendasi Kecocokan Dibuat ]
```

- **Kriteria Pembobotan**:
  - **Kategori Identik**: Menghasilkan +40 poin kecocokan awal.
  - **Kecocokan Kata Kunci (Keywords Overlap)**: Kata-kata dalam judul ditokenisasi dan dibandingkan (mengabaikan kata hubung). Setiap kata kunci yang cocok menambahkan +20 poin (maksimal 40 poin).
  - **Kecocokan Lokasi**: Jika lokasi pelaporan berada di gedung atau zona yang sama, sistem menambahkan +25 poin.
- **Hasil & Alasan**: Setiap kecocokan menyimpan rincian alasan sistem (*reasons breakdown*) agar pengguna memahami mengapa kedua laporan tersebut direkomendasikan.

---

## 🔄 Alur Kerja Pengguna (User Journey)

### Skenario A: Pengguna Kehilangan Barang
1. Pengguna membuka menu **Laporkan Barang** dan memilih opsi **Saya Kehilangan Barang**.
2. Pengguna mengisi nama barang (misal: *"MacBook Air M2 Silver"*), memilih kategori `Elektronik`, lokasi `Perpustakaan Lantai 2`, serta mengunggah foto atau memilih preset foto.
3. Laporan tersimpan dan langsung tampil di **Katalog Publik** dengan badge merah `Lost`.
4. Jika seseorang telah/akan melaporkan temuan laptop di lokasi serupa, sistem secara otomatis menghubungkan kedua laporan pada tab **Barang Cocok** di Dashboard.
5. Pemilik membuka detail temuan, mengirim pesan verifikasi ke penemu, dan menyepakati lokasi serah terima.
6. Setelah barang kembali, pemilik mengubah status menjadi **Returned** melalui Dashboard.

### Skenario B: Pengguna Menemukan Barang
1. Pengguna menemukan barang tertinggal (misal: *"Dompet Kulit Cokelat"* di Kantin).
2. Pengguna membuka menu **Laporkan Barang** dan memilih **Saya Menemukan Barang**.
3. Pengguna mendeskripsikan ciri umum namun menyimpan detail rahasia (seperti nomor kartu di dalamnya) untuk verifikasi nanti.
4. Laporan muncul di katalog dengan badge hijau `Found`.
5. Pemilik asli melihat laporan tersebut, mengirim formulir pesan klaim dengan menyebutkan identitas isi dompet.
6. Setelah verifikasi cocok, barang diserahkan dan penemu/pemilik menandai laporan sebagai **Returned**.

---

## 🎨 Arsitektur & Konsep Desain

Aplikasi mengusung filosofi **SaaS-Grade Institutional Minimalism**:
- **Tidak Bergantung pada Framework Berat**: Dibangun menggunakan murni **Vanilla JavaScript ES Modules** dan **Modular CSS**, menghasilkan performa sangat cepat dengan bundle size ultra-ringan.
- **Sistem Desain Berbasis Variabel CSS (Tokens)**:
  - *Backgrounds*: `#ffffff` (Primary White), `#f8fafc` (Slate 50), `#f1f5f9` (Slate 100).
  - *Typography*: `#0f172a` (Deep Charcoal Navy) dan `#334155` (Slate 700).
  - *Accents*: `#2563eb` (Royal Blue Institusional) dengan hover `#1d4ed8`.
  - *Status*:
    - **Lost**: `#fef2f2` (bg) / `#991b1b` (teks) / `#fecaca` (border)
    - **Found**: `#f0fdf4` (bg) / `#166534` (teks) / `#bbf7d0` (border)
    - **Returned**: `#f8fafc` (bg) / `#475569` (teks) / `#cbd5e1` (border)
- **Tipografi**: Menggunakan font modern **Plus Jakarta Sans** dari Google Fonts dengan skala hierarki yang tegas dan nyaman dibaca.
- **Responsif Penuh**: Mendukung optimal tampilan desktop resolusi tinggi, laptop, tablet, hingga layar smartphone dengan navigasi mobile drawer.

---

## 💾 Struktur Data (LocalStorage Schema)

Seluruh status aplikasi tersimpan secara persisten pada `localStorage` browser sehingga data tidak akan hilang saat halaman dimuat ulang (*refresh*).

```javascript
// Struktur Data Aplikasi (Entity Relationship Diagram Sederhana)
{
  // 1. Entitas Pengguna
  "laf_users": [
    {
      "id": "usr_001",
      "name": "Alex Rivera",
      "email": "alex.rivera@campus.ac.id",
      "phone": "+62 812-3456-7890",
      "role": "Mahasiswa",
      "avatar": "AR",
      "bio": "Mahasiswa Teknik Informatika semester 6...",
      "joined": "2024-08-15"
    }
  ],

  // 2. Entitas Laporan Barang
  "laf_items": [
    {
      "id": "itm_001",
      "userId": "usr_001",
      "title": "MacBook Air M2 13-inch Silver",
      "category": "Elektronik",
      "status": "lost", // 'lost' | 'found' | 'returned'
      "description": "Tertinggal di meja kubikel ruang baca utama...",
      "additionalInfo": "Ada stiker GitHub dan stiker siluet kucing di pojok kanan bawah",
      "location": "Perpustakaan Pusat, Lantai 2",
      "date": "2026-09-12",
      "time": "14:30",
      "image": "data:image/jpeg;base64,...",
      "contactName": "Alex Rivera",
      "contactEmail": "alex.rivera@campus.ac.id",
      "contactPhone": "+62 812-3456-7890",
      "createdAt": "2026-09-12T14:45:00.000Z",
      "updatedAt": "2026-09-12T14:45:00.000Z"
    }
  ],

  // 3. Entitas Pesan / Verifikasi Klaim
  "laf_inquiries": [
    {
      "id": "inq_001",
      "itemId": "itm_001",
      "senderName": "Dr. Sarah Jenkins",
      "senderEmail": "sarah.jenkins@campus.ac.id",
      "senderPhone": "+62 811-9876-5432",
      "message": "Saya menemukan laptop serupa di meja resepsionis perpus...",
      "createdAt": "2026-09-13T09:15:00.000Z"
    }
  ],

  // 4. Log Linimasa Aktivitas
  "laf_activities": [
    {
      "id": "act_001",
      "userId": "usr_001",
      "action": "Melaporkan barang hilang: MacBook Air M2 13-inch Silver",
      "timestamp": "2026-09-12T14:45:00.000Z"
    }
  ]
}
```

---

## 📂 Struktur Direktori Proyek

```
lost-and-found/
├── .git/                      # Repositori Git lokal
├── .gitignore                 # Berkas abaian Git (node_modules, dist, dll)
├── index.html                 # Pintu masuk utama HTML & konfigurasi font
├── package.json               # Konfigurasi dependensi Vite & script build
├── package-lock.json          # Lockfile dependensi npm
├── README.md                  # Dokumentasi komprehensif proyek
└── src/                       # Kode sumber aplikasi
    ├── components/            # Komponen UI modular
    │   ├── Footer.js          # Footer institusional & informasi tautan
    │   ├── ItemCard.js        # Komponen kartu barang di katalog & beranda
    │   ├── ItemDetailModal.js # Modal detail barang, verifikasi, dan klaim
    │   ├── Modal.js           # Komponen dasar wrapper modal dialog
    │   ├── Navbar.js          # Bilah navigasi responsif & drawer mobile
    │   └── Toast.js           # Sistem notifikasi toast pop-up
    ├── data/                  # Layer data & state management
    │   ├── seedData.js        # Data awal realistis (barang, akun demo)
    │   └── store.js           # State manager reaktif, CRUD & matching engine
    ├── styles/                # Arsitektur CSS modular
    │   ├── base.css           # Reset CSS, base typography & utility classes
    │   ├── components.css     # Styling komponen (navbar, card, modal, button)
    │   ├── index.css          # Pintu masuk impor seluruh stylesheet
    │   ├── variables.css      # Design tokens (warna, radius, shadow, font)
    │   └── views.css          # Styling spesifik untuk tiap halaman/view
    ├── views/                 # Halaman aplikasi (Views)
    │   ├── AuthView.js        # Halaman login & register (termasuk demo login)
    │   ├── DashboardView.js   # Dashboard pengguna (laporan saya & match items)
    │   ├── HomeView.js        # Halaman beranda, hero section, live stats
    │   ├── ItemsView.js       # Halaman katalog barang, live search & multi-filter
    │   ├── ProfileView.js     # Halaman profil akun, ganti kata sandi, log aktivitas
    │   └── ReportView.js      # Halaman formulir pelaporan barang hilang / temuan
    ├── main.js                # Inisialisasi aplikasi, store, navbar, footer & router
    └── router.js              # Hash router berbasis Single Page Application (SPA)
```

---

## 🛠️ Panduan Instalasi & Menjalankan Aplikasi

### Prasyarat Sistem
- **Node.js**: Versi 18.0.0 atau yang lebih baru ([Unduh Node.js](https://nodejs.org/))
- **npm**: Versi 9.0.0 atau yang lebih baru (terpasang otomatis bersama Node.js)
- **Git**: Terpasang di sistem komputer Anda

### 1. Kloning Repositori
```bash
git clone https://github.com/mfthlmzn17-jpg/RPL-WEB.git
cd RPL-WEB
```

### 2. Memasang Dependensi
```bash
npm install
```

### 3. Menjalankan Server Pengembangan (Dev Mode)
```bash
npm run dev
```
Setelah perintah dijalankan, Vite akan mengaktifkan server lokal. Buka peramban (browser) dan akses alamat:
```
http://localhost:5173/
```

### 4. Membangun Berkas Produksi (Production Build)
Untuk membuat berkas teroptimasi siap hosting / publikasi:
```bash
npm run build
```
Hasil kompilasi akan berada di direktori `dist/`. Anda dapat mengujinya dengan:
```bash
npm run preview
```

---

## 🔑 Kredensial Akun Demo

Untuk mempermudah pengujian seluruh fitur tanpa perlu mendaftar dari awal, sistem telah dilengkapi dengan 2 akun bawaan:

| Peran Institusi | Nama Lengkap | Alamat Email | Kata Sandi | Tombol Akses Cepat |
| :--- | :--- | :--- | :--- | :--- |
| **Mahasiswa** | Alex Rivera | `alex.rivera@campus.ac.id` | `password123` | Tombol *"Demo Mahasiswa"* di halaman Login |
| **Dosen** | Dr. Sarah Jenkins | `sarah.jenkins@campus.ac.id` | `password123` | Tombol *"Demo Dosen"* di halaman Login |

*Catatan: Anda juga dapat mendaftarkan akun baru secara mandiri melalui formulir Register.*

---

## 🧪 Skenario Pengujian Fitur

Berikut adalah langkah-langkah yang direkomendasikan untuk menguji fungsionalitas utama aplikasi:

1. **Uji Pencarian & Filter (Katalog)**:
   - Masuk ke tab **Cari Barang**.
   - Ketik *"MacBook"* pada kolom pencarian dan amati respons instan.
   - Klik filter `Barang Hilang` lalu pilih kategori `Elektronik`.
   - Perhatikan chip filter aktif yang muncul di bagian atas dan klik *"Reset Filter"* untuk kembali ke semua data.
2. **Uji Pelaporan Barang Baru**:
   - Klik tombol **Laporkan Barang** di navigasi atas.
   - Pilih jenis laporan: **Saya Menemukan Barang**.
   - Masukkan judul barang, pilih salah satu foto dari **Preset Demo Cepat** (misal: *Earphone*), isi lokasi kejadian, lalu simpan.
   - Sistem akan menampilkan notifikasi Toast sukses dan mengarahkan ke katalog barang.
3. **Uji Algoritma Kecocokan (Matching Engine)**:
   - Buka **Dashboard** (klik ikon pengguna di navbar lalu pilih *Dashboard*).
   - Masuk ke tab **Barang Cocok** untuk melihat rekomendasi otomatis barang hilang vs barang temuan.
   - Klik *"Bandingkan & Hubungi"* untuk membuka modal detail dan mengirim pesan klaim.
4. **Uji Penyelesaian Laporan (Mark as Returned)**:
   - Pada Dashboard atau Modal Detail barang milik Anda, klik tombol **Tandai Selesai / Dikembalikan**.
   - Status barang akan berubah menjadi `Returned` dan statistik penyelesaian pada beranda akan bertambah secara otomatis.

---

## 👥 Lisensi & Hak Cipta

Proyek ini dikembangkan dan diselesaikan untuk memenuhi tugas praktikum **Rekayasa Perangkat Lunak Berbasis Web (RPL WEB)**.

- **Pengembang**: mfthlmzn17-jpg ([GitHub](https://github.com/mfthlmzn17-jpg))
- **Lisensi**: Bebas digunakan untuk keperluan edukasi, pembelajaran, dan pengembangan institusional non-komersial.
- **Hak Cipta**: © 2026 Lost And Found Platform. Seluruh hak cipta dilindungi undang-undang.
