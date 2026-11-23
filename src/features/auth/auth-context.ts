import { createContext } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import type { UserRole } from '@/types/index.ts'

export interface UserProfile {
  id: string
  email: string | null
  full_name: string | null
  phone_number: string | null
  avatar_url: string | null
}

export interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  role: UserRole | null
  loading: boolean
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
