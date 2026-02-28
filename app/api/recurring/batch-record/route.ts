import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiError } from '@/lib/api-errors'
import { getToday } from '@/lib/date-utils'

interface BatchRecordItem {
  id: string
  amount: number
  currency: string
  category_id?: string | null
  name: string
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')

  let body: { items: BatchRecordItem[]; localDate?: string }
  try {
    body = await request.json() as { items: BatchRecordItem[]; localDate?: string }
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  if (!body.items?.length) return apiError('VALIDATION_ERROR')

  const today = body.localDate ?? getToday()

  // 각 정기지출을 거래내역으로 생성
  const transactionInserts = body.items.map((item) => ({
    user_id: user.id,
    amount: item.amount,
    type: 'expense' as const,
    currency: item.currency,
    category_id: item.category_id ?? null,
    memo: item.name,
    date: today,
    is_favorite: false,
  }))

  const { error: txError } = await supabase.from('transactions').insert(transactionInserts)
  if (txError) return apiError('SERVER_ERROR')

  // last_recorded_date 단일 upsert로 일괄 업데이트 (트랜잭션 보장)
  const recurringUpdates = body.items.map((item) => ({
    id: item.id,
    user_id: user.id,
    last_recorded_date: today,
  }))
  const { error: upsertError } = await supabase
    .from('recurring_expenses')
    .upsert(recurringUpdates, { onConflict: 'id', ignoreDuplicates: false })
  if (upsertError) return apiError('SERVER_ERROR')

  return NextResponse.json({ success: true, data: { recorded: body.items.length } })
}
