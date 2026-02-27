'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { GoalProgressBar } from './goal-progress-bar'
import type { Goal } from '@/types/goal'

interface GoalCardProps {
  goal: Goal
  onClick: () => void
  onEdit: () => void
  onDelete: () => void
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  active: 'default',
  completed: 'secondary',
  paused: 'outline',
  cancelled: 'destructive',
}

export function GoalCard({ goal, onClick, onEdit, onDelete }: GoalCardProps) {
  const t = useTranslations('goals')

  const milestonesTotal = goal.milestones?.length ?? 0
  const milestonesCompleted = goal.milestones?.filter((m) => m.completed).length ?? 0

  const daysLeft = goal.target_date
    ? Math.ceil((new Date(goal.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">{goal.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {t(`categories.${goal.category}` as Parameters<typeof t>[0])}
              </Badge>
              <Badge variant={STATUS_VARIANT[goal.status] ?? 'default'} className="text-xs">
                {t(`statuses.${goal.status}` as Parameters<typeof t>[0])}
              </Badge>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e: React.MouseEvent) => { e.stopPropagation(); onEdit() }}>
                <Pencil className="h-3.5 w-3.5 mr-2" />
                {t('editGoal')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e: React.MouseEvent) => { e.stopPropagation(); onDelete() }}
                className="text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                {t('deleteGoal')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t('progress')} {goal.progress}%</span>
            {milestonesTotal > 0 && (
              <span>{t('milestonesCount', { completed: milestonesCompleted, total: milestonesTotal })}</span>
            )}
          </div>
          <GoalProgressBar progress={goal.progress} />
        </div>

        {daysLeft !== null && (
          <p className={`text-xs ${daysLeft < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
            {daysLeft < 0 ? t('overdue') : t('daysLeft', { days: daysLeft })}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
