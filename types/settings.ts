import type { CurrencyCode } from '@/lib/currency'

export type LocaleCode = 'ko' | 'en'

export interface UserSettings {
  id: string
  user_id: string
  locale: LocaleCode
  default_currency: CurrencyCode
  created_at: string
  updated_at: string
}

export type UpdateSettingsInput = Partial<Pick<UserSettings, 'locale' | 'default_currency'>>
