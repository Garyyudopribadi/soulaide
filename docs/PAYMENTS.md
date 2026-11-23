# Payment Integration

## 1. Provider

Provider pembayaran: **QRISGate** (https://qrisgate.web.id), REST API dengan base URL `https://qrisgate.web.id`.

- QRISGate membuat satu QRIS dinamis per order dari QRIS statis milik merchant, menambahkan kode unik (Rp 1–10, melebar hingga Rp 20 ketika rentang penuh) pada digit terakhir agar order concurrent dengan nominal sama tetap dapat dibedakan.
- Pembeli wajib membayar nominal TEPAT: `total_amount = base_amount + unique_code`.
- Dana masuk langsung ke rekening bank/e-wallet merchant sendiri; QRISGate hanya membaca notifikasi pembayaran dan tidak menahan dana.
- Biaya platform: flat Rp 100 per transaksi sukses, dipotong dari saldo kredit merchant (dikembalikan bila transaksi tidak pernah selesai); langganan opsional membebaskan biaya ini. Tidak ada MDR persentase.
- Jangan pernah meng-hardcode `unique_code`; selalu gunakan `total_amount` yang dikembalikan API.

## 2. Secure flow

1. Frontend meminta pembuatan transaksi untuk booking yang valid.
2. Edge Function `create-payment` memverifikasi JWT, ownership, harga dari `Soulaide_services`, dan status booking `pending_payment`; pembayaran pending yang belum kedaluwarsa dipakai ulang, bukan dibuat baru.
3. Edge Function membuat transaksi ke QRISGate `POST /api/v1/transactions` dengan header `Authorization: Bearer qg_live_...` dari secret environment.
4. Frontend menerima data pembayaran yang aman (`qr_string`, `qr_image_base64`, `checkout_url`, `total_amount`, `expires_at`) dan menampilkannya di `QrisPaymentModal`.
5. QRISGate mengirim webhook ke Edge Function `qrisgate-webhook` saat status berubah.
6. Backend memverifikasi signature HMAC-SHA256, timestamp, dan detail transaksi.
7. Backend memproses event secara idempotent berdasarkan `X-QRISGate-Delivery-Id`.
8. Backend memperbarui payment record (`Soulaide_payments`) dan booking state (`Soulaide_bookings`) sesuai aturan.
9. Customer melihat status yang dibaca ulang dari backend/database (polling otomatis tiap 5 detik dan pemeriksaan manual).

## 3. Critical rules

- Jangan pernah menaruh `QRISGATE_API_KEY` atau `QRISGATE_WEBHOOK_SECRET` di frontend; secret QRISGate tidak boleh pernah diberi prefix `VITE_`.
- Jangan percaya callback browser atau `return_url` sebagai bukti pembayaran.
- Jangan mengubah status paid berdasarkan query parameter redirect.
- Verifikasi HMAC atas RAW request bytes (bukan JSON yang di-serialize ulang), tolak timestamp lebih tua dari 5 menit, dan gunakan perbandingan constant-time.
- Simpan webhook event untuk audit dan deduplication; delivery id yang sama dipakai ulang saat retry.
- Pastikan event duplicate/out-of-order tidak merusak state.
- Harga dihitung dari data database yang dipercaya, bukan nominal yang dikirim browser; nominal tagihan selalu `base_amount + unique_code` dari respons QRISGate.

## 4. Ketentuan biaya, refund, dan kanal

- Biaya platform flat Rp 100 per transaksi sukses ditanggung merchant melalui saldo kredit QRISGate, bukan customer; tidak ada MDR persentase.
- QRISGate tidak menahan dana dan tidak memiliki API refund. Refund dilakukan manual oleh merchant (transfer balik) dan tetap dicatat ke `Soulaide_refunds`.
- Khusus merchant GoPay: notifikasi merchant GoPay hanya aktif untuk QRIS statis. Untuk merchant GoPay, QRISGate menampilkan QR statis dan pembeli memasukkan nominal tepat secara manual. Kanal lain (DANA, BCA, dll.) memakai QR dinamis dengan nominal terkunci.
- Deteksi pembayaran dikonfigurasi di sisi merchant (bukan kode aplikasi): APK listener Android di ponsel merchant (notifikasi DANA, BRImo, myBCA, Livin, ShopeePay, GoPay), detektor berbasis sesi (GoPay Merchant / Shopee Partner / BCA Merchant), atau notifikasi email bank.