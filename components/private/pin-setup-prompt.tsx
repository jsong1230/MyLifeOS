import Link from 'next/link'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * PIN 미설정 상태 안내 컴포넌트.
 * 사적 기록 접근 전 PIN 설정이 필요함을 알리고 설정 페이지로 안내한다.
 */
export function PinSetupPrompt() {
  return (
    <div className="flex flex-col h-full items-center justify-center px-6">
      <div className="w-full max-w-xs space-y-6 text-center">
        {/* 자물쇠 아이콘 */}
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-muted">
            <Lock className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          </div>
        </div>

        {/* 안내 메시지 */}
        <div>
          <h2 className="text-xl font-semibold">PIN 설정 필요</h2>
          <p className="text-sm text-muted-foreground mt-2">
            PIN이 설정되지 않았습니다.
            <br />
            설정 페이지에서 PIN을 먼저 설정해주세요.
          </p>
        </div>

        {/* 설정 페이지 이동 버튼 */}
        <Button asChild className="w-full">
          <Link href="/settings">설정 페이지로 이동</Link>
        </Button>
      </div>
    </div>
  )
}
