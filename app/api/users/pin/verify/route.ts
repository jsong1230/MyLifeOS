import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import bcrypt from 'bcryptjs'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const MAX_ATTEMPTS = 5
const LOCK_DURATION_MS = 10 * 60 * 1000 // 10분

/**
 * POST /api/users/pin/verify
 * PIN 검증, 실패 횟수 관리, 잠금 처리.
 *
 * body: { pin }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // JWT 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return apiError('AUTH_REQUIRED')
    }

    const body = await request.json()
    const { pin } = body as { pin: string }

    if (!pin) {
      return apiError('VALIDATION_ERROR')
    }

    // 사용자 PIN 정보 조회 (RLS 우회)
    const adminClient = createAdminClient()
    const { data: userData, error: fetchError } = await adminClient
      .from('users')
      .select('pin_hash, pin_salt, pin_failed_count, pin_locked_until')
      .eq('id', user.id)
      .maybeSingle()

    if (fetchError) {
      return apiError('SERVER_ERROR')
    }

    const { pin_hash, pin_salt, pin_locked_until } = userData ?? {
      pin_hash: null, pin_salt: null, pin_failed_count: 0, pin_locked_until: null,
    }
    let { pin_failed_count } = userData ?? { pin_failed_count: 0 }

    // PIN 미설정 확인 (users 레코드 없음 포함)
    if (!userData || !pin_hash || !pin_salt) {
      return apiError('NOT_FOUND', { verified: false, pinSet: false })
    }

    // 잠금 상태 확인 (만료된 경우 자동 해제)
    if (pin_locked_until) {
      const lockedUntilMs = new Date(pin_locked_until).getTime()
      if (lockedUntilMs > Date.now()) {
        const remainingSeconds = Math.ceil((lockedUntilMs - Date.now()) / 1000)
        return apiError('LOCKED', { lockedUntil: lockedUntilMs, remainingSeconds })
      } else {
        // 잠금 만료: 자동 해제
        await adminClient
          .from('users')
          .update({ pin_failed_count: 0, pin_locked_until: null })
          .eq('id', user.id)
        pin_failed_count = 0
      }
    }

    // PIN 검증
    const match = await bcrypt.compare(pin, pin_hash)

    if (match) {
      // 성공: 실패 횟수 초기화
      await adminClient
        .from('users')
        .update({ pin_failed_count: 0, pin_locked_until: null })
        .eq('id', user.id)

      return NextResponse.json({
        success: true,
        data: { verified: true },
      })
    }

    // 실패: 카운터 증가
    const newCount = pin_failed_count + 1

    if (newCount >= MAX_ATTEMPTS) {
      // 5회 도달 → 10분 잠금
      const lockedUntil = new Date(Date.now() + LOCK_DURATION_MS)
      await adminClient
        .from('users')
        .update({ pin_failed_count: newCount, pin_locked_until: lockedUntil.toISOString() })
        .eq('id', user.id)

      return apiError('LOCKED', {
        lockedUntil: lockedUntil.getTime(),
        remainingSeconds: Math.ceil(LOCK_DURATION_MS / 1000),
      })
    }

    // 실패 (5회 미만)
    await adminClient
      .from('users')
      .update({ pin_failed_count: newCount })
      .eq('id', user.id)

    return NextResponse.json({
      success: false,
      data: {
        verified: false,
        failedAttempts: newCount,
        maxAttempts: MAX_ATTEMPTS,
        remainingAttempts: MAX_ATTEMPTS - newCount,
      },
    })
  } catch {
    return apiError('SERVER_ERROR')
  }
}
