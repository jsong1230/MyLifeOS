import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import { getToday } from '@/lib/date-utils'
import type { Book, BookStatus, CreateBookInput } from '@/types/book'

const VALID_STATUSES: BookStatus[] = ['to_read', 'reading', 'completed']

// GET /api/books?status=reading|completed|to_read — 독서 목록 조회
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id
  if (!userId) return apiError('AUTH_REQUIRED')

  const { searchParams } = new URL(request.url)
  const statusFilter = searchParams.get('status') as BookStatus | null

  let query = supabase
    .from('books')
    .select('id, user_id, title, author, total_pages, current_page, status, started_at, completed_at, rating, memo, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (statusFilter && VALID_STATUSES.includes(statusFilter)) {
    query = query.eq('status', statusFilter)
  }

  const { data, error } = await query

  if (error) {
    return apiError('SERVER_ERROR')
  }

  const books = data as Book[]

  // 통계 계산
  const stats = {
    total: books.length,
    reading: books.filter((b) => b.status === 'reading').length,
    completed: books.filter((b) => b.status === 'completed').length,
  }

  return NextResponse.json({ success: true, data: books, stats })
}

// POST /api/books — 책 등록
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')
  const userId = user.id

  let body: CreateBookInput
  try {
    body = await request.json() as CreateBookInput
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  // 제목 필수 검증
  if (!body.title || typeof body.title !== 'string' || body.title.trim() === '') {
    return apiError('VALIDATION_ERROR')
  }

  // 상태 검증 (제공된 경우)
  const status: BookStatus = body.status && VALID_STATUSES.includes(body.status)
    ? body.status
    : 'to_read'

  // 시작일 검증 (제공된 경우)
  if (body.started_at && !/^\d{4}-\d{2}-\d{2}$/.test(body.started_at)) {
    return apiError('VALIDATION_ERROR')
  }

  // 총 페이지 검증 (제공된 경우)
  if (body.total_pages !== undefined && (typeof body.total_pages !== 'number' || body.total_pages < 1)) {
    return apiError('VALIDATION_ERROR')
  }

  const today = getToday()
  const insertData: Record<string, unknown> = {
    user_id: userId,
    title: body.title.trim(),
    author: body.author?.trim() ?? null,
    total_pages: body.total_pages ?? null,
    current_page: 0,
    status,
    started_at: body.started_at ?? (status === 'reading' ? today : null),
    completed_at: status === 'completed' ? today : null,
    memo: null,
    rating: null,
  }

  const { data, error } = await supabase
    .from('books')
    .insert(insertData)
    .select('id, user_id, title, author, total_pages, current_page, status, started_at, completed_at, rating, memo, created_at, updated_at')
    .maybeSingle()

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: data as Book }, { status: 201 })
}
