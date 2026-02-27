import type { CurrencyCode } from '@/lib/currency'

export type LocaleCode = 'ko' | 'en'

export interface UserSettings {
  id: string
  user_id: string
  locale: LocaleCode
  default_currency: CurrencyCode
  nickname?: string | null  // 사용자 설정 표시 이름 (Google OAuth 재로그인에 영향받지 않음)
  created_at: string
  updated_at: string
}

export type UpdateSettingsInput = Partial<Pick<UserSettings, 'locale' | 'default_currency' | 'nickname'>>
