import React, { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header.tsx'
import { Footer } from './Footer.tsx'
import { FloatingCommunicationsWidget } from '@/features/chat/FloatingCommunicationsWidget.tsx'

export const Layout: React.FC = () => {
  const { pathname } = useLocation()

  // Scroll smoothly to top on route navigation
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

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
