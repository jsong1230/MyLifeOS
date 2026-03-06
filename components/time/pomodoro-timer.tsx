'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Play, Pause, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePomodoroSessions, useRecordPomodoro } from '@/hooks/use-pomodoro'
import { getToday } from '@/lib/date-utils'

// 타이머 상태
type TimerPhase = 'idle' | 'focus' | 'break' | 'done'

// 집중 시간 선택지 (분)
const FOCUS_OPTIONS = [15, 20, 25, 30, 45, 60] as const
// 휴식 시간 선택지 (분)
const BREAK_OPTIONS = [5, 10, 15] as const

// SVG 원형 진행률 반지름
const RADIUS = 90
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function PomodoroTimer() {
  const t = useTranslations('pomodoro')
  const today = getToday()

  // 타이머 설정
  const [focusMinutes, setFocusMinutes] = useState(25)
  const [breakMinutes, setBreakMinutes] = useState(5)

  // 타이머 상태
  const [phase, setPhase] = useState<TimerPhase>('idle')
  const [secondsLeft, setSecondsLeft] = useState(focusMinutes * 60)
  const [isRunning, setIsRunning] = useState(false)

  // interval ref (cleanup용)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // React Query 훅
  const { data: sessions = [] } = usePomodoroSessions(today)
  const recordPomodoro = useRecordPomodoro()

  // 오늘 완료된 세션 수
  const completedCount = sessions.filter((s) => s.completed).length

  // 총 시간 (초) — phase에 따라 결정
  const totalSeconds = phase === 'break'
    ? breakMinutes * 60
    : focusMinutes * 60

  // 진행률 (0~1)
  const progress = totalSeconds > 0 ? secondsLeft / totalSeconds : 1
  // SVG stroke-dashoffset 계산 (시계방향 감소)
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress)

  // 분:초 포맷
  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const timeDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  // 세션 완료 기록
  const handleSessionComplete = useCallback((
    focusMin: number,
    breakMin: number,
    completedPhase: 'focus' | 'break'
  ) => {
    // 집중 세션이 완료되었을 때만 DB에 기록
    if (completedPhase === 'focus') {
      recordPomodoro.mutate({
        focus_minutes: focusMin,
        break_minutes: breakMin,
        completed: true,
        date: today,
      })
    }
  }, [recordPomodoro, today])

  // 타이머 tick
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // 시간 종료
          clearInterval(intervalRef.current!)
          intervalRef.current = null
          setIsRunning(false)

          if (phase === 'focus') {
            // 집중 완료 → 휴식으로 전환
            handleSessionComplete(focusMinutes, breakMinutes, 'focus')
            setPhase('break')
            return breakMinutes * 60
          } else if (phase === 'break') {
            // 휴식 완료 → done
            setPhase('done')
            return 0
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isRunning, phase, focusMinutes, breakMinutes, handleSessionComplete])

  // 집중/휴식 시간 변경 시 idle 상태면 secondsLeft 리셋
  useEffect(() => {
    if (phase === 'idle') {
      setSecondsLeft(focusMinutes * 60)
    }
  }, [focusMinutes, phase])

  // 시작/일시정지 토글
  function handleStartPause() {
    if (phase === 'idle' || phase === 'done') {
      // 새 집중 세션 시작
      setPhase('focus')
      setSecondsLeft(focusMinutes * 60)
      setIsRunning(true)
    } else {
      setIsRunning((prev) => !prev)
    }
  }

  // 리셋
  function handleReset() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsRunning(false)
    setPhase('idle')
    setSecondsLeft(focusMinutes * 60)
  }

  // phase별 색상
  const phaseColor = phase === 'break'
    ? 'text-green-500'
    : phase === 'done'
      ? 'text-yellow-500'
      : 'text-primary'

  const strokeColor = phase === 'break'
    ? '#22c55e'
    : phase === 'done'
      ? '#eab308'
      : 'hsl(var(--primary))'

  // phase 레이블
  function getPhaseLabel() {
    if (phase === 'focus') return t('focus')
    if (phase === 'break') return t('break')
    if (phase === 'done') return t('done')
    return t('focus')
  }

  const isIdle = phase === 'idle'
  const isDone = phase === 'done'

  return (
    <div className="flex flex-col gap-6 max-w-sm mx-auto">
      {/* 오늘 완료 횟수 */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <span>🍅</span>
        <span>
          {t('completed_today')}: <strong className="text-foreground">{completedCount}</strong> {t('sessions')}
        </span>
      </div>

      {/* 원형 타이머 카드 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-center text-base font-medium">
            <span className={phaseColor}>{getPhaseLabel()}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          {/* SVG 원형 진행률 */}
          <div className="relative flex items-center justify-center">
            <svg
              width={220}
              height={220}
              className="-rotate-90"
              aria-hidden="true"
            >
              {/* 배경 원 */}
              <circle
                cx={110}
                cy={110}
                r={RADIUS}
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth={10}
              />
              {/* 진행 원 */}
              <circle
                cx={110}
                cy={110}
                r={RADIUS}
                fill="none"
                stroke={strokeColor}
                strokeWidth={10}
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            {/* 중앙 타이머 표시 */}
            <div className="absolute flex flex-col items-center">
              <span className={`text-4xl font-bold tabular-nums ${phaseColor}`}>
                {timeDisplay}
              </span>
              {isDone && (
                <span className="text-sm text-muted-foreground mt-1">{t('done')}</span>
              )}
            </div>
          </div>

          {/* 컨트롤 버튼 */}
          <div className="flex items-center gap-3">
            {/* 시작/일시정지 버튼 */}
            <Button
              size="lg"
              onClick={handleStartPause}
              aria-label={isRunning ? t('pause') : t('start')}
              className="min-w-24"
            >
              {isRunning ? (
                <>
                  <Pause className="size-4 mr-1" />
                  {t('pause')}
                </>
              ) : (
                <>
                  <Play className="size-4 mr-1" />
                  {t('start')}
                </>
              )}
            </Button>

            {/* 리셋 버튼 */}
            <Button
              size="lg"
              variant="outline"
              onClick={handleReset}
              aria-label={t('reset')}
              disabled={isIdle}
            >
              <RotateCcw className="size-4 mr-1" />
              {t('reset')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 시간 설정 카드 */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-4">
            {/* 집중 시간 선택 */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-muted-foreground">
                {t('focus_time')}
              </label>
              <div className="flex flex-wrap gap-1">
                {FOCUS_OPTIONS.map((min) => (
                  <button
                    key={min}
                    onClick={() => {
                      if (!isRunning) {
                        setFocusMinutes(min)
                        if (phase === 'idle') {
                          setSecondsLeft(min * 60)
                        }
                      }
                    }}
                    disabled={isRunning}
                    className={[
                      'px-2 py-1 rounded text-xs font-medium transition-colors',
                      focusMinutes === min
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80',
                      isRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                    ].join(' ')}
                    aria-pressed={focusMinutes === min}
                  >
                    {min}{t('minutes')}
                  </button>
                ))}
              </div>
            </div>

            {/* 휴식 시간 선택 */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-muted-foreground">
                {t('break_time')}
              </label>
              <div className="flex flex-wrap gap-1">
                {BREAK_OPTIONS.map((min) => (
                  <button
                    key={min}
                    onClick={() => {
                      if (!isRunning) {
                        setBreakMinutes(min)
                      }
                    }}
                    disabled={isRunning}
                    className={[
                      'px-2 py-1 rounded text-xs font-medium transition-colors',
                      breakMinutes === min
                        ? 'bg-green-500 text-white'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80',
                      isRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                    ].join(' ')}
                    aria-pressed={breakMinutes === min}
                  >
                    {min}{t('minutes')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
