'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { ShoppingCart, MoreVertical, CheckCircle2, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { ShoppingListSummary } from '@/types/shopping'

interface ShoppingListCardProps {
  list: ShoppingListSummary
  onComplete: (id: string) => void
  onDelete: (id: string) => void
}

export function ShoppingListCard({ list, onComplete, onDelete }: ShoppingListCardProps) {
  const t = useTranslations('shopping')
  const router = useRouter()

  const progress = list.total_items > 0
    ? Math.round((list.checked_items / list.total_items) * 100)
    : 0

  const isOverBudget = list.budget !== null && list.estimated_total > list.budget

  function handleCardClick() {
    router.push(`/money/shopping/${list.id}`)
  }

  function handleComplete(e: React.MouseEvent) {
    e.stopPropagation()
    onComplete(list.id)
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    onDelete(list.id)
  }

  return (
    <Card
      className={cn(
        'cursor-pointer hover:shadow-md transition-shadow',
        list.is_completed && 'opacity-60'
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-4 space-y-3">
        {/* 헤더 */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <ShoppingCart className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="font-medium truncate">{list.name}</span>
            {list.is_completed && (
              <Badge variant="secondary" className="shrink-0 text-xs">
                {t('completed')}
              </Badge>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!list.is_completed && (
                <DropdownMenuItem onClick={handleComplete}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {t('complete')}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 진행률 */}
        {list.total_items > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{t('progress')}</span>
              <span>{list.checked_items} / {list.total_items}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  progress === 100 ? 'bg-green-500' : 'bg-primary'
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* 예산 / 합계 */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {list.estimated_total > 0 ? (
            <span>
              {t('total_estimated')}: {list.estimated_total.toLocaleString()} {list.currency}
            </span>
          ) : (
            <span className="text-muted-foreground/50">{t('empty_items')}</span>
          )}
          {isOverBudget && (
            <Badge variant="destructive" className="text-xs">
              {t('budget_over')}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
