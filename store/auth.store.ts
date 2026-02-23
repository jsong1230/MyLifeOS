import { create } from 'zustand'
import { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  isLoading: boolean
  isPinVerified: boolean
  encryptionKey: string | null
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setPinVerified: (verified: boolean, key?: string) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isPinVerified: false,
  encryptionKey: null,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setPinVerified: (verified, key) => set({ isPinVerified: verified, encryptionKey: key ?? null }),
  reset: () => set({ user: null, isLoading: false, isPinVerified: false, encryptionKey: null }),
}))
