# Payment Implementation (Phase 6)

> **Catatan riwayat:** Phase 6 awalnya diimplementasikan dengan Midtrans Snap. Sejak **2026-11-23** provider pembayaran diganti menjadi **QRISGate**; dokumen ini mendeskripsikan implementasi QRISGate yang berlaku saat ini.

## 1. Overview & Architecture

Integrasi pembayaran Soulaide menggunakan **QRISGate** (REST API, base URL `https://qrisgate.web.id`) dengan arsitektur **Zero-Trust Client Security**:
- **Model pembayaran:** QRISGate membuat satu QRIS dinamis per order dari QRIS statis milik merchant, menambahkan kode unik (Rp 1–10, melebar hingga Rp 20 ketika rentang penuh) pada digit terakhir agar order concurrent dengan nominal sama dapat dibedakan. Pembeli wajib membayar nominal TEPAT: `total_amount = base_amount + unique_code`. Jangan pernah meng-hardcode `unique_code`; selalu gunakan `total_amount` dari respons API.
- **Aliran dana:** Dana masuk langsung ke rekening bank/e-wallet merchant sendiri; QRISGate hanya membaca notifikasi pembayaran dan tidak menahan dana. Biaya platform flat **Rp 100 per transaksi sukses** dipotong dari saldo kredit merchant (dikembalikan bila transaksi tidak pernah selesai); langganan opsional membebaskan biaya ini. Tidak ada MDR persentase.
- **QRISGate API Key** (`qg_live_...`, dari dashboard QRISGate tab "API & Webhook", hanya ditampilkan sekali) dirahasiakan sepenuhnya di lingkungan backend/Supabase Edge Function (`QRISGATE_API_KEY`), tidak pernah terekspos ke bundle JavaScript frontend dan tidak boleh berprefix `VITE_`.
- **Kalkulasi Harga Terpercaya:** Jumlah tagihan dasar (`base_amount`) selalu diambil langsung dari entitas database `Soulaide_services.price` yang terhubung dengan `Soulaide_bookings.service_id`. Klien browser dilarang mengirimkan nominal harga.
- **Verifikasi Kriptografis Webhook:** Notifikasi QRISGate divalidasi menggunakan **HMAC-SHA256** atas `timestamp + "." + rawBody` dengan `QRISGATE_WEBHOOK_SECRET` (header `X-QRISGate-Signature`, heksadesimal, boleh membawa prefix `sha256=`). HMAC dihitung atas RAW request bytes, bukan JSON yang di-serialize ulang; timestamp (`X-QRISGate-Timestamp`, unix seconds) lebih tua dari 5 menit ditolak; perbandingan signature bersifat constant-time.
- **Idempotensi & Anti-Replay:** Setiap notifikasi webhook dicatat dalam tabel `public."Soulaide_payment_webhook_events"` menggunakan `X-QRISGate-Delivery-Id` sebagai kunci deduplikasi (id yang sama dipakai ulang saat retry). Event duplikat atau event *out-of-order* dicegah dari merusak status transaksi.
- **Verifikasi Server-Authoritative:** Klien tidak pernah mempercayai redirect URL browser (`return_url`) sebagai bukti lunas. Klien selalu memverifikasi status pembayaran langsung dari database yang diperbarui oleh webhook terverifikasi (polling otomatis tiap 5 detik dan pemeriksaan manual).
- **Catatan GoPay:** Notifikasi merchant GoPay hanya aktif untuk QRIS statis. Untuk merchant GoPay, QRISGate menampilkan QR statis dan pembeli memasukkan nominal tepat secara manual; kanal lain (DANA, BCA, dll.) memakai QR dinamis dengan nominal terkunci.

---

## 2. Struktur Database & Kebijakan RLS

Sesuai aturan utama proyek, seluruh tabel custom menggunakan prefix persis `Soulaide_`. Migrasi `20261123000012_switch_payments_to_qrisgate.sql` menyesuaikan skema pembayaran untuk QRISGate:

1. **`public."Soulaide_payments"`**:
   - `id`: UUID (PK)
   - `booking_id`: UUID (FK ke `Soulaide_bookings`)
   - `amount`: BIGINT (Nominal dasar dalam IDR, `base_amount`)
   - `status`: `'pending' | 'paid' | 'failed' | 'expired' | 'refunded' | 'partially_refunded'` (tidak berubah)
   - `provider`: TEXT (default `'qrisgate'`)
   - `provider_order_id`: TEXT (Unique; menyimpan `external_order_id` kita, format `SLD-<booking_code>-<suffix>`)
   - `provider_transaction_id`: TEXT (ID transaksi QRISGate, format `trx_...`)
   - `unique_code`: INTEGER (kode unik Rp 1–10, hingga Rp 20 bila rentang penuh)
   - `total_amount`: BIGINT (`base_amount + unique_code`, nominal wajib bayar)
   - `qr_string`: TEXT (payload QR EMVCo)
   - `qr_image`: TEXT (PNG data URL atau null)
   - `checkout_url`: TEXT (`https://qrisgate.web.id/pay/trx_...`)
   - `expires_at`: TIMESTAMPTZ
   - `payment_type`: TEXT
   - `payment_time`: TIMESTAMPTZ

2. **`public."Soulaide_payment_webhook_events"`**:
   - `id`: UUID (PK)
   - `event_id`: TEXT (Unique deduplication key: `X-QRISGate-Delivery-Id`, sama di seluruh retry)
   - `order_id`: TEXT
   - `raw_payload`: JSONB
   - `status`: TEXT (`'processed'`)
   - `processed_at`: TIMESTAMPTZ

3. **`public."Soulaide_refunds"`**:
   - `id`: UUID (PK)
   - `payment_id`: UUID (FK ke `Soulaide_payments`)
   - `amount`: BIGINT
   - `reason`: TEXT
   - `status`: `'pending' | 'completed' | 'failed'`
   - QRISGate tidak menahan dana dan tidak memiliki API refund; refund adalah transfer manual oleh merchant yang dicatat ke tabel ini sebagaimana sebelumnya.

---

## 3. Komponen Backend (Supabase Edge Functions)

### A. Edge Function `create-payment` (`supabase/functions/create-payment/index.ts`)
- Memvalidasi JWT token pengguna melalui `auth.getUser()`.
- Memastikan `booking.customer_id === user.id`.
- Memastikan status booking adalah `pending_payment`.
- Mengambil harga dari `Soulaide_services.price`.
- Menggunakan kembali pembayaran `pending` yang belum kedaluwarsa bila ada, alih-alih membuat transaksi baru.
- Mengirim request ke QRISGate `POST /api/v1/transactions` dengan header `Authorization: Bearer qg_live_...` dan body `{ external_order_id, amount (integer IDR), customer_name, return_url, include_qr_image: true }`.
- Respons 201: `{ success, data: { transaction_id (trx_...), external_order_id, merchant_name, base_amount, unique_code, total_amount, qr_string (EMVCo), qr_image_base64 (PNG data URL atau null), checkout_url, expires_at } }`.
- Merekam record transaksi ke `Soulaide_payments` dengan status `pending` (termasuk `provider`, `provider_order_id`, `provider_transaction_id`, `unique_code`, `total_amount`, `qr_string`, `qr_image`, `checkout_url`, `expires_at`).
- Mengembalikan data QRIS dan nominal tepat ke frontend.

### B. Edge Function `qrisgate-webhook` (`supabase/functions/qrisgate-webhook/index.ts`)
- Menerima payload POST dari webhook QRISGate saat status berubah. Payload bersifat FLAT (tanpa wrapper `data`): `{ event, transaction_id, external_order_id, base_amount, unique_code, total_amount, customer_name, paid_at, created_at }`.
- Header yang dibaca: `X-QRISGate-Event` (`payment.paid | payment.expired | payment.cancelled`), `X-QRISGate-Timestamp` (unix seconds), `X-QRISGate-Signature` (HMAC-SHA256 heksadesimal, boleh berprefix `sha256=`), `X-QRISGate-Delivery-Id` (kunci idempotensi), `X-QRISGate-Attempt`.
- Menghitung HMAC-SHA256 atas `timestamp + "." + rawBody` dengan `QRISGATE_WEBHOOK_SECRET`; menolak timestamp lebih tua dari 5 menit; membandingkan signature secara constant-time.
- Menolak notifikasi jika signature tidak cocok (HTTP 403 Forbidden).
- Memeriksa idempotensi deduplikasi event berdasarkan delivery id ke tabel `Soulaide_payment_webhook_events`.
- Melakukan transisi status state machine:
  - `payment.paid` $\rightarrow$ Payment: `paid`, Booking: `confirmed`.
  - `payment.expired` $\rightarrow$ Payment: `expired`, Booking: `cancelled`.
  - `payment.cancelled` $\rightarrow$ Payment: `failed`, Booking: `cancelled`.
- Memperbarui `Soulaide_payments` dan `Soulaide_bookings`, lalu mencatat seluruh siklus ke `Soulaide_audit_logs` dengan aksi `QRISGATE_WEBHOOK_PROCESSED`.

---

## 4. Antarmuka Frontend & Integrasi

1. **`src/features/payments/types.ts`:**
   - Definisi tipe TypeScript untuk `PaymentRecord`, `PaymentStatus`, dan respons transaksi QRISGate. Tidak ada lagi deklarasi global `window.snap`.

2. **`src/features/payments/qrisgateCrypto.ts`:**
   - Helper kalkulasi dan verifikasi HMAC-SHA256 cross-platform Web Crypto API.
   - Fungsi pemetaan event deterministik (`payment.paid` / `payment.expired` / `payment.cancelled` ke status pembayaran).

3. **`src/features/payments/paymentService.ts`:**
   - `createPaymentSession` memanggil Supabase Edge Function `create-payment` dan query database verifikasi.

4. **`src/features/payments/PaymentStatusBadge.tsx`:**
   - Badge visual status pembayaran dengan indikator ikon intuitif.

5. **`src/features/payments/QrisPaymentModal.tsx`:**
   - Menampilkan gambar QR (`qr_image_base64`, fallback `qr_string`), nominal tepat dengan rincian `base_amount + unique_code`, dan hitung mundur kedaluwarsa (`expires_at`).
   - Polling status otomatis tiap 5 detik terhadap Supabase dan tombol periksa status manual dari database.
   - Tidak memuat skrip pembayaran eksternal apa pun; tautan `checkout_url` QRISGate tersedia bila diperlukan.

6. **Integrasi ke Halaman Pemesanan & Dashboard Klien:**
   - `src/features/booking/BookingPage.tsx`: Integrasi tombol "Bayar Sekarang via QRIS" langsung setelah reservasi slot berhasil dikunci di Step 5.
   - `src/features/customer/CustomerDashboardPage.tsx`: Tombol bayar pada setiap sesi berstatus `pending_payment` yang memicu `QrisPaymentModal`.

---

## 5. Ringkasan Pengujian Unit

Seluruh pengujian berada di `src/features/payments/payments.test.ts`:
- Perhitungan HMAC-SHA256 berukuran 64 karakter heksadesimal.
- Verifikasi keberhasilan tanda tangan digital yang sah atas raw body.
- Penolakan tanda tangan palsu / manipulasi nominal `total_amount`.
- Penolakan tanda tangan dari webhook secret asing.
- Penolakan timestamp lebih tua dari 5 menit.
- Pemetaan event QRISGate (`payment.paid`, `payment.expired`, `payment.cancelled`) ke status pembayaran dan booking.