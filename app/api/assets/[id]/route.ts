import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import type { Asset, UpdateAssetInput } from '@/types/asset'

const VALID_ASSET_TYPES = ['cash', 'deposit', 'investment', 'other'] as const

// PATCH /api/assets/[id] → 자산 수정
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return apiError('AUTH_REQUIRED')
  }

  let body: UpdateAssetInput
  try {
    body = await request.json() as UpdateAssetInput
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  if (body.asset_type !== undefined && !VALID_ASSET_TYPES.includes(body.asset_type)) {
    return apiError('VALIDATION_ERROR')
  }

  if (body.amount !== undefined && (isNaN(Number(body.amount)) || Number(body.amount) < 0)) {
    return apiError('VALIDATION_ERROR')
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
    return apiError('SERVER_ERROR')
  }
  if (!data) {
    return apiError('NOT_FOUND')
  }

  return NextResponse.json({ success: true, data: data as Asset })
}

// DELETE /api/assets/[id] → 자산 삭제
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return apiError('AUTH_REQUIRED')
  }

  const { error } = await supabase
    .from('assets')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: null })
}
