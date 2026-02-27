import { createClient } from '@/lib/supabase/server'
import { apiError } from '@/lib/api-errors'
import { searchFoods } from '@/lib/food-nutrition'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') ?? ''
  const locale = searchParams.get('locale') ?? 'ko'

  if (q.length < 1) {
    return Response.json({ foods: [] })
  }

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return apiError('AUTH_REQUIRED')

  const foods = await searchFoods(q, locale)

  // 음식 DB는 정적 데이터 — 브라우저에서 10분간 캐시 허용
  return Response.json({ foods }, {
    headers: { 'Cache-Control': 'private, max-age=600' },
  })
}
