'use client'

import { use, useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, LayoutList, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ShoppingItemRow } from '@/components/money/shopping-item-row'
import { ShoppingItemForm } from '@/components/money/shopping-item-form'
import {
  useShoppingList,
  useUpdateShoppingList,
  useAddShoppingItem,
  useUpdateShoppingItem,
  useDeleteShoppingItem,
} from '@/hooks/use-shopping'
import { cn } from '@/lib/utils'
import type { ShoppingItem } from '@/types/shopping'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ShoppingDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const t = useTranslations('shopping')
  const tc = useTranslations('common')
  const router = useRouter()

  const { data: list, isLoading } = useShoppingList(id)
  const updateList = useUpdateShoppingList()
  const addItem = useAddShoppingItem()
  const updateItem = useUpdateShoppingItem()
  const deleteItem = useDeleteShoppingItem()

  const [groupByCategory, setGroupByCategory] = useState(false)

  const items: ShoppingItem[] = list?.items ?? []

  // 예상 합계 / 실제 합계
  const estimatedTotal = items.reduce((sum, i) => sum + (i.estimated_price ?? 0), 0)
  const actualTotal = items.reduce((sum, i) => sum + (i.actual_price ?? 0), 0)
  const checkedItems = items.filter((i) => i.is_checked).length
  const isOverBudget = list?.budget !== null && list?.budget !== undefined && estimatedTotal > list.budget

  // 카테고리별 그룹핑
  const grouped = useMemo(() => {
    if (!groupByCategory) return null
    const map: Record<string, ShoppingItem[]> = {}
    for (const item of items) {
      const key = item.category ?? tc('other')
      if (!map[key]) map[key] = []
      map[key].push(item)
    }
    return map
  }, [items, groupByCategory])

  async function handleCheck(itemId: string, checked: boolean) {
    await updateItem.mutateAsync({ listId: id, itemId, input: { is_checked: checked } })
  }

  async function handlePriceChange(itemId: string, actualPrice: number | null) {
    await updateItem.mutateAsync({ listId: id, itemId, input: { actual_price: actualPrice } })
  }

  async function handleDeleteItem(itemId: string) {
    await deleteItem.mutateAsync({ listId: id, itemId })
  }

  async function handleAddItem(input: Parameters<typeof addItem.mutateAsync>[0]) {
    await addItem.mutateAsync(input)
  }

  async function handleComplete() {
    await updateList.mutateAsync({ id, input: { is_completed: true } })
  }

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto">
        <div className="h-8 w-32 bg-muted/40 animate-pulse rounded" />
        <div className="h-48 bg-muted/40 animate-pulse rounded-xl" />
      </div>
    )
  }

  if (!list) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <p className="text-muted-foreground">{tc('noData')}</p>
      </div>
    )
  }

  function renderItems(itemList: ShoppingItem[]) {
    return itemList.map((item) => (
      <ShoppingItemRow
        key={item.id}
        item={item}
        onCheck={handleCheck}
        onPriceChange={handlePriceChange}
        onDelete={handleDeleteItem}
      />
    ))
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-2xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label={tc('back')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold truncate">{list.name}</h1>
        </div>
        {list.is_completed && (
          <Badge variant="secondary">{t('completed')}</Badge>
        )}
        {!list.is_completed && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleComplete()}
            disabled={updateList.isPending}
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            {t('complete')}
          </Button>
        )}
      </div>

      {/* 요약 카드 */}
      <Card>
        <CardContent className="p-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{t('progress')}</p>
            <p className="text-lg font-semibold">
              {checkedItems} <span className="text-sm text-muted-foreground">/ {items.length}</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">{t('total_estimated')}</p>
            <p className={cn('text-lg font-semibold', isOverBudget && 'text-destructive')}>
              {estimatedTotal > 0 ? estimatedTotal.toLocaleString() : '-'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">{t('total_actual')}</p>
            <p className="text-lg font-semibold">
              {actualTotal > 0 ? actualTotal.toLocaleString() : '-'}
            </p>
          </div>
        </CardContent>
        {list.budget !== null && (
          <>
            <Separator />
            <CardContent className="p-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('budget')}</span>
              <span className={cn('font-medium', isOverBudget && 'text-destructive')}>
                {list.budget.toLocaleString()} {list.currency}
                {isOverBudget && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    {t('budget_over')}
                  </Badge>
                )}
              </span>
            </CardContent>
          </>
        )}
      </Card>

      {/* 아이템 추가 폼 */}
      {!list.is_completed && (
        <Card>
          <CardContent className="p-4">
            <ShoppingItemForm
              listId={id}
              onAdd={(input) => void handleAddItem(input)}
              isLoading={addItem.isPending}
            />
          </CardContent>
        </Card>
      )}

      {/* 그룹핑 토글 */}
      {items.length > 0 && (
        <div className="flex items-center gap-2">
          <Button
            variant={groupByCategory ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setGroupByCategory((v) => !v)}
            className="text-xs"
          >
            <Tag className="h-3 w-3 mr-1" />
            {t('category')}
          </Button>
          <Button
            variant={!groupByCategory ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setGroupByCategory(false)}
            className="text-xs"
          >
            <LayoutList className="h-3 w-3 mr-1" />
            {tc('all')}
          </Button>
        </div>
      )}

      {/* 아이템 목록 */}
      {items.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm">
          {t('empty_items')}
        </div>
      ) : groupByCategory && grouped ? (
        <div className="space-y-4">
          {Object.entries(grouped).map(([cat, catItems]) => (
            <Card key={cat}>
              <CardHeader className="py-2 px-4">
                <CardTitle className="text-sm text-muted-foreground">{cat}</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 divide-y divide-border/40">
                {renderItems(catItems)}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="px-4 pb-3 pt-2 divide-y divide-border/40">
            {renderItems(items)}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
