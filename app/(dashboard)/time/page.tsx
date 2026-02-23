import { ModulePlaceholder } from '@/components/common/module-placeholder'
import { Clock } from 'lucide-react'

export default function TimePage() {
  return (
    <ModulePlaceholder
      moduleName="시간 관리"
      icon={<Clock />}
      description="할일, 캘린더, 루틴 기능이 곧 추가됩니다"
    />
  )
}
