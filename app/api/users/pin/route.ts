import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import bcrypt from 'bcryptjs'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const PIN_REGEX = /^\d{4,6}$/

/**
 * GET /api/users/pin
 * PIN 설정 여부만 확인 (pin_hash 존재 여부).
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return apiError('AUTH_REQUIRED')
    }

    const adminClient = createAdminClient()
    const { data, error } = await adminClient
      .from('users')
      .select('pin_hash')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      return apiError('SERVER_ERROR')
    }

    // 레코드 없으면 PIN 미설정으로 간주
    return NextResponse.json({
      success: true,
      data: { pinSet: Boolean(data?.pin_hash) },
    })
  } catch {
    return apiError('SERVER_ERROR')
  }
}

/**
 * POST /api/users/pin
 * PIN 최초 설정 및 변경 처리.
 *
 * body: { pin, confirmPin, currentPin? }
 * - currentPin 없음 → 최초 설정
 * - currentPin 있음 → 변경
 *
 * 이 엔드포인트는 user.email, user.user_metadata가 필요하므로 getUser()를 직접 사용.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // JWT 인증 확인 (user.email, user.user_metadata 접근을 위해 getUser() 사용)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return apiError('AUTH_REQUIRED')
    }

    const body = await request.json()
    const { pin, confirmPin, currentPin } = body as {
      pin: string
      confirmPin: string
      currentPin?: string
    }

    // 입력값 검증
    if (!pin || !confirmPin) {
      return apiError('VALIDATION_ERROR')
    }
    if (!PIN_REGEX.test(pin)) {
      return apiError('VALIDATION_ERROR')
    }
    if (pin !== confirmPin) {
      return apiError('VALIDATION_ERROR')
    }

    // 현재 사용자 PIN 정보 조회
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('pin_hash, pin_salt, pin_failed_count, pin_locked_until')
      .eq('id', user.id)
      .maybeSingle()

    if (fetchError) {
      return apiError('SERVER_ERROR')
    }

    const { pin_hash, pin_failed_count, pin_locked_until } = userData ?? {
      pin_hash: null, pin_salt: null, pin_failed_count: 0, pin_locked_until: null,
    }

    // 잠금 상태 확인
    if (pin_locked_until) {
      const lockedUntil = new Date(pin_locked_until).getTime()
      if (lockedUntil > Date.now()) {
        return apiError('LOCKED')
      }
    }

    // 최초 설정 vs 변경 분기
    const isChange = Boolean(currentPin)

    if (!isChange) {
      // 최초 설정: 이미 PIN이 있으면 409
      if (pin_hash) {
        return apiError('CONFLICT')
      }
    } else {
      // 변경: 기존 PIN 검증
      if (!pin_hash) {
        return apiError('NOT_FOUND')
      }

      // 잠금 임박 시에도 현재 PIN 확인 허용
      const match = await bcrypt.compare(currentPin!, pin_hash)
      if (!match) {
        return apiError('FORBIDDEN')
      }
    }

    // 새 PIN 해싱
    const salt = await bcrypt.genSalt(12)
    const newHash = await bcrypt.hash(pin, salt)

    // service_role로 RLS 우회하여 PIN 저장
    const adminClient = createAdminClient()
    const upsertPayload: Record<string, unknown> = {
      id: user.id,
      pin_hash: newHash,
      pin_salt: salt,
      pin_failed_count: 0,
      pin_locked_until: null,
      updated_at: new Date().toISOString(),
    }
    // 레코드가 없는 경우 필수 필드 포함
    if (!userData) {
      upsertPayload.email = user.email ?? ''
      upsertPayload.name =
        user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? ''
      upsertPayload.created_at = new Date().toISOString()
    }

    const { error: updateError } = await adminClient
      .from('users')
      .upsert(upsertPayload)

    if (updateError) {
      return apiError('SERVER_ERROR')
    }

    return NextResponse.json({
      success: true,
      data: { pinSet: true },
    })
  } catch {
    return apiError('SERVER_ERROR')
  }
}
