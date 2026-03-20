import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://mylifeos.songfamily.work'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_error`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('OAuth callback error:', error.message)
    return NextResponse.redirect(`${origin}/login?error=auth_error`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
