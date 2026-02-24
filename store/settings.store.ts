import { create } from 'zustand'
import type { CurrencyCode } from '@/lib/currency'
import type { LocaleCode } from '@/types/settings'

interface SettingsState {
  locale: LocaleCode
  defaultCurrency: CurrencyCode
  setLocale: (locale: LocaleCode) => void
  setDefaultCurrency: (currency: CurrencyCode) => void
  setSettings: (settings: { locale: LocaleCode; defaultCurrency: CurrencyCode }) => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  locale: 'ko',
  defaultCurrency: 'KRW',
  setLocale: (locale) => set({ locale }),
  setDefaultCurrency: (defaultCurrency) => set({ defaultCurrency }),
  setSettings: ({ locale, defaultCurrency }) => set({ locale, defaultCurrency }),
}))
