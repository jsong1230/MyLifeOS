import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_LAYOUT } from '@/types/dashboard-layout'
import type { WidgetConfig } from '@/types/dashboard-layout'

// GET /api/settings/dashboard-layout — 대시보드 레이아웃 조회
export async function GET(_request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')

  const { data, error } = await supabase
    .from('user_settings')
    .select('dashboard_layout')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    return apiError('SERVER_ERROR')
  }

  const layout: WidgetConfig[] = data?.dashboard_layout ?? DEFAULT_LAYOUT
  return NextResponse.json({ success: true, data: layout })
}

// PATCH /api/settings/dashboard-layout — 대시보드 레이아웃 저장
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')

  let body: { layout: WidgetConfig[] }
  try {
    body = await request.json()
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  const { layout } = body
  if (!Array.isArray(layout) || layout.length === 0) {
    return apiError('VALIDATION_ERROR')
  }

  // 기본 유효성 검사
  const validKeys = new Set(['time', 'money', 'health', 'private', 'books'])
  for (const item of layout) {
    if (
      typeof item.key !== 'string' ||
      !validKeys.has(item.key) ||
      typeof item.visible !== 'boolean' ||
      typeof item.order !== 'number'
    ) {
      return apiError('VALIDATION_ERROR')
    }
  }

  const { data, error } = await supabase
    .from('user_settings')
    .upsert(
      { user_id: user.id, dashboard_layout: layout },
      { onConflict: 'user_id' }
    )
    .select('dashboard_layout')
    .single()

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: data.dashboard_layout })
}
