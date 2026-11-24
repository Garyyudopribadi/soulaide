import React, { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header.tsx'
import { Footer } from './Footer.tsx'
import { FloatingCommunicationsWidget } from '@/features/chat/FloatingCommunicationsWidget.tsx'

const WORKSPACE_PREFIXES = ['/dashboard', '/admin', '/psychologist']

export const Layout: React.FC = () => {
  const { pathname } = useLocation()
  const isWorkspace = WORKSPACE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )

  // Scroll smoothly to top on route navigation
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  if (isWorkspace) {
    // Logged-in workspaces have their own navigation. The public chat bubble
    // sits on top of table actions in the admin dashboard.
    return (
      <div className="min-h-screen bg-[#F7F4EF] text-[#23192D]">
        <Outlet />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#23192D]">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <FloatingCommunicationsWidget />
    </div>
  )
}
