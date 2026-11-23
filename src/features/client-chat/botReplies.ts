/**
 * Assistant voice: calm, warm, concise Indonesian. No diagnosis, no therapy.
 * All copy lives here so tone stays consistent and testable.
 */

import type { ChatCatalog, ChatPsychologist, ChatService } from './types.ts'
import type { FlowSelections } from './assistantFlow.ts'
import { formatRupiah, formatSessionDate } from './wib.ts'
import { servicePriceForMethod } from './chatApi.ts'

export const ASSISTANT_NAME = 'Asisten Soulaide'

export function greetReply(hasHistory: boolean): string {
  if (hasHistory) {
    return 'Selamat datang kembali. Mau lanjut memesan sesi, atau ada yang bisa saya bantu?'
  }
  return (
    'Halo, saya asisten Soulaide. Saya akan memandu Anda memesan sesi konseling langkah demi langkah: ' +
    'pilih metode, layanan, psikolog, lalu jadwal. Pembayaran selesai lewat QRIS di percakapan ini. Mulai?'
  )
}

export function methodReply(): string {
  return 'Baik. Sesi ingin dilakukan secara online (video call) atau tatap muka di klinik?'
}

export function serviceReply(method: 'online' | 'offline', services: ChatService[]): string {
  const label = method === 'online' ? 'online' : 'tatap muka'
  if (services.length === 0) {
    return `Belum ada layanan ${label} yang tersedia saat ini. Coba metode lain, atau hubungi tim kami via WhatsApp.`
  }
  return `Ini layanan yang tersedia untuk sesi ${label}. Pilih salah satu:`
}

export function psychologistReply(service: ChatService, psychologists: ChatPsychologist[]): string {
  if (psychologists.length === 0) {
    return 'Belum ada psikolog yang tersedia untuk layanan ini. Silakan kembali beberapa saat lagi.'
  }
  if (psychologists.length === 1 && psychologists[0].isBot) {
    return (
      'Untuk uji coba pembayaran, sesi Anda akan ditemani Soul Bot. Ini kanal tes resmi Soulaide, ' +
      'bukan konseling sungguhan. Pilih tanggal uji cobanya:'
    )
  }
  return `Siapa yang ingin Anda temui untuk "${service.name}"?`
}

export function dateReply(psychologist: ChatPsychologist): string {
  return `Kapan Anda ingin bertemu ${psychologist.fullName}? Pilih tanggal (minimal 24 jam dari sekarang, waktu WIB):`
}

export function timeReply(dateStr: string): string {
  return `Slot yang tersedia pada ${formatSessionDate(dateStr)} (WIB):`
}

export function noSlotsReply(dateStr: string): string {
  return `Tidak ada slot tersedia pada ${formatSessionDate(dateStr)}. Silakan pilih tanggal lain.`
}

export function notesReply(): string {
  return (
    'Ada catatan untuk psikolog sebelum sesi? Misalnya topik yang ingin dibahas atau kebutuhan khusus. ' +
    'Boleh dilewati. Catatan ini bukan untuk konseling atau diagnosis.'
  )
}

export function consentReply(): string {
  return (
    'Sebelum lanjut: sesi ini adalah layanan konseling profesional, bukan layanan darurat. ' +
    'Jika Anda dalam krisis, hubungi 119 ext. 8 atau layanan darurat terdekat. ' +
    'Dengan melanjutkan, Anda menyetujui ketentuan booking Soulaide (jadwal, pembayaran, dan kebijakan pembatalan). Setuju?'
  )
}

export function confirmReply(
  selections: FlowSelections,
  catalog: ChatCatalog
): string {
  const service = catalog.services.find((s) => s.id === selections.serviceId)
  const psych = catalog.psychologists.find((p) => p.id === selections.psychologistId)
  if (!service || !psych || !selections.method || !selections.dateStr || !selections.time) {
    return 'Ringkasan belum lengkap. Kembali ke langkah sebelumnya untuk melengkapi pilihan.'
  }
  const price = servicePriceForMethod(service, selections.method)
  const lines = [
    'Ringkasan pesanan Anda:',
    `Layanan: ${service.name} (${service.durationMinutes} menit)`,
    `Psikolog: ${psych.fullName}`,
    `Metode: ${selections.method === 'online' ? 'Online (video call)' : 'Tatap muka di klinik'}`,
    `Jadwal: ${formatSessionDate(selections.dateStr)}, ${selections.time} WIB`,
    price !== null ? `Harga: ${formatRupiah(price)} (+ kode unik QRIS saat pembayaran)` : 'Harga: sesuai tarif layanan',
  ]
  if (selections.notes) lines.push(`Catatan: ${selections.notes}`)
  lines.push('Konfirmasi untuk membuat booking dan lanjut ke pembayaran QRIS.')
  return lines.join('\n')
}

export function bookingCreatedReply(bookingCode: string): string {
  return (
    `Booking ${bookingCode} berhasil dibuat. Kartu pembayaran QRIS sudah aktif di percakapan psikolog Anda. ` +
    'Selesaikan pembayaran dalam 30 menit agar slot tidak dilepas. Setelah bayar, status sesi terkonfirmasi otomatis.'
  )
}

export function bookingErrorReply(error: string): string {
  return `Booking belum berhasil: ${error}. Anda bisa mencoba lagi, atau kembali mengubah pilihan.`
}

export function doneReply(): string {
  return (
    'Selesai. Semua aktivitas sesi ini (pembayaran, konfirmasi, perubahan jadwal, struk) akan muncul sebagai kartu ' +
    'di thread psikolog Anda. Ada lagi yang ingin dipesan?'
  )
}

export function freeformReply(): string {
  return (
    'Saya asisten pemesanan Soulaide, jadi saya paling paham soal booking, jadwal, dan pembayaran. ' +
    'Untuk pertanyaan lain, tim kami siap membantu via WhatsApp. Mau saya bantu memesan sesi?'
  )
}

export function crisisReply(): string {
  return (
    'Jika Anda atau orang terdekat dalam bahaya atau krisis, segera hubungi 119 ext. 8 (layanan kesehatan jiwa, 24 jam) ' +
    'atau 112/119. Anda tidak sendirian, dan bantuan darurat tersedia sekarang.'
  )
}