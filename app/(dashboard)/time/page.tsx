'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Plus, Timer, Flame } from 'lucide-react'
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
import { TodoList } from '@/components/time/todo-list'
import { TodoForm } from '@/components/time/todo-form'
import {
  useTodos,
  useCreateTodo,
  useUpdateTodo,
  useDeleteTodo,
  useReorderTodos,
} from '@/hooks/use-todos'
import { usePomodoroCompletedCount } from '@/hooks/use-pomodoro'
import { useStreaks } from '@/hooks/use-streaks'
import type { Todo, CreateTodoInput, UpdateTodoInput, ReorderTodoInput } from '@/types/todo'

// 할일 관리 페이지
export default function TimePage() {
  const searchParams = useSearchParams()
  const t = useTranslations('time.todos')
  const tc = useTranslations('common')
  const tp = useTranslations('pomodoro')
  const ts = useTranslations('streaks')

  // 오늘 완료된 포모도로 세션 수
  const { data: pomodoroCount = 0 } = usePomodoroCompletedCount()
  // 스트릭 데이터
  const { data: streaksData } = useStreaks()

  // 폼 다이얼로그 상태
  const [isFormOpen, setIsFormOpen] = useState(false)
  // 수정 중인 할일
  const [selectedTodo, setSelectedTodo] = useState<Todo | undefined>(undefined)
  // 삭제 확인 다이얼로그 상태
  const [deleteTargetId, setDeleteTargetId] = useState<string | undefined>(undefined)

  // React Query 훅
  const { data: todos = [], isLoading } = useTodos()
  const createTodo = useCreateTodo()
  const updateTodo = useUpdateTodo()
  const deleteTodo = useDeleteTodo()
  const reorderTodos = useReorderTodos()

  // 폼 열기 (신규 추가)
  function handleOpenCreate() {
    setSelectedTodo(undefined)
    setIsFormOpen(true)
  }

  // 폼 열기 (수정)
  function handleOpenEdit(todo: Todo) {
    setSelectedTodo(todo)
    setIsFormOpen(true)
  }

  // 폼 닫기
  function handleCloseForm() {
    setIsFormOpen(false)
    setSelectedTodo(undefined)
  }

  // 폼 제출 — 생성 또는 수정
  function handleFormSubmit(data: CreateTodoInput | UpdateTodoInput) {
    if (selectedTodo) {
      // 수정 모드
      updateTodo.mutate(
        { id: selectedTodo.id, input: data as UpdateTodoInput },
        {
          onSuccess: () => {
            handleCloseForm()
          },
        }
      )
    } else {
      // 생성 모드
      createTodo.mutate(data as CreateTodoInput, {
        onSuccess: () => {
          handleCloseForm()
        },
      })
    }
  }

  // 완료 토글
  function handleToggle(id: string) {
    const todo = todos.find((t) => t.id === id)
    if (!todo) return

    const newStatus = todo.status === 'completed' ? 'pending' : 'completed'
    updateTodo.mutate({ id, input: { status: newStatus } })
  }

  // 삭제 확인 다이얼로그 열기
  function handleDeleteRequest(id: string) {
    setDeleteTargetId(id)
  }

  // 삭제 실행
  function handleDeleteConfirm() {
    if (!deleteTargetId) return
    deleteTodo.mutate(deleteTargetId, {
      onSuccess: () => {
        setDeleteTargetId(undefined)
      },
    })
  }

  // 삭제 취소
  function handleDeleteCancel() {
    setDeleteTargetId(undefined)
  }

  // 순서 변경
  function handleReorder(items: ReorderTodoInput[]) {
    reorderTodos.mutate(items)
  }

  const isFormLoading = createTodo.isPending || updateTodo.isPending

  // FAB action=add 파라미터 감지 → 폼 자동 오픈
  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      handleOpenCreate()
    }
  }, [searchParams])

  return (
    <div className="relative min-h-full p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">{t('title')}</h1>
        <Button
          size="sm"
          onClick={handleOpenCreate}
          aria-label={t('addTitle')}
        >
          <Plus className="size-4" />
          {tc('add')}
        </Button>
      </div>

      {/* 스트릭 요약 카드 */}
      <Link href="/time/streaks" className="block mb-3">
        <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
          <CardContent className="flex items-center justify-between py-3 px-4">
            <div className="flex items-center gap-2">
              <Flame className="size-4 text-orange-500" />
              <span className="text-sm font-medium">{ts('title')}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              {(streaksData?.total_current_streak ?? 0) > 0 ? (
                <>
                  <span>🔥</span>
                  <span>{streaksData!.total_current_streak} {ts('days')}</span>
                </>
              ) : (
                <span>{ts('no_streak')}</span>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* 포모도로 타이머 카드 */}
      <Link href="/time/pomodoro" className="block mb-4">
        <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
          <CardContent className="flex items-center justify-between py-3 px-4">
            <div className="flex items-center gap-2">
              <Timer className="size-4 text-primary" />
              <span className="text-sm font-medium">{tp('title')}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>🍅</span>
              <span>{pomodoroCount} {tp('sessions')}</span>
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <span className="text-muted-foreground text-sm">{tc('loading')}</span>
        </div>
      )}

      {/* 할일 목록 */}
      {!isLoading && (
        <TodoList
          todos={todos}
          onToggle={handleToggle}
          onEdit={handleOpenEdit}
          onDelete={handleDeleteRequest}
          onReorder={handleReorder}
        />
      )}

      {/* 할일 추가/수정 다이얼로그 */}
      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) handleCloseForm() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedTodo ? t('editTitle') : t('addTitle')}
            </DialogTitle>
          </DialogHeader>
          <TodoForm
            todo={selectedTodo}
            onSubmit={handleFormSubmit}
            onCancel={handleCloseForm}
            isLoading={isFormLoading}
          />
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 AlertDialog */}
      <AlertDialog
        open={Boolean(deleteTargetId)}
        onOpenChange={(open) => { if (!open) handleDeleteCancel() }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>{tc('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {tc('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
