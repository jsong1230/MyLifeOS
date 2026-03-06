import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig: NextConfig = {
  // 헤더에서 X-Powered-By 제거 (정보 노출 방지 + 약간의 응답 크기 감소)
  poweredByHeader: false,

  experimental: {
    // 대형 라이브러리 자동 트리쉐이킹 — 실제 사용하는 컴포넌트만 번들에 포함
    // lucide-react: 600+ 아이콘 중 사용하는 것만, recharts: 사용하는 차트 타입만
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      '@supabase/supabase-js',
    ],
  },

  images: {
    remotePatterns: [],
    // 최신 이미지 포맷 우선 제공 (지원 브라우저에서 자동 변환)
    formats: ['image/avif', 'image/webp'],
  },
}

export default withNextIntl(nextConfig)
