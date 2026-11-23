# Admin Dashboard Implementation (Phase 9)

## 1. Overview & Operational Principles

Portal Administrator (Admin Dashboard) Soulaide dirancang untuk memfasilitasi manajemen operasional harian klinik psikologi tanpa mengorbankan kerahasiaan klinis klien:
1. **Pemisahan Tegas Data Operasional & Data Klinis (Clinical Privacy):**
   - Admin operasional memiliki akses penuh untuk mengelola ketersediaan, status pemesanan, dan transaksi keuangan.
   - Sesuai standar `docs/SECURITY_AND_PRIVACY.md`, **admin dilarang mengakses catatan observasi klinis (`Soulaide_clinical_notes`)**. Catatan klinis murni diisolasi untuk psikolog penanggung jawab dan super admin berlisensi klinis.
2. **Rekonsiliasi Pembayaran & Refund Gateway Midtrans:**
   - Memantau status transaksi Midtrans Snap secara langsung.
   - Memproses pengembalian dana (*refund*) parsial maupun penuh yang tercatat ke tabel `Soulaide_refunds` dan termutasi ke status pembayaran.
3. **Manajemen Pemesanan & Alokasi Psikolog:**
   - Pemantauan status reservasi real-time (*Pending Payment*, *Confirmed*, *Reschedule Requested*, *Completed*, *Cancelled*, *No-Show*).
   - Opsi pengalihan penugasan psikolog (*reassign psychologist*).
4. **Otorisasi Staf & Perlindungan Super Admin:**
   - Daftar staf dan role pengguna (`customer`, `psychologist`, `admin`, `super_admin`).
   - Penegakan aturan bahwa pengubahan wewenang staf hanya dapat dilakukan oleh akun berlevel `super_admin`.
5. **Jejak Audit Sistem Terpadu (Audit Trail):**
   - Seluruh mutasi status pemesanan, transaksi refund, pengalihan psikolog, dan perubahan role staf dicatat secara permanen ke `Soulaide_audit_logs`.

---

## 2. Struktur Modul & Sub-Komponen

Modul administrator diimplementasikan pada `src/features/admin/`:

1. **`AdminDashboardPage.tsx`:**
   - Kontroler pusat dengan tab navigasi lengkap:
     - `overview`: Ringkasan KPI dan aktivitas terkini
     - `bookings`: Operasional jadwal & penugasan psikolog
     - `payments`: Rekonsiliasi transaksi Midtrans & refund
     - `services`: CMS Katalog Layanan & Tarif
     - `psychologists`: CMS Profil Psikolog
     - `staff`: Otoritas Pengguna & Hak Akses
     - `audit-logs`: Penampil Jejak Audit Sistem
     - `faqs`: Manajemen Pusat Bantuan
     - `settings`: Pengaturan Konfigurasi Situs

2. **`AdminOverviewTab.tsx`:**
   - Menampilkan metrik KPI real-time (Total Booking, Sesi Terkonfirmasi, Menunggu Bayar, Pendapatan Bersih, Psikolog Terdaftar, Layanan Aktif).
   - Peringatan antrean pemesanan yang memerlukan tindakan admin.
   - Stream log aktivitas audit terkini.

3. **`AdminBookingsTab.tsx`:**
   - Tabel pemesanan lengkap dengan filter status dan metode (Online/Tatap Muka).
   - Fitur pencarian multi-parameter (kode booking, nama klien, email, psikolog).
   - Tindakan operasional: Konfirmasi Lunas, Setujui Reschedule, Tandai Selesai, Batalkan Sesi, dan Modal Pengalihan Psikolog.

4. **`AdminPaymentsTab.tsx`:**
   - Rekonsiliasi pembayaran dengan nomor Order ID Midtrans.
   - Modal proses *refund* dengan validasi nominal batas atas dan alasan tertulis.

5. **`AdminStaffTab.tsx`:**
   - Daftar otorisasi pengguna.
   - Selektor promosi/demofikasi role pengguna dengan *Super Admin Guard* di sisi UI dan PostgreSQL RLS.

6. **`AdminAuditLogsTab.tsx`:**
   - Penampil riwayat audit sistem dengan pencarian teks dan *JSON viewer* untuk inspeksi payload metadata.

7. **`adminService.ts`:**
   - Kueri kalkulasi KPI, penarikan data relasional booking & payment, eksekusi pembaruan status, pencatatan jejak audit, dan pemrosesan refund.

---

## 3. Hasil Pengujian Unit

Seluruh pengujian unit pada `src/features/admin/admin.test.ts` berhasil:
- Kalkulasi akurat KPI operasional dan pendapatan bersih dari transaksi lunas.
- Pemfilteran status reservasi dan pencarian kata kunci klien.
- Perlindungan hak istimewa Super Admin untuk manajemen role.
- Validasi aturan pengembalian dana (*refund* penuh, parsial, penolakan nominal melebihi nilai transaksi, dan penolakan nominal non-positif).
