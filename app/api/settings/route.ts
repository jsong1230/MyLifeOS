import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import type { UpdateSettingsInput } from '@/types/settings'

// GET /api/settings — 사용자 설정 조회
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id
  if (!userId) return apiError('AUTH_REQUIRED')

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    return apiError('SERVER_ERROR')
  }

  // 설정이 없으면 기본값 반환
  const settings = data ?? { locale: 'ko', default_currency: 'KRW' }
  return NextResponse.json({ success: true, data: settings })
}

// PATCH /api/settings — 사용자 설정 업데이트
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')
  const userId = user.id

  let body: UpdateSettingsInput
  try {
    body = await request.json()
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  const { locale, default_currency, nickname, onboarding_completed } = body

  // 유효성 검사
  if (locale && !['ko', 'en'].includes(locale)) {
    return apiError('VALIDATION_ERROR')
  }
  if (default_currency && !['KRW', 'CAD', 'USD'].includes(default_currency)) {
    return apiError('VALIDATION_ERROR')
  }
  if (nickname !== undefined && nickname !== null && (typeof nickname !== 'string' || nickname.length > 50)) {
    return apiError('VALIDATION_ERROR')
  }
  if (onboarding_completed !== undefined && typeof onboarding_completed !== 'boolean') {
    return apiError('VALIDATION_ERROR')
  }

  const updateData: UpdateSettingsInput = {}
  if (locale) updateData.locale = locale
  if (default_currency) updateData.default_currency = default_currency
  if ('nickname' in body) updateData.nickname = nickname ?? null
  if (onboarding_completed !== undefined) updateData.onboarding_completed = onboarding_completed

  const { data, error } = await supabase
    .from('user_settings')
    .upsert(
      { user_id: userId, ...updateData },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (error) {
    return apiError('SERVER_ERROR')
  }

  // locale 변경 시 쿠키도 업데이트
  if (locale) {
    const cookieStore = await cookies()
    cookieStore.set('locale', locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1년
      sameSite: 'lax',
    })
  }

  return NextResponse.json({ success: true, data })
}
