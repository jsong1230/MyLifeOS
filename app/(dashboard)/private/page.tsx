import { ModulePlaceholder } from '@/components/common/module-placeholder'
import { BookOpen } from 'lucide-react'

export default function PrivatePage() {
  return (
    <ModulePlaceholder
      moduleName="사적 기록"
      icon={<BookOpen />}
      description="일기 작성, 감정 캘린더, 인간관계 메모 기능이 곧 추가됩니다"
    />
  )
}
