'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
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
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react'
import { AssetForm } from '@/components/money/asset-form'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

const AssetSummary = dynamic(
  () => import('@/components/money/asset-summary').then((m) => ({ default: m.AssetSummary })),
  { ssr: false, loading: () => <Skeleton className="h-64 rounded-xl" /> }
)
const AssetTrendChart = dynamic(
  () => import('@/components/money/asset-trend-chart').then((m) => ({ default: m.AssetTrendChart })),
  { ssr: false, loading: () => <Skeleton className="h-64 rounded-xl" /> }
)
import {
  useAssets,
  useAssetTrend,
  useCreateAsset,
  useUpdateAsset,
  useDeleteAsset,
} from '@/hooks/use-assets'
import { ASSET_TYPE_LABEL, type Asset, type CreateAssetInput, type UpdateAssetInput } from '@/types/asset'

// 현재 월을 YYYY-MM 형식으로
function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// 이전/다음 달 이동
function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// YYYY-MM → 로케일 기반 연/월 표시
function formatMonthLabel(ym: string, locale: string): string {
  const [y, m] = ym.split('-').map(Number)
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }).format(
    new Date(y, m - 1, 1)
  )
}

// 자산 현황 페이지 — F-21
export default function AssetsPage() {
  const locale = useLocale()
  const t = useTranslations('money.assets')
  const tc = useTranslations('common')
  const [month, setMonth] = useState(getCurrentMonth)
  const isCurrentMonth = month === getCurrentMonth()

  // 다이얼로그 상태
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Asset | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null)

  // 데이터 조회
  const { data: assets = [], isLoading } = useAssets(month)
  const { data: trendData = [] } = useAssetTrend(6)

  // 뮤테이션
  const createMutation = useCreateAsset()
  const updateMutation = useUpdateAsset()
  const deleteMutation = useDeleteAsset()

  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  function handleAddClick() {
    setEditTarget(null)
    setIsFormOpen(true)
  }

  function handleEditClick(asset: Asset) {
    setEditTarget(asset)
    setIsFormOpen(true)
  }

  function handleDeleteClick(asset: Asset) {
    setDeleteTarget(asset)
  }

  function handleFormClose() {
    setIsFormOpen(false)
    setEditTarget(null)
  }

  function handleFormSubmit(data: CreateAssetInput) {
    if (editTarget) {
      const input: UpdateAssetInput = {
        asset_type: data.asset_type,
        amount: data.amount,
        note: data.note ?? null,
      }
      updateMutation.mutate(
        { id: editTarget.id, input, month: editTarget.month },
        { onSuccess: handleFormClose }
      )
    } else {
      createMutation.mutate(data, { onSuccess: handleFormClose })
    }
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return
    deleteMutation.mutate(
      { id: deleteTarget.id, month: deleteTarget.month },
      { onSuccess: () => setDeleteTarget(null) }
    )
  }

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      {/* 월 네비게이션 */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setMonth((m) => shiftMonth(m, -1))} aria-label={tc('prev')}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="text-center">
          <p className="text-sm font-semibold">{formatMonthLabel(month, locale)}</p>
          {!isCurrentMonth && (
            <button
              type="button"
              onClick={() => setMonth(getCurrentMonth())}
              className="text-xs text-primary hover:underline"
            >
              {t('goToCurrentMonth')}
            </button>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMonth((m) => shiftMonth(m, 1))} aria-label={tc('next')}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* 자산 요약 (파이 차트 + 유형별 금액) */}
      {isLoading ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            {tc('loading')}
          </CardContent>
        </Card>
      ) : (
        <AssetSummary assets={assets} />
      )}

      {/* 월별 자산 추이 차트 */}
      {trendData.length > 1 && <AssetTrendChart data={trendData} />}

      {/* 자산 목록 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">{t('items')}</h2>
        <Button size="sm" onClick={handleAddClick} disabled={isMutating} className="gap-1">
          <Plus className="h-4 w-4" />
          {tc('add')}
        </Button>
      </div>

      {/* 자산 목록 */}
      {!isLoading && assets.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            {assets.map((asset) => (
              <div key={asset.id} className="flex items-center justify-between px-4 py-3 border-b last:border-b-0">
                <div>
                  <p className="text-sm font-medium">{t(`types.${asset.asset_type}` as Parameters<typeof t>[0])}</p>
                  {asset.note && (
                    <p className="text-xs text-muted-foreground">{asset.note}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    {asset.amount.toLocaleString(locale)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => handleEditClick(asset)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteClick(asset)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : !isLoading ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">{t('noThisMonth')}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={handleAddClick}>
              <Plus className="h-4 w-4 mr-1" />
              {t('addFirst')}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* 추가/수정 다이얼로그 */}
      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) handleFormClose() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? t('edit') : t('add')}</DialogTitle>
          </DialogHeader>
          <AssetForm
            asset={editTarget ?? undefined}
            defaultMonth={month}
            onSubmit={handleFormSubmit}
            onCancel={handleFormClose}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteConfirm')}
            </AlertDialogDescription>
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
