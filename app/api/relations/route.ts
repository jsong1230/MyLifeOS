import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
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
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user?.id
  if (!userId) return apiError('AUTH_REQUIRED')

  const { data, error } = await supabase
    .from('relations')
    .select('id, user_id, name, relationship_type, last_met_at, memo_encrypted, created_at, updated_at')
    .eq('user_id', userId)
    .order('name', { ascending: true })

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: data as Relation[] })
}

// POST /api/relations — 인간관계 등록
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')
  const userId = user.id

  let body: CreateRelationBody
  try {
    body = await request.json() as CreateRelationBody
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  // 이름 필수 검증
  if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
    return apiError('VALIDATION_ERROR')
  }

  // 관계 유형 검증
  if (!body.relationship_type || !VALID_RELATIONSHIP_TYPES.includes(
    body.relationship_type as (typeof VALID_RELATIONSHIP_TYPES)[number]
  )) {
    return apiError('VALIDATION_ERROR')
  }

  // 날짜 형식 검증 (입력된 경우)
  if (body.last_met_at != null && body.last_met_at !== '') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.last_met_at)) {
      return apiError('VALIDATION_ERROR')
    }
  }

  const insertData = {
    user_id: userId,
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
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: data as Relation }, { status: 201 })
}
