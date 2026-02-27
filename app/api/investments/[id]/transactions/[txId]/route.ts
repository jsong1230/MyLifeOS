import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import type { InvestmentTransaction } from '@/types/investment'

// DELETE /api/investments/[id]/transactions/[txId] → 거래 삭제 후 shares/avg_cost 완전 재계산
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; txId: string }> }
) {
  const { id: investmentId, txId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')
  const userId = user.id

  // 종목 소유권 검증
  const { data: investment, error: invError } = await supabase
    .from('investments')
    .select('id')
    .eq('id', investmentId)
    .eq('user_id', userId)
    .single()

  if (invError || !investment) {
    return apiError('NOT_FOUND')
  }

  // 거래 삭제
  const { error: deleteError } = await supabase
    .from('investment_transactions')
    .delete()
    .eq('id', txId)
    .eq('investment_id', investmentId)
    .eq('user_id', userId)

  if (deleteError) {
    return apiError('SERVER_ERROR')
  }

  // 남은 거래 내역으로 shares/avg_cost 완전 재계산
  const { data: remaining, error: fetchError } = await supabase
    .from('investment_transactions')
    .select('type, price, shares')
    .eq('investment_id', investmentId)
    .eq('user_id', userId)
    .order('date', { ascending: true })
    .order('created_at', { ascending: true })

  if (fetchError) {
    return apiError('SERVER_ERROR')
  }

  const transactions = (remaining ?? []) as Pick<InvestmentTransaction, 'type' | 'price' | 'shares'>[]

  // 매수 거래만 기반으로 가중평균 단가 계산 (매도는 수량만 감소)
  let totalShares = 0
  let weightedCostSum = 0  // sum of (price * shares) for buy trades, adjusted proportionally

  for (const tx of transactions) {
    const txShares = Number(tx.shares)
    const txPrice = Number(tx.price)

    if (tx.type === 'buy') {
      weightedCostSum += txPrice * txShares
      totalShares += txShares
    } else {
      // 매도 시 비율에 따라 weightedCostSum도 감소
      if (totalShares > 0) {
        const ratio = Math.min(txShares, totalShares) / totalShares
        weightedCostSum -= weightedCostSum * ratio
      }
      totalShares = Math.max(0, totalShares - txShares)
    }
  }

  const newAvgCost = totalShares > 0 ? weightedCostSum / totalShares : 0

  const { error: updateError } = await supabase
    .from('investments')
    .update({ shares: totalShares, avg_cost: newAvgCost })
    .eq('id', investmentId)
    .eq('user_id', userId)

  if (updateError) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: null })
}
