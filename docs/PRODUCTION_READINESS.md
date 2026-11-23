# Phase 11 — Production Readiness Review & Checklist

Dokumen audit kesiapan produksi (*production readiness*) untuk platform psikologi Soulaide, mencakup verifikasi keamanan, isolasi privasi klinis, validasi RLS, checklist aktivasi pembayaran QRISGate, rencana pemulihan bencana (*disaster recovery*), dan pemantauan sistem.

---

## 1. Security Review & Clinical Privacy Audit

### 1.1 Isolasi Catatan Klinis (*Clinical Notes Boundary*)
Sesuai kode etik psikologi HIMPSI dan prinsip hak istimewa terkecil (*least privilege*):
- **Struktur Tabel:** Data rekam medis dan catatan perkembangan disimpan dalam `public."Soulaide_clinical_notes"`.
- **Enforcement RLS:** 
  - Klien **tidak dapat** mengubah catatan klinis.
  - Staf operasional/Admin **STRICTLY BLOCKED** dari melihat atau melakukan query terhadap tabel `Soulaide_clinical_notes`.
  - Hanya psikolog penanggung jawab yang terdaftar dan `super_admin` (khusus audit kepatuhan klinis) yang memiliki izin akses.
- **Penyimpanan Berkas Asesmen:** Semua berkas laporan klinis wajib menggunakan Supabase Private Storage dengan akses melalui *time-limited signed URLs*.

### 1.2 Isolasi Kunci Rahasia (*Secret Zero-Leakage*)
- **Frontend Bundle Security:** Kunci rahasia seperti `QRISGATE_API_KEY`, `QRISGATE_WEBHOOK_SECRET`, dan `SUPABASE_SERVICE_ROLE_KEY` **TIDAK PERNAH** diberi awalan `VITE_` dan tidak dimasukkan ke dalam bundel klien Vite.
- **Edge Functions:** Seluruh proses pembayaran, pembuatan transaksi QRISGate, dan penerimaan webhook dijalankan di Supabase Edge Functions yang terisolasi secara server-authoritative.
- **Verifikasi Kriptografis Webhook:** Menggunakan HMAC-SHA256 berbasis Web Crypto API standar untuk memvalidasi `X-QRISGate-Signature` atas `timestamp + "." + rawBody` dengan webhook secret; timestamp lebih tua dari 5 menit ditolak dan perbandingan dilakukan secara constant-time.

---

## 2. RLS & Role Hierarchy Matrix

| Peran (*Role*) | Akses Booking | Akses Pembayaran & Refund | Profil Klien & Darurat | Catatan Klinis (*Clinical Notes*) | Manajemen Peran Staf |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Anonymous (Publik)** | Baca Layanan/Psikolog | ❌ | ❌ | ❌ | ❌ |
| **Customer** | Sesi Milik Sendiri | Riwayat Milik Sendiri | Profil & Kontak Darurat Sendiri | ❌ | ❌ |
| **Psychologist** | Sesi yang Ditugaskan | ❌ | Kontak Darurat Klien Sesi | Sesi yang Ditugaskan | ❌ |
| **Admin (Operasional)** | Seluruh Booking | Verifikasi & Refund | Informasi Kontak Saja | ❌ **(Dilarang Keras)** | ❌ |
| **Super Admin** | Seluruh Booking | Penuh | Penuh | Audit HIMPSI Terbatas | Penuh |

---

## 3. Checklist Aktivasi Pembayaran QRISGate (Produksi)

> Catatan riwayat: checklist ini menggantikan checklist transisi Sandbox→Produksi Midtrans sejak provider pembayaran diganti menjadi QRISGate pada 2026-11-23.

Sebelum mengaktifkan pembayaran QRISGate di lingkungan produksi, pastikan seluruh langkah berikut telah diverifikasi:

- [ ] **Akun & Merchant QRISGate:** QRIS statis merchant terdaftar di QRISGate (https://qrisgate.web.id) dan rekening bank/e-wallet penerima dana siap (dana masuk langsung ke merchant, tidak ditahan platform).
- [ ] **Kunci API Produksi:**
  - `QRISGATE_API_KEY` (`qg_live_...`) diambil dari dashboard QRISGate tab *API & Webhook* (hanya ditampilkan sekali) dan dimasukkan secara aman ke Supabase Edge Functions Secrets menggunakan `supabase secrets set QRISGATE_API_KEY=...`.
  - Tidak ada kunci QRISGate di variabel frontend/Vercel; secret QRISGate tidak boleh berprefix `VITE_`.
- [ ] **Webhook Secret & URL Terdaftar:**
  - `QRISGATE_WEBHOOK_SECRET` diset melalui `supabase secrets set QRISGATE_WEBHOOK_SECRET=...`.
  - URL webhook produksi didaftarkan pada pengaturan webhook QRISGate:
    `https://[project-ref].supabase.co/functions/v1/qrisgate-webhook`
- [ ] **Deteksi Pembayaran Merchant Aktif:**
  - Konfigurasi sisi merchant (bukan kode aplikasi): APK listener Android (notifikasi DANA, BRImo, myBCA, Livin, ShopeePay, GoPay), detektor berbasis sesi (GoPay Merchant / Shopee Partner / BCA Merchant), atau notifikasi email bank.
  - Khusus merchant GoPay: notifikasi hanya aktif untuk QRIS statis; pembeli memasukkan nominal tepat secara manual pada QR statis yang ditampilkan QRISGate.
- [ ] **Saldo Kredit Merchant:** Saldo kredit QRISGate mencukupi untuk biaya flat Rp 100 per transaksi sukses (atau langganan opsional yang membebaskan biaya telah aktif). Tidak ada MDR persentase.
- [ ] **Uji Transaksi Real (Smoke Test):**
  - Lakukan 1 transaksi uji coba bernilai kecil (misal Rp 10.000 + kode unik), bayar nominal TEPAT `base_amount + unique_code` menggunakan akun bank/e-wallet riil untuk memastikan verifikasi HMAC-SHA256 webhook dan update status `Soulaide_bookings` serta `Soulaide_payments` berhasil 100%.

---

## 4. Performance & Accessibility Review

### 4.1 Bundle & Code Splitting
- **Vite & Rolldown Minification:** Seluruh aset CSS dan JS terkompresi dengan Gzip/Brotli.
- **React 19 Safe Architecture:** Pemuatan asinkron dengan TanStack React Query mencegah re-render siklikal atau efek samping `setState-in-effect`.
- **Lazy Loading Asset:** Komponen modal koordinasi sesi, modal pembayaran QRIS (`QrisPaymentModal`), dan modal eskalasi krisis hanya dirender ketika dibutuhkan.

### 4.2 Standar Aksesibilitas (WCAG 2.1 AA)
- Rasio kontras warna teks terhadap latar belakang memenuhi standar WCAG (rasio minimal 4.5:1 untuk teks normal).
- Label formulir, tombol aksi, dan indikator kehadiran memiliki teks semantik yang jelas untuk pembaca layar (*screen readers*).
- Seluruh elemen interaktif dapat diakses melalui navigasi keyboard (fokus visual ring terlihat jelas).

---

## 5. Rencana Cadangan & Pemulihan Data (*Backup & Disaster Recovery*)

### 5.1 Mekanisme Pencadangan Otomatis Supabase
- **Continuous Archiving / Point-In-Time Recovery (PITR):** Supabase mengarsipkan Write-Ahead Logs (WAL) secara berkelanjutan, memungkinkan pemulihan basis data ke detik mana pun dalam 7 hingga 30 hari terakhir.
- **Cadangan Harian (*Daily Snapshot*):** Snapshot basis data dibuat otomatis setiap 24 jam dan disimpan di lokasi penyimpanan terenkripsi yang terpisah secara geografis.

### 5.2 Target Pemulihan (*Recovery Objectives*)
- **RTO (*Recovery Time Objective*):** < 2 Jam untuk mengembalikan aplikasi ke kondisi operasional penuh.
- **RPO (*Recovery Point Objective*):** < 5 Menit data hilang berkat WAL continuous archiving.

### 5.3 Prosedur Ekspor Rutin Mandiri
Jalankan pencadangan terenkripsi berkala menggunakan CLI:
```bash
# Ekspor skema dan data tabel Soulaide
supabase db dump --data-only -f soulaide_backup_$(date +%Y%m%d).sql
```

---

## 6. Pemantauan & Penanganan Galat (*Monitoring & Error Handling*)

- **React ErrorBoundary:** Komponen [ErrorBoundary.tsx](file:///F:/Garyudo.my.id/soulaide-webapp/src/components/shared/ErrorBoundary.tsx) mengisolasi galat tak terduga pada antarmuka klien dan menyediakan navigasi pemulihan tanpa mengekspos data medis.
- **Audit Logging Berkelanjutan:** Setiap perubahan status jadwal booking, pengembalian dana (*refund*), pembaruan peran staf, dan pengubahan kehadiran psikolog dicatat ke tabel `public."Soulaide_audit_logs"`.
- **Edge Function Logs:** Log eksekusi `create-payment` dan `qrisgate-webhook` dapat dipantau langsung melalui Supabase Dashboard (*Edge Functions > Invocations / Logs*).
