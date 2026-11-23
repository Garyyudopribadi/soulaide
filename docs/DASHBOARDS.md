# Dashboard Requirements

## 1. Customer dashboard

- Ringkasan booking mendatang.
- Riwayat booking.
- Detail layanan, psikolog, metode, tanggal, dan waktu.
- Status pembayaran dan bukti/receipt bila tersedia.
- Aksi reschedule/cancel sesuai kebijakan.
- Profil dan preferensi komunikasi.
- Consent dan dokumen yang memang boleh diakses customer.
- Notifikasi dan akses chat yang tersedia.

## 2. Psychologist dashboard

- Ringkasan sesi hari ini dan mendatang.
- Daftar booking yang ditugaskan.
- Detail klien minimum yang diperlukan untuk sesi.
- Kalender dan ketersediaan.
- Status presence: offline, online, available, busy, away.
- Akses catatan klinis sesuai kewenangan profesional.
- Riwayat status dan notifikasi.

Psikolog tidak boleh melihat booking atau catatan psikolog lain tanpa authorization.

## 3. Admin dashboard

- KPI operasional yang tidak membocorkan detail klinis.
- Pengelolaan layanan, kategori, harga, metode, dan konten.
- Pengelolaan profil psikolog dan jadwal.
- Pengelolaan booking dan status operasional.
- Rekonsiliasi pembayaran, transaksi, dan refund.
- Pengelolaan FAQ, artikel, halaman, dan pengaturan website.
- Pengelolaan staf/role sesuai permission.
- Audit log.

## 4. UX requirements

- Setiap dashboard memiliki loading, empty, error, dan success state.
- Tabel mendukung pencarian/filter yang relevan.
- Tampilkan status dengan label yang mudah dipahami.
- Konfirmasi sebelum aksi destruktif.
- Responsif untuk mobile/tablet/desktop.
- Jangan menampilkan menu/aksi yang tidak relevan dengan role, tetapi tetap enforce permission di backend.
