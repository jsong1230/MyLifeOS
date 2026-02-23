'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DiarySearch } from '@/components/private/diary-search'

// 일기 검색 페이지
// - 상단 뒤로가기 버튼 (/private/diary)
// - DiarySearch 컴포넌트 (키워드 + 감정 태그 필터)
export default function DiarySearchPage() {
  const router = useRouter()

  function goBack() {
    router.push('/private/diary')
  }

  return (
    <div className="flex flex-col h-full">
      {/* 헤더: 뒤로가기 + 제목 */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-background sticky top-0 z-10">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={goBack}
          aria-label="일기 목록으로 돌아가기"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-sm font-semibold">일기 검색</h1>
      </div>

      {/* 검색 컴포넌트 */}
      <div className="flex-1 overflow-auto p-4">
        <DiarySearch />
      </div>
    </div>
  )
}
