import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ShieldCheck, Lock, Mail, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button.tsx'
import { Card, CardContent, CardFooter } from '@/components/ui/card.tsx'
import { supabase } from '@/lib/supabase/client.ts'
import { useAuth } from './useAuth.ts'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { refreshProfile } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setErrorMessage(error.message)
      } else if (data.user) {
        await refreshProfile()

        const from = (location.state as { from?: { pathname: string } })?.from?.pathname
        if (from && from !== '/login') {
          navigate(from, { replace: true })
        } else {
          navigate('/dashboard', { replace: true })
        }
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Gagal melakukan login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative py-16 sm:py-20 px-4 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[32rem] h-[20rem] bg-plum-200/35 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-md mx-auto space-y-6">
        <div className="text-center space-y-3">
          <Link to="/" className="inline-flex p-2.5 rounded-2xl bg-white border border-[#EAE3DC] shadow-xs group" aria-label="Beranda Soulaide">
            <img
              src="/Soulaide Psi Arc Logo.png"
              alt="Soulaide"
              className="h-11 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </Link>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E1429] tracking-tight">
              Masuk ke <span className="font-serif italic font-semibold text-plum-700">Portal Klien</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#645A70] max-w-xs mx-auto leading-relaxed">
              Akses jadwal konseling aktif, riwayat sesi, dan laporan evaluasi klinis Anda.
            </p>
          </div>
        </div>

        <Card className="rounded-3xl border-[#EAE3DC] bg-white shadow-[0_18px_40px_-20px_rgba(41,23,56,0.16)]">
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4 pt-7">
              {errorMessage && (
                <div className="p-3.5 text-xs bg-rose-50 text-rose-800 rounded-xl border border-rose-200">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#3C3148] uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-plum-600" />
                  Alamat Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full px-4 py-3 text-sm border border-[#DFD7CE] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-plum-500/30 focus:border-plum-500 bg-sanctuary-50 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#3C3148] uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-plum-600" />
                    Kata Sandi
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-plum-700 font-semibold hover:underline"
                  >
                    Lupa kata sandi?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-4 pr-11 py-3 text-sm border border-[#DFD7CE] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-plum-500/30 focus:border-plum-500 bg-sanctuary-50 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8E81A1] hover:text-plum-700 cursor-pointer"
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex-col gap-3.5 pt-2 border-t-0">
              <Button type="submit" className="w-full h-11 rounded-xl gap-2" disabled={loading}>
                <span>{loading ? 'Memverifikasi...' : 'Masuk ke Akun'}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </Button>
              <p className="text-xs text-center text-[#645A70] pt-1">
                Belum memiliki akun?{' '}
                <Link to="/register" className="text-plum-700 font-bold hover:underline">
                  Daftar sekarang
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>

        <div className="text-center text-xs text-[#7A6F85] flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-plum-600" />
          <span>Koneksi aman berstandar enkripsi data medis & HIMPSI</span>
        </div>
      </div>
    </div>
  )
}
