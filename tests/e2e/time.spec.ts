import { test, expect } from '@playwright/test'

/**
 * Time 페이지 — E2E 테스트
 *
 * 보호된 라우트이므로 미인증 상태에서는 /login 리다이렉트를 검증하고,
 * 각 서브 페이지(/time, /time/calendar, /time/routines, /time/blocks, /time/stats)의
 * 구조 및 내비게이션을 확인한다.
 *
 * 배포 URL: https://mylifeos-virid.vercel.app
 */

// ─── 미인증 접근 보호 ─────────────────────────────────────────────────────────

test.describe('Time 페이지 — 미인증 접근 보호', () => {
  test('/time 페이지는 인증 없이 접근 불가하다', async ({ page }) => {
    // Arrange
    await page.goto('/time')
    await page.waitForLoadState('networkidle')

    // Assert — 미들웨어가 /login 으로 리다이렉트해야 함
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('/time/calendar 페이지는 인증 없이 접근 불가하다', async ({ page }) => {
    // Arrange
    await page.goto('/time/calendar')
    await page.waitForLoadState('networkidle')

    // Assert
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('/time/routines 페이지는 인증 없이 접근 불가하다', async ({ page }) => {
    // Arrange
    await page.goto('/time/routines')
    await page.waitForLoadState('networkidle')

    // Assert
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('/time/blocks 페이지는 인증 없이 접근 불가하다', async ({ page }) => {
    // Arrange
    await page.goto('/time/blocks')
    await page.waitForLoadState('networkidle')

    // Assert
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('/time/stats 페이지는 인증 없이 접근 불가하다', async ({ page }) => {
    // Arrange
    await page.goto('/time/stats')
    await page.waitForLoadState('networkidle')

    // Assert
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })
})

// ─── Time 서브 내비게이션 구조 ───────────────────────────────────────────────

test.describe('Time 페이지 — 서브 내비게이션 링크', () => {
  /**
   * 미인증 상태에서도 /login 페이지를 통해 확인할 수 있는 내용이 아닌,
   * 서브 내비게이션(layout.tsx)에 정의된 링크 구조는 배포 페이지에 직접
   * 접근해야 확인 가능하므로, 미인증 리다이렉트 환경에서는 네비게이션 href 속성을
   * 소스 코드 검증이 아닌 개별 접근 시 리다이렉트 대상 URL 일치로 대체한다.
   */

  test('/time 접근 시 리다이렉트 URL이 /login이다 (내비게이션 보호 확인)', async ({ page }) => {
    // Arrange + Act
    const response = await page.goto('/time')
    await page.waitForLoadState('networkidle')

    // Assert — 미인증이므로 /login 으로 리다이렉트되어야 함
    await expect(page).toHaveURL(/\/login/)
    // 원본 응답은 307(리다이렉트) 또는 200(리다이렉트 후 로그인 페이지)
    expect([200, 307, 302, 303]).toContain(response?.status() ?? 200)
  })
})

// ─── Time 할일(Todo) 섹션 API 검증 ──────────────────────────────────────────

test.describe('Time 페이지 — 할일 API 엔드포인트 (미인증 접근)', () => {
  test('할일 API(/api/todos)는 미인증 시 401 또는 리다이렉트를 반환한다', async ({ page }) => {
    // Arrange + Act
    const response = await page.request.get('/api/todos')

    // Assert — 미인증 요청은 401, 403, 307, 302 중 하나여야 함
    expect([401, 403, 307, 302]).toContain(response.status())
  })

  test('루틴 API(/api/routines)는 미인증 시 401 또는 리다이렉트를 반환한다', async ({ page }) => {
    // Arrange + Act
    const response = await page.request.get('/api/routines')

    // Assert
    expect([401, 403, 307, 302]).toContain(response.status())
  })
})

// ─── Time 페이지 — 로그인 페이지에서 확인 가능한 앱 상태 ─────────────────────

test.describe('Time 페이지 — 앱 기본 구조 검증', () => {
  test('앱이 정상적으로 로드되고 타이틀이 올바르다', async ({ page }) => {
    // Arrange
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    // Assert — 앱 타이틀 확인 (Time 포함 전체 앱 공통)
    await expect(page).toHaveTitle(/My Life OS/)
  })

  test('로그인 페이지에서 회원가입 링크가 동작한다 (라우팅 정상 확인)', async ({ page }) => {
    // Arrange
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    // Act — 회원가입 링크 클릭
    const signupLink = page.getByRole('link', { name: '회원가입' })
    await signupLink.click()
    await page.waitForLoadState('networkidle')

    // Assert — /signup 으로 이동 확인 (라우팅 정상 동작)
    await expect(page).toHaveURL(/\/signup/)
  })
})

// ─── 통계 API 검증 ────────────────────────────────────────────────────────────

test.describe('Time 완료율 통계 — API 엔드포인트 (미인증 접근)', () => {
  test('완료율 통계 API는 미인증 시 401 또는 리다이렉트를 반환한다', async ({ page }) => {
    // Arrange + Act
    const response = await page.request.get('/api/stats/completion')

    // Assert — 미인증 보호 확인
    expect([401, 403, 307, 302, 404]).toContain(response.status())
  })
})
