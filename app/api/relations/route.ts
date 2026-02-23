import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Relation } from '@/types/relation'

const VALID_RELATIONSHIP_TYPES = ['family', 'friend', 'colleague', 'other'] as const

// API 요청 바디 타입 — 클라이언트가 암호화 후 전송하는 형식
interface CreateRelationBody {
  name: string
  relationship_type: string
  last_met_at?: string | null
  memo_encrypted?: string | null
}

// GET /api/relations — 내 인간관계 목록 전체 조회
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: '인증이 필요합니다' },
      { status: 401 }
    )
  }

  const { data, error } = await supabase
    .from('relations')
    .select('id, user_id, name, relationship_type, last_met_at, memo_encrypted, created_at, updated_at')
    .eq('user_id', user.id)
    .order('name', { ascending: true })

  if (error) {
    return NextResponse.json(
      { success: false, error: '인간관계 목록 조회에 실패했습니다' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data: data as Relation[] })
}

// POST /api/relations — 인간관계 등록
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: '인증이 필요합니다' },
      { status: 401 }
    )
  }

  let body: CreateRelationBody
  try {
    body = await request.json() as CreateRelationBody
  } catch {
    return NextResponse.json(
      { success: false, error: '잘못된 요청 형식입니다' },
      { status: 400 }
    )
  }

  // 이름 필수 검증
  if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
    return NextResponse.json(
      { success: false, error: '이름은 필수입니다' },
      { status: 400 }
    )
  }

  // 관계 유형 검증
  if (!body.relationship_type || !VALID_RELATIONSHIP_TYPES.includes(
    body.relationship_type as (typeof VALID_RELATIONSHIP_TYPES)[number]
  )) {
    return NextResponse.json(
      { success: false, error: '유효하지 않은 관계 유형입니다' },
      { status: 400 }
    )
  }

  // 날짜 형식 검증 (입력된 경우)
  if (body.last_met_at != null && body.last_met_at !== '') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.last_met_at)) {
      return NextResponse.json(
        { success: false, error: '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)' },
        { status: 400 }
      )
    }
  }

  const insertData = {
    user_id: user.id,
    name: body.name.trim(),
    relationship_type: body.relationship_type,
    last_met_at: body.last_met_at ?? null,
    memo_encrypted: body.memo_encrypted ?? null,
  }

  const { data, error } = await supabase
    .from('relations')
    .insert(insertData)
    .select('id, user_id, name, relationship_type, last_met_at, memo_encrypted, created_at, updated_at')
    .maybeSingle()

  if (error) {
    return NextResponse.json(
      { success: false, error: '인간관계 등록에 실패했습니다' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data: data as Relation }, { status: 201 })
}
