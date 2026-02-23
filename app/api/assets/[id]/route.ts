import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Asset, UpdateAssetInput } from '@/types/asset'

const VALID_ASSET_TYPES = ['cash', 'deposit', 'investment', 'other'] as const

// PATCH /api/assets/[id] → 자산 수정
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ success: false, error: '인증이 필요합니다' }, { status: 401 })
  }

  let body: UpdateAssetInput
  try {
    body = await request.json() as UpdateAssetInput
  } catch {
    return NextResponse.json({ success: false, error: '잘못된 요청 형식입니다' }, { status: 400 })
  }

  if (body.asset_type !== undefined && !VALID_ASSET_TYPES.includes(body.asset_type)) {
    return NextResponse.json({ success: false, error: '유효하지 않은 자산 유형입니다' }, { status: 400 })
  }

  if (body.amount !== undefined && (isNaN(Number(body.amount)) || Number(body.amount) < 0)) {
    return NextResponse.json({ success: false, error: '금액은 0 이상이어야 합니다' }, { status: 400 })
  }

  const updateData: Record<string, unknown> = {}
  if (body.asset_type !== undefined) updateData.asset_type = body.asset_type
  if (body.amount !== undefined) updateData.amount = Number(body.amount)
  if ('note' in body) updateData.note = body.note ?? null

  const { data, error } = await supabase
    .from('assets')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ success: false, error: '자산 수정에 실패했습니다' }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ success: false, error: '자산을 찾을 수 없습니다' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: data as Asset })
}

// DELETE /api/assets/[id] → 자산 삭제
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ success: false, error: '인증이 필요합니다' }, { status: 401 })
  }

  const { error } = await supabase
    .from('assets')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ success: false, error: '자산 삭제에 실패했습니다' }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: null })
}
