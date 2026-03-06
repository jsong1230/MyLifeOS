'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { BookList } from '@/components/books/book-list'
import { BookForm } from '@/components/books/book-form'
import { Plus } from 'lucide-react'
import { useCreateBook } from '@/hooks/use-books'
import type { CreateBookInput, UpdateBookInput } from '@/types/book'

export default function BooksPage() {
  const t = useTranslations('books')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const createMutation = useCreateBook()

  function handleCreateSubmit(data: CreateBookInput | UpdateBookInput) {
    createMutation.mutate(data as CreateBookInput, {
      onSuccess: () => setIsFormOpen(false),
    })
  }

  return (
    <div className="px-4 max-w-2xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">{t('title')}</h1>
        <Button size="sm" onClick={() => setIsFormOpen(true)}>
          <Plus className="w-4 h-4 mr-1" />
          {t('add')}
        </Button>
      </div>

      <BookList onAddClick={() => setIsFormOpen(true)} />

      {/* 새 책 추가 다이얼로그 */}
      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) setIsFormOpen(false) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('add')}</DialogTitle>
          </DialogHeader>
          <BookForm
            onSubmit={handleCreateSubmit}
            onCancel={() => setIsFormOpen(false)}
            isLoading={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
