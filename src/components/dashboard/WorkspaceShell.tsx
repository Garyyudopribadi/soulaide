/**
 * Full-viewport workspace frame shared by the client and psychologist apps:
 * icon rail (desktop) + list pane + detail pane. On mobile the list and the
 * detail swap places, with a bottom tab bar for sections. Brand stays the
 * legacy sanctuary/plum surfaces used by the chat components.
 */

import React from 'react'
import { Link } from 'react-router-dom'
import { Home, LogOut } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '@/features/auth/useAuth'
import { getInitials } from '@/lib/dashboard'
import { cn } from '@/lib/utils'

export interface WorkspaceSection {
  key: string
  label: string
  icon: LucideIcon
  badge?: number
}

interface WorkspaceShellProps {
  sections: WorkspaceSection[]
  activeKey: string
  /** Mobile: a detail (conversation/pane) is open, so hide list + bottom bar. */
  detailActive: boolean
  userName: string
  userEmail: string
  avatarUrl?: string | null
  onNavigate: (key: string) => void
  list: React.ReactNode
  children: React.ReactNode
}

export const WorkspaceShell: React.FC<WorkspaceShellProps> = ({
  sections,
  activeKey,
  detailActive,
  userName,
  userEmail,
  avatarUrl,
  onNavigate,
  list,
  children,
}) => {
  const { signOut } = useAuth()

  const listMobileVisible = !detailActive
  const navVisible = !detailActive

  const railButton = (active: boolean) =>
    cn(
      'relative flex h-11 w-11 items-center justify-center rounded-xl transition-colors duration-150',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-plum-300',
      active ? 'bg-white/12 text-white' : 'text-plum-200 hover:bg-white/[0.08] hover:text-white'
    )

  const badge = (n?: number) =>
    n && n > 0 ? (
      <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-champagne-500 px-1 text-[9px] font-extrabold text-plum-950">
        {n > 9 ? '9+' : n}
      </span>
    ) : null

  return (
    <div className="flex h-dvh overflow-hidden bg-sanctuary-100 text-[#23192D]">
      {/* Icon rail (desktop) */}
      <nav
        className="hidden w-[68px] shrink-0 flex-col items-center gap-1.5 bg-plum-950 py-3 md:flex"
        aria-label="Navigasi ruang kerja"
      >
        <Link
          to="/"
          className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 p-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-plum-300"
          aria-label="Kembali ke beranda Soulaide"
          title="Beranda Soulaide"
        >
          <img src="/Soulaide Psi Arc Logo.png" alt="" className="h-full w-full object-contain" />
        </Link>

        {sections.map(({ key, label, icon: Icon, badge: n }) => (
          <button
            key={key}
            type="button"
            onClick={() => onNavigate(key)}
            className={railButton(activeKey === key)}
            aria-label={label}
            aria-current={activeKey === key ? 'page' : undefined}
            title={label}
          >
            <Icon className="h-5 w-5" />
            {badge(n)}
          </button>
        ))}

        <div className="flex-1" />

        <Link to="/" className={railButton(false)} aria-label="Lihat situs publik" title="Situs publik">
          <Home className="h-5 w-5" />
        </Link>
        <button
          type="button"
          onClick={() => signOut()}
          className={cn(railButton(false), 'hover:bg-rose-500/15 hover:text-rose-200')}
          aria-label="Keluar dari akun"
          title="Keluar"
        >
          <LogOut className="h-5 w-5" />
        </button>
        <span
          className="mt-1 flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-gradient-to-br from-champagne-200 to-champagne-500 text-[10px] font-extrabold text-plum-950"
          title={`${userName} · ${userEmail}`}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            getInitials(userName)
          )}
        </span>
      </nav>

      {/* List pane */}
      <aside
        className={cn(
          'shrink-0 flex-col border-r border-[#E8E1D9] bg-white md:flex md:w-[320px] lg:w-[360px] xl:w-[400px]',
          listMobileVisible ? 'flex w-full' : 'hidden',
          navVisible && 'pb-14 md:pb-0'
        )}
        aria-label="Daftar percakapan"
      >
        {list}
      </aside>

      {/* Detail pane */}
      <main
        className={cn(
          'min-w-0 flex-1 flex-col md:flex',
          listMobileVisible ? 'hidden' : 'flex',
          navVisible && 'pb-14 md:pb-0'
        )}
      >
        {children}
      </main>

      {/* Bottom tab bar (mobile) */}
      {navVisible && (
        <nav
          className="fixed inset-x-0 bottom-0 z-40 flex border-t border-[#E8E1D9] bg-white/95 backdrop-blur md:hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          aria-label="Navigasi ruang kerja"
        >
          {sections.map(({ key, label, icon: Icon, badge: n }) => (
            <button
              key={key}
              type="button"
              onClick={() => onNavigate(key)}
              aria-current={activeKey === key ? 'page' : undefined}
              className={cn(
                'relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-colors',
                activeKey === key ? 'text-plum-700' : 'text-[#72677E] hover:text-plum-700'
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
              {n && n > 0 ? (
                <span className="absolute right-[calc(50%-16px)] top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-champagne-500 px-1 text-[9px] font-extrabold text-plum-950">
                  {n > 9 ? '9+' : n}
                </span>
              ) : null}
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}
