'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Plus, CheckSquare, Receipt, Utensils, PenLine, Droplets } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { getToday } from '@/lib/date-utils'

const NAV_OPTIONS = [
  { key: 'addTodo' as const, icon: CheckSquare, href: '/time?action=add' },
  { key: 'addExpense' as const, icon: Receipt, href: '/money/transactions?action=add' },
  { key: 'addMeal' as const, icon: Utensils, href: '/health/meals?action=add' },
  { key: 'addDiary' as const, icon: PenLine, href: '/private/diary?action=add' },
]

// Floating Action Button — 빠른 입력 진입점
export function FAB() {
  const [expanded, setExpanded] = useState(false)
  const [waterFeedback, setWaterFeedback] = useState<'idle' | 'loading' | 'done'>('idle')
  const router = useRouter()
  const t = useTranslations('fab')
  const queryClient = useQueryClient()

  function handleNavOption(href: string) {
    setExpanded(false)
    router.push(href)
  }

  const handleWaterAdd = useCallback(async () => {
    if (waterFeedback === 'loading') return
    setExpanded(false)
    setWaterFeedback('loading')
    try {
      await fetch('/api/health/water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount_ml: 200, date: getToday() }),
      })
      void queryClient.invalidateQueries({ queryKey: ['water', getToday()] })
      setWaterFeedback('done')
      setTimeout(() => setWaterFeedback('idle'), 2000)
    } catch {
      setWaterFeedback('idle')
    }
  }, [waterFeedback, queryClient])

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

      {/* 수분 추가 완료 피드백 토스트 */}
      {waterFeedback === 'done' && (
        <div className="fixed bottom-44 right-4 md:bottom-28 md:right-8 z-50 bg-background border shadow-lg rounded-full px-4 py-2 text-sm font-medium flex items-center gap-2 animate-fadeSlideUp">
          <Droplets className="w-4 h-4 text-blue-500" />
          {t('water_added')}
        </div>
      )}

      {/* FAB 컨테이너 */}
      <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50 flex flex-col items-end gap-3">
        {/* 옵션 버튼 목록 */}
        {expanded && (
          <div className="flex flex-col items-end gap-2">
            {/* 수분 빠른 추가 */}
            <button
              type="button"
              onClick={() => void handleWaterAdd()}
              disabled={waterFeedback === 'loading'}
              className="flex items-center gap-3 bg-background shadow-lg rounded-full px-4 py-3 text-sm font-medium hover:bg-muted transition-all disabled:opacity-60"
              style={{ animation: 'fadeSlideUp 0.15s ease forwards' }}
            >
              <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <Droplets className="w-4 h-4 text-primary" aria-hidden="true" />
              </span>
              {t('water_quick_add')}
            </button>

            {/* 기존 네비게이션 옵션 */}
            {NAV_OPTIONS.map(({ key, icon: Icon, href }, i) => (
              <button
                key={href}
                type="button"
                onClick={() => handleNavOption(href)}
                className="flex items-center gap-3 bg-background shadow-lg rounded-full px-4 py-3 text-sm font-medium hover:bg-muted transition-all"
                style={{
                  animationDelay: `${(i + 1) * 50}ms`,
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
        .animate-fadeSlideUp {
          animation: fadeSlideUp 0.15s ease forwards;
        }
      `}</style>
    </>
  )
}
