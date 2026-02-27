import { createClient } from '@/lib/supabase/server'
import { apiError } from '@/lib/api-errors'
import { searchFoods } from '@/lib/food-nutrition'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') ?? ''

  if (q.length < 2) {
    return Response.json({ foods: [] })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')

  const foods = await searchFoods(q)
  return Response.json({ foods })
}
