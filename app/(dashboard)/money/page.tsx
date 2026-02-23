import { ModulePlaceholder } from '@/components/common/module-placeholder'
import { Wallet } from 'lucide-react'

export default function MoneyPage() {
  return (
    <ModulePlaceholder
      moduleName="금전 관리"
      icon={<Wallet />}
      description="수입/지출, 예산, 지출 분석 기능이 곧 추가됩니다"
    />
  )
}
