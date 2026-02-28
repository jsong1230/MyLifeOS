import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import type { Investment, InvestmentWithTransactions, UpdateInvestmentInput } from '@/types/investment'

// GET /api/investments/[id] → 종목 상세 + 거래 내역
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id
  if (!userId) return apiError('AUTH_REQUIRED')

  const { data, error } = await supabase
    .from('investments')
    .select('*, investment_transactions(*)')
    .eq('id', id)
    .eq('user_id', userId)
    .order('date', { referencedTable: 'investment_transactions', ascending: false })
    .single()

  if (error || !data) {
    return apiError('NOT_FOUND')
  }

  return NextResponse.json({ success: true, data: data as InvestmentWithTransactions })
}

// PATCH /api/investments/[id] → 종목 수정 (current_price, name, exchange, note만)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')
  const userId = user.id

  let body: UpdateInvestmentInput
  try {
    body = await request.json() as UpdateInvestmentInput
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  const updateData: Record<string, unknown> = {}
  if (body.name !== undefined) updateData.name = body.name.trim()
  if ('current_price' in body) updateData.current_price = body.current_price ?? null
  if ('exchange' in body) updateData.exchange = body.exchange ?? null
  if ('note' in body) updateData.note = body.note ?? null

  if (Object.keys(updateData).length === 0) {
    return apiError('VALIDATION_ERROR')
  }

  const { data, error } = await supabase
    .from('investments')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) {
    return apiError('SERVER_ERROR')
  }
  if (!data) {
    return apiError('NOT_FOUND')
  }

  return NextResponse.json({ success: true, data: data as Investment })
}

// DELETE /api/investments/[id] → 종목 삭제 (CASCADE로 거래 내역도 삭제)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')
  const userId = user.id

  const { error } = await supabase
    .from('investments')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: null })
}
