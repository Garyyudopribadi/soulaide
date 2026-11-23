/**
 * Chat-centric client area as a full-screen messaging workspace.
 * Desktop: icon rail + thread list + conversation pane. Mobile: list and
 * conversation swap, bottom tabs for profile/notifications. Each psychologist
 * thread carries chat plus every booking/payment activity as live cards.
 */

import React, { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation, useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/features/auth/useAuth'
import { customerService } from './customerService'
import { notificationService } from '@/features/chat/notificationService'
import { CustomerProfileTab } from './CustomerProfileTab'
import { CustomerNotificationsTab } from './CustomerNotificationsTab'
import { ClientAppShell, type ClientSection } from '@/features/client-chat/ClientAppShell'
import { ThreadListPane } from '@/features/client-chat/ThreadList'
import { ThreadView } from '@/features/client-chat/ThreadView'
import { AssistantChat } from '@/features/client-chat/AssistantChat'

const ThreadRoute: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>()
  if (!conversationId) return <Navigate to="/dashboard" replace />
  return <ThreadView conversationId={conversationId} />
}

const PaneHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div className="flex items-center gap-3 border-b border-[#E8E1D9] bg-white/70 px-4 py-3">
    <Link
      to="/dashboard"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-plum-700 transition-colors hover:bg-plum-50 md:hidden"
      aria-label="Kembali ke daftar percakapan"
    >
      <ArrowLeft className="h-4 w-4" />
    </Link>
    <div className="min-w-0">
      <p className="truncate text-sm font-bold text-plum-950">{title}</p>
      <p className="truncate text-[10px] font-medium text-[#72677E]">{subtitle}</p>
    </div>
  </div>
)

export const CustomerDashboardPage: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const { data: clientProfile = null, refetch: loadClientProfile } = useQuery({
    queryKey: ['customer-client-profile', user?.id],
    queryFn: () => (user ? customerService.fetchCustomerClientProfile(user.id) : Promise.resolve(null)),
    enabled: Boolean(user),
  })

  const { data: consents = [] } = useQuery({
    queryKey: ['customer-consents', user?.id],
    queryFn: () => (user ? customerService.fetchCustomerConsents(user.id) : Promise.resolve([])),
    enabled: Boolean(user),
  })

  const { data: notifications = [], refetch: loadNotifications } = useQuery({
    queryKey: ['customer-notifications', user?.id],
    queryFn: () => (user ? customerService.fetchCustomerNotifications(user.id) : Promise.resolve([])),
    enabled: Boolean(user),
  })

  useEffect(() => {
    if (!user) return
    const unsubscribe = notificationService.subscribeToNotifications(user.id, () => {
      void loadNotifications()
    })
    return () => unsubscribe()
  }, [user, loadNotifications])

  const unreadNotifCount = notifications.filter((n) => !n.is_read).length
  const fullName = profile?.full_name || user?.email?.split('@')[0] || 'Sahabat Soulaide'

  const section: ClientSection = location.pathname.startsWith('/dashboard/profile')
    ? 'profile'
    : location.pathname.startsWith('/dashboard/notifications')
      ? 'notifications'
      : 'threads'

  const threadMatch = location.pathname.match(/^\/dashboard\/thread\/([^/]+)/)
  const activeThreadId = threadMatch ? threadMatch[1] : null
  const threadActive = Boolean(activeThreadId) || location.pathname === '/dashboard/assistant'
  const assistantActive = location.pathname === '/dashboard/assistant' || location.pathname === '/dashboard'

  const handleNavigate = (next: ClientSection) => {
    if (next === 'threads') navigate('/dashboard')
    else if (next === 'profile') navigate('/dashboard/profile')
    else navigate('/dashboard/notifications')
  }

  return (
    <ClientAppShell
      section={section}
      threadActive={threadActive}
      unreadNotifCount={unreadNotifCount}
      userName={fullName}
      userEmail={user?.email || ''}
      avatarUrl={profile?.avatar_url}
      onNavigate={handleNavigate}
      list={<ThreadListPane activeThreadId={activeThreadId} assistantActive={assistantActive} />}
    >
      <Routes>
        <Route index element={<AssistantChat showHeader />} />
        <Route path="assistant" element={<AssistantChat showHeader />} />
        <Route path="thread/:conversationId" element={<ThreadRoute />} />
        <Route
          path="profile"
          element={
            user ? (
              <div className="flex h-full min-h-0 flex-col">
                <PaneHeader title="Profil & consent" subtitle="Data diri dan persetujuan ketentuan sesi" />
                <div className="scrollbar-thin flex-1 overflow-y-auto px-4 py-6 md:px-8">
                  <div className="mx-auto max-w-2xl">
                    <CustomerProfileTab
                      userId={user.id}
                      initialFullName={profile?.full_name || ''}
                      initialPhone={profile?.phone_number || ''}
                      userEmail={user.email || ''}
                      clientProfile={clientProfile}
                      consents={consents}
                      onProfileUpdated={() => {
                        void loadClientProfile()
                        void refreshProfile()
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : null
          }
        />
        <Route
          path="notifications"
          element={
            <div className="flex h-full min-h-0 flex-col">
              <PaneHeader title="Notifikasi" subtitle="Kabar booking, pembayaran, dan jadwal sesi" />
              <div className="scrollbar-thin flex-1 overflow-y-auto px-4 py-6 md:px-8">
                <div className="mx-auto max-w-2xl">
                  <CustomerNotificationsTab
                    notifications={notifications}
                    onMarkAsRead={(id) => {
                      void customerService.markNotificationRead(id).then(() => loadNotifications())
                    }}
                    onMarkAllAsRead={() => {
                      if (!user) return
                      void customerService.markAllNotificationsRead(user.id).then(() => loadNotifications())
                    }}
                  />
                </div>
              </div>
            </div>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </ClientAppShell>
  )
}
