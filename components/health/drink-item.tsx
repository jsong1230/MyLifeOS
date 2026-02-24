'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2 } from 'lucide-react'
import type { DrinkLog, DrinkType } from '@/types/health'

// 주종별 이모지 매핑
const DRINK_TYPE_EMOJI: Record<DrinkType, string> = {
  beer: '🍺',
  soju: '🥃',
  wine: '🍷',
  whiskey: '🥃',
  other: '🍶',
}

// 주종별 배지 색상 (tailwind 클래스)
const DRINK_TYPE_BADGE_CLASS: Record<DrinkType, string> = {
  beer: 'bg-amber-100 text-amber-700 border-amber-200',
  soju: 'bg-green-100 text-green-700 border-green-200',
  wine: 'bg-red-100 text-red-700 border-red-200',
  whiskey: 'bg-orange-100 text-orange-700 border-orange-200',
  other: 'bg-slate-100 text-slate-700 border-slate-200',
}

// 날짜 문자열(YYYY-MM-DD)을 M/D 형식으로 변환
function formatDate(dateStr: string): string {
  const [, month, day] = dateStr.split('-')
  return `${parseInt(month)}/${parseInt(day)}`
}

interface DrinkItemProps {
  drink: DrinkLog
  onEdit: (drink: DrinkLog) => void
  onDelete: (drink: DrinkLog) => void
}

// 음주 기록 단일 항목 컴포넌트
export function DrinkItem({ drink, onEdit, onDelete }: DrinkItemProps) {
  const t = useTranslations('health.drinks')
  const tc = useTranslations('common')

  const emoji = DRINK_TYPE_EMOJI[drink.drink_type]
  const label = t(`types.${drink.drink_type}` as Parameters<typeof t>[0])
  const badgeClass = DRINK_TYPE_BADGE_CLASS[drink.drink_type]

  return (
    <div className="flex items-center gap-3 py-3">
      {/* 주종 이모지 아이콘 */}
      <div className="flex-shrink-0 text-2xl w-9 text-center">{emoji}</div>

      {/* 주요 정보 영역 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {/* 주종 배지 */}
          <Badge
            variant="outline"
            className={badgeClass}
          >
            {label}
          </Badge>

          {/* 음주량 */}
          <span className="text-sm font-semibold text-foreground">
            {Number(drink.amount_ml).toFixed(0)}ml
          </span>

          {/* 잔 수 (있는 경우) */}
          {drink.drink_count != null && Number(drink.drink_count) > 0 && (
            <span className="text-sm text-muted-foreground">
              {Number(drink.drink_count) % 1 === 0
                ? `${Number(drink.drink_count).toFixed(0)}${t('unit')}`
                : `${Number(drink.drink_count)}${t('unit')}`}
            </span>
          )}

          {/* 도수 (있는 경우) */}
          {drink.alcohol_pct != null && (
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {Number(drink.alcohol_pct)}%
            </span>
          )}
        </div>

        {/* 날짜 및 메모 */}
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">{formatDate(drink.date)}</span>
          {drink.note && (
            <span className="text-xs text-muted-foreground truncate">{drink.note}</span>
          )}
        </div>
      </div>

      {/* 수정/삭제 버튼 영역 */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => onEdit(drink)}
          aria-label={t('edit')}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(drink)}
          aria-label={tc('delete')}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
