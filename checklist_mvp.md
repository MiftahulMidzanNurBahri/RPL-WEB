# Checklist Evaluasi & Finalisasi MVP
**Lost And Found — Platform Pelaporan Barang Hilang & Ditemukan Mahasiswa Universitas Pradita**

Dokumen ini mendokumentasikan status implementasi, pengujian, cakupan integrasi full-stack, serta penanganan kasus ekstrem (*edge cases*) pada seluruh modul inti Minimum Viable Product (MVP).

---

## 1. Tabel Komprehensif Fitur Inti MVP

| ID Modul | Fitur / Spesifikasi Inti | Komponen Terlibat | Status Pengujian | Skenario Edge Case Teruji |
| :--- | :--- | :--- | :---: | :--- |
| **MVP-01** | **Autentikasi & Otorisasi Pengguna**<br>Registrasi domain resmi Pradita, penetapan peran otomatis (`student` vs `faculty_staff`), login berbasis sesi cookie `HttpOnly`, proteksi CSRF, dan ganti kata sandi. | `apps/api/src/routes/auth.routes.ts`<br>`apps/api/src/lib/sessions.ts`<br>`apps/web/src/pages/AuthPage.tsx`<br>`apps/web/src/auth/AuthProvider.tsx` | `UNIT TEST: PASSED`<br>`E2E: PASSED` | • Penolakan domain email umum (mis. `@gmail.com`).<br>• Larangan pendaftaran NIM oleh akun staf.<br>• Password mismatch validation feedback.<br>• Rate limiting brute-force login.<br>• Verifikasi token CSRF pada mutasi data. |
| **MVP-02** | **Pelaporan Barang (Lost & Found CRUD)**<br>Formulir pelaporan kehilangan dan temuan, pemilihan kategori, lokasi kampus, tanggal/jam kejadian, ciri verifikasi rahasia, serta unggah foto/preset. | `apps/api/src/routes/items.routes.ts`<br>`apps/api/src/lib/schemas.ts`<br>`apps/web/src/pages/ReportPage.tsx`<br>`apps/web/src/pages/demoPresets.ts` | `UNIT TEST: PASSED`<br>`E2E: PASSED` | • Laporan kehilangan wajib mengisi kategori, lokasi, dan tanggal.<br>• Laporan temuan wajib menyertakan foto.<br>• Validasi batas waktu penyerahan operasional (09:00 - 19:00 WIB).<br>• Penolakan tanggal masa depan / tanggal kalender mustahil (mis. 30 Februari).<br>• Pembatasan ukuran file maksimal 5 MB dengan verifikasi magic bytes (MIME). |
| **MVP-03** | **Katalog Publik & Pencarian Cerdas**<br>Pencarian debounced multi-field (judul, deskripsi, lokasi), segmented filter status (*Semua*, *Lost*, *Found*), filter dropdown, paginasi data, dan pengurutan (*newest/oldest*). | `apps/api/src/routes/items.routes.ts`<br>`apps/web/src/pages/ItemsPage.tsx`<br>`apps/web/src/components/ItemCard.tsx` | `UNIT TEST: PASSED`<br>`E2E: PASSED` | • Penanganan string query kosong (*whitespace*) tanpa memicu filter palsu.<br>• Tampilan *empty state* yang informatif saat pencarian tidak menghasilkan data.<br>• Skeleton loading state saat data sedang diambil.<br>• Paginasi aman saat data melebihi 1 halaman.<br>• Laporan *returned* dan *archived* otomatis dikeluarkan dari katalog aktif. |
| **MVP-04** | **Mesin Pencocokan Otomatis (Match Engine)**<br>Algoritma scoring deterministik antara laporan bertipe lawan (`lost` vs `found`) berbasis kesamaan kategori (+40), kata kunci teks (+20 / +40), dan normalisasi lokasi kampus (+25). Threshold kelayakan >= 30. | `apps/api/src/services/matching.ts`<br>`apps/api/src/routes/domain.routes.ts`<br>`apps/web/src/pages/DashboardPage.tsx` | `UNIT TEST: PASSED`<br>`E2E: PASSED` | • Normalisasi teks lokasi bebas terhadap spasi berlebih, tanda baca, dan perbedaan huruf besar/kecil.<br>• Deteksi perbedaan nomor ruangan (mis. Ruang 14 vs Ruang 301 tidak dicocokkan).<br>• Rekomendasi hanya diberikan untuk laporan yang masih aktif dan bukan milik pengguna sendiri.<br>• Alasan kecocokan ditampilkan tanpa membocorkan ciri rahasia pelapor. |
| **MVP-05** | **Komunikasi Terlindungi & Klaim (Inquiry System)**<br>Pengiriman pesan klaim kepemilikan dan pertanyaan detail kepada pelapor tanpa mengekspos nomor telepon atau email di halaman publik. | `apps/api/src/routes/domain.routes.ts`<br>`apps/web/src/pages/ItemDetailPage.tsx`<br>`apps/web/src/pages/DashboardPage.tsx` | `UNIT TEST: PASSED`<br>`E2E: PASSED` | • Pencegahan pengiriman inquiry kepada diri sendiri.<br>• Larangan mengirim inquiry pada barang yang sudah berstatus *returned*.<br>• Rate limiting pengiriman inquiry per jam.<br>• Pembaruan status inquiry (*pending*, *replied*, *resolved*) oleh penerima.<br>• Pelapor dapat melihat pesan langsung di tab komunikasi dashboard. |
| **MVP-06** | **Siklus Hidup Laporan (Lifecycle, Renewal & Retention)**<br>Penandaan status *returned*, perpanjangan masa aktif laporan (+14 hari), auto-archive laporan kedaluwarsa, dan auto-purge barang selesai setelah melewati retensi 3 hari. | `apps/api/src/services/item-archiving.ts`<br>`apps/api/src/services/returned-item-cleanup.ts`<br>`apps/api/src/routes/items.routes.ts` | `UNIT TEST: PASSED`<br>`E2E: PASSED` | • Transaksi atomik perubahan status *returned* beserta pencatatan ActivityLog.<br>• Laporan *returned* dipertahankan selama masa tenggang 3 hari untuk kebutuhan verifikasi sebelum dipurged.<br>• Soft-delete untuk pembatalan laporan agar rekam jejak audit tidak hilang.<br>• Perpanjangan masa aktif (renewal) hanya diperbolehkan untuk laporan aktif. |
| **MVP-07** | **Dashboard Personal & Profil Akademik**<br>Statistik agregat pribadi (barang hilang, ditemukan, rekomendasi cocok), riwayat aktivitas pribadi (*ActivityLog*), dan pengaturan profil (nama, telepon, bio). | `apps/api/src/routes/domain.routes.ts`<br>`apps/web/src/pages/DashboardPage.tsx`<br>`apps/web/src/pages/ProfilePage.tsx` | `UNIT TEST: PASSED`<br>`E2E: PASSED` | • Sanitasi string kosong pada nomor telepon dan bio agar tidak tersimpan sebagai spasi kosong.<br>• Email institusi dan role dikunci (*read-only*) untuk menjaga integritas civitas.<br>• Inisial avatar otomatis diperbarui saat nama pengguna diubah.<br>• Log aktivitas personal terisolasi (pengguna hanya dapat melihat aktivitas akunnya sendiri). |

---

## 2. Ringkasan Eksekusi Suite Pengujian Otomatis

Seluruh pengujian dijalankan menggunakan Node.js native test runner via TypeScript runner (`tsx --test`):

```text
> @lost-and-found/api@1.0.0 test
> tsx --test "src/**/*.test.ts"

✔ requires lost report metadata before creating a report (MVP-02: Form Validation)
✔ accepts valid found reports only within operating hours (MVP-02: Business Rules)
✔ rejects impossible incident dates and future dates (MVP-02: Date Validation)
✔ ignores blank search filters instead of treating them as real values (MVP-03: Query Sanitization)
✔ treats blank phone and bio values as absent profile data (MVP-07: Profile Sanitization)
✔ adds the configured 14-day report expiration window (MVP-06: Expiration Lifecycle)
✔ includes only unarchived active lost or found reports in the active query (MVP-03: Catalog Isolation)
✔ awards category and location points (MVP-04: Deterministic Matching)
✔ awards stronger keyword points for at least three shared tokens (MVP-04: Keyword Overlap)
✔ does not award points for unrelated reports (MVP-04: Match Exclusion)
✔ matches equivalent free-form locations despite case, punctuation, and spacing (MVP-04: Location Normalization)
✔ does not match free-form locations with different room numbers (MVP-04: Precision Matching)
✔ does not award location points for empty or whitespace-only locations (MVP-04: Blank Location Edge Case)
✔ uses a three-day retention cutoff (MVP-06: Returned Retention Rule)
✔ purges only expired returned items and preserves related history (MVP-06: Cascade Cleanup Isolation)
✔ E2E API Flow: Authentication, Catalog, Items, Inquiries, and Return Lifecycle (MVP E2E Integration)

ℹ tests 16
ℹ pass 16
ℹ fail 0
```

---

## 3. Verifikasi Error Handling & Feedback UI

1. **State Loading:**
   - Semua halaman utama (`HomePage`, `ItemsPage`, `ItemDetailPage`, `DashboardPage`, `ProfilePage`) dilengkapi *skeleton loader* yang halus tanpa pergeseran tata letak (*layout shift*).
2. **State Data Kosong (Empty State):**
   - Katalog publik menampilkan ilustrasi dan tombol aksi reset filter bila kata kunci atau kombinasi filter tidak menghasilkan rekaman.
   - Dashboard personal menampilkan instruksi ramah bila belum memiliki laporan, rekomendasi cocok, atau pesan inquiry.
3. **Pemberitahuan Interaktif (Toast & Modal Konfirmasi):**
   - Tindakan destruktif (menghapus laporan atau menandai barang dikembalikan) mewajibkan konfirmasi modal terlebih dahulu.
   - Seluruh mutasi data sukses maupun gagal menampilkan pesan *toast* berbahasa Indonesia yang jelas dan mudah dipahami pengguna.
4. **Keamanan & Otorisasi Privasi:**
   - Ciri rahasia (*additionalInfo*) secara ketat hanya dikirim pada respons API kepada pemilik asli laporan (`isMine: true`).
   - Nomor telepon dan kontak pribadi tidak pernah dipublikasikan di katalog maupun detail barang, melainkan dialihkan secara aman melalui jalur pesan inquiry platform.
