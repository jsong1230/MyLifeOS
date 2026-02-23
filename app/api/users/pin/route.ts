import { NextResponse, type NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { createClient } from '@/lib/supabase/server'

const PIN_REGEX = /^\d{4,6}$/

/**
 * GET /api/users/pin
 * PIN 설정 여부만 확인 (pin_hash 존재 여부).
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('users')
      .select('pin_hash')
      .eq('id', user.id)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: '사용자 정보를 조회할 수 없습니다' }, { status: 500 })
    }

    // 레코드 없으면 PIN 미설정으로 간주
    return NextResponse.json({
      success: true,
      data: { pinSet: Boolean(data?.pin_hash) },
    })
  } catch {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 },
    )
  }
}

/**
 * POST /api/users/pin
 * PIN 최초 설정 및 변경 처리.
 *
 * body: { pin, confirmPin, currentPin? }
 * - currentPin 없음 → 최초 설정
 * - currentPin 있음 → 변경
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // JWT 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()
    const { pin, confirmPin, currentPin } = body as {
      pin: string
      confirmPin: string
      currentPin?: string
    }

    // 입력값 검증
    if (!pin || !confirmPin) {
      return NextResponse.json({ error: 'PIN을 입력해주세요' }, { status: 400 })
    }
    if (!PIN_REGEX.test(pin)) {
      return NextResponse.json(
        { error: 'PIN은 4~6자리 숫자만 사용 가능합니다' },
        { status: 400 },
      )
    }
    if (pin !== confirmPin) {
      return NextResponse.json({ error: 'PIN이 일치하지 않습니다' }, { status: 400 })
    }

    // 현재 사용자 PIN 정보 조회
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('pin_hash, pin_salt, pin_failed_count, pin_locked_until')
      .eq('id', user.id)
      .maybeSingle()

    if (fetchError) {
      return NextResponse.json({ error: '사용자 정보를 조회할 수 없습니다' }, { status: 500 })
    }

    // users 레코드가 없으면 upsert로 생성 후 진행
    if (!userData) {
      await supabase.from('users').upsert({
        id: user.id,
        email: user.email ?? '',
        name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? '',
        created_at: new Date().toISOString(),
      })
    }

    const { pin_hash, pin_failed_count, pin_locked_until } = userData ?? {
      pin_hash: null, pin_salt: null, pin_failed_count: 0, pin_locked_until: null,
    }

    // 잠금 상태 확인
    if (pin_locked_until) {
      const lockedUntil = new Date(pin_locked_until).getTime()
      if (lockedUntil > Date.now()) {
        const remainingSeconds = Math.ceil((lockedUntil - Date.now()) / 1000)
        return NextResponse.json(
          { error: '앱이 잠금 상태입니다', lockedUntil, remainingSeconds },
          { status: 423 },
        )
      }
    }

    // 최초 설정 vs 변경 분기
    const isChange = Boolean(currentPin)

    if (!isChange) {
      // 최초 설정: 이미 PIN이 있으면 409
      if (pin_hash) {
        return NextResponse.json(
          { error: 'PIN이 이미 설정되어 있습니다. 변경 기능을 사용해주세요' },
          { status: 409 },
        )
      }
    } else {
      // 변경: 기존 PIN 검증
      if (!pin_hash) {
        return NextResponse.json(
          { error: '설정된 PIN이 없습니다. 먼저 PIN을 설정해주세요' },
          { status: 404 },
        )
      }

      // 잠금 임박 시에도 현재 PIN 확인 허용
      const match = await bcrypt.compare(currentPin!, pin_hash)
      if (!match) {
        return NextResponse.json({ error: '현재 PIN이 올바르지 않습니다' }, { status: 403 })
      }
    }

    // 새 PIN 해싱
    const salt = await bcrypt.genSalt(12)
    const newHash = await bcrypt.hash(pin, salt)

    const { error: updateError } = await supabase
      .from('users')
      .update({
        pin_hash: newHash,
        pin_salt: salt,
        pin_failed_count: 0,
        pin_locked_until: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json({ error: 'PIN 저장에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: { pinSet: true, salt },
    })
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
