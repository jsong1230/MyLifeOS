import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import { getUserDefaultCurrency } from '@/lib/user-defaults'
import type { ShoppingListSummary } from '@/types/shopping'

// GET /api/money/shopping → 장보기 목록 (최근 10개, 요약 포함)
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')

  const { data, error } = await supabase
    .from('shopping_lists')
    .select(`
      id, user_id, name, budget, currency, is_completed, created_at, updated_at,
      shopping_items(id, estimated_price, actual_price, is_checked)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) return apiError('SERVER_ERROR')

  const summaries: ShoppingListSummary[] = (data ?? []).map((list) => {
    const items = list.shopping_items ?? []
    const total_items = items.length
    const checked_items = items.filter((i) => i.is_checked).length
    const estimated_total = items.reduce((sum, i) => sum + (i.estimated_price ?? 0), 0)
    const actual_total = items.reduce((sum, i) => sum + (i.actual_price ?? 0), 0)

    return {
      id: list.id,
      user_id: list.user_id,
      name: list.name,
      budget: list.budget,
      currency: list.currency,
      is_completed: list.is_completed,
      created_at: list.created_at ?? '',
      updated_at: list.updated_at ?? '',
      total_items,
      checked_items,
      estimated_total,
      actual_total,
    }
  })

  return NextResponse.json({ success: true, data: summaries })
}

// POST /api/money/shopping → 새 목록 생성
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')

  let body: { name?: string; budget?: number; currency?: string }
  try {
    body = await request.json() as { name?: string; budget?: number; currency?: string }
  } catch {
    body = {}
  }

  const defaultCurrency = await getUserDefaultCurrency(supabase, user.id)

  const { data, error } = await supabase
    .from('shopping_lists')
    .insert({
      user_id: user.id,
      name: body.name?.trim() || '장보기 목록',
      budget: body.budget ?? null,
      currency: body.currency ?? defaultCurrency,
    })
    .select('id, user_id, name, budget, currency, is_completed, created_at, updated_at')
    .single()

  if (error) return apiError('SERVER_ERROR')

  return NextResponse.json({ success: true, data }, { status: 201 })
}
