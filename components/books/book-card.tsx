'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Star, BookOpen, Clock, CheckCircle } from 'lucide-react'
import type { Book, BookStatus } from '@/types/book'

interface BookCardProps {
  book: Book
  onEdit: (book: Book) => void
  onDelete: (book: Book) => void
  onUpdatePage: (id: string, currentPage: number) => void
  onChangeStatus: (id: string, status: BookStatus) => void
}

const STATUS_ICONS = {
  to_read: Clock,
  reading: BookOpen,
  completed: CheckCircle,
}

const STATUS_COLORS = {
  to_read: 'text-muted-foreground',
  reading: 'text-blue-500',
  completed: 'text-green-500',
}

export function BookCard({ book, onEdit, onDelete, onUpdatePage, onChangeStatus }: BookCardProps) {
  const t = useTranslations('books')
  const [pageInput, setPageInput] = useState(book.current_page.toString())
  const [isEditingPage, setIsEditingPage] = useState(false)

  const progress = book.total_pages && book.total_pages > 0
    ? Math.min(Math.round((book.current_page / book.total_pages) * 100), 100)
    : null

  const StatusIcon = STATUS_ICONS[book.status]

  function handlePageSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newPage = parseInt(pageInput, 10)
    if (!isNaN(newPage) && newPage >= 0) {
      onUpdatePage(book.id, newPage)
    }
    setIsEditingPage(false)
  }

  function handlePageKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setPageInput(book.current_page.toString())
      setIsEditingPage(false)
    }
  }

  return (
    <Card className={book.status === 'to_read' ? 'bg-muted/30' : ''}>
      <CardHeader className="flex flex-row items-start justify-between pb-2 gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <StatusIcon className={`w-4 h-4 mt-0.5 shrink-0 ${STATUS_COLORS[book.status]}`} />
          <div className="min-w-0">
            <p className="font-medium text-sm leading-tight line-clamp-2">{book.title}</p>
            {book.author && (
              <p className="text-xs text-muted-foreground mt-0.5">{book.author}</p>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
              <MoreVertical className="w-4 h-4" />
              <span className="sr-only">메뉴</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(book)}>
              {t('edit')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {book.status !== 'to_read' && (
              <DropdownMenuItem onClick={() => onChangeStatus(book.id, 'to_read')}>
                {t('status_to_read')}
              </DropdownMenuItem>
            )}
            {book.status !== 'reading' && (
              <DropdownMenuItem onClick={() => onChangeStatus(book.id, 'reading')}>
                {t('status_reading')}
              </DropdownMenuItem>
            )}
            {book.status !== 'completed' && (
              <DropdownMenuItem onClick={() => onChangeStatus(book.id, 'completed')}>
                {t('status_completed')}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(book)}
              className="text-destructive focus:text-destructive"
            >
              {t('delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* 읽는 중: 진행률 바 + 현재 페이지 입력 */}
        {book.status === 'reading' && (
          <>
            {progress !== null && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t('progress')}</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-1.5" />
                {book.total_pages && (
                  <p className="text-xs text-muted-foreground text-right">
                    {book.current_page} / {book.total_pages}p
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground shrink-0">{t('current_page')}</span>
              {isEditingPage ? (
                <form onSubmit={handlePageSubmit} className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={0}
                    max={book.total_pages ?? undefined}
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    onKeyDown={handlePageKeyDown}
                    className="h-6 w-20 text-xs px-2"
                    autoFocus
                  />
                  <Button type="submit" size="sm" className="h-6 text-xs px-2">
                    OK
                  </Button>
                </form>
              ) : (
                <button
                  className="text-xs font-medium text-primary underline underline-offset-2"
                  onClick={() => {
                    setPageInput(book.current_page.toString())
                    setIsEditingPage(true)
                  }}
                >
                  {book.current_page}p
                </button>
              )}
            </div>
          </>
        )}

        {/* 완독: 별점 표시 */}
        {book.status === 'completed' && (
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-3.5 h-3.5 ${
                  book.rating && star <= book.rating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-muted-foreground'
                }`}
              />
            ))}
            {book.completed_at && (
              <span className="text-xs text-muted-foreground ml-1">{book.completed_at}</span>
            )}
          </div>
        )}

        {/* 읽을 예정: 시작일 없음 표시 */}
        {book.status === 'to_read' && (
          <p className="text-xs text-muted-foreground">{t('status_to_read')}</p>
        )}

        {/* 메모 */}
        {book.memo && (
          <p className="text-xs text-muted-foreground line-clamp-2 border-t pt-2">{book.memo}</p>
        )}
      </CardContent>
    </Card>
  )
}
