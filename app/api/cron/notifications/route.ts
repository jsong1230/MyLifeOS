import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendPushNotification, type PushSubscriptionData, type PushPayload } from '@/lib/push-notifications'

// GET /api/cron/notifications — 정기 알림 발송 (Vercel Cron)
export async function GET(request: Request) {
  // Authorization 헤더 검증
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // service_role 키 확인
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Missing service role key' }, { status: 501 })
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

  // enabled=true인 사용자의 알림 설정 조회
  const { data: settings, error: settingsError } = await supabaseAdmin
    .from('notification_settings')
    .select('*')
    .eq('enabled', true)

  if (settingsError || !settings?.length) {
    return NextResponse.json({ sent: 0, failed: 0, reason: 'no_enabled_users' })
  }

  const today = new Date()
  const todayDay = today.getDate()
  const todayDayOfWeek = today.getDay() // 0=Sunday
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  let sent = 0
  let failed = 0

  for (const setting of settings) {
    const userId = setting.user_id

    // 해당 사용자의 구독 목록 조회
    const { data: subscriptions } = await supabaseAdmin
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth_key')
      .eq('user_id', userId)

    if (!subscriptions?.length) continue

    const notifications: PushPayload[] = []

    // 루틴 알림
    if (setting.routine_reminders) {
      const { data: routines } = await supabaseAdmin
        .from('routines')
        .select('id, title, frequency, days_of_week')
        .eq('user_id', userId)
        .eq('is_active', true)

      if (routines?.length) {
        const todayRoutines = routines.filter((r) => {
          if (r.frequency === 'daily') return true
          if (r.frequency === 'weekly' && Array.isArray(r.days_of_week)) {
            return r.days_of_week.includes(todayDayOfWeek)
          }
          return false
        })

        if (todayRoutines.length > 0) {
          notifications.push({
            title: '오늘의 루틴',
            body: `오늘 ${todayRoutines.length}개의 루틴이 있습니다: ${todayRoutines.slice(0, 3).map((r) => r.title).join(', ')}`,
            url: '/time/routines',
          })
        }
      }
    }

    // 정기지출 알림
    if (setting.recurring_reminders) {
      const { data: recurring } = await supabaseAdmin
        .from('recurring_expenses')
        .select('id, name, amount, billing_day, last_recorded_date')
        .eq('user_id', userId)
        .eq('is_active', true)

      if (recurring?.length) {
        const upcoming = recurring.filter((r) => {
          const billingDay = r.billing_day
          const diff = billingDay - todayDay
          const isNearBillingDay = diff >= -3 && diff <= 3

          // 이번 달에 이미 기록되었는지 확인
          if (r.last_recorded_date) {
            const lastDate = new Date(r.last_recorded_date)
            if (lastDate.getMonth() === currentMonth && lastDate.getFullYear() === currentYear) {
              return false
            }
          }

          return isNearBillingDay
        })

        if (upcoming.length > 0) {
          notifications.push({
            title: '정기지출 알림',
            body: `기록되지 않은 정기지출 ${upcoming.length}건: ${upcoming.slice(0, 3).map((r) => r.name).join(', ')}`,
            url: '/money/recurring',
          })
        }
      }
    }

    // 목표 알림
    if (setting.goal_reminders) {
      const { data: goals } = await supabaseAdmin
        .from('goals')
        .select('id, title, target_date')
        .eq('user_id', userId)
        .eq('status', 'active')

      if (goals?.length) {
        const upcomingGoals = goals.filter((g) => {
          if (!g.target_date) return false
          const targetDate = new Date(g.target_date)
          const daysUntil = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          return daysUntil >= 0 && daysUntil <= 7
        })

        if (upcomingGoals.length > 0) {
          notifications.push({
            title: '목표 마감 알림',
            body: `마감이 임박한 목표 ${upcomingGoals.length}건: ${upcomingGoals.slice(0, 3).map((g) => g.title).join(', ')}`,
            url: '/time/goals',
          })
        }
      }
    }

    // 각 구독에 알림 발송
    for (const notification of notifications) {
      for (const sub of subscriptions) {
        const success = await sendPushNotification(sub as PushSubscriptionData, notification)
        if (success) sent++
        else failed++
      }
    }
  }

  return NextResponse.json({ success: true, sent, failed })
}
