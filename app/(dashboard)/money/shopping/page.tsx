'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { ShoppingListCard } from '@/components/money/shopping-list-card'
import {
  useShoppingLists,
  useCreateShoppingList,
  useUpdateShoppingList,
  useDeleteShoppingList,
} from '@/hooks/use-shopping'

export default function ShoppingPage() {
  const t = useTranslations('shopping')
  const tc = useTranslations('common')

  const { data: lists = [], isLoading } = useShoppingLists()
  const createList = useCreateShoppingList()
  const updateList = useUpdateShoppingList()
  const deleteList = useDeleteShoppingList()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [newListBudget, setNewListBudget] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  async function handleCreate() {
    if (!newListName.trim()) return
    await createList.mutateAsync({
      name: newListName.trim(),
      budget: newListBudget ? Number(newListBudget) : undefined,
    })
    setNewListName('')
    setNewListBudget('')
    setIsCreateOpen(false)
  }

  async function handleComplete(id: string) {
    await updateList.mutateAsync({ id, input: { is_completed: true } })
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteList.mutateAsync(deleteTarget)
    setDeleteTarget(null)
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          {t('title')}
        </h1>
        <Button onClick={() => setIsCreateOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          {t('new_list')}
        </Button>
      </div>

      {/* 목록 */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : lists.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground space-y-2">
          <ShoppingCart className="h-10 w-10 mx-auto opacity-30" />
          <p>{t('empty_lists')}</p>
          <Button variant="outline" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            {t('new_list')}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {lists.map((list) => (
            <ShoppingListCard
              key={list.id}
              list={list}
              onComplete={handleComplete}
              onDelete={(id) => setDeleteTarget(id)}
            />
          ))}
        </div>
      )}

      {/* 새 목록 생성 다이얼로그 */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('new_list')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <label className="text-sm font-medium mb-1 block">{t('list_name')}</label>
              <Input
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder={t('list_name')}
                onKeyDown={(e) => e.key === 'Enter' && void handleCreate()}
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                {t('budget')} <span className="text-muted-foreground text-xs">({tc('optional')})</span>
              </label>
              <Input
                type="number"
                min={0}
                value={newListBudget}
                onChange={(e) => setNewListBudget(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                {tc('cancel')}
              </Button>
              <Button
                onClick={() => void handleCreate()}
                disabled={!newListName.trim() || createList.isPending}
              >
                {tc('create')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tc('confirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('delete')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {tc('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
