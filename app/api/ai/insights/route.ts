import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { apiError } from '@/lib/api-errors'
import { NextResponse, type NextRequest } from 'next/server'

export interface AiInsight {
  category: 'spending' | 'health' | 'routine' | 'goal' | 'overall'
  title: string
  description: string
  type: 'positive' | 'warning' | 'suggestion'
  emoji: string
}

export interface AiInsightsResponse {
  insights: AiInsight[]
  summary: string
  generatedAt: string
}

// POST /api/ai/insights — 지난 30일 사용자 데이터를 Claude AI로 분석
export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return apiError('SERVER_ERROR', { reason: 'ANTHROPIC_API_KEY is not configured' })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')

  const body = await request.json().catch(() => ({}))
  const locale: string = body.locale ?? 'ko'

  // 지난 30일 범위 계산
  const now = new Date()
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const fromDate = thirtyDaysAgo.toISOString().split('T')[0]

  // 데이터 병렬 조회
  const [
    { data: transactions },
    { data: mealLogs },
    { data: healthLogs },
    { data: routines },
    { data: goals },
  ] = await Promise.all([
    supabase
      .from('transactions')
      .select('amount, type, category_id, date, currency')
      .eq('user_id', user.id)
      .gte('date', fromDate)
      .order('date', { ascending: false })
      .limit(100),
    supabase
      .from('meal_logs')
      .select('calories, meal_type, date')
      .eq('user_id', user.id)
      .gte('date', fromDate)
      .order('date', { ascending: false })
      .limit(100),
    supabase
      .from('health_logs')
      .select('value, date')
      .eq('user_id', user.id)
      .eq('log_type', 'sleep')
      .gte('date', fromDate)
      .order('date', { ascending: false })
      .limit(30),
    supabase
      .from('routines')
      .select('title, frequency, streak, is_active')
      .eq('user_id', user.id),
    supabase
      .from('goals')
      .select('title, status, progress_pct, target_date')
      .eq('user_id', user.id)
      .eq('status', 'active'),
  ])

  // 데이터 요약 가공
  const transactionsSummary = {
    total: transactions?.length ?? 0,
    expenses: transactions
      ?.filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount ?? 0), 0) ?? 0,
    income: transactions
      ?.filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount ?? 0), 0) ?? 0,
    currencies: [...new Set(transactions?.map((t) => t.currency).filter(Boolean))],
  }

  const mealsSummary = {
    total: mealLogs?.length ?? 0,
    avgCalories:
      mealLogs && mealLogs.length > 0
        ? Math.round(
            mealLogs.reduce((sum, m) => sum + (m.calories ?? 0), 0) / mealLogs.length
          )
        : 0,
    mealTypes: mealLogs?.reduce(
      (acc, m) => {
        if (m.meal_type) acc[m.meal_type] = (acc[m.meal_type] ?? 0) + 1
        return acc
      },
      {} as Record<string, number>
    ),
  }

  const sleepSummary = {
    total: healthLogs?.length ?? 0,
    avgHours:
      healthLogs && healthLogs.length > 0
        ? Math.round(
            (healthLogs.reduce((sum, h) => sum + (h.value ?? 0), 0) / healthLogs.length) *
              10
          ) / 10
        : 0,
  }

  const routinesSummary = {
    active: routines?.filter((r) => r.is_active).length ?? 0,
    total: routines?.length ?? 0,
    avgStreak:
      routines && routines.length > 0
        ? Math.round(
            routines.reduce((sum, r) => sum + (r.streak ?? 0), 0) / routines.length
          )
        : 0,
  }

  const goalsSummary = {
    active: goals?.length ?? 0,
    avgProgress:
      goals && goals.length > 0
        ? Math.round(
            goals.reduce((sum, g) => sum + (g.progress_pct ?? 0), 0) / goals.length
          )
        : 0,
  }

  const prompt = `당신은 개인 라이프 매니지먼트 AI 어시스턴트입니다.
아래 사용자의 지난 30일 데이터를 분석하고, JSON 형식으로 인사이트를 제공해주세요.

[데이터]
- 거래 내역: ${JSON.stringify(transactionsSummary)}
- 식사 기록: ${JSON.stringify(mealsSummary)}
- 수면 기록: ${JSON.stringify(sleepSummary)}
- 루틴: ${JSON.stringify(routinesSummary)}
- 목표: ${JSON.stringify(goalsSummary)}

반드시 다음 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "insights": [
    {
      "category": "spending" | "health" | "routine" | "goal" | "overall",
      "title": "짧은 제목 (15자 이내)",
      "description": "구체적인 분석 내용 (50-100자)",
      "type": "positive" | "warning" | "suggestion",
      "emoji": "적절한 이모지 1개"
    }
  ],
  "summary": "전체 요약 1-2문장"
}
insights는 4-6개, 각 category에서 최소 1개 이상 (데이터가 있는 경우).
locale이 'en'이면 영어로 응답하세요.

현재 locale: ${locale}`

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  let parsedResponse: { insights: AiInsight[]; summary: string }
  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const textContent = message.content.find((c) => c.type === 'text')
    const rawText = textContent?.type === 'text' ? textContent.text : ''

    // JSON 블록 추출 (```json ... ``` 감싸진 경우도 처리)
    const jsonMatch = rawText.match(/```json\s*([\s\S]*?)```/) ??
      rawText.match(/```\s*([\s\S]*?)```/) ?? null
    const jsonString = jsonMatch ? jsonMatch[1].trim() : rawText.trim()

    parsedResponse = JSON.parse(jsonString)
  } catch {
    // Claude 응답 파싱 실패 시 fallback
    parsedResponse = { insights: [], summary: '' }
  }

  const responseData: AiInsightsResponse = {
    insights: parsedResponse.insights ?? [],
    summary: parsedResponse.summary ?? '',
    generatedAt: new Date().toISOString(),
  }

  return NextResponse.json({ success: true, data: responseData })
}
