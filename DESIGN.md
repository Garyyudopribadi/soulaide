# Soulaide Public Site — Design System ("Ruang Bercerita")

Design Read: situs praktik konseling yang tenang dan jujur. Pengunjung datang dengan
kerentanan; tugas desain adalah menurunkan kecemasan, bukan memukau. Maka situs ini
text-first, flat, dan hangat, seperti ruang praktik yang rapi.

Referensi shipped (live-design-refs): Centrum Par, Warsawa —
https://couplesfacilitation.com/ (kurasi: https://landdding.com/l/relationship-and-marital-counseling-and-psychotherapy-6noi1).
Diambil: ketenangan, teks sebagai konten utama, satu gestur identitas yang berani,
tanpa hype. Tidak di-clone; identitas plum Soulaide dipertahankan.

## Dials
- ENERGY 1–2: tenang, editorial. Bukan playful, bukan korporat keras.
- RHYTHM 2: bagian bernapas, whitespace besar, maksimal dua kolom asimetris.
- MOTION 1: hanya transisi hover/focus 150ms dan buka/tutup akordeon.
  Tanpa animasi loop, orbit, float, glow, scroll-reveal, atau video intro.

## Keputusan (satu alasan per keputusan)
- Warna: paper `#FAF8F5` (latar existing), ink `#23192D`, satu aksen flat plum-700
  `#492E5F`. Plum adalah identitas merek existing, bukan default AI. Tanpa gradien,
  tanpa glass/blur, tanpa glow.
- Tipografi: Playfair Display upright (500–600) hanya untuk judul display; Plus
  Jakarta Sans untuk semua teks lain. Tanpa aksen italic bergradien (tell AI).
- Radius: kartu 12px, tombol/input 10px. Tanpa blob 2rem+.
- Hero: pernyataan serif di kiri, grid 2×2 potret asli psikolog di kanan (trust-first,
  manusia nyata, bukan ilustrasi stok). `fetchpriority="high"` + ukuran eksplisit.
- Sosial proof: hanya fakta terverifikasi (4 psikolog, SIPP, HIMPSI, lead time 24 jam).
  Tanpa testimoni/rating/statistik karangan.
- Harga: hanya tarif terkonfirmasi dari data (docs/CONTENT_AND_SERVICES.md).
  Nilai null/tak terkonfirmasi → CTA "Hubungi kami" (WhatsApp), bukan angka placeholder.
  Soul Expert tidak punya tarif terkonfirmasi → tanpa angka, arahkan ke admin.
- Sapaan: "kamu" konsisten di seluruh situs publik (ASUMSI, belum dikonfirmasi user;
  nada hangat-setara sesuai merek). Dashboard/auth tidak disentuh.
- Krisis: hotline 119 ext 8 selalu terlihat (strip header, band penutup, footer, kontak).
- Ikon: lucide garis tipis, tanpa chip lingkaran berwarna; daftar memakai teks/nomor.
- Motion reduced: `prefers-reduced-motion` mematikan semua transisi baru.
- Aksesibilitas: nama aksesibel di semua kontrol, focus-visible ring plum, akordeon
  `aria-expanded`, modal `role="dialog"` + Esc + klik backdrop.

## Cakupan
Landing, services, psychologists (list/detail), FAQ, contact, 404, Header, Footer.
Dashboard, auth, booking, chat: di luar cakupan; token CSS lama tetap ada untuk mereka.

## Asumsi yang perlu konfirmasi user
1. Sapaan "kamu" (vs "Anda").
2. Platform sesi ditulis netral "video call" (docs: Zoom/Voice Call; copy lama: Google Meet).
3. Tarif Soul Expert & MHCU offline ditampilkan sebagai "hubungi kami", bukan angka.
