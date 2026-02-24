'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { EmptyState } from '@/components/dashboard/empty-state'
import { BookOpen, ChevronRight } from 'lucide-react'
import { EMOTION_LABELS, EMOTION_ICONS, type DiaryEntry } from '@/types/diary'

function getToday(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 사적 기록 요약 카드 — 오늘 일기 감정 태그 표시
export function PrivateSummaryCard() {
  const today = getToday()

  const { data: diary, isLoading } = useQuery<DiaryEntry | null>({
    queryKey: ['diary', today],
    queryFn: async () => {
      const res = await fetch(`/api/diaries?date=${today}`)
      const json = await res.json() as { success: boolean; data: DiaryEntry | null; error?: string }
      if (!json.success) throw new Error(json.error ?? '일기 조회 실패')
      return json.data
    },
  })

  return (
    <Link href="/private" className="block">
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">사적 기록</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-xs text-muted-foreground">불러오는 중...</p>
          ) : diary ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">오늘 일기 작성됨</p>
              <div className="flex flex-wrap gap-1">
                {diary.emotion_tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-xs bg-muted px-2 py-0.5 rounded-full">
                    {EMOTION_ICONS[tag]} {EMOTION_LABELS[tag]}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<BookOpen />}
              title="아직 일기가 없어요"
              description="오늘의 감정과 이야기를 기록해보세요"
            />
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
