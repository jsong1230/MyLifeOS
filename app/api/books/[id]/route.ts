import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import { getToday } from '@/lib/date-utils'
import type { Book, BookStatus, UpdateBookInput } from '@/types/book'

const VALID_STATUSES: BookStatus[] = ['to_read', 'reading', 'completed']

// GET /api/books/[id] — 단건 조회
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')
  const userId = user.id

  const { id } = await params

  if (!id) return apiError('VALIDATION_ERROR')

  const { data, error } = await supabase
    .from('books')
    .select('id, user_id, title, author, total_pages, current_page, status, started_at, completed_at, rating, memo, created_at, updated_at')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) return apiError('SERVER_ERROR')
  if (!data) return apiError('NOT_FOUND')

  return NextResponse.json({ success: true, data: data as Book })
}

// PATCH /api/books/[id] — 정보 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')
  const userId = user.id

  const { id } = await params

  if (!id) return apiError('VALIDATION_ERROR')

  let body: UpdateBookInput
  try {
    body = await request.json() as UpdateBookInput
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  // 소유자 확인
  const { data: existing } = await supabase
    .from('books')
    .select('id, status, started_at')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()

  if (!existing) return apiError('NOT_FOUND')

  // 업데이트 데이터 빌드
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || body.title.trim() === '') {
      return apiError('VALIDATION_ERROR')
    }
    updateData.title = body.title.trim()
  }

  if (body.author !== undefined) {
    updateData.author = body.author?.trim() ?? null
  }

  if (body.total_pages !== undefined) {
    if (typeof body.total_pages !== 'number' || body.total_pages < 1) {
      return apiError('VALIDATION_ERROR')
    }
    updateData.total_pages = body.total_pages
  }

  if (body.current_page !== undefined) {
    if (typeof body.current_page !== 'number' || body.current_page < 0) {
      return apiError('VALIDATION_ERROR')
    }
    updateData.current_page = body.current_page
  }

  if (body.rating !== undefined) {
    if (typeof body.rating !== 'number' || body.rating < 1 || body.rating > 5) {
      return apiError('VALIDATION_ERROR')
    }
    updateData.rating = body.rating
  }

  if (body.memo !== undefined) {
    updateData.memo = body.memo ?? null
  }

  if (body.started_at !== undefined) {
    if (body.started_at && !/^\d{4}-\d{2}-\d{2}$/.test(body.started_at)) {
      return apiError('VALIDATION_ERROR')
    }
    updateData.started_at = body.started_at ?? null
  }

  if (body.completed_at !== undefined) {
    if (body.completed_at && !/^\d{4}-\d{2}-\d{2}$/.test(body.completed_at)) {
      return apiError('VALIDATION_ERROR')
    }
    updateData.completed_at = body.completed_at ?? null
  }

  // 상태 변경 시 자동 날짜 처리
  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) {
      return apiError('VALIDATION_ERROR')
    }
    updateData.status = body.status

    const today = getToday()

    // completed로 변경 시 completed_at 자동 설정
    if (body.status === 'completed' && body.completed_at === undefined) {
      updateData.completed_at = today
    }

    // reading으로 변경 시 started_at이 null이면 today로 설정
    if (body.status === 'reading' && body.started_at === undefined) {
      const currentStartedAt = (existing as { started_at?: string | null }).started_at
      if (!currentStartedAt) {
        updateData.started_at = today
      }
    }
  }

  const { data, error } = await supabase
    .from('books')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select('id, user_id, title, author, total_pages, current_page, status, started_at, completed_at, rating, memo, created_at, updated_at')
    .maybeSingle()

  if (error) return apiError('SERVER_ERROR')

  return NextResponse.json({ success: true, data: data as Book })
}

// DELETE /api/books/[id] — 삭제
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')
  const userId = user.id

  const { id } = await params

  if (!id) return apiError('VALIDATION_ERROR')

  // 소유자 확인
  const { data: existing } = await supabase
    .from('books')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()

  if (!existing) return apiError('NOT_FOUND')

  const { error } = await supabase
    .from('books')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) return apiError('SERVER_ERROR')

  return NextResponse.json({ success: true, data: null })
}
