'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Plus, Target } from 'lucide-react'
import { GoalCard } from '@/components/goals/goal-card'
import { GoalForm } from '@/components/goals/goal-form'
import { GoalProgressBar } from '@/components/goals/goal-progress-bar'
import { MilestoneList } from '@/components/goals/milestone-list'
import {
  useGoals,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
} from '@/hooks/use-goals'
import type { Goal, CreateGoalInput } from '@/types/goal'

const STATUS_OPTIONS = ['active', 'completed', 'paused', 'cancelled'] as const

export function GoalsTab() {
  const t = useTranslations('goals')
  const tc = useTranslations('common')

  const [tab, setTab] = useState<string>('active')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Goal | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Goal | null>(null)
  const [detailTarget, setDetailTarget] = useState<Goal | null>(null)

  const statusFilter = tab === 'all' ? undefined : tab
  const { data: goals = [], isLoading } = useGoals(statusFilter)

  const createMutation = useCreateGoal()
  const updateMutation = useUpdateGoal()
  const deleteMutation = useDeleteGoal()

  function handleAddClick() {
    setEditTarget(null)
    setIsFormOpen(true)
  }

  function handleEditClick(goal: Goal) {
    setEditTarget(goal)
    setIsFormOpen(true)
  }

  function handleFormClose() {
    setIsFormOpen(false)
    setEditTarget(null)
  }

  function handleFormSubmit(data: CreateGoalInput) {
    if (editTarget) {
      updateMutation.mutate(
        { id: editTarget.id, input: data },
        { onSuccess: handleFormClose }
      )
    } else {
      createMutation.mutate(data, { onSuccess: handleFormClose })
    }
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null)
        if (detailTarget?.id === deleteTarget.id) setDetailTarget(null)
      },
    })
  }

  function handleProgressChange(goalId: string, progress: number) {
    updateMutation.mutate({ id: goalId, input: { progress } })
  }

  function handleStatusChange(goalId: string, status: Goal['status']) {
    updateMutation.mutate({
      id: goalId,
      input: {
        status,
        ...(status === 'completed' ? { progress: 100 } : {}),
      },
    })
  }

  const detailGoal = detailTarget
    ? goals.find((g) => g.id === detailTarget.id) ?? detailTarget
    : null

  return (
    <div className="space-y-4 pb-24 md:pb-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{t('noGoalsDescription')}</p>
        <Button size="sm" onClick={handleAddClick} className="gap-1 shrink-0">
          <Plus className="h-4 w-4" />
          {t('newGoal')}
        </Button>
      </div>

      {/* 탭 필터 */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">{t('tabs.active')}</TabsTrigger>
          <TabsTrigger value="completed">{t('tabs.completed')}</TabsTrigger>
          <TabsTrigger value="all">{t('tabs.all')}</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 목표 카드 그리드 */}
      {isLoading ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            {tc('loading')}
          </CardContent>
        </Card>
      ) : goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onClick={() => setDetailTarget(goal)}
              onEdit={() => handleEditClick(goal)}
              onDelete={() => setDeleteTarget(goal)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">{t('noGoals')}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('noGoalsDescription')}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={handleAddClick}>
              <Plus className="h-4 w-4 mr-1" />
              {t('newGoal')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 생성/수정 다이얼로그 */}
      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) handleFormClose() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? t('editGoal') : t('newGoal')}</DialogTitle>
          </DialogHeader>
          <GoalForm
            goal={editTarget ?? undefined}
            onSubmit={handleFormSubmit}
            onCancel={handleFormClose}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* 상세 다이얼로그 */}
      <Dialog
        open={detailGoal !== null}
        onOpenChange={(open) => { if (!open) setDetailTarget(null) }}
      >
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          {detailGoal && (
            <>
              <DialogHeader>
                <DialogTitle className="pr-8">{detailGoal.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {detailGoal.description && (
                  <p className="text-sm text-muted-foreground">{detailGoal.description}</p>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">
                    {t(`categories.${detailGoal.category}` as Parameters<typeof t>[0])}
                  </Badge>
                  {detailGoal.target_date && (
                    <span className="text-xs text-muted-foreground">
                      {t('targetDate')}: {detailGoal.target_date}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('status')}</label>
                  <Select
                    value={detailGoal.status}
                    onValueChange={(v: string) => handleStatusChange(detailGoal.id, v as Goal['status'])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {t(`statuses.${s}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">{t('progress')}</label>
                    <span className="text-sm text-muted-foreground">{detailGoal.progress}%</span>
                  </div>
                  <Slider
                    value={[detailGoal.progress]}
                    onValueCommit={(v) => handleProgressChange(detailGoal.id, v[0])}
                    max={100}
                    step={5}
                  />
                  <GoalProgressBar progress={detailGoal.progress} />
                </div>
                <MilestoneList
                  goalId={detailGoal.id}
                  milestones={detailGoal.milestones ?? []}
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteGoal')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteGoalConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>{tc('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? tc('deleting') : tc('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
