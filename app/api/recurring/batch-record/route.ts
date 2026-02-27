import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiError } from '@/lib/api-errors'

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

  let body: { items: BatchRecordItem[] }
  try {
    body = await request.json() as { items: BatchRecordItem[] }
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  if (!body.items?.length) return apiError('VALIDATION_ERROR')

  const today = new Date().toISOString().split('T')[0]

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

  // last_recorded_date 업데이트
  const updatePromises = body.items.map((item) =>
    supabase
      .from('recurring_expenses')
      .update({ last_recorded_date: today })
      .eq('id', item.id)
      .eq('user_id', user.id)
  )
  await Promise.all(updatePromises)

  return NextResponse.json({ success: true, data: { recorded: body.items.length } })
}
