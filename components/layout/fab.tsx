'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Plus, CheckSquare, Receipt, Utensils, PenLine, Droplets, Pill, Check } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { getToday } from '@/lib/date-utils'
import { useMedications } from '@/hooks/use-medications'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { MedicationWithLog } from '@/types/medication'

const NAV_OPTIONS = [
  { key: 'addTodo' as const, icon: CheckSquare, href: '/time?action=add' },
  { key: 'addExpense' as const, icon: Receipt, href: '/money/transactions?action=add' },
  { key: 'addMeal' as const, icon: Utensils, href: '/health/meals?action=add' },
  { key: 'addDiary' as const, icon: PenLine, href: '/private/diary?action=add' },
]

// 약 복용 체크 다이얼로그
function MedicationCheckDialog({
  open,
  onOpenChange,
  t,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  t: ReturnType<typeof useTranslations<'fab'>>
}) {
  const { data: medications, isLoading } = useMedications()
  const queryClient = useQueryClient()
  const [takingId, setTakingId] = useState<string | null>(null)

  const untaken = medications?.filter((m: MedicationWithLog) => !m.taken_today) ?? []

  async function handleTake(med: MedicationWithLog) {
    setTakingId(med.id)
    try {
      await fetch(`/api/health/medications/${med.id}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: getToday() }),
      })
      void queryClient.invalidateQueries({ queryKey: ['medications'] })
    } finally {
      setTakingId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('medication_check')}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-6 text-center text-sm text-muted-foreground">...</div>
        ) : untaken.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
            <Check className="w-8 h-8 text-green-500" />
            <span>
              {medications && medications.length > 0
                ? t('medication_all_taken')
                : t('medication_none')}
            </span>
          </div>
        ) : (
          <ul className="flex flex-col gap-2 py-2">
            {untaken.map((med: MedicationWithLog) => (
              <li
                key={med.id}
                className="flex items-center justify-between rounded-lg border px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{med.name}</p>
                  {med.dosage && (
                    <p className="text-xs text-muted-foreground truncate">{med.dosage}</p>
                  )}
                </div>
                <button
                  type="button"
                  disabled={takingId === med.id}
                  onClick={() => void handleTake(med)}
                  className="ml-3 shrink-0 w-8 h-8 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors disabled:opacity-50"
                  aria-label={med.name}
                >
                  <Check className="w-4 h-4 text-primary" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Floating Action Button — 빠른 입력 진입점
export function FAB() {
  const [expanded, setExpanded] = useState(false)
  const [medDialogOpen, setMedDialogOpen] = useState(false)
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

  function handleMedCheck() {
    setExpanded(false)
    setMedDialogOpen(true)
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
            {/* 약 복용 체크 */}
            <button
              type="button"
              onClick={handleMedCheck}
              className="flex items-center gap-3 bg-background shadow-lg rounded-full px-4 py-3 text-sm font-medium hover:bg-muted transition-all"
              style={{ animation: 'fadeSlideUp 0.15s ease forwards' }}
            >
              <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <Pill className="w-4 h-4 text-primary" aria-hidden="true" />
              </span>
              {t('medication_check')}
            </button>

            {/* 수분 빠른 추가 */}
            <button
              type="button"
              onClick={() => void handleWaterAdd()}
              disabled={waterFeedback === 'loading'}
              className="flex items-center gap-3 bg-background shadow-lg rounded-full px-4 py-3 text-sm font-medium hover:bg-muted transition-all disabled:opacity-60"
              style={{ animationDelay: '50ms', animation: 'fadeSlideUp 0.15s ease forwards' }}
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
                  animationDelay: `${(i + 2) * 50}ms`,
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

      {/* 약 복용 체크 다이얼로그 */}
      <MedicationCheckDialog
        open={medDialogOpen}
        onOpenChange={setMedDialogOpen}
        t={t}
      />

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
