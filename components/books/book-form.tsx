'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Book, BookStatus, CreateBookInput, UpdateBookInput } from '@/types/book'

interface BookFormProps {
  book?: Book | null
  onSubmit: (data: CreateBookInput | UpdateBookInput) => void
  onCancel: () => void
  isLoading?: boolean
}

export function BookForm({ book, onSubmit, onCancel, isLoading }: BookFormProps) {
  const t = useTranslations('books')
  const tc = useTranslations('common')

  const [title, setTitle] = useState(book?.title ?? '')
  const [author, setAuthor] = useState(book?.author ?? '')
  const [totalPages, setTotalPages] = useState(book?.total_pages?.toString() ?? '')
  const [status, setStatus] = useState<BookStatus>(book?.status ?? 'to_read')
  const [startedAt, setStartedAt] = useState(book?.started_at ?? '')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError(t('book_title') + ' ' + tc('required'))
      return
    }

    const data: CreateBookInput | UpdateBookInput = {
      title: title.trim(),
      author: author.trim() || undefined,
      total_pages: totalPages ? parseInt(totalPages, 10) : undefined,
      status,
      started_at: startedAt || undefined,
    }

    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="space-y-2">
        <Label htmlFor="book-title">
          {t('book_title')} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="book-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('book_title')}
          disabled={isLoading}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="book-author">{t('author')}</Label>
        <Input
          id="book-author"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder={t('author')}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="book-total-pages">{t('total_pages')}</Label>
        <Input
          id="book-total-pages"
          type="number"
          min={1}
          value={totalPages}
          onChange={(e) => setTotalPages(e.target.value)}
          placeholder="0"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="book-status">{t('status')}</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as BookStatus)} disabled={isLoading}>
          <SelectTrigger id="book-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="to_read">{t('status_to_read')}</SelectItem>
            <SelectItem value="reading">{t('status_reading')}</SelectItem>
            <SelectItem value="completed">{t('status_completed')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(status === 'reading' || status === 'completed') && (
        <div className="space-y-2">
          <Label htmlFor="book-started-at">{t('started_at')}</Label>
          <Input
            id="book-started-at"
            type="date"
            value={startedAt}
            onChange={(e) => setStartedAt(e.target.value)}
            disabled={isLoading}
          />
        </div>
      )}

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          {tc('cancel')}
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? tc('saving') : tc('save')}
        </Button>
      </div>
    </form>
  )
}
