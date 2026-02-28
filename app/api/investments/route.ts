import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import type { Investment, CreateInvestmentInput } from '@/types/investment'

const VALID_ASSET_TYPES = ['stock', 'etf', 'crypto', 'other'] as const

// GET /api/investments → 종목 목록 조회
export async function GET(_request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id
  if (!userId) return apiError('AUTH_REQUIRED')

  const { data, error } = await supabase
    .from('investments')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true })

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: (data ?? []) as Investment[] })
}

// POST /api/investments → 종목 추가
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')
  const userId = user.id

  let body: CreateInvestmentInput
  try {
    body = await request.json() as CreateInvestmentInput
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  if (!body.ticker || !body.name) {
    return apiError('VALIDATION_ERROR')
  }

  if (!VALID_ASSET_TYPES.includes(body.asset_type)) {
    return apiError('VALIDATION_ERROR')
  }

  if (!body.currency) {
    return apiError('VALIDATION_ERROR')
  }

  const { data, error } = await supabase
    .from('investments')
    .insert({
      user_id: userId,
      ticker: body.ticker.toUpperCase().trim(),
      name: body.name.trim(),
      asset_type: body.asset_type,
      currency: body.currency,
      exchange: body.exchange ?? null,
      note: body.note ?? null,
      shares: 0,
      avg_cost: 0,
      current_price: null,
    })
    .select('*')
    .single()

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: data as Investment }, { status: 201 })
}
