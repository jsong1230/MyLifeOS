import { ModulePlaceholder } from '@/components/common/module-placeholder'
import { Heart } from 'lucide-react'

export default function HealthPage() {
  return (
    <ModulePlaceholder
      moduleName="건강 관리"
      icon={<Heart />}
      description="식사, 음주, 수면, 운동 기록 기능이 곧 추가됩니다"
    />
  )
}
