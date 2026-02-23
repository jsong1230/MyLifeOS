import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { BodyLog, UpdateBodyLogInput } from '@/types/health'

// PATCH /api/health/body/[id]
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ success: false, error: '인증이 필요합니다' }, { status: 401 })
  }

  let body: UpdateBodyLogInput
  try {
    body = await request.json() as UpdateBodyLogInput
  } catch {
    return NextResponse.json({ success: false, error: '잘못된 요청 형식입니다' }, { status: 400 })
  }

  const updateData: Record<string, unknown> = {}
  if ('weight' in body) updateData.weight = body.weight ?? null
  if ('body_fat' in body) updateData.body_fat = body.body_fat ?? null
  if ('muscle_mass' in body) updateData.muscle_mass = body.muscle_mass ?? null
  if (body.date) updateData.date = body.date
  if ('note' in body) updateData.note = body.note ?? null

  const { data, error } = await supabase
    .from('body_logs')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ success: false, error: '체중 기록 수정에 실패했습니다' }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ success: false, error: '기록을 찾을 수 없습니다' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: data as BodyLog })
}

// DELETE /api/health/body/[id]
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ success: false, error: '인증이 필요합니다' }, { status: 401 })
  }

  const { error } = await supabase
    .from('body_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ success: false, error: '체중 기록 삭제에 실패했습니다' }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: null })
}
