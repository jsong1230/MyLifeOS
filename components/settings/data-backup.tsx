'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Download, Upload, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ConflictStrategy = 'skip' | 'overwrite'

interface RestoreTableResult {
  table: string
  total: number
  inserted: number
  skipped: number
  error?: string
}

interface RestoreResult {
  strategy: ConflictStrategy
  total: number
  inserted: number
  skipped: number
  tables: RestoreTableResult[]
  warnings: string[]
}

/**
 * 데이터 백업/복원 컴포넌트
 * - "백업 다운로드": POST /api/export/backup → JSON 파일 다운로드
 * - "백업 복원": 파일 선택 → POST /api/import (multipart)
 */
export function DataBackup() {
  const t = useTranslations('settings.backup')

  const [includePrivate, setIncludePrivate] = useState(true)
  const [strategy, setStrategy] = useState<ConflictStrategy>('skip')

  const [isBackingUp, setIsBackingUp] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)

  const [backupError, setBackupError] = useState('')
  const [restoreError, setRestoreError] = useState('')
  const [restoreResult, setRestoreResult] = useState<RestoreResult | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── 백업 다운로드 ─────────────────────────────────────────────

  async function handleBackup() {
    if (isBackingUp) return
    setIsBackingUp(true)
    setBackupError('')

    try {
      const res = await fetch('/api/export/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ includePrivate }),
      })

      if (!res.ok) {
        const json = (await res.json()) as { error?: string }
        setBackupError(json.error ?? t('backupFailed'))
        return
      }

      // Content-Disposition 헤더에서 파일명 추출 또는 기본값 사용
      const disposition = res.headers.get('Content-Disposition') ?? ''
      const match = disposition.match(/filename="([^"]+)"/)
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const filename = match?.[1] ?? `mylifeos_backup_${today}.json`

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = filename
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      URL.revokeObjectURL(url)
    } catch {
      setBackupError(t('backupError'))
    } finally {
      setIsBackingUp(false)
    }
  }

  // ── 파일 선택 후 복원 ─────────────────────────────────────────

  function handleFileSelect() {
    setRestoreResult(null)
    setRestoreError('')
    fileInputRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // 파일 입력 초기화 (같은 파일 재선택 허용)
    e.target.value = ''

    if (!file.name.endsWith('.json')) {
      setRestoreError(t('invalidFileType'))
      return
    }

    setIsRestoring(true)
    setRestoreError('')
    setRestoreResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('strategy', strategy)

      const res = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      })

      const json = (await res.json()) as {
        success: boolean
        error?: string
        data?: RestoreResult
      }

      if (!res.ok || !json.success) {
        setRestoreError(json.error ?? t('restoreFailed'))
        return
      }

      if (json.data) {
        setRestoreResult(json.data)
      }
    } catch {
      setRestoreError(t('restoreError'))
    } finally {
      setIsRestoring(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ── 백업 다운로드 섹션 ─────────────────────────── */}
      <div className="space-y-3">
        <p className="text-sm font-medium">{t('backupTitle')}</p>

        {/* Private 데이터 포함 여부 */}
        <div className="flex items-center gap-2">
          <input
            id="include-private"
            type="checkbox"
            checked={includePrivate}
            onChange={(e) => setIncludePrivate(e.target.checked)}
            className="h-4 w-4 rounded border-input accent-primary"
          />
          <label htmlFor="include-private" className="text-sm text-muted-foreground cursor-pointer">
            {t('includePrivate')}
          </label>
        </div>
        <p className="text-xs text-muted-foreground">{t('includePrivateHint')}</p>

        {backupError && (
          <p className="flex items-center gap-1.5 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {backupError}
          </p>
        )}

        <Button
          variant="outline"
          size="sm"
          disabled={isBackingUp}
          onClick={handleBackup}
          className="gap-2"
        >
          {isBackingUp ? (
            <>
              <span className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              {t('backing')}
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              {t('backupDownload')}
            </>
          )}
        </Button>
      </div>

      <div className="border-t" />

      {/* ── 복원 섹션 ──────────────────────────────────── */}
      <div className="space-y-3">
        <p className="text-sm font-medium">{t('restoreTitle')}</p>
        <p className="text-xs text-muted-foreground">{t('restoreHint')}</p>

        {/* 충돌 전략 선택 */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <input
              type="radio"
              id="strategy-skip"
              name="conflict-strategy"
              value="skip"
              checked={strategy === 'skip'}
              onChange={() => setStrategy('skip')}
              className="h-4 w-4 accent-primary"
            />
            <label htmlFor="strategy-skip" className="text-sm cursor-pointer">
              {t('strategySkip')}
              <span className="ml-1 text-xs text-muted-foreground">{t('strategySkipHint')}</span>
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="radio"
              id="strategy-overwrite"
              name="conflict-strategy"
              value="overwrite"
              checked={strategy === 'overwrite'}
              onChange={() => setStrategy('overwrite')}
              className="h-4 w-4 accent-primary"
            />
            <label htmlFor="strategy-overwrite" className="text-sm cursor-pointer">
              {t('strategyOverwrite')}
              <span className="ml-1 text-xs text-muted-foreground">{t('strategyOverwriteHint')}</span>
            </label>
          </div>
        </div>

        {restoreError && (
          <p className="flex items-center gap-1.5 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {restoreError}
          </p>
        )}

        {/* 복원 결과 */}
        {restoreResult && (
          <div className="rounded-md border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 p-3 space-y-1">
            <p className="flex items-center gap-1.5 text-sm font-medium text-green-800 dark:text-green-200">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {t('restoreSuccess')}
            </p>
            <p className="text-xs text-green-700 dark:text-green-300">
              {t('restoreSummary', {
                total: restoreResult.total,
                inserted: restoreResult.inserted,
                skipped: restoreResult.skipped,
              })}
            </p>
            {restoreResult.warnings.length > 0 && (
              <div className="mt-1 space-y-0.5">
                {restoreResult.warnings.map((w, i) => (
                  <p key={i} className="text-xs text-amber-700 dark:text-amber-400">
                    {w}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 숨겨진 파일 입력 */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileChange}
        />

        <Button
          variant="outline"
          size="sm"
          disabled={isRestoring}
          onClick={handleFileSelect}
          className="gap-2"
        >
          {isRestoring ? (
            <>
              <span className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              {t('restoring')}
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              {t('restoreUpload')}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
