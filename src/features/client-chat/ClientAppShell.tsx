/**
 * Client workspace frame: the shared full-viewport shell with the client's
 * three sections (threads, notifications, profile).
 */

import React from 'react'
import { Bell, MessagesSquare, User } from 'lucide-react'
import { WorkspaceShell } from '@/components/dashboard/WorkspaceShell'

export type ClientSection = 'threads' | 'notifications' | 'profile'

interface ClientAppShellProps {
  section: ClientSection
  threadActive: boolean
  unreadNotifCount: number
  userName: string
  userEmail: string
  avatarUrl?: string | null
  onNavigate: (section: ClientSection) => void
  list: React.ReactNode
  children: React.ReactNode
}

export const ClientAppShell: React.FC<ClientAppShellProps> = ({
  section,
  threadActive,
  unreadNotifCount,
  userName,
  userEmail,
  avatarUrl,
  onNavigate,
  list,
  children,
}) => (
  <WorkspaceShell
    sections={[
      { key: 'threads', label: 'Percakapan', icon: MessagesSquare },
      { key: 'notifications', label: 'Notifikasi', icon: Bell, badge: unreadNotifCount },
      { key: 'profile', label: 'Profil', icon: User },
    ]}
    activeKey={section}
    detailActive={threadActive}
    userName={userName}
    userEmail={userEmail}
    avatarUrl={avatarUrl}
    onNavigate={(key) => onNavigate(key as ClientSection)}
    list={list}
  >
    {children}
  </WorkspaceShell>
)
