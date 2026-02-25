'use client'

import { Construction } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface ModulePlaceholderProps {
  moduleName: string
  icon: React.ReactNode
  description: string
}

// 미구현 모듈 페이지 공통 "준비 중" 컴포넌트
export function ModulePlaceholder({ moduleName, icon, description }: ModulePlaceholderProps) {
  const t = useTranslations('common')
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
      <div className="text-muted-foreground/30 [&>svg]:w-16 [&>svg]:h-16" aria-hidden="true">
        {icon}
      </div>
      <h1 className="text-xl font-semibold">{moduleName}</h1>
      <p className="text-sm text-muted-foreground max-w-xs">{description}</p>
      <div className="flex items-center gap-2 text-muted-foreground/60 text-xs mt-2">
        <Construction className="w-3 h-3" />
        <span>{t('comingSoon')}</span>
      </div>
    </div>
  )
}
