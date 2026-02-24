'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { decrypt } from '@/lib/crypto/encryption'

// 내보내기 가능한 모듈 목록
type ExportModule =
  | 'todos'
  | 'routines'
  | 'transactions'
  | 'meal_logs'
  | 'drink_logs'
  | 'health_logs'
  | 'diaries'
  | 'relations'
  | 'all'

// 내보내기 형식
type ExportFormat = 'csv' | 'json'

// 모듈별 파일명 설정 (레이블은 컴포넌트 내에서 번역)
const MODULE_FILENAME: Record<ExportModule, string> = {
  todos: 'todos',
  routines: 'routines',
  transactions: 'transactions',
  meal_logs: 'meal_logs',
  drink_logs: 'drink_logs',
  health_logs: 'health_logs',
  diaries: 'diaries',
  relations: 'relations',
  all: 'mylifeos_all',
}

// 개별 모듈 버튼 목록 (all 은 별도 배치)
const MODULE_LIST: Exclude<ExportModule, 'all'>[] = [
  'todos',
  'routines',
  'transactions',
  'meal_logs',
  'drink_logs',
  'health_logs',
  'diaries',
  'relations',
]

// 암호화된 필드가 포함된 모듈 목록
const ENCRYPTED_MODULES: ExportModule[] = ['diaries', 'relations', 'all']

/**
 * 객체 배열을 CSV 문자열로 변환
 * - 첫 행: 헤더 (키 이름)
 * - 이후: 각 행 데이터 (JSON.stringify로 따옴표 처리)
 */
function toCSV(data: Record<string, unknown>[]): string {
  if (!data.length) return ''
  const headers = Object.keys(data[0])
  const rows = data.map((row) =>
    headers.map((h) => JSON.stringify(row[h] ?? '')).join(',')
  )
  return [headers.join(','), ...rows].join('\n')
}

/**
 * Blob URL 방식으로 파일 다운로드 트리거
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

/**
 * 일기 데이터의 content_encrypted 필드 복호화
 * enc_key 없으면 content_encrypted 필드 그대로 유지
 */
function decryptDiaries(
  diaries: Record<string, unknown>[],
  encKey: string | null
): Record<string, unknown>[] {
  if (!encKey) return diaries
  return diaries.map((entry) => {
    if (typeof entry.content_encrypted !== 'string') return entry
    try {
      const decrypted = decrypt(entry.content_encrypted, encKey)
      // content_encrypted 제거 후 content 로 교체
      const { content_encrypted, ...rest } = entry
      void content_encrypted // 미사용 변수 경고 억제
      return { ...rest, content: decrypted }
    } catch {
      // 복호화 실패 시 원본 유지
      return entry
    }
  })
}

/**
 * 인간관계 메모의 memo_encrypted 필드 복호화
 * enc_key 없으면 memo_encrypted 필드 그대로 유지
 */
function decryptRelations(
  relations: Record<string, unknown>[],
  encKey: string | null
): Record<string, unknown>[] {
  if (!encKey) return relations
  return relations.map((entry) => {
    if (typeof entry.memo_encrypted !== 'string' || !entry.memo_encrypted) {
      return entry
    }
    try {
      const decrypted = decrypt(entry.memo_encrypted, encKey)
      const { memo_encrypted, ...rest } = entry
      void memo_encrypted // 미사용 변수 경고 억제
      return { ...rest, memo: decrypted }
    } catch {
      return entry
    }
  })
}

/**
 * 데이터 내보내기 컴포넌트
 * - 모듈별 CSV / JSON 파일 다운로드
 * - 암호화 데이터(일기, 인간관계 메모)는 sessionStorage enc_key로 복호화 후 내보내기
 */
export function DataExport() {
  const t = useTranslations('settings.export')

  // 모듈별 레이블 (번역 기반)
  const MODULE_LABEL: Record<ExportModule, string> = {
    todos: t('todos'),
    routines: t('routines'),
    transactions: t('transactions'),
    meal_logs: t('mealLogs'),
    drink_logs: t('drinkLogs'),
    health_logs: t('healthLogs'),
    diaries: t('diaries'),
    relations: t('relations'),
    all: t('all'),
  }

  const [format, setFormat] = useState<ExportFormat>('csv')
  // 로딩 중인 모듈 추적 (동시 여러 요청 방지)
  const [loadingModule, setLoadingModule] = useState<ExportModule | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  /**
   * 단일 모듈 또는 전체 내보내기 처리
   */
  async function handleExport(module: ExportModule) {
    if (loadingModule) return
    setLoadingModule(module)
    setErrorMessage('')

    try {
      // sessionStorage에서 암호화 키 조회 (PIN 인증 후 저장된 키)
      const encKey =
        typeof window !== 'undefined'
          ? sessionStorage.getItem('enc_key')
          : null

      const res = await fetch(`/api/export?module=${module}`)
      const json = (await res.json()) as {
        success: boolean
        data?: unknown
        error?: string
      }

      if (!res.ok || !json.success) {
        setErrorMessage(json.error ?? t('exportFailed'))
        return
      }

      const timestamp = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

      if (module === 'all') {
        // 전체 내보내기: 각 모듈을 개별 파일로 다운로드
        const allData = json.data as Record<string, Record<string, unknown>[]>

        for (const [key, moduleData] of Object.entries(allData)) {
          if (!Array.isArray(moduleData) || moduleData.length === 0) continue

          let processedData = moduleData

          // 암호화 필드 복호화 처리
          if (key === 'diaries') {
            processedData = decryptDiaries(moduleData, encKey)
          } else if (key === 'relations') {
            processedData = decryptRelations(moduleData, encKey)
          }

          const moduleFilename =
            MODULE_FILENAME[key as ExportModule] ?? key
          const filename = `${moduleFilename}_${timestamp}.${format}`

          if (format === 'json') {
            downloadFile(
              JSON.stringify(processedData, null, 2),
              filename,
              'application/json'
            )
          } else {
            downloadFile(toCSV(processedData), filename, 'text/csv')
          }
        }
      } else {
        // 단일 모듈 내보내기
        let data = json.data as Record<string, unknown>[]
        if (!Array.isArray(data)) {
          data = []
        }

        // 암호화 필드 복호화 처리
        if (module === 'diaries') {
          data = decryptDiaries(data, encKey)
        } else if (module === 'relations') {
          data = decryptRelations(data, encKey)
        }

        const filename = `${MODULE_FILENAME[module]}_${timestamp}.${format}`

        if (format === 'json') {
          downloadFile(
            JSON.stringify(data, null, 2),
            filename,
            'application/json'
          )
        } else {
          downloadFile(toCSV(data), filename, 'text/csv')
        }
      }
    } catch {
      setErrorMessage(t('exportError'))
    } finally {
      setLoadingModule(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* 형식 선택 토글 */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{t('formatLabel')}</span>
        <div className="flex rounded-md border overflow-hidden">
          <button
            type="button"
            className={`px-3 py-1.5 text-sm transition-colors ${
              format === 'csv'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-foreground hover:bg-muted'
            }`}
            onClick={() => setFormat('csv')}
          >
            CSV
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 text-sm transition-colors ${
              format === 'json'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-foreground hover:bg-muted'
            }`}
            onClick={() => setFormat('json')}
          >
            JSON
          </button>
        </div>
      </div>

      {/* 에러 메시지 */}
      {errorMessage && (
        <p className="text-sm text-destructive">{errorMessage}</p>
      )}

      {/* 암호화 데이터 안내 */}
      <p className="text-xs text-muted-foreground">
        {t('encryptedHint')}
      </p>

      {/* 모듈별 내보내기 버튼 */}
      <div className="grid grid-cols-2 gap-2">
        {MODULE_LIST.map((module) => {
          const isEncrypted = ENCRYPTED_MODULES.includes(module)
          const isLoading = loadingModule === module
          return (
            <Button
              key={module}
              variant="outline"
              size="sm"
              disabled={loadingModule !== null}
              onClick={() => handleExport(module)}
              className="justify-start"
            >
              {isLoading ? (
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  {t('exporting')}
                </span>
              ) : (
                <span>
                  {MODULE_LABEL[module]}
                  {isEncrypted && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      {t('encrypted')}
                    </span>
                  )}
                </span>
              )}
            </Button>
          )
        })}
      </div>

      {/* 전체 내보내기 버튼 */}
      <Button
        variant="default"
        size="sm"
        disabled={loadingModule !== null}
        onClick={() => handleExport('all')}
        className="w-full"
      >
        {loadingModule === 'all' ? (
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            {t('exportingAll')}
          </span>
        ) : (
          t('exportAll')
        )}
      </Button>
    </div>
  )
}
