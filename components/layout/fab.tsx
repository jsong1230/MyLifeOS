'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Plus, CheckSquare, Receipt, Utensils, PenLine } from 'lucide-react'

const FAB_OPTIONS = [
  { key: 'addTodo' as const, icon: CheckSquare, href: '/time' },
  { key: 'addExpense' as const, icon: Receipt, href: '/money' },
  { key: 'addMeal' as const, icon: Utensils, href: '/health' },
  { key: 'addDiary' as const, icon: PenLine, href: '/private' },
]

// Floating Action Button — 빠른 입력 진입점
export function FAB() {
  const [expanded, setExpanded] = useState(false)
  const router = useRouter()
  const t = useTranslations('fab')

  function handleOption(href: string) {
    setExpanded(false)
    router.push(href)
  }

  return (
    <>
      {/* 배경 오버레이 */}
      {expanded && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          aria-hidden="true"
          onClick={() => setExpanded(false)}
        />
      )}

      {/* FAB 컨테이너 */}
      <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50 flex flex-col items-end gap-3">
        {/* 옵션 버튼 목록 */}
        {expanded && (
          <div className="flex flex-col items-end gap-2">
            {FAB_OPTIONS.map(({ key, icon: Icon, href }, i) => (
              <button
                key={href}
                type="button"
                onClick={() => handleOption(href)}
                className="flex items-center gap-3 bg-background shadow-lg rounded-full px-4 py-3 text-sm font-medium hover:bg-muted transition-all"
                style={{
                  animationDelay: `${i * 50}ms`,
                  animation: 'fadeSlideUp 0.15s ease forwards',
                }}
              >
                <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" aria-hidden="true" />
                </span>
                {t(key)}
              </button>
            ))}
          </div>
        )}

        {/* 메인 FAB 버튼 */}
        <button
          type="button"
          aria-label={t('quickAdd')}
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
          className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
        >
          <Plus
            className="w-6 h-6 transition-transform duration-200"
            style={{ transform: expanded ? 'rotate(45deg)' : 'rotate(0deg)' }}
          />
        </button>
      </div>

      <style jsx global>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}
