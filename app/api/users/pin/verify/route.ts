import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import bcrypt from 'bcryptjs'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('AUTH_REQUIRED')
    const userId = user.id

    const body = await request.json()
    const { pin, localEncSalt } = body as { pin: string; localEncSalt?: string | null }

    if (!pin) {
      return apiError('VALIDATION_ERROR')
    }

    // 사용자 PIN 정보 조회 (RLS 우회)
    const adminClient = createAdminClient()
    const { data: userData, error: fetchError } = await adminClient
      .from('users')
      .select('pin_hash, pin_salt, pin_failed_count, pin_locked_until, enc_salt')
      .eq('id', userId)
      .maybeSingle()

    if (fetchError) {
      return apiError('SERVER_ERROR')
    }

    const { pin_hash, pin_salt, pin_locked_until, enc_salt } = userData ?? {
      pin_hash: null, pin_salt: null, pin_failed_count: 0, pin_locked_until: null, enc_salt: null,
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
          .eq('id', userId)
        pin_failed_count = 0
      }
    }

    // PIN 검증
    const match = await bcrypt.compare(pin, pin_hash)

    if (match) {
      // 성공: 실패 횟수 초기화 + enc_salt 마이그레이션 (서버에 없고 클라이언트가 보낸 경우)
      const updatePayload: Record<string, unknown> = { pin_failed_count: 0, pin_locked_until: null }
      const resolvedEncSalt = enc_salt ?? (localEncSalt || null)
      if (!enc_salt && localEncSalt) {
        updatePayload.enc_salt = localEncSalt
      }
      await adminClient
        .from('users')
        .update(updatePayload)
        .eq('id', userId)

      return NextResponse.json({
        success: true,
        data: { verified: true, encSalt: resolvedEncSalt },
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
        .eq('id', userId)

      return apiError('LOCKED', {
        lockedUntil: lockedUntil.getTime(),
        remainingSeconds: Math.ceil(LOCK_DURATION_MS / 1000),
      })
    }

    // 실패 (5회 미만)
    await adminClient
      .from('users')
      .update({ pin_failed_count: newCount })
      .eq('id', userId)

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
