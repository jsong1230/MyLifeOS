'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Trash2 } from 'lucide-react'
import { useCreateMilestone, useToggleMilestone, useDeleteMilestone } from '@/hooks/use-goals'
import type { GoalMilestone } from '@/types/goal'

interface MilestoneListProps {
  goalId: string
  milestones: GoalMilestone[]
}

export function MilestoneList({ goalId, milestones }: MilestoneListProps) {
  const t = useTranslations('goals')
  const [newTitle, setNewTitle] = useState('')

  const createMutation = useCreateMilestone(goalId)
  const toggleMutation = useToggleMilestone(goalId)
  const deleteMutation = useDeleteMilestone(goalId)

  function handleAdd() {
    if (!newTitle.trim()) return
    createMutation.mutate(
      { title: newTitle.trim() },
      { onSuccess: () => setNewTitle('') }
    )
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  function handleToggle(milestone: GoalMilestone) {
    toggleMutation.mutate({
      milestoneId: milestone.id,
      completed: !milestone.completed,
    })
  }

  function handleDelete(milestoneId: string) {
    deleteMutation.mutate(milestoneId)
  }

  const sorted = [...milestones].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">{t('milestones')}</h4>

      {sorted.length > 0 && (
        <div className="space-y-1">
          {sorted.map((ms) => (
            <div
              key={ms.id}
              className="flex items-center gap-2 group py-1"
            >
              <Checkbox
                checked={ms.completed}
                onCheckedChange={() => handleToggle(ms)}
                aria-label={ms.title}
              />
              <span
                className={`flex-1 text-sm ${
                  ms.completed ? 'line-through text-muted-foreground' : ''
                }`}
              >
                {ms.title}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                onClick={() => handleDelete(ms.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('milestonePlaceholder')}
          className="text-sm h-8"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 shrink-0"
          onClick={handleAdd}
          disabled={!newTitle.trim() || createMutation.isPending}
        >
          <Plus className="h-3 w-3 mr-1" />
          {t('addMilestone')}
        </Button>
      </div>
    </div>
  )
}
