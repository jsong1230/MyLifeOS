import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'

/** 충돌 전략 */
type ConflictStrategy = 'skip' | 'overwrite'

/** 유효한 테이블 목록 (백업 대상과 동일 순서) */
const VALID_TABLES = [
  'categories',
  'todos',
  'routines',
  'time_blocks',
  'transactions',
  'budgets',
  'recurring_expenses',
  'assets',
  'body_logs',
  'exercise_logs',
  'alcohol_logs',
  'meal_logs',
  'diary_entries',
  'people',
  'quick_memos',
  'water_logs',
  'pomodoro_sessions',
  'medications',
  'medication_logs',
  'books',
  'shopping_lists',
  'shopping_items',
  'goals',
  'goal_milestones',
  'investments',
  'investment_transactions',
] as const

type ValidTable = (typeof VALID_TABLES)[number]

/** 복원 결과 요약 */
interface RestoreTableResult {
  table: ValidTable
  total: number
  inserted: number
  skipped: number
  error?: string
}

/**
 * POST /api/import
 *
 * multipart/form-data:
 *   - file: JSON 백업 파일
 *   - strategy: 'skip' | 'overwrite' (기본: 'skip')
 *
 * 각 테이블의 row를 순서대로 upsert하거나 skip합니다.
 * - skip: 이미 존재하는 id는 건너뜁니다 (ignoreDuplicates: true)
 * - overwrite: 모든 row를 upsert합니다 (onConflict: 'id')
 *
 * user_id는 현재 로그인 사용자로 덮어씁니다 (보안).
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')
  const userId = user.id

  // multipart/form-data 파싱
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  const fileField = formData.get('file')
  if (!fileField || !(fileField instanceof File)) {
    return apiError('VALIDATION_ERROR')
  }

  const strategyRaw = formData.get('strategy')
  const strategy: ConflictStrategy =
    strategyRaw === 'overwrite' ? 'overwrite' : 'skip'

  // JSON 파싱
  let parsed: unknown
  try {
    const text = await fileField.text()
    parsed = JSON.parse(text)
  } catch {
    return NextResponse.json(
      { success: false, error: 'INVALID_JSON' },
      { status: 400 },
    )
  }

  // 백업 포맷 검증
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('version' in parsed) ||
    !('data' in parsed)
  ) {
    return NextResponse.json(
      { success: false, error: 'INVALID_BACKUP_FORMAT' },
      { status: 400 },
    )
  }

  const backup = parsed as {
    version: string
    data: Record<string, unknown[]>
  }

  if (!backup.data || typeof backup.data !== 'object') {
    return NextResponse.json(
      { success: false, error: 'INVALID_BACKUP_FORMAT' },
      { status: 400 },
    )
  }

  const results: RestoreTableResult[] = []

  for (const table of VALID_TABLES) {
    const rows = backup.data[table]
    if (!Array.isArray(rows) || rows.length === 0) {
      results.push({ table, total: 0, inserted: 0, skipped: 0 })
      continue
    }

    // user_id를 현재 사용자로 강제 교체 (보안)
    const sanitizedRows = rows.map((row) => {
      if (typeof row !== 'object' || row === null) return row
      return { ...(row as Record<string, unknown>), user_id: userId }
    })

    if (strategy === 'skip') {
      // ignoreDuplicates: true — id 충돌 시 skip
      const { error, count } = await supabase
        .from(table)
        .upsert(sanitizedRows, { onConflict: 'id', ignoreDuplicates: true })
        .select('id')

      if (error) {
        results.push({
          table,
          total: rows.length,
          inserted: 0,
          skipped: rows.length,
          error: error.message,
        })
      } else {
        const inserted = count ?? 0
        results.push({
          table,
          total: rows.length,
          inserted,
          skipped: rows.length - inserted,
        })
      }
    } else {
      // overwrite — upsert (id 충돌 시 덮어쓰기)
      const { error, count } = await supabase
        .from(table)
        .upsert(sanitizedRows, { onConflict: 'id' })
        .select('id')

      if (error) {
        results.push({
          table,
          total: rows.length,
          inserted: 0,
          skipped: rows.length,
          error: error.message,
        })
      } else {
        results.push({
          table,
          total: rows.length,
          inserted: count ?? rows.length,
          skipped: 0,
        })
      }
    }
  }

  const totalInserted = results.reduce((s, r) => s + r.inserted, 0)
  const totalSkipped = results.reduce((s, r) => s + r.skipped, 0)
  const totalRows = results.reduce((s, r) => s + r.total, 0)
  const tableErrors = results.filter((r) => r.error)

  return NextResponse.json({
    success: true,
    data: {
      strategy,
      total: totalRows,
      inserted: totalInserted,
      skipped: totalSkipped,
      tables: results,
      warnings: tableErrors.map((r) => `${r.table}: ${r.error}`),
    },
  })
}
