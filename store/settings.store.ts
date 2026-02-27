import { create } from 'zustand'
import type { CurrencyCode } from '@/lib/currency'
import type { LocaleCode } from '@/types/settings'

interface SettingsState {
  locale: LocaleCode
  defaultCurrency: CurrencyCode
  nickname: string | null  // user_settings에 저장된 사용자 닉네임 (Google OAuth 재로그인에 영향받지 않음)
  setLocale: (locale: LocaleCode) => void
  setDefaultCurrency: (currency: CurrencyCode) => void
  setNickname: (nickname: string | null) => void
  setSettings: (settings: { locale: LocaleCode; defaultCurrency: CurrencyCode; nickname?: string | null }) => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  locale: 'ko',
  defaultCurrency: 'KRW',
  nickname: null,
  setLocale: (locale) => set({ locale }),
  setDefaultCurrency: (defaultCurrency) => set({ defaultCurrency }),
  setNickname: (nickname) => set({ nickname }),
  setSettings: ({ locale, defaultCurrency, nickname }) => set({ locale, defaultCurrency, nickname: nickname ?? null }),
}))
