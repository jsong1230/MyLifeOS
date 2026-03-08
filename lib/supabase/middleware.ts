import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// 공개 경로 (비로그인 허용)
const PUBLIC_PATHS = ['/login', '/signup', '/callback', '/reset-password']

// 토큰 기반 공개 API (세션 없이 접근 가능, 자체 인증 처리)
const PUBLIC_API_PATHS = ['/api/time/calendar/ical']

// Supabase 세션 갱신 및 인증 상태 확인 (middleware.ts에서 호출)
export async function updateSession(request: NextRequest) {
  // 클라이언트가 보낸 x-user-id 헤더를 제거하여 위조 방지
  const cleanedHeaders = new Headers(request.headers)
  cleanedHeaders.delete('x-user-id')

  let supabaseResponse = NextResponse.next({ request: { headers: cleanedHeaders } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request: { headers: cleanedHeaders } })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isPublicPath = PUBLIC_PATHS.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )
  const isPublicApiPath = PUBLIC_API_PATHS.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  // 미인증 사용자의 보호 경로 접근 시 /login 리다이렉트
  if (!user && !isPublicPath && !isPublicApiPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 인증된 사용자의 공개 경로 접근 시 / 리다이렉트 (OAuth 콜백 제외)
  if (user && isPublicPath && !request.nextUrl.pathname.startsWith('/callback')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // 인증된 사용자: x-user-id 헤더에 검증된 user.id를 설정하여 API route로 전달
  if (user) {
    const headersWithUser = new Headers(cleanedHeaders)
    headersWithUser.set('x-user-id', user.id)
    const finalResponse = NextResponse.next({ request: { headers: headersWithUser } })
    // supabaseResponse에 설정된 쿠키(세션 갱신 쿠키)를 finalResponse에 복사
    supabaseResponse.cookies.getAll().forEach(({ name, value, ...rest }) => {
      finalResponse.cookies.set({ name, value, ...rest })
    })
    return finalResponse
  }

  return supabaseResponse
}
