# Lost And Found — Platform Pelaporan Barang Hilang & Ditemukan (RPL WEB)

> Lost And Found adalah platform web Single Page Application (SPA) yang dirancang untuk mengelola pelaporan dan penemuan barang tertinggal atau hilang di lingkungan kampus maupun fasilitas publik secara terpusat, transparan, dan terverifikasi.

---

## Daftar Isi

- [Latar Belakang dan Permasalahan](#latar-belakang-dan-permasalahan)
- [Solusi yang Dihadirkan](#solusi-yang-dihadirkan)
- [Fitur Utama Aplikasi](#fitur-utama-aplikasi)
- [Algoritma Pencocokan Otomatis (Match Engine)](#algoritma-pencocokan-otomatis-match-engine)
- [Alur Kerja Pengguna (User Journey)](#alur-kerja-pengguna-user-journey)
- [Arsitektur dan Konsep Desain](#arsitektur-dan-konsep-desain)
- [Struktur Data (LocalStorage Schema)](#struktur-data-localstorage-schema)
- [Struktur Direktori Proyek](#struktur-direktori-proyek)
- [Panduan Instalasi dan Menjalankan Aplikasi](#panduan-instalasi-dan-menjalankan-aplikasi)
- [Kredensial Akun Demo](#kredensial-akun-demo)
- [Skenario Pengujian Fitur](#skenario-pengujian-fitur)
- [Lisensi dan Hak Cipta](#lisensi-dan-hak-cipta)

---

## Latar Belakang dan Permasalahan

Di area kampus yang luas dan memiliki mobilitas tinggi, insiden barang tertinggal atau hilang seperti laptop, kartu tanda mahasiswa (KTM), botol minum, kunci kendaraan, hingga dokumen penting merupakan permasalahan rutin. Pendekatan konvensional yang umum digunakan memiliki sejumlah kelemahan:

1. **Penyebaran Informasi Terfragmentasi**: Informasi tersebar di berbagai saluran tidak resmi seperti grup chat, media sosial, atau papan pengumuman fisik yang cepat tertimbun.
2. **Ketiadaan Pencarian Terpusat**: Korban kehilangan harus memeriksa ratusan percakapan manual tanpa filter kategori, tanggal, maupun lokasi.
3. **Risiko Klaim Sepihak**: Penemu barang kesulitan memverifikasi keabsahan klaim kepemilikan dari pihak yang menghubungi.
4. **Ketidakjelasan Status Penyelesaian**: Laporan lama yang barangnya telah kembali tetap beredar dan menimbulkan redundansi informasi.

---

## Solusi yang Dihadirkan

Platform Lost And Found menghadirkan repositori dan pusat layanan terpadu dengan pendekatan sistematis:

- **Katalog Publik Terbuka & Real-Time**: Seluruh laporan tersusun secara terstruktur dengan indikator status visual (Lost, Found, Returned).
- **Pencarian Cepat & Filter Multi-Kriteria**: Pencarian teks dengan mekanisme debouncing, penyaringan berdasarkan status, kategori, lokasi gedung, serta pengurutan kronologis.
- **Automated Match Detection Engine**: Algoritma pencocokan cerdas yang secara otomatis mendeteksi korelasi antara laporan barang hilang dan temuan berdasarkan bobot kesamaan kategori, kata kunci judul, dan lokasi.
- **Verifikasi Kepemilikan yang Aman**: Pelapor dapat menyimpan catatan tanda khusus terproteksi yang wajib dibuktikan oleh pihak pengklaim melalui formulir pesan terenkripsi secara fungsional.
- **Dashboard Manajemen Pengguna**: Pengguna memiliki visibilitas penuh untuk memantau status laporan aktif, memperbarui data, menandai status selesai (Returned), dan meninjau rekomendasi barang yang cocok.

---

## Fitur Utama Aplikasi

### 1. Halaman Beranda (Landing & Home Page)
- **Hero Section**: Navigasi ringkas dengan aksi cepat pelaporan barang hilang (*Report Lost Item*) dan barang ditemukan (*Report Found Item*), disertai bar pencarian cepat terintegrasi.
- **Statistik Dinamis (Live Metric Cards)**: Menampilkan metrik real-time:
  - Total Barang Hilang (*Lost Items Count*)
  - Total Barang Ditemukan (*Found Items Count*)
  - Barang Berhasil Dikembalikan (*Resolved/Returned Count*)
- **Daftar Laporan Terkini**: Menampilkan ringkasan barang yang baru dilaporkan lengkap dengan status, tanggal, dan lokasi.
- **Panduan Alur Kerja (How It Works)**: Edukasi 4 tahapan sistematis (Laporkan, Cari & Cocokkan, Verifikasi, Serah Terima).

### 2. Katalog dan Pencarian Barang (Search & Directory Page)
- **Live Debounced Search**: Pencarian kata kunci instan pada judul, deskripsi, dan lokasi tanpa degradasi performa render.
- **Filter Status Tersegmentasi**:
  - `Semua Status` (All Items)
  - `Barang Hilang` (Lost Items Only)
  - `Barang Ditemukan` (Found Items Only)
- **Filter Kategori Terstruktur**: Elektronik, Kartu & ID, Kunci, Dompet & Tas, Buku & Dokumen, Pakaian, Kacamata, dan Lainnya.
- **Filter Lokasi Kampus**: Perpustakaan Pusat, Gedung Kuliah Bersama, Laboratorium Komputer, Kantin, Fasilitas Olahraga, Area Parkir, dan Tempat Ibadah Kampus.
- **Pengurutan Fleksibel**: Berdasarkan kronologi terbaru (*Newest First*) atau terlama (*Oldest First*).
- **Active Filter Chips**: Ringkasan filter aktif yang dapat dihapus secara individual atau direset sekaligus.
- **State Kosong Informatif**: Panduan pencarian ketika parameter filter tidak menghasilkan data.

### 3. Formulir Pelaporan Barang (Report Item Page)
- **Mode Pelaporan Ganda**: Pilihan tipe laporan (*Saya Kehilangan Barang* vs *Saya Menemukan Barang*).
- **Input Metadata Terstandarisasi**:
  - Nama / Judul Barang
  - Kategori dan Lokasi Spesifik
  - Tanggal dan Estimasi Waktu Kejadian
  - Deskripsi Karakteristik Barang
  - Tanda Khusus / Ciri Rahasia (untuk keperluan verifikasi klaim)
- **Unggah Gambar & Preset Pengujian**:
  - Unggah berkas gambar lokal dengan konversi otomatis ke format Data URL dan pratinjau langsung.
  - Pilihan 8 preset gambar instan (Laptop, Earphone, Kunci, Dompet, Ransel, Kacamata, Botol Minum, Kalkulator) untuk efisiensi pengujian.
- **Data Kontak Pelapor**: Nama, email institusi, dan nomor telepon aktif.
- **Notifikasi Potensi Kecocokan Instan**: Peringatan proaktif saat pelapor mengisi formulir apabila ditemukan laporan berlawanan yang memiliki kesamaan data.

### 4. Modal Detail Barang dan Verifikasi Klaim
- **Tampilan Media Resolusi Tinggi**: Dilengkapi penanganan fallback gambar ketika URL eksternal tidak dapat diakses.
- **Metadata Lengkap Insiden**: Status, kategori, ID Referensi unik, lokasi spesifik, tanggal, dan waktu kejadian.
- **Panel Verifikasi Kepemilikan**: Panduan bagi pemilik untuk memberikan pembuktian identitas barang sebelum proses serah terima.
- **Formulir Kontak Terarah**: Pengiriman pesan klarifikasi atau klaim langsung ke pelapor tanpa mengekspos kontak pribadi secara publik.
- **Manajemen oleh Pemilik Laporan**:
  - Memperbarui status menjadi *Returned / Resolved*.
  - Mengedit konten laporan secara berkala.
  - Menghapus laporan dengan dialog konfirmasi.

### 5. Dashboard Pengguna (User Dashboard)
- **Ringkasan Metrik Pengguna**:
  - Total laporan kehilangan aktif
  - Total laporan penemuan aktif
  - Rekomendasi kecocokan terdeteksi
  - Total laporan yang telah berhasil diselesaikan
- **Tab Laporan Saya**:
  - Filter status internal (Semua, Aktif, Selesai).
  - Manajemen penuh: Tinjau Detail, Tandai Selesai, Perbarui Data, Hapus Laporan.
- **Tab Rekomendasi Kecocokan (Potential Matches)**:
  - Tampilan perbandingan berdampingan (*side-by-side comparison*) antara barang milik pengguna dan barang pengguna lain yang berpotensi merupakan pasangannya.
  - Rincian skor kecocokan (*Match Score Percentage*) beserta breakdown analisis sistem (kesamaan kategori, kata kunci, dan lokasi).
  - Akses langsung untuk menghubungi pihak terkait.

### 6. Profil Pengguna dan Riwayat Aktivitas
- **Identitas Akun**: Nama lengkap, peran institusi (Mahasiswa / Dosen / Staf), avatar inisial, dan tanggal bergabung.
- **Pengaturan Profil**: Pembaruan biodata, nomor kontak, dan alamat surel institusi.
- **Keamanan Akun**: Penggantian kata sandi dengan validasi kata sandi lama dan konfirmasi kata sandi baru.
- **Linimasa Aktivitas (Audit Log)**: Rekam jejak seluruh interaksi pengguna (pelaporan barang, pengiriman pesan, pembaruan status, autentikasi).

### 7. Autentikasi Pengguna & Akses Cepat Demo
- Formulir Masuk (*Login*) dan Pendaftaran (*Register*) yang terintegrasi validasi input.
- **Akses Cepat Akun Demo (1-Click Login)**:
  - Akun Mahasiswa (Alex Rivera)
  - Akun Dosen (Dr. Sarah Jenkins)
- Opsi penyimpanan sesi (*Remember Me*) dan simulasi pemulihan kata sandi.

---

## Algoritma Pencocokan Otomatis (Match Engine)

Sistem menerapkan algoritma deteksi heuristik berbasis pembobotan (*weighted deterministic scoring*) untuk mengevaluasi tingkat kesamaan antar dua laporan:

```text
                       [ Laporan Baru / Target Item ]
                                     |
                                     v
                   [ Filter Status Berlawanan ]
                (Lost <---> Found / Status: Active)
                                     |
                                     v
        +----------------------------+----------------------------+
        |                            |                            |
        v                            v                            v
 [ Skor Kategori ]           [ Skor Kata Kunci ]           [ Skor Lokasi ]
   Bobot: +40 poin             Bobot: +20-40 poin            Bobot: +25 poin
  (Jika kategori sama)        (Tokenisasi judul &           (Jika lokasi berada
                               deskripsi cocok)              di gedung/area sama)
        |                            |                            |
        +----------------------------+----------------------------+
                                     |
                                     v
                          [ Total Skor Kecocokan ]
                                     |
                       Skor >= Threshold (30 poin)
                                     |
                                     v
                    [ Rekomendasi Kecocokan Dibuat ]
```

### Parameter Penilaian:
- **Kesesuaian Kategori**: Menghasilkan nilai dasar +40 poin apabila kategori barang identik.
- **Kesesuaian Kata Kunci (Token Overlap)**: Teks judul dipecah menjadi token kata individual setelah pembersihan kata hubung (*stop words*). Setiap kata kunci yang cocok menambahkan +20 poin (maksimum batas 40 poin).
- **Kesesuaian Lokasi**: Kesamaan area atau gedung pelaporan menghasilkan +25 poin tambahan.
- **Ambang Batas Minimum**: Rekomendasi ditampilkan kepada pengguna apabila akumulasi skor mencapai minimal 30 poin.

---

## Alur Kerja Pengguna (User Journey)

### Skenario A: Pelaporan Barang Hilang
1. Pengguna membuka halaman pelaporan dan memilih opsi **Saya Kehilangan Barang**.
2. Pengguna melengkapi data nama barang, kategori, lokasi terakhir dilihat, estimasi waktu, serta foto pendukung.
3. Laporan tercatat dan terbit pada katalog publik dengan penanda status `Lost`.
4. Jika ditemukan barang temuan yang relevan, sistem menampilkan rekomendasi pada tab **Barang Cocok** di Dashboard.
5. Pemilik meninjau detail barang temuan, mengajukan pesan verifikasi tanda kepemilikan, dan mengatur serah terima fisik.
6. Setelah barang berhasil diterima kembali, pemilik memperbarui status laporan menjadi `Returned`.

### Skenario B: Pelaporan Barang Temuan
1. Penemu membuka formulir pelaporan dan memilih opsi **Saya Menemukan Barang**.
2. Penemu mengisi rincian umum barang dan menyimpan tanda rahasia (misalnya nomor seri atau isi spesifik) untuk kebutuhan validasi.
3. Laporan terbit pada katalog publik dengan penanda status `Found`.
4. Pihak yang merasa memiliki barang mengirimkan pesan verifikasi untuk mencocokkan ciri-ciri rahasia tersebut.
5. Setelah konfirmasi validitas tercapai, barang diserahkan dan status laporan diperbarui menjadi `Returned`.

---

## Arsitektur dan Konsep Desain

Aplikasi mengadopsi standar rancang bangun modern tanpa ketergantungan framework eksternal:

- **Arsitektur Tanpa Framework (Vanilla Stack)**: Dibangun sepenuhnya menggunakan **Vanilla JavaScript ES Modules** dan **Modular CSS**, memastikan waktu inisialisasi instan, efisiensi konsumsi memori, dan portabilitas tinggi.
- **Sistem Desain Berbasis Variabel CSS (Design Tokens)**:
  - Latar Belakang: `#ffffff` (Primary), `#f8fafc` (Slate 50), `#f1f5f9` (Slate 100).
  - Tipografi: `#0f172a` (Primary Text) dan `#334155` (Secondary Text).
  - Aksen Institusional: `#2563eb` (Brand Blue) dengan hover `#1d4ed8`.
  - Indikator Status:
    - `Lost`: Latar `#fef2f2`, Teks `#991b1b`, Border `#fecaca`.
    - `Found`: Latar `#f0fdf4`, Teks `#166534`, Border `#bbf7d0`.
    - `Returned`: Latar `#f8fafc`, Teks `#475569`, Border `#cbd5e1`.
- **Tipografi**: Menggunakan keluarga font institusional modern **Plus Jakarta Sans** dengan hierarki ukuran dan keterbacaan yang terstandarisasi.
- **Desain Responsif Penuh**: Mendukung tata letak adaptif untuk layar desktop, laptop, tablet, serta perangkat seluler melalui drawer navigasi responsif.

---

## Struktur Data (LocalStorage Schema)

Seluruh status aplikasi dikelola dan disimpan secara persisten pada `localStorage` peramban:

```javascript
{
  // 1. Data Pengguna
  "laf_users": [
    {
      "id": "usr_001",
      "name": "Alex Rivera",
      "email": "alex.rivera@campus.ac.id",
      "phone": "+62 812-3456-7890",
      "role": "Mahasiswa",
      "avatar": "AR",
      "bio": "Mahasiswa Teknik Informatika...",
      "joined": "2024-08-15"
    }
  ],

  // 2. Data Laporan Barang
  "laf_items": [
    {
      "id": "itm_001",
      "userId": "usr_001",
      "title": "MacBook Air M2 13-inch Silver",
      "category": "Elektronik",
      "status": "lost", // 'lost' | 'found' | 'returned'
      "description": "Tertinggal di meja kubikel perpustakaan...",
      "additionalInfo": "Stiker GitHub di sudut kanan bawah",
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

  // 3. Data Pesan & Inkuiri Klaim
  "laf_inquiries": [
    {
      "id": "inq_001",
      "itemId": "itm_001",
      "senderName": "Dr. Sarah Jenkins",
      "senderEmail": "sarah.jenkins@campus.ac.id",
      "senderPhone": "+62 811-9876-5432",
      "message": "Barang ini telah diamankan di meja resepsionis...",
      "createdAt": "2026-09-13T09:15:00.000Z"
    }
  ],

  // 4. Riwayat Aktivitas Sistem
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

## Struktur Direktori Proyek

```text
lost-and-found/
├── .gitignore                 # Daftar berkas abaian Git
├── index.html                 # Dokumen entri utama HTML
├── package.json               # Konfigurasi dependensi dan scripts build
├── package-lock.json          # Rekam versi dependensi npm
├── README.md                  # Dokumentasi teknis proyek
└── src/                       # Kode sumber aplikasi
    ├── components/            # Komponen antarmuka pengguna modular
    │   ├── Footer.js          # Komponen footer aplikasi
    │   ├── ItemCard.js        # Komponen kartu item katalog
    │   ├── ItemDetailModal.js # Modal detail, verifikasi, dan klaim
    │   ├── Modal.js           # Komponen dasar wrapper dialog
    │   ├── Navbar.js          # Navigasi utama dan menu mobile
    │   └── Toast.js           # Notifikasi pop-up sistem
    ├── data/                  # Layer data dan state management
    │   ├── seedData.js        # Data awal demonstrasi sistem
    │   └── store.js           # State store reaktif dan matching engine
    ├── styles/                # Arsitektur CSS modular
    │   ├── base.css           # Reset dasar dan typography utilities
    │   ├── components.css     # Styling komponen antarmuka
    │   ├── index.css          # Entri impor utama stylesheet
    │   ├── variables.css      # Design tokens (warna, radius, bayangan)
    │   └── views.css          # Styling halaman spesifik
    ├── views/                 # Komponen halaman (Views)
    │   ├── AuthView.js        # Halaman autentikasi login dan register
    │   ├── DashboardView.js   # Dashboard laporan dan rekomendasi kecocokan
    │   ├── HomeView.js        # Halaman beranda dan metrik ringkasan
    │   ├── ItemsView.js       # Halaman direktori pencarian dan filter
    │   ├── ProfileView.js     # Halaman manajemen akun dan log aktivitas
    │   └── ReportView.js      # Formulir pelaporan barang baru
    ├── main.js                # Inisialisasi aplikasi dan dependensi
    └── router.js              # Hash router Single Page Application (SPA)
```

---

## Panduan Instalasi dan Menjalankan Aplikasi

### Prasyarat Sistem
- **Node.js**: Versi 18.0.0 atau yang lebih baru ([Unduh Node.js](https://nodejs.org/))
- **npm**: Versi 9.0.0 atau yang lebih baru (terpasang bersama Node.js)
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
Setelah server lokal berjalan, buka peramban dan akses alamat:
```text
http://localhost:5173/
```

### 4. Membangun Berkas Distribusi Produksi (Production Build)
Untuk menghasilkan berkas teroptimasi siap publikasi:
```bash
npm run build
```
Hasil kompilasi tersimpan pada direktori `dist/`. Anda dapat menguji hasil kompilasi dengan:
```bash
npm run preview
```

---

## Kredensial Akun Demo

Untuk mempermudah pengujian alur fungsional tanpa registrasi manual, sistem menyediakan dua akun demonstrasi:

| Peran Institusi | Nama Lengkap | Alamat Email | Kata Sandi | Akses Cepat |
| :--- | :--- | :--- | :--- | :--- |
| **Mahasiswa** | Alex Rivera | `alex.rivera@campus.ac.id` | `password123` | Tombol "Demo Mahasiswa" pada Form Login |
| **Dosen** | Dr. Sarah Jenkins | `sarah.jenkins@campus.ac.id` | `password123` | Tombol "Demo Dosen" pada Form Login |

---

## Skenario Pengujian Fitur

1. **Uji Pencarian dan Penyaringan Data (Katalog)**:
   - Buka menu **Cari Barang**.
   - Masukkan kata kunci pencarian (misalnya *"MacBook"*) pada input pencarian.
   - Aktifkan filter status `Barang Hilang` dan kategori `Elektronik`.
   - Periksa chips indikator filter aktif di bagian atas dan gunakan tombol *Reset Filter* untuk mengembalikan filter.
2. **Uji Pelaporan Barang Baru**:
   - Klik tombol **Laporkan Barang** pada navigasi utama.
   - Pilih jenis laporan: **Saya Menemukan Barang**.
   - Masukkan judul barang, pilih salah satu gambar dari **Preset Demo Cepat**, isi data lokasi, lalu simpan laporan.
   - Sistem akan menampilkan notifikasi konfirmasi sukses dan menambahkan barang ke katalog.
3. **Uji Algoritma Kecocokan (Matching Engine)**:
   - Akses **Dashboard** melalui menu profil di navigasi atas.
   - Pilih tab **Barang Cocok** untuk melihat hasil analisis otomatis barang hilang vs barang temuan.
   - Klik tombol aksi untuk membuka detail dan mengirim pesan konfirmasi kepada pihak pelapor.
4. **Uji Pembaruan Status Penyelesaian (Mark as Returned)**:
   - Pada Dashboard atau Modal Detail barang milik akun Anda, klik tombol **Tandai Selesai / Dikembalikan**.
   - Status laporan akan diperbarui menjadi `Returned` dan metrik penyelesaian pada halaman beranda akan terbarui secara otomatis.

---

## Lisensi dan Hak Cipta

Proyek ini dikembangkan dan diselesaikan untuk memenuhi instrumen tugas **Rekayasa Perangkat Lunak Berbasis Web (RPL WEB)**.

- **Pengembang**: mfthlmzn17-jpg ([GitHub](https://github.com/mfthlmzn17-jpg))
- **Lisensi**: Bebas digunakan untuk keperluan edukasi, pembelajaran, dan pengembangan institusional non-komersial.
- **Hak Cipta**: © 2026 Lost And Found Platform. Seluruh hak cipta dilindungi.
