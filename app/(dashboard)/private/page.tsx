import Link from 'next/link'
import { BookOpen, Search, SmilePlus, BarChart2, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const MENU_ITEMS = [
  {
    href: '/private/diary',
    icon: BookOpen,
    title: '일기',
    description: '오늘의 기록 작성 및 조회',
    color: 'text-violet-500',
  },
  {
    href: '/private/diary/search',
    icon: Search,
    title: '일기 검색',
    description: '키워드·감정 태그로 검색',
    color: 'text-blue-500',
  },
  {
    href: '/private/emotion',
    icon: SmilePlus,
    title: '감정 캘린더',
    description: '날짜별 감정 기록 확인',
    color: 'text-yellow-500',
  },
  {
    href: '/private/emotion/stats',
    icon: BarChart2,
    title: '감정 통계',
    description: '월별 감정 분포 분석',
    color: 'text-pink-500',
  },
  {
    href: '/private/relations',
    icon: Users,
    title: '인간관계 메모',
    description: '인물 정보 및 메모 관리',
    color: 'text-green-500',
  },
]

// 사적 기록 모듈 홈
export default function PrivatePage() {
  return (
    <div className="px-4 pt-2 max-w-2xl mx-auto space-y-4">
      <h1 className="text-xl font-semibold">사적 기록</h1>
      <div className="grid grid-cols-1 gap-3">
        {MENU_ITEMS.map(({ href, icon: Icon, title, description, color }) => (
          <Link key={href} href={href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center gap-4 py-4">
                <Icon className={`w-6 h-6 shrink-0 ${color}`} />
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
