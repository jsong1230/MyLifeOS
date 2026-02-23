'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import type { Todo, CreateTodoInput, UpdateTodoInput, ReorderTodoInput } from '@/types/todo'

// 할일 관리 페이지
export default function TimePage() {
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

  return (
    <div className="relative min-h-full p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">할일</h1>
        <Button
          size="sm"
          onClick={handleOpenCreate}
          aria-label="새 할일 추가"
        >
          <Plus className="size-4" />
          추가
        </Button>
      </div>

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <span className="text-muted-foreground text-sm">불러오는 중...</span>
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
              {selectedTodo ? '할일 수정' : '새 할일 추가'}
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
            <AlertDialogTitle>할일 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 할일을 삭제하시겠습니까? 삭제된 할일은 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
