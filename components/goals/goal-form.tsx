'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Goal, CreateGoalInput } from '@/types/goal'

const CATEGORIES = ['general', 'health', 'financial', 'education', 'career', 'personal'] as const

interface GoalFormProps {
  goal?: Goal
  onSubmit: (data: CreateGoalInput) => void
  onCancel: () => void
  isLoading?: boolean
}

export function GoalForm({ goal, onSubmit, onCancel, isLoading }: GoalFormProps) {
  const t = useTranslations('goals')
  const tc = useTranslations('common')

  const [title, setTitle] = useState(goal?.title ?? '')
  const [description, setDescription] = useState(goal?.description ?? '')
  const [category, setCategory] = useState(goal?.category ?? 'general')
  const [targetDate, setTargetDate] = useState(goal?.target_date ?? '')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!title.trim()) return

    onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      category,
      target_date: targetDate || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="goal-title">{t('goalTitle')}</Label>
        <Input
          id="goal-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('goalTitlePlaceholder')}
          required
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="goal-description">{t('goalDescription')}</Label>
        <Textarea
          id="goal-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('goalDescriptionPlaceholder')}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="goal-category">{t('category')}</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger id="goal-category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {t(`categories.${cat}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="goal-target-date">{t('targetDate')}</Label>
        <Input
          id="goal-target-date"
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          {tc('cancel')}
        </Button>
        <Button type="submit" disabled={isLoading || !title.trim()}>
          {isLoading ? tc('saving') : tc('save')}
        </Button>
      </div>
    </form>
  )
}
