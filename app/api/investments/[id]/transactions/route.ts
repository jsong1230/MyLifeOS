import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import { getToday } from '@/lib/date-utils'
import type { InvestmentTransaction, CreateTradeInput } from '@/types/investment'

// POST /api/investments/[id]/transactions → 매수/매도 거래 추가
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: investmentId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')
  const userId = user.id

  let body: CreateTradeInput
  try {
    body = await request.json() as CreateTradeInput
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  if (!['buy', 'sell'].includes(body.type)) {
    return apiError('VALIDATION_ERROR')
  }
  if (isNaN(Number(body.price)) || Number(body.price) <= 0) {
    return apiError('VALIDATION_ERROR')
  }
  if (isNaN(Number(body.shares)) || Number(body.shares) <= 0) {
    return apiError('VALIDATION_ERROR')
  }

  // 현재 종목 데이터 조회 (user_id 검증 포함)
  const { data: investment, error: fetchError } = await supabase
    .from('investments')
    .select('id, shares, avg_cost')
    .eq('id', investmentId)
    .eq('user_id', userId)
    .single()

  if (fetchError || !investment) {
    return apiError('NOT_FOUND')
  }

  const currentShares = Number(investment.shares)
  const currentAvgCost = Number(investment.avg_cost)
  const tradePrice = Number(body.price)
  const tradeShares = Number(body.shares)
  const fee = Number(body.fee ?? 0)

  let newShares: number
  let newAvgCost: number

  if (body.type === 'buy') {
    // 매수: 가중평균 단가 재계산
    newShares = currentShares + tradeShares
    newAvgCost = newShares > 0
      ? (currentShares * currentAvgCost + tradePrice * tradeShares) / newShares
      : 0
  } else {
    // 매도: 보유수량 감소 (avg_cost 유지)
    newShares = currentShares - tradeShares
    if (newShares < 0) {
      return apiError('VALIDATION_ERROR')
    }
    newAvgCost = currentAvgCost
  }

  // 거래 내역 INSERT
  const { data: txData, error: txError } = await supabase
    .from('investment_transactions')
    .insert({
      user_id: userId,
      investment_id: investmentId,
      type: body.type,
      price: tradePrice,
      shares: tradeShares,
      fee: fee,
      date: body.date ?? getToday(),
      note: body.note ?? null,
    })
    .select('*')
    .single()

  if (txError || !txData) {
    return apiError('SERVER_ERROR')
  }

  // 종목 shares/avg_cost 업데이트
  const { error: updateError } = await supabase
    .from('investments')
    .update({ shares: newShares, avg_cost: newAvgCost })
    .eq('id', investmentId)
    .eq('user_id', userId)

  if (updateError) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: txData as InvestmentTransaction }, { status: 201 })
}
