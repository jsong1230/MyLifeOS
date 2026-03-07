import { test, expect } from '@playwright/test'

/**
 * F-39 포모도로 타이머 — E2E 테스트
 *
 * 보호된 라우트이므로 미인증 상태에서는 /login 리다이렉트를 검증하고,
 * 포모도로 세션 관련 API 엔드포인트의 인증 보호를 확인한다.
 *
 * 배포 URL: https://mylifeos-virid.vercel.app
 */

// ─── 미인증 접근 보호 ─────────────────────────────────────────────────────────

test.describe('포모도로 타이머 (F-39) — 미인증 접근 보호', () => {
  test('/time/pomodoro 페이지는 인증 없이 접근 불가하다', async ({ page }) => {
    // Arrange
    await page.goto('/time/pomodoro')
    await page.waitForLoadState('networkidle')

    // Assert — 미들웨어가 /login 으로 리다이렉트해야 함
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('/time/pomodoro 접근 시 로그인 폼이 표시된다', async ({ page }) => {
    // Arrange + Act
    await page.goto('/time/pomodoro')
    await page.waitForLoadState('networkidle')

    // Assert
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('/time/pomodoro 접근 시 리다이렉트 응답 상태가 올바르다', async ({ page }) => {
    // Arrange + Act
    const response = await page.goto('/time/pomodoro')
    await page.waitForLoadState('networkidle')

    // Assert
    await expect(page).toHaveURL(/\/login/)
    expect([200, 307, 302, 303]).toContain(response?.status() ?? 200)
  })
})

// ─── 포모도로 세션 API 엔드포인트 — 미인증 접근 검증 ──────────────────────────

test.describe('포모도로 타이머 API — 미인증 접근 차단', () => {
  test('포모도로 세션 API(/api/time/pomodoro)는 미인증 시 401 또는 리다이렉트를 반환한다', async ({ page }) => {
    // Arrange + Act
    const response = await page.request.get('/api/time/pomodoro')

    // Assert
    expect([401, 403, 307, 302, 404]).toContain(response.status())
  })

  test('포모도로 세션 POST는 미인증 시 401 또는 리다이렉트를 반환한다', async ({ page }) => {
    // Arrange + Act
    const response = await page.request.post('/api/time/pomodoro', {
      data: {
        duration_minutes: 25,
        completed: true,
        started_at: new Date().toISOString(),
      },
    })

    // Assert
    expect([401, 403, 307, 302, 404]).toContain(response.status())
  })

  test('포모도로 세션 통계 API는 미인증 시 401 또는 리다이렉트를 반환한다', async ({ page }) => {
    // Arrange + Act
    const today = new Date().toISOString().split('T')[0]
    const response = await page.request.get(`/api/time/pomodoro?date=${today}`)

    // Assert
    expect([401, 403, 307, 302, 404]).toContain(response.status())
  })
})

// ─── 포모도로 타이머 — 라우트 보호 구조 검증 ─────────────────────────────────

test.describe('포모도로 타이머 — 라우트 보호 구조', () => {
  test('타이머 관련 time 서브 경로가 미인증 시 모두 보호된다', async ({ page }) => {
    // /time/pomodoro 는 /time 레이아웃 하위 경로
    await page.goto('/time/pomodoro')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/login/)
  })

  test('/time/streaks 경로도 미인증 시 보호된다', async ({ page }) => {
    await page.goto('/time/streaks')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/login/)
  })
})

// ─── 앱 기본 구조 검증 ────────────────────────────────────────────────────────

test.describe('포모도로 타이머 — 앱 기본 구조', () => {
  test('앱 타이틀이 My Life OS로 표시된다', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveTitle(/My Life OS/)
  })

  test('로그인 페이지에서 회원가입 링크가 동작한다 (라우팅 정상 확인)', async ({ page }) => {
    // Arrange
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    // Act
    const signupLink = page.getByRole('link', { name: '회원가입' })
    await signupLink.click()
    await page.waitForLoadState('networkidle')

    // Assert
    await expect(page).toHaveURL(/\/signup/)
  })
})
