# Environment Configuration

## 1. Vite frontend variables

Untuk Vite gunakan prefix `VITE_`, bukan `NEXT_PUBLIC_`.

Contoh `.env.example`:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Hanya masukkan nilai yang memang aman untuk diekspos ke browser. Tidak ada variabel pembayaran QRISGate di frontend; seluruh integrasi pembayaran berjalan di Edge Function.

## 2. Server/Edge Function secrets

Simpan secrets di environment server/Supabase Edge Function secrets, bukan di `.env` frontend yang dibundle.

Nama konfigurasi yang digunakan:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `QRISGATE_API_KEY` (API key `qg_live_...` dari dashboard QRISGate, tab "API & Webhook"; hanya ditampilkan sekali saat dibuat)
- `QRISGATE_WEBHOOK_SECRET` (secret untuk verifikasi HMAC-SHA256 webhook QRISGate)
- `WHATSAPP_NUMBER`

Jangan commit file `.env` aktual. Commit `.env.example` tanpa secret.

## 3. Rules

- Jangan pernah menggunakan service role key pada frontend.
- Jangan menggunakan QRISGate API key atau webhook secret pada frontend. Secret QRISGate tidak boleh pernah diberi prefix `VITE_`.
- Validasi environment saat aplikasi/backend start.
- Pisahkan development, staging, dan production.
- Rotasi secret jika terlanjur terekspos.