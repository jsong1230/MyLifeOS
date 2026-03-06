'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { Skeleton } from '@/components/ui/skeleton'
import { BookCard } from '@/components/books/book-card'
import { BookForm } from '@/components/books/book-form'
import { BookOpen } from 'lucide-react'
import {
  useBooks,
  useUpdateBook,
  useDeleteBook,
} from '@/hooks/use-books'
import type { Book, BookStatus, CreateBookInput, UpdateBookInput } from '@/types/book'

interface BookListProps {
  onAddClick: () => void
}

export function BookList({ onAddClick: _onAddClick }: BookListProps) {
  const t = useTranslations('books')
  const tc = useTranslations('common')

  const [editTarget, setEditTarget] = useState<Book | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Book | null>(null)

  // 전체 목록 조회 (필터 없이 — 탭에서 클라이언트 필터링)
  const { data, isLoading } = useBooks()
  const updateMutation = useUpdateBook()
  const deleteMutation = useDeleteBook()

  const books = data?.data ?? []
  const stats = data?.stats ?? { total: 0, reading: 0, completed: 0 }

  const readingBooks = books.filter((b) => b.status === 'reading')
  const toReadBooks = books.filter((b) => b.status === 'to_read')
  const completedBooks = books.filter((b) => b.status === 'completed')

  function handleUpdatePage(id: string, currentPage: number) {
    updateMutation.mutate({ id, input: { current_page: currentPage } })
  }

  function handleChangeStatus(id: string, status: BookStatus) {
    updateMutation.mutate({ id, input: { status } })
  }

  function handleEditSubmit(data: CreateBookInput | UpdateBookInput) {
    if (!editTarget) return
    updateMutation.mutate(
      { id: editTarget.id, input: data as UpdateBookInput },
      {
        onSuccess: () => setEditTarget(null),
      }
    )
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    })
  }

  function renderBookGrid(bookList: Book[]) {
    if (bookList.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BookOpen className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        </div>
      )
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {bookList.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            onEdit={(b) => setEditTarget(b)}
            onDelete={(b) => setDeleteTarget(b)}
            onUpdatePage={handleUpdatePage}
            onChangeStatus={handleChangeStatus}
          />
        ))}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    )
  }

  return (
    <>
      {/* 통계 요약 */}
      <div className="flex gap-4 text-sm mb-4">
        <span className="text-muted-foreground">
          {t('stats_total')}: <strong>{stats.total}</strong>
        </span>
        <span className="text-blue-500">
          {t('stats_reading')}: <strong>{stats.reading}</strong>
        </span>
        <span className="text-green-500">
          {t('stats_completed')}: <strong>{stats.completed}</strong>
        </span>
      </div>

      <Tabs defaultValue="reading">
        <TabsList className="w-full">
          <TabsTrigger value="reading" className="flex-1">
            {t('status_reading')} ({readingBooks.length})
          </TabsTrigger>
          <TabsTrigger value="to_read" className="flex-1">
            {t('status_to_read')} ({toReadBooks.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex-1">
            {t('status_completed')} ({completedBooks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reading" className="mt-4">
          {renderBookGrid(readingBooks)}
        </TabsContent>
        <TabsContent value="to_read" className="mt-4">
          {renderBookGrid(toReadBooks)}
        </TabsContent>
        <TabsContent value="completed" className="mt-4">
          {renderBookGrid(completedBooks)}
        </TabsContent>
      </Tabs>

      {/* 수정 다이얼로그 */}
      <Dialog open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('edit')}</DialogTitle>
          </DialogHeader>
          <BookForm
            book={editTarget}
            onSubmit={handleEditSubmit}
            onCancel={() => setEditTarget(null)}
            isLoading={updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.title}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? tc('deleting') : tc('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
