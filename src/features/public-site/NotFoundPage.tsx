import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export const NotFoundPage: React.FC = () => {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
      <p className="font-serif text-6xl font-semibold text-plum-300">404</p>
      <h1 className="display mt-4 text-2xl sm:text-3xl">Halaman tidak ditemukan.</h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-soft">
        Halaman yang kamu cari tidak tersedia atau mungkin telah berpindah alamat.
      </p>
      <Link to="/" className="btn-primary mt-7">
        <ArrowLeft className="h-4 w-4" />
        Kembali ke beranda
      </Link>
    </div>
  )
}
