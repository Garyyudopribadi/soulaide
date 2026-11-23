/**
 * Chat-centric client area.
 * Home is the thread list; each psychologist thread carries chat plus every
 * booking/payment activity as live cards. Profile and notifications remain.
 */

import React, { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation, useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MessagesSquare, User, Bell, ArrowLeft } from 'lucide-react'
import { DashboardShell, type DashboardNavGroup } from '@/components/dashboard/DashboardShell'
import { useAuth } from '@/features/auth/useAuth'
import { customerService } from './customerService'
import { notificationService } from '@/features/chat/notificationService'
import { CustomerProfileTab } from './CustomerProfileTab'
import { CustomerNotificationsTab } from './CustomerNotificationsTab'
import { ThreadList } from '@/features/client-chat/ThreadList'
import { ThreadView } from '@/features/client-chat/ThreadView'

const ThreadRoute: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>()
  if (!conversationId) return <Navigate to="/dashboard" replace />
  return (
    <div className="mx-auto max-w-2xl">
      <Link
        to="/dashboard"
        className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-plum-700 transition-colors hover:text-plum-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Semua percakapan
      </Link>
      <div className="h-[calc(100dvh-220px)] min-h-[440px] overflow-hidden rounded-2xl border border-[#E3DACF] bg-sanctuary-100 shadow-2xs">
        <ThreadView conversationId={conversationId} />
      </div>
    </div>
  )
}

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

  const activeKey = location.pathname.startsWith('/dashboard/profile')
    ? 'profile'
    : location.pathname.startsWith('/dashboard/notifications')
      ? 'notifications'
      : 'threads'

  const navGroups: DashboardNavGroup[] = [
    {
      label: 'Ruang Anda',
      items: [
        { key: 'threads', label: 'Percakapan', icon: MessagesSquare },
        { key: 'profile', label: 'Profil & consent', icon: User },
        {
          key: 'notifications',
          label: 'Notifikasi',
          icon: Bell,
          badge: unreadNotifCount,
          badgeTone: 'amber',
        },
      ],
    },
  ]

  const handleNavigate = (key: string) => {
    if (key === 'threads') navigate('/dashboard')
    else if (key === 'profile') navigate('/dashboard/profile')
    else if (key === 'notifications') navigate('/dashboard/notifications')
  }

  return (
    <DashboardShell
      portalName="Ruang Klien"
      portalTag="Client Area"
      roleLabel="Klien"
      navGroups={navGroups}
      activeKey={activeKey}
      onNavigate={handleNavigate}
      userName={fullName}
      userEmail={user?.email || ''}
      avatarUrl={profile?.avatar_url}
      notificationCount={unreadNotifCount}
      onNotificationsClick={() => navigate('/dashboard/notifications')}
    >
      <Routes>
        <Route index element={<ThreadList />} />
        <Route path="thread/:conversationId" element={<ThreadRoute />} />
        <Route
          path="profile"
          element={
            user ? (
              <div className="mx-auto max-w-3xl">
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
            ) : null
          }
        />
        <Route
          path="notifications"
          element={
            <div className="mx-auto max-w-3xl">
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
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </DashboardShell>
  )
}