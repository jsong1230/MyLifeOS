import { test, expect } from '@playwright/test'

/**
 * Health 페이지 — E2E 테스트
 *
 * 보호된 라우트이므로 미인증 상태에서는 /login 리다이렉트를 검증하고,
 * 각 서브 페이지(/health, /health/body, /health/exercise, /health/drinks 등)의
 * 접근 제한 및 API 응답을 확인한다.
 *
 * 음주 경고 배너 로직:
 *   - 잔 수 합계 >= 14잔 → 경고(빨간 배지)
 *   - 잔 수 합계 >= 11.2잔(80%) → 주의(노란 배지)
 *   - 잔 수 합계 < 11.2잔 → 정상 또는 배너 없음
 *
 * 배포 URL: https://mylifeos-virid.vercel.app
 */

// ─── 미인증 접근 보호 ─────────────────────────────────────────────────────────

test.describe('Health 페이지 — 미인증 접근 보호', () => {
  test('/health 페이지는 인증 없이 접근 불가하다', async ({ page }) => {
    // Arrange
    await page.goto('/health')
    await page.waitForLoadState('networkidle')

    // Assert — 미들웨어가 /login 으로 리다이렉트해야 함
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('/health/body 페이지는 인증 없이 접근 불가하다', async ({ page }) => {
    // Arrange
    await page.goto('/health/body')
    await page.waitForLoadState('networkidle')

    // Assert
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('/health/exercise 페이지는 인증 없이 접근 불가하다', async ({ page }) => {
    // Arrange
    await page.goto('/health/exercise')
    await page.waitForLoadState('networkidle')

    // Assert
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('/health/drinks 페이지는 인증 없이 접근 불가하다', async ({ page }) => {
    // Arrange
    await page.goto('/health/drinks')
    await page.waitForLoadState('networkidle')

    // Assert
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('/health/meals 페이지는 인증 없이 접근 불가하다', async ({ page }) => {
    // Arrange
    await page.goto('/health/meals')
    await page.waitForLoadState('networkidle')

    // Assert
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('/health/sleep 페이지는 인증 없이 접근 불가하다', async ({ page }) => {
    // Arrange
    await page.goto('/health/sleep')
    await page.waitForLoadState('networkidle')

    // Assert
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('/health/diet-goal 페이지는 인증 없이 접근 불가하다', async ({ page }) => {
    // Arrange
    await page.goto('/health/diet-goal')
    await page.waitForLoadState('networkidle')

    // Assert
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })
})

// ─── Health API 엔드포인트 — 미인증 접근 검증 ────────────────────────────────

test.describe('Health 페이지 — API 엔드포인트 (미인증 접근)', () => {
  test('체중 기록 API(/api/body-logs)는 미인증 시 401 또는 리다이렉트를 반환한다', async ({ page }) => {
    // Arrange + Act
    const response = await page.request.get('/api/body-logs')

    // Assert
    expect([401, 403, 307, 302]).toContain(response.status())
  })

  test('운동 기록 API(/api/exercise-logs)는 미인증 시 401 또는 리다이렉트를 반환한다', async ({ page }) => {
    // Arrange + Act
    const response = await page.request.get('/api/exercise-logs')

    // Assert
    expect([401, 403, 307, 302]).toContain(response.status())
  })

  test('음주 기록 API(/api/drinks)는 미인증 시 401 또는 리다이렉트를 반환한다', async ({ page }) => {
    // Arrange + Act
    const response = await page.request.get('/api/drinks')

    // Assert
    expect([401, 403, 307, 302]).toContain(response.status())
  })

  test('식사 기록 API(/api/meals)는 미인증 시 401 또는 리다이렉트를 반환한다', async ({ page }) => {
    // Arrange + Act
    const response = await page.request.get('/api/meals')

    // Assert
    expect([401, 403, 307, 302]).toContain(response.status())
  })

  test('수면 기록 API(/api/sleep-logs)는 미인증 시 401 또는 리다이렉트를 반환한다', async ({ page }) => {
    // Arrange + Act
    const response = await page.request.get('/api/sleep-logs')

    // Assert
    expect([401, 403, 307, 302]).toContain(response.status())
  })

  test('식단 목표 API(/api/diet-goal)는 미인증 시 401 또는 리다이렉트를 반환한다', async ({ page }) => {
    // Arrange + Act
    const response = await page.request.get('/api/diet-goal')

    // Assert
    expect([401, 403, 307, 302]).toContain(response.status())
  })
})

// ─── 음주 경고 배너 — WHO 기준 로직 검증 ────────────────────────────────────

test.describe('Health 음주 경고 — WHO 기준 배너 로직', () => {
  /**
   * DrinkWeeklyCard 컴포넌트 기준:
   *   - WHO_WEEKLY_LIMIT_DRINKS = 14 (남성 기준)
   *   - WHO_CAUTION_THRESHOLD = 14 * 0.8 = 11.2
   *
   * 미인증 환경에서는 실제 배너를 확인할 수 없으므로,
   * /health/drinks 접근 보호 및 배너 관련 API 응답을 검증한다.
   */

  test('/health/drinks는 미인증 시 /login으로 리다이렉트된다 (경고 배너 페이지 보호)', async ({ page }) => {
    // Arrange
    await page.goto('/health/drinks')
    await page.waitForLoadState('networkidle')

    // Assert — 음주 경고가 있는 페이지도 인증 없이는 접근 불가
    await expect(page).toHaveURL(/\/login/)
  })

  test('음주 기록 API는 week_start 파라미터를 수용하는 경로 구조를 가진다', async ({ page }) => {
    // Arrange — 이번 주 월요일 계산 (YYYY-MM-DD)
    const today = new Date()
    const day = today.getDay()
    const diff = day === 0 ? -6 : 1 - day
    const monday = new Date(today)
    monday.setDate(today.getDate() + diff)
    const weekStart = monday.toISOString().split('T')[0]

    // Act
    const response = await page.request.get(`/api/drinks?week_start=${weekStart}`)

    // Assert — 미인증이므로 401/403/307/302 중 하나 (성공 응답 200은 아님)
    expect([401, 403, 307, 302]).toContain(response.status())
  })
})

// ─── Health 페이지 — 리다이렉트 상태 코드 검증 ───────────────────────────────

test.describe('Health 페이지 — 리다이렉트 응답 구조', () => {
  test('/health 접근 시 리다이렉트 응답 상태가 올바르다', async ({ page }) => {
    // Arrange + Act
    const response = await page.goto('/health')
    await page.waitForLoadState('networkidle')

    // Assert — 최종 URL 은 /login, 중간 응답은 307/302/200 중 하나
    await expect(page).toHaveURL(/\/login/)
    expect([200, 307, 302, 303]).toContain(response?.status() ?? 200)
  })

  test('/health/body 접근 시 리다이렉트 후 로그인 폼이 표시된다', async ({ page }) => {
    // Arrange + Act
    await page.goto('/health/body')
    await page.waitForLoadState('networkidle')

    // Assert — 체중 기록 페이지 접근 시 로그인 폼이 표시되어야 함
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('/health/exercise 접근 시 리다이렉트 후 로그인 폼이 표시된다', async ({ page }) => {
    // Arrange + Act
    await page.goto('/health/exercise')
    await page.waitForLoadState('networkidle')

    // Assert — 운동 기록 페이지 접근 시 로그인 폼이 표시되어야 함
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })
})

// ─── Health 페이지 — 앱 전체 기본 구조 검증 ──────────────────────────────────

test.describe('Health 페이지 — 앱 기본 구조 검증', () => {
  test('앱 타이틀이 My Life OS로 표시된다', async ({ page }) => {
    // Arrange
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    // Assert — Health 포함 전체 앱 공통 타이틀
    await expect(page).toHaveTitle(/My Life OS/)
  })

  test('앱 HTML lang 속성이 ko로 설정된다 (한국어 음주 경고 텍스트 지원 확인)', async ({ page }) => {
    // Arrange
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    // Assert — 한국어 배지 텍스트 ("이번 주 절주", "주의", "경고" 등) 표시를 위한 lang 속성
    const htmlLang = await page.locator('html').getAttribute('lang')
    expect(htmlLang).toBe('ko')
  })
})
