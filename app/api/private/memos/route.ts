import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import type { QuickMemo } from '@/types/memo'

const VALID_COLORS = ['default', 'yellow', 'green', 'blue', 'pink', 'purple'] as const

// POST 요청 바디 타입 — 클라이언트가 암호화한 content를 받음
interface CreateMemoBody {
  content_encrypted: string
  is_pinned?: boolean
  color?: string
}

// GET /api/private/memos — 내 퀵 메모 목록 전체 조회 (복호화는 클라이언트에서)
export async function GET(_request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')

  const { data, error } = await supabase
    .from('quick_memos')
    .select('id, user_id, content_encrypted, is_pinned, color, created_at, updated_at')
    .eq('user_id', user.id)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: data as QuickMemo[] })
}

// POST /api/private/memos — 퀵 메모 생성
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')

  let body: CreateMemoBody
  try {
    body = await request.json() as CreateMemoBody
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  // content_encrypted 필수 검증
  if (!body.content_encrypted || typeof body.content_encrypted !== 'string' || body.content_encrypted.trim() === '') {
    return apiError('VALIDATION_ERROR')
  }

  // color 검증 (있는 경우)
  if (body.color !== undefined && !VALID_COLORS.includes(body.color as (typeof VALID_COLORS)[number])) {
    return apiError('VALIDATION_ERROR')
  }

  const insertData = {
    user_id: user.id,
    content_encrypted: body.content_encrypted,
    is_pinned: body.is_pinned ?? false,
    color: body.color ?? 'default',
  }

  const { data, error } = await supabase
    .from('quick_memos')
    .insert(insertData)
    .select('id, user_id, content_encrypted, is_pinned, color, created_at, updated_at')
    .maybeSingle()

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: data as QuickMemo }, { status: 201 })
}
