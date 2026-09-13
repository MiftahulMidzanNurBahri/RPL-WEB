# Lost And Found — Platform Pelaporan Barang Hilang & Ditemukan Mahasiswa Universitas Pradita (RPL WEB)

> Lost And Found adalah platform web Single Page Application (SPA) yang dirancang khusus untuk civitas akademika dan mahasiswa Universitas Pradita (Pradita University) guna mengelola pelaporan, pencarian, dan pengembalian barang tertinggal atau hilang di lingkungan kampus secara terpusat, transparan, dan terverifikasi.

---

## Daftar Isi

- [Ruang Lingkup dan Batasan Pengguna](#ruang-lingkup-dan-batasan-pengguna)
- [Latar Belakang dan Permasalahan di Kampus](#latar-belakang-dan-permasalahan-di-kampus)
- [Solusi yang Dihadirkan](#solusi-yang-dihadirkan)
- [Fitur Utama Aplikasi](#fitur-utama-aplikasi)
- [Algoritma Pencocokan Otomatis (Match Engine)](#algoritma-pencocokan-otomatis-match-engine)
- [Alur Kerja Mahasiswa (User Journey)](#alur-kerja-mahasiswa-user-journey)
- [Arsitektur dan Konsep Desain](#arsitektur-dan-konsep-desain)
- [Struktur Data (LocalStorage Schema)](#struktur-data-localstorage-schema)
- [Struktur Direktori Proyek](#struktur-direktori-proyek)
- [Panduan Instalasi dan Menjalankan Aplikasi](#panduan-instalasi-dan-menjalankan-aplikasi)
- [Kredensial Akun Demo](#kredensial-akun-demo)
- [Skenario Pengujian Fitur](#skenario-pengujian-fitur)
- [Lisensi dan Hak Cipta](#lisensi-dan-hak-cipta)

---

## Ruang Lingkup dan Batasan Pengguna

Platform ini secara eksklusif diperuntukkan bagi lingkungan internal **Universitas Pradita (Pradita University)**:

- **Pengguna Berhak**: Mahasiswa aktif, dosen, staf akademik, serta petugas keamanan/operasional kampus Universitas Pradita.
- **Identitas Akun**: Berbasis Nomor Induk Mahasiswa (NIM) atau alamat surel institusi resmi kampus (`@student.pradita.ac.id` untuk mahasiswa dan `@pradita.ac.id` untuk dosen/staf).
- **Cakupan Wilayah Operasional**: Terbatas pada area gedung kampus Universitas Pradita (Scientia Business Park, Gading Serpong, Tangerang), meliputi ruang perkuliahan, laboratorium, perpustakaan, kafetaria/lounge mahasiswa, sarana olahraga, hingga area parkir kendaraan.

---

## Latar Belakang dan Permasalahan di Kampus

Aktivitas perkuliahan dan mobilitas tinggi mahasiswa Universitas Pradita di berbagai fasilitas kampus kerap menimbulkan insiden barang tertinggal atau hilang, seperti laptop perkuliahan, Kartu Tanda Mahasiswa (KTM Pradita), botol minum/tumbler, kunci kendaraan, modul kuliah, dompet, hingga perangkat elektronik pendukung tugas akhir. 

Pendekatan konvensional yang selama ini digunakan di lingkungan kampus memiliki keterbatasan nyata:

1. **Informasi Tersebar dan Tidak Terpusat**: Laporan barang hilang sering kali hanya disebarkan melalui grup percakapan WhatsApp angkatan/kelas atau broadcast media sosial yang cepat tertimbun pesan baru.
2. **Ketiadaan Direktori Pencarian Terstruktur**: Mahasiswa korban kehilangan kesulitan menelusuri laporan temuan karena tidak adanya filter kategori barang, tanggal kejadian, atau lokasi spesifik di kampus Pradita.
3. **Risiko Klaim Sepihak Tanpa Verifikasi**: Penemu barang atau petugas resepsionis kesulitan memvalidasi keabsahan pihak yang mengaku sebagai pemilik sah.
4. **Status Barang Tidak Terbarui**: Laporan barang yang sejatinya telah kembali tetap beredar di grup percakapan sehingga memicu kerancuan informasi.

---

## Solusi yang Dihadirkan

Platform Lost And Found Universitas Pradita menghadirkan pusat informasi dan layanan terpadu yang terstruktur:

- **Katalog Terpadu Kampus Pradita**: Menampilkan seluruh inventaris barang hilang (*Lost*) dan temuan (*Found*) secara transparan dengan penanda status yang jelas.
- **Pencarian Cepat Berdasarkan Zona Kampus**: Fitur filter cerdas yang mencakup lokasi-lokasi riil Universitas Pradita (Perpustakaan, Lab Komputer & Desain, Ruang Kuliah, Student Lounge/Kantin, dan Area Parkir).
- **Automated Match Detection Engine**: Algoritma pencocokan yang otomatis mendeteksi korelasi antara laporan kehilangan mahasiswa dan laporan penemuan berdasarkan kesamaan kategori, kata kunci judul, serta zona lokasi kampus.
- **Validasi Kepemilikan Terproteksi**: Mekanisme verifikasi identitas (seperti kepemilikan KTM Pradita, nomor seri perangkat, atau ciri khusus rahasia) sebelum proses serah terima fisik dilakukan.
- **Dashboard Personal Mahasiswa**: Visibilitas penuh bagi setiap mahasiswa untuk memantau status laporannya, mengelola data barang, dan menandai barang yang telah kembali (*Returned*).

---

## Fitur Utama Aplikasi

### 1. Halaman Beranda (Landing & Home Page)
- **Hero Section**: Sambutan informatif civitas kampus dengan akses instan tombol *"Laporkan Kehilangan"* dan *"Laporkan Temuan"*, serta kolom pencarian terintegrasi.
- **Statistik Dinamis Kampus (Live Metrics)**:
  - Total Laporan Kehilangan Aktif (*Lost Items*)
  - Total Barang Ditemukan (*Found Items*)
  - Barang Berhasil Dikembalikan ke Pemilik (*Resolved / Returned*)
- **Daftar Laporan Terkini di Kampus**: Menampilkan kartu ringkasan barang terbaru yang dilaporkan mahasiswa.
- **Panduan Alur Layanan Kampus**: Penjelasan alur 4 langkah sistematis (Laporkan, Cari & Cocokkan, Verifikasi Kepemilikan, Serah Terima di Kampus).

### 2. Katalog dan Pencarian Barang (Search & Directory Page)
- **Live Debounced Search**: Pencarian kata kunci instan pada nama barang, deskripsi, dan lokasi tanpa memperlambat browser.
- **Filter Status Tersegmentasi**:
  - `Semua Status` (All Items)
  - `Barang Hilang` (Lost Items Only)
  - `Barang Ditemukan` (Found Items Only)
- **Filter Kategori Barang**: Elektronik & Gadget, Kartu Tanda Mahasiswa (KTM) & Dompet, Kunci Kendaraan, Buku & Dokumen Kuliah, Pakaian & Jaket Almamater, Kacamata, dan Lainnya.
- **Filter Lokasi Kampus Pradita**: Perpustakaan Pradita, Laboratorium Komputer & Desain, Ruang Kuliah Teori Lantai 2-5, Student Lounge / Kantin Pradita, Fasilitas Olahraga, Area Parkir, dan Lobby Utama.
- **Pengurutan Kronologis**: Menampilkan barang berdasarkan waktu pelaporan terbaru atau terlama.
- **Active Filter Chips**: Tombol indikator penyaringan aktif yang dapat dibatalkan per item atau direset secara menyeluruh.

### 3. Formulir Pelaporan Barang (Report Item Page)
- **Mode Pelaporan Ganda**: Pilihan laporan kehilangan (*Lost*) vs laporan penemuan (*Found*).
- **Input Metadata Terstandarisasi**:
  - Judul / Nama Barang
  - Kategori dan Zona Lokasi Kampus Pradita
  - Tanggal dan Estimasi Jam Kejadian
  - Deskripsi Detail Ciri Fisik
  - Tanda Khusus / Ciri Rahasia (disembunyikan dari publik untuk verifikasi klaim)
- **Unggah Gambar & Preset Demo**:
  - Mendukung unggah foto asli dari galeri/penyimpanan perangkat lokal dengan pratinjau instan.
  - Menyediakan 8 preset gambar instan (Laptop, Earphone, Kunci Motor, Dompet, Ransel, Kacamata, Tumbler Minum, Kalkulator Ilmiah) untuk kemudahan pengujian form.
- **Kontak Mahasiswa/Pelapor**: Nama lengkap mahasiswa, NIM/email `@student.pradita.ac.id`, dan nomor WhatsApp aktif.
- **Notifikasi Potensi Kecocokan Cerdas**: Sistem langsung memberi tahu mahasiswa jika ada laporan temuan yang cocok saat mengisi formulir.

### 4. Modal Detail Barang dan Verifikasi Klaim
- **Tampilan Foto Resolusi Tinggi**: Dilengkapi penanganan fallback gambar yang handal.
- **Metadata Insiden Lengkap**: Kategori, ID Referensi laporan, lokasi spesifik di kampus Pradita, tanggal, dan jam kejadian.
- **Instruksi Verifikasi Kepemilikan**: Arahan bagi pemilik asli untuk membuktikan kepemilikan sah (misalnya menunjukkan KTM Pradita atau mencocokkan ciri rahasia).
- **Formulir Kontak Terarah**: Pengiriman pesan inkuiri/klaim langsung kepada penemu tanpa mengekspos nomor pribadi secara terbuka di halaman publik.
- **Kontrol Hak Akses Pelapor**:
  - Memperbarui status barang menjadi *Returned / Selesai*.
  - Mengedit rincian data laporan barang.
  - Menghapus laporan jika terjadi kekeliruan input.

### 5. Dashboard Pengguna Mahasiswa (User Dashboard)
- **Ringkasan Metrik Personal**:
  - Jumlah barang hilang yang dilaporkan
  - Jumlah barang temuan yang diamankan
  - Rekomendasi kecocokan barang yang terdeteksi
  - Riwayat laporan yang telah selesai
- **Tab Laporan Saya**:
  - Manajemen penuh laporan pribadi mahasiswa dengan filter status (Semua, Aktif, Selesai).
- **Tab Rekomendasi Kecocokan (Potential Matches)**:
  - Perbandingan berdampingan (*side-by-side*) antara barang yang dilaporkan mahasiswa dan temuan pengguna lain di kampus.
  - Rincian skor kecocokan persentase dan parameter analisis (kesamaan kategori, nama barang, dan lokasi).

### 6. Profil Mahasiswa dan Log Aktivitas
- **Profil Akademik**: Nama mahasiswa, NIM/Peran, avatar inisial akun, serta tanggal bergabung.
- **Pembaruan Informasi Akun**: Edit nomor telepon kontak dan biodata.
- **Keamanan Akun**: Form penggantian kata sandi dengan validasi keamanan.
- **Linimasa Aktivitas (Activity Log)**: Catatan riwayat aktivitas pelaporan, pesan masuk/keluar, dan pembaruan status laporan.

### 7. Autentikasi Pengguna & Akun Demo Pradita
- Halaman Masuk (*Login*) dan Pendaftaran Akun (*Register*) terintegrasi.
- **Akses Cepat Demo Kampus (1-Click Login)**:
  - **Akun Mahasiswa Pradita**: Alex Rivera (`alex.rivera@student.pradita.ac.id`)
  - **Akun Dosen / Staf Pradita**: Dr. Sarah Jenkins (`sarah.jenkins@pradita.ac.id`)

---

## Algoritma Pencocokan Otomatis (Match Engine)

Sistem mengadopsi algoritma deteksi heuristik deterministik berbasis skor bobot untuk mencocokkan laporan kehilangan dan temuan di kampus Universitas Pradita:

```text
                       [ Laporan Baru Mahasiswa ]
                                   |
                                   v
                      [ Filter Status Berlawanan ]
                  (Lost <---> Found / Status: Active)
                                   |
                                   v
        +--------------------------+--------------------------+
        |                          |                          |
        v                          v                          v
 [ Skor Kategori ]         [ Skor Kata Kunci ]         [ Skor Lokasi ]
   Bobot: +40 poin           Bobot: +20-40 poin          Bobot: +25 poin
  (Jika kategori sama)      (Tokenisasi judul &         (Jika lokasi di zona
                             deskripsi barang)           kampus yang sama)
        |                          |                          |
        +--------------------------+--------------------------+
                                   |
                                   v
                        [ Total Skor Kecocokan ]
                                   |
                     Skor >= Threshold (30 poin)
                                   |
                                   v
                [ Rekomendasi Kecocokan Ditampilkan ]
```

### Parameter Penilaian:
- **Kategori Sama (+40 Poin)**: Menjadi dasar utama penentuan jenis barang.
- **Kata Kunci Judul Cocok (+20 hingga +40 Poin)**: Token kata pada judul barang dicocokkan setelah penyaringan kata umum.
- **Zona Lokasi Kampus Pradita Cocok (+25 Poin)**: Memperhitungkan probabilitas barang tertinggal di area gedung/ruangan yang identik.
- **Ambang Batas Rekomendasi**: Rekomendasi otomatis dimunculkan kepada mahasiswa jika total skor mencapai minimal 30 poin.

---

## Alur Kerja Mahasiswa (User Journey)

### Skenario A: Mahasiswa Kehilangan Barang di Kampus
1. Mahasiswa membuka portal Lost And Found Universitas Pradita dan memilih opsi **Saya Kehilangan Barang**.
2. Mahasiswa melengkapi formulir: nama barang (misal: *"Laptop ASUS ROG Strix"*), kategori `Elektronik`, lokasi `Lab Komputer Gedung Pradita Lantai 3`, perkiraan jam kejadian, serta foto barang.
3. Laporan terbit di katalog publik kampus dengan status badge merah `Lost`.
4. Sistem Match Engine secara otomatis memindai laporan temuan dari mahasiswa lain atau petugas kampus.
5. Ketika kecocokan terdeteksi di Dashboard pada tab **Barang Cocok**, mahasiswa meninjau detail temuan dan mengirim pesan klarifikasi kepemilikan.
6. Setelah proses verifikasi fisik di kampus selesai, mahasiswa menandai status laporan menjadi `Returned`.

### Skenario B: Mahasiswa Menemukan Barang di Kampus
1. Mahasiswa menemukan barang tertinggal (misal: *"KTM Universitas Pradita dan Dompet"* di Kafetaria Lantai 1).
2. Mahasiswa membuka form dan memilih opsi **Saya Menemukan Barang**.
3. Mahasiswa memasukkan ciri umum barang dan menyimpan tanda verifikasi rahasia (seperti nomor NIM atau kartu tertentu di dalamnya).
4. Laporan terbit pada katalog dengan status badge hijau `Found`.
5. Pemilik asli melihat laporan tersebut dan mengajukan klaim verifikasi dengan menyebutkan tanda rahasia tersebut.
6. Setelah identitas terbukti valid, serah terima dilakukan di area kampus dan status laporan diubah menjadi `Returned`.

---

## Arsitektur dan Konsep Desain

Platform dirancang dengan standar arsitektur web modern yang ringan, cepat, dan terisolasi:

- **Vanilla JavaScript Architecture (SPA)**: Tanpa framework pihak ketiga yang berat, menghasilkan ukuran bundle yang sangat hemat daya dan waktu muat instan di jaringan kampus.
- **Sistem Desain Berbasis Variabel CSS (Tokens)**:
  - Latar Belakang: `#ffffff` (Putih Bersih), `#f8fafc` (Slate 50), `#f1f5f9` (Slate 100).
  - Tipografi: `#0f172a` (Teks Utama) dan `#334155` (Teks Sekunder).
  - Aksen Institusional: `#2563eb` (Biru Institusi) dengan interaksi hover `#1d4ed8`.
  - Indikator Status:
    - `Lost`: Latar `#fef2f2`, Teks `#991b1b`, Border `#fecaca`.
    - `Found`: Latar `#f0fdf4`, Teks `#166534`, Border `#bbf7d0`.
    - `Returned`: Latar `#f8fafc`, Teks `#475569`, Border `#cbd5e1`.
- **Tipografi Modern**: Memanfaatkan keluarga font institusional **Plus Jakarta Sans** dari Google Fonts.
- **Tata Letak Adaptif**: Responsif penuh pada perangkat laptop mahasiswa, komputer laboratorium, tablet, hingga smartphone melalui drawer navigasi mobile.

---

## Struktur Data (LocalStorage Schema)

Seluruh status data tersimpan persisten pada penyimpanan lokal browser (`localStorage`) sehingga data pengujian tidak hilang saat halaman dimuat ulang:

```javascript
{
  // 1. Data Akun Mahasiswa / Civitas Pradita
  "laf_users": [
    {
      "id": "usr_001",
      "name": "Alex Rivera",
      "email": "alex.rivera@student.pradita.ac.id",
      "phone": "+62 812-3456-7890",
      "role": "Mahasiswa",
      "avatar": "AR",
      "bio": "Mahasiswa Informatika Universitas Pradita Angkatan 2024",
      "joined": "2024-08-15"
    }
  ],

  // 2. Data Laporan Barang di Kampus
  "laf_items": [
    {
      "id": "itm_001",
      "userId": "usr_001",
      "title": "MacBook Air M2 13-inch Silver",
      "category": "Elektronik",
      "status": "lost", // 'lost' | 'found' | 'returned'
      "description": "Tertinggal di meja ruang baca Perpustakaan Pradita...",
      "additionalInfo": "Stiker GitHub dan stiker logo Pradita di sudut kanan bawah",
      "location": "Perpustakaan Pradita University, Lantai 2",
      "date": "2026-09-12",
      "time": "14:30",
      "image": "data:image/jpeg;base64,...",
      "contactName": "Alex Rivera",
      "contactEmail": "alex.rivera@student.pradita.ac.id",
      "contactPhone": "+62 812-3456-7890",
      "createdAt": "2026-09-12T14:45:00.000Z",
      "updatedAt": "2026-09-12T14:45:00.000Z"
    }
  ],

  // 3. Pesan Verifikasi Kepemilikan Barang
  "laf_inquiries": [
    {
      "id": "inq_001",
      "itemId": "itm_001",
      "senderName": "Dr. Sarah Jenkins",
      "senderEmail": "sarah.jenkins@pradita.ac.id",
      "senderPhone": "+62 811-9876-5432",
      "message": "Barang ini telah diamankan oleh staf di front desk Perpustakaan Pradita...",
      "createdAt": "2026-09-13T09:15:00.000Z"
    }
  ],

  // 4. Riwayat Aktivitas Pengguna
  "laf_activities": [
    {
      "id": "act_001",
      "userId": "usr_001",
      "action": "Melaporkan barang hilang di Perpustakaan Pradita: MacBook Air M2",
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
├── index.html                 # Dokumen entri utama HTML & font Pradita UI
├── package.json               # Konfigurasi dependensi dan scripts build
├── package-lock.json          # Rekam versi dependensi npm
├── README.md                  # Dokumentasi teknis proyek Universitas Pradita
└── src/                       # Kode sumber aplikasi
    ├── components/            # Komponen antarmuka pengguna modular
    │   ├── Footer.js          # Footer institusional Universitas Pradita
    │   ├── ItemCard.js        # Komponen kartu item katalog barang
    │   ├── ItemDetailModal.js # Modal detail, verifikasi klaim, dan kontak
    │   ├── Modal.js           # Komponen dasar wrapper dialog modal
    │   ├── Navbar.js          # Navigasi utama dan menu mobile drawer
    │   └── Toast.js           # Notifikasi pop-up feedback sistem
    ├── data/                  # Layer data dan state management
    │   ├── seedData.js        # Data awal demonstrasi di kampus Pradita
    │   └── store.js           # State store reaktif dan matching engine
    ├── styles/                # Arsitektur CSS modular institusional
    │   ├── base.css           # Reset dasar dan typography utilities
    │   ├── components.css     # Styling komponen antarmuka
    │   ├── index.css          # Entri impor utama stylesheet
    │   ├── variables.css      # Design tokens (warna, radius, bayangan)
    │   └── views.css          # Styling spesifik tampilan per view
    ├── views/                 # Komponen halaman (Views)
    │   ├── AuthView.js        # Halaman autentikasi akun mahasiswa & dosen
    │   ├── DashboardView.js   # Dashboard laporan personal & barang cocok
    │   ├── HomeView.js        # Halaman beranda dan metrik ringkasan kampus
    │   ├── ItemsView.js       # Halaman direktori pencarian dan multi-filter
    │   ├── ProfileView.js     # Halaman profil mahasiswa dan log aktivitas
    │   └── ReportView.js      # Formulir pelaporan barang hilang / temuan
    ├── main.js                # Inisialisasi aplikasi dan router
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
git clone https://github.com/MiftahulMidzanNurBahri/RPL-WEB.git
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
Setelah server lokal aktif, buka peramban dan akses alamat:
```text
http://localhost:5173/
```

### 4. Membangun Berkas Distribusi Produksi (Production Build)
Untuk menghasilkan berkas teroptimasi siap publikasi di server kampus:
```bash
npm run build
```
Hasil kompilasi tersimpan pada direktori `dist/`. Anda dapat menguji hasil kompilasi dengan:
```bash
npm run preview
```

---

## Kredensial Akun Demo

Sistem menyediakan dua akun demonstrasi civitas akademika Universitas Pradita untuk mempermudah pengujian alur fungsional tanpa registrasi manual:

| Peran Institusi | Nama Pengguna | Alamat Email Institusi | Kata Sandi | Akses Cepat |
| :--- | :--- | :--- | :--- | :--- |
| **Mahasiswa Pradita** | Alex Rivera | `alex.rivera@student.pradita.ac.id` | `password123` | Tombol "Demo Mahasiswa" pada Form Login |
| **Dosen / Staf Pradita** | Dr. Sarah Jenkins | `sarah.jenkins@pradita.ac.id` | `password123` | Tombol "Demo Dosen" pada Form Login |

---

## Skenario Pengujian Fitur

1. **Uji Pencarian dan Penyaringan Barang Kampus**:
   - Buka menu **Cari Barang**.
   - Ketikkan kata kunci pencarian (misalnya *"KTM"* atau *"MacBook"*).
   - Terapkan filter status `Barang Hilang` dan pilih lokasi `Perpustakaan Pradita`.
   - Amati pembaruan katalog secara instan dan gunakan tombol *Reset Filter* untuk mengembalikan tampilan.
2. **Uji Pelaporan Barang Baru Mahasiswa**:
   - Klik tombol **Laporkan Barang** di bilah navigasi atas.
   - Pilih jenis laporan: **Saya Menemukan Barang**.
   - Lengkapi nama barang, pilih foto dari **Preset Demo Cepat**, tentukan lokasi di kampus Pradita, lalu simpan laporan.
   - Sistem akan memunculkan notifikasi konfirmasi sukses dan menambahkan barang ke katalog publik kampus.
3. **Uji Algoritma Match Engine Kampus**:
   - Akses menu **Dashboard** pada navbar atas.
   - Pilih tab **Barang Cocok** untuk meninjau hasil evaluasi otomatis antara laporan kehilangan dan temuan di kampus Pradita.
   - Klik tombol tindakan untuk memeriksa detail dan mengirim pesan verifikasi kepemilikan.
4. **Uji Penyelesaian Laporan (Mark as Returned)**:
   - Pada Dashboard atau Modal Detail barang milik akun Anda, klik tombol **Tandai Selesai / Dikembalikan**.
   - Status laporan akan diperbarui menjadi `Returned` dan statistik penyelesaian pada beranda kampus akan bertambah secara otomatis.

---

## Lisensi dan Hak Cipta

Proyek ini dikembangkan dan diselesaikan untuk memenuhi instrumen tugas mata kuliah **Rekayasa Perangkat Lunak Berbasis Web (RPL WEB)** di **Universitas Pradita (Pradita University)**.

- **Institusi**: Universitas Pradita (Pradita University), Gading Serpong, Tangerang
- **Pengembang**: MiftahulMidzanNurBahri ([GitHub](https://github.com/MiftahulMidzanNurBahri))
- **Lisensi**: Bebas digunakan untuk keperluan edukasi, pembelajaran, dan pengembangan institusional non-komersial di lingkungan Universitas Pradita.
- **Hak Cipta**: © 2026 Lost And Found Platform — Universitas Pradita. Seluruh hak cipta dilindungi.
