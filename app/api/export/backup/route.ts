import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getToday } from '@/lib/date-utils'

// ── 테이블 목록 ─────────────────────────────────────────────────

/** Private 데이터 (암호화 원문 그대로 포함) */
const PRIVATE_TABLES = ['diary_entries', 'people', 'quick_memos'] as const

/** 전체 백업 대상 테이블 (순서는 FK 의존성 고려) */
const BACKUP_TABLES = [
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

type BackupTable = (typeof BACKUP_TABLES)[number]

// ── 테이블별 쿼리 함수 ────────────────────────────────────────

async function fetchTable(
  supabase: SupabaseClient,
  table: BackupTable,
  userId: string,
): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error(`[backup] table=${table} error:`, error.message)
    return []
  }
  return (data ?? []) as Record<string, unknown>[]
}

/**
 * POST /api/export/backup
 *
 * body: { includePrivate?: boolean }
 *
 * 전체 데이터를 단일 JSON 파일로 반환합니다.
 * Private 데이터(diary_entries, people, quick_memos)는
 * includePrivate=false 이면 제외됩니다 (기본 true).
 * 암호화 필드는 복호화 없이 원문 그대로 포함됩니다.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')
  const userId = user.id

  let includePrivate = true
  try {
    const body = await request.json()
    if (typeof body.includePrivate === 'boolean') {
      includePrivate = body.includePrivate
    }
  } catch {
    // body 없거나 파싱 실패 시 기본값 사용
  }

  const tablesToBackup = includePrivate
    ? BACKUP_TABLES
    : BACKUP_TABLES.filter((t) => !(PRIVATE_TABLES as readonly string[]).includes(t))

  try {
    const results = await Promise.all(
      tablesToBackup.map((table) => fetchTable(supabase, table, userId)),
    )

    const backupData: Record<string, Record<string, unknown>[]> = {}
    tablesToBackup.forEach((table, i) => {
      backupData[table] = results[i]
    })

    const today = getToday() // YYYY-MM-DD
    const dateStr = today.replace(/-/g, '') // YYYYMMDD

    const payload = {
      version: '1',
      exported_at: new Date().toISOString(),
      user_id: userId,
      include_private: includePrivate,
      data: backupData,
    }

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="mylifeos_backup_${dateStr}.json"`,
      },
    })
  } catch {
    return apiError('SERVER_ERROR')
  }
}
