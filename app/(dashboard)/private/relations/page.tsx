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
import { RelationList } from '@/components/private/relation-list'
import { RelationForm } from '@/components/private/relation-form'
import {
  useRelations,
  useCreateRelation,
  useUpdateRelation,
  useDeleteRelation,
} from '@/hooks/use-relations'
import type { CreateRelationInput, UpdateRelationInput, RelationDecrypted } from '@/types/relation'

// 인간관계 메모 페이지
export default function RelationsPage() {
  const t = useTranslations()
  // 폼 다이얼로그 상태
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingRelation, setEditingRelation] = useState<RelationDecrypted | undefined>(undefined)

  // 삭제 확인 다이얼로그 상태
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  // 데이터 훅
  const { data: relations = [], isLoading } = useRelations()
  const createRelation = useCreateRelation()
  const updateRelation = useUpdateRelation()
  const deleteRelation = useDeleteRelation()

  // 추가 다이얼로그 열기
  function handleOpenCreate() {
    setEditingRelation(undefined)
    setIsFormOpen(true)
  }

  // 수정 다이얼로그 열기
  function handleOpenEdit(relation: RelationDecrypted) {
    setEditingRelation(relation)
    setIsFormOpen(true)
  }

  // 폼 다이얼로그 닫기
  function handleFormCancel() {
    setIsFormOpen(false)
    setEditingRelation(undefined)
  }

  // 생성 또는 수정 폼 제출 처리
  function handleFormSubmit(data: CreateRelationInput) {
    if (editingRelation) {
      // 수정 — UpdateRelationInput 형식으로 변환
      const updateInput: UpdateRelationInput = {
        name: data.name,
        relationship_type: data.relationship_type,
        last_met_at: data.last_met_at ?? null,
        memo: data.memo ?? null,
      }
      updateRelation.mutate(
        { id: editingRelation.id, input: updateInput },
        {
          onSuccess: () => {
            setIsFormOpen(false)
            setEditingRelation(undefined)
          },
        }
      )
    } else {
      // 생성
      createRelation.mutate(data, {
        onSuccess: () => {
          setIsFormOpen(false)
        },
      })
    }
  }

  // 삭제 확인 다이얼로그 열기
  function handleDeleteRequest(id: string) {
    setDeleteTargetId(id)
  }

  // 삭제 확정
  function handleDeleteConfirm() {
    if (!deleteTargetId) return
    deleteRelation.mutate(deleteTargetId, {
      onSuccess: () => {
        setDeleteTargetId(null)
      },
    })
  }

  // 삭제 취소
  function handleDeleteCancel() {
    setDeleteTargetId(null)
  }

  // 삭제 대상 이름 조회 (다이얼로그 표시용)
  const deleteTargetName = deleteTargetId
    ? (relations.find((r) => r.id === deleteTargetId)?.name ?? t('private.relations.unknown'))
    : t('private.relations.unknown')

  const isMutating = createRelation.isPending || updateRelation.isPending

  return (
    <div className="flex flex-col h-full">
      {/* 상단 헤더 */}
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 className="text-base font-semibold">{t('private.relations.title')}</h1>
          <Button
            size="sm"
            onClick={handleOpenCreate}
            disabled={isLoading || isMutating}
          >
            {t('private.relations.addButton')}
          </Button>
        </div>
      </div>

      {/* 인간관계 목록 */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-lg mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
            </div>
          ) : (
            <RelationList
              relations={relations}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteRequest}
            />
          )}
        </div>
      </div>

      {/* 인간관계 추가/수정 다이얼로그 */}
      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => { if (!open) handleFormCancel() }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingRelation ? t('private.relations.edit') : t('private.relations.add')}
            </DialogTitle>
          </DialogHeader>
          <RelationForm
            relation={editingRelation}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isLoading={isMutating}
          />
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 AlertDialog */}
      <AlertDialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => { if (!open) handleDeleteCancel() }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('private.relations.deleteConfirm', { name: deleteTargetName })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('private.relations.deleteWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleDeleteCancel}
              disabled={deleteRelation.isPending}
            >
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteRelation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteRelation.isPending ? t('private.diary.deleting') : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
