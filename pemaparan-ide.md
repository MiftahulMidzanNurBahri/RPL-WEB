# 1. TEMA (Mengerucut)
**Sistem Lost & Found Kampus Terpadu Berbasis Web (Campus Lost and Found Hub)**

Aplikasi web terpusat yang dirancang khusus untuk lingkungan kampus guna menjembatani pelaporan, pelacakan, pencarian, dan proses serah-terima barang yang hilang maupun barang yang ditemukan oleh civitas academica secara transparan, aman, dan terverifikasi.

---

### A. Deskripsi Masalah
1. **Penyebaran Informasi yang Terfragmentasi dan Cepat Tenggelam:**
   Saat ini, mahasiswa atau staf yang kehilangan maupun menemukan barang mengandalkan kanal informal seperti grup WhatsApp kelas/angkatan, Instagram Story, atau akun *menfess* (Twitter/X). Informasi di media ini sangat cepat tertimbun pesan baru sehingga peluang barang ditemukan kembali menjadi sangat kecil.
2. **Tidak Ada Tempat Pusat Informasi (Single Source of Truth):**
   Korban yang kehilangan barang sering kebingungan harus mencari ke mana: apakah harus bertanya ke ruang kelas, sekretariat jurusan, kantor satpam, musholla, atau kantin. Di sisi lain, penemu barang sering kali bingung ke mana harus menitipkan barang temuan.
3. **Risiko Klaim Palsu dan Kurangnya Validasi:**
   Klaim barang yang disebarkan lewat media sosial terbuka rentan dimanfaatkan oleh oknum tidak bertanggung jawab karena tidak adanya sistem verifikasi kepemilikan (misal: ciri khusus, nomor identitas, bukti pembelian, atau verifikasi kartu identitas).
4. **Pendataan Manual di Pos Keamanan/Satpam:**
   Barang-barang temuan yang diserahkan ke pos satpam atau bagian sarana prasarana sering kali hanya ditumpuk atau dicatat di buku register fisik yang rawan hilang, rusak, dan tidak dapat diakses secara publik oleh mahasiswa.

---

### B. Profil Target Pengguna
1. **Mahasiswa (Pengguna Utama):**
   - Karakteristik: Memiliki mobilitas tinggi antar gedung/ruangan kampus dan aktif menggunakan perangkat mobile/laptop.
   - Kebutuhan: Kemudahan mencari barang yang hilang, membuat laporan penemuan dengan cepat, serta mendapatkan notifikasi/update status barang.
2. **Dosen dan Tenaga Kependidikan (Tendik/Staf):**
   - Karakteristik: Beraktivitas di lingkungan kampus/gedung fakultas.
   - Kebutuhan: Wadah resmi untuk melaporkan barang tertinggal di ruang kerja atau ruang kelas.
3. **Petugas Keamanan Kampus (Satpam) / Unit Sarpras (Admin Operasional):**
   - Karakteristik: Pihak berwenang yang bertindak sebagai pos penerimaan fisik barang temuan di kampus.
   - Kebutuhan: Dashboard pendataan inventaris barang temuan, pencatatan serah-terima fisik, dan verifikasi identitas pengambil barang (KTM/KTP).
4. **Administrator Sistem:**
   - Karakteristik: Pengelola teknis web.
   - Kebutuhan: Manajemen kategori barang, manajemen akun, audit log aktivitas sistem, serta pemantauan data laporan.

---

### C. Manfaat Aplikasi
1. **Bagi Pemilik Barang (Korban Kehilangan):**
   - Mempercepat proses menemukan kembali barang berharga yang hilang.
   - Memiliki kanal pencarian terstruktur berdasarkan kategori, lokasi gedung, dan rentang tanggal.
   - Keamanan identitas dan privasi terjaga melalui mekanisme klaim yang terverifikasi.
2. **Bagi Penemu Barang:**
   - Menyediakan jalur pelaporan resmi dan aman tanpa harus mempublikasikan nomor kontak pribadi di media sosial publik.
   - Memberikan petunjuk jelas lokasi penyerahan fisik barang (misal: pos satpam gedung terkait).
3. **Bagi Institusi Kampus dan Petugas Keamanan:**
   - Modernisasi operasional layanan kampus melalui digitalisasi inventaris barang temuan.
   - Transparansi penuh atas alur serah-terima barang dengan rekam jejak digital yang jelas.
   - Mengurangi penumpukan barang tak bertuan di ruang satpam/sarpras.

---

### D. Daftar Fitur Inti
1. **Autentikasi & Manajemen Akun:**
   - Registrasi dan Login pengguna (mahasiswa/staf dengan email kampus/umum).
   - Pembagian hak akses berbasis peran (*Role-based Access Control*: Mahasiswa/Pengguna, Petugas Pos Satpam, Administrator).
2. **Formulir Laporan Kehilangan (Lost Item Report):**
   - Input nama barang, kategori (Elektronik, Dokumen/Kartu Identitas, Kunci, Pakaian/Aksesoris, dll.).
   - Deskripsi ciri khusus, lokasi terakhir diingat (pilihan nama gedung/ruangan kampus), perkiraan tanggal dan waktu hilang.
   - Opsi upload foto referensi barang.
3. **Formulir Laporan Penemuan (Found Item Report):**
   - Input detail barang temuan, lokasi penemuan, kondisi barang, dan tanggal ditemukan.
   - Upload foto kondisi barang asli.
   - Pilihan status penempatan fisik: "Dititipkan di Pos Satpam [Gedung X]" atau "Disimpan Sementara oleh Penemu".
4. **Katalog & Pencarian Cerdas (Search & Filter System):**
   - Tampilan katalog visual untuk daftar barang hilang dan barang ditemukan.
   - Filter dinamis berdasarkan: status (*Lost* / *Found*), kategori barang, lokasi gedung/area kampus, dan rentang tanggal.
   - Pencarian kata kunci (*search bar*) nama barang.
5. **Sistem Pengajuan Klaim & Verifikasi Kepemilikan:**
   - Tombol "Ajukan Klaim Ini Milik Saya" pada barang yang berstatus ditemukan.
   - Formulir bukti klaim (pengguna harus menyebutkan detail ciri tersembunyi yang tidak tampak di foto umum, nomor seri, atau foto bukti pendukung).
   - Validasi klaim oleh penemu/petugas keamanan sebelum serah-terima disetujui.
6. **Pelacakan Status Barang (Status Lifecycle Tracking):**
   - Indikator status yang jelas pada setiap laporan:
     - *Open* (Belum ada titik temu / barang baru dilaporkan).
     - *Claim In Review* (Sedang ada proses pengajuan klaim/verifikasi).
     - *Resolved / Returned* (Barang sudah berhasil dikembalikan ke pemilik sah).
     - *Archived / Expired* (Laporan sudah melewati batas waktu retensi tertentu).
7. **Dashboard Petugas Keamanan (Satpam) / Admin:**
   - Log serah-terima barang secara digital (mencatat siapa yang menyerahkan, siapa yang mengambil, waktu serah terima, dan nomor identitas KTM/KTP).
   - Rekap statistik barang (jumlah barang dilaporkan, ditemukan, dan berhasil dikembalikan).

---

### E. Fitur yang Tidak Dikerjakan (Out of Scope)
1. **Pelacakan Posisi Real-Time via GPS / IoT:**
   Sistem tidak terhubung dengan sensor fisik, tag pelacak GPS (seperti Apple AirTag), maupun beacon hardware.
2. **Layanan Ekspedisi / Pengiriman Logistik:**
   Aplikasi tidak menyediakan kurir atau pengiriman barang; proses pengambilan barang wajib dilakukan secara langsung (tatap muka) di pos kampus terkait.
3. **Sistem Finansial atau Hadiah (Reward Payment Gateway):**
   Tidak ada integrasi sistem pembayaran atau transfer uang untuk pemberian tip/imbalan kepada penemu guna menghindari motif komersialisasi atau perselisihan nominal.
4. **Kecerdasan Buatan Tingkat Lanjut (Advanced AI Computer Vision / Biometric):**
   Sistem tidak mengimplementasikan pengenalan wajah pengguna atau pencocokan gambar berbasis AI otomatis skala tinggi pada fase ini (fokus pada pencocokan data terstruktur & verifikasi manual yang valid).
5. **Investigasi Hukum Pidana:**
   Aplikasi bukan pengganti laporan kepolisian untuk kasus dugaan pencurian berat/tindak kriminal; ranah hukum tetap diselesaikan melalui prosedur otoritas keamanan resmi kampus.

---

### F. Kriteria Keberhasilan Aplikasi
1. **Keandalan Fungsional (Functional Completeness):**
   Seluruh alur utama (pembuatan laporan kehilangan & penemuan, pencarian filter, pengajuan klaim, validasi oleh petugas, dan perubahan status menjadi *Resolved*) berjalan 100% tanpa kendala teknis krusial.
2. **Efisiensi Waktu Temu (Match & Resolution Efficiency):**
   Mengurangi waktu yang dibutuhkan civitas academica dalam melacak dan mengklaim barang temuan dari yang biasanya memakan waktu berhari-hari di media sosial menjadi hitungan jam setelah laporan terbit.
3. **Akurasi Validasi Kepemilikan (Zero Misclaim):**
   Tingkat keberhasilan verifikasi mencapai 100% tanpa adanya insiden salah serah barang kepada pihak yang tidak berhak, dibuktikan dengan kesesuaian ciri-ciri khusus dan pencatatan identitas resmi saat serah-terima.
4. **Kemudahan Penggunaan (Usability & User Satisfaction):**
   Antarmuka web responsif dan intuitif saat diakses via ponsel maupun desktop, dengan target skor *System Usability Scale* (SUS) minimal 75 (kategori *Good / Excellent*).
5. **Tingkat Penyelesaian Barang (Resolution Rate):**
   Mencapai tingkat pengembalian barang (*successful return rate*) minimal 40% dari total barang temuan yang didata dalam sistem.
