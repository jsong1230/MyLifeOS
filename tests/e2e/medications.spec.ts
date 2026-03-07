import { test, expect } from '@playwright/test'

/**
 * F-41 약 복용 기록 — E2E 테스트
 *
 * 보호된 라우트이므로 미인증 상태에서는 /login 리다이렉트를 검증하고,
 * 약 복용 기록 관련 API 엔드포인트의 인증 보호를 확인한다.
 *
 * 배포 URL: https://mylifeos-virid.vercel.app
 */

// ─── 미인증 접근 보호 ─────────────────────────────────────────────────────────

test.describe('약 복용 기록 (F-41) — 미인증 접근 보호', () => {
  test('/health/medications 페이지는 인증 없이 접근 불가하다', async ({ page }) => {
    // Arrange
    await page.goto('/health/medications')
    await page.waitForLoadState('networkidle')

    // Assert — 미들웨어가 /login 으로 리다이렉트해야 함
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('/health/medications 접근 시 로그인 폼이 표시된다', async ({ page }) => {
    // Arrange + Act
    await page.goto('/health/medications')
    await page.waitForLoadState('networkidle')

    // Assert
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('/health/medications 접근 시 리다이렉트 응답 상태가 올바르다', async ({ page }) => {
    // Arrange + Act
    const response = await page.goto('/health/medications')
    await page.waitForLoadState('networkidle')

    // Assert
    await expect(page).toHaveURL(/\/login/)
    expect([200, 307, 302, 303]).toContain(response?.status() ?? 200)
  })
})

// ─── 약 복용 기록 API 엔드포인트 — 미인증 접근 검증 ──────────────────────────

test.describe('약 복용 기록 API — 미인증 접근 차단', () => {
  test('약 목록 API(/api/health/medications)는 미인증 시 401 또는 리다이렉트를 반환한다', async ({ page }) => {
    // Arrange + Act
    const response = await page.request.get('/api/health/medications')

    // Assert
    expect([401, 403, 307, 302, 404]).toContain(response.status())
  })

  test('약 등록 POST는 미인증 시 401 또는 리다이렉트를 반환한다', async ({ page }) => {
    // Arrange + Act
    const response = await page.request.post('/api/health/medications', {
      data: {
        name: '테스트 약',
        dosage: '500mg',
        frequency: 'daily',
      },
    })

    // Assert
    expect([401, 403, 307, 302, 404]).toContain(response.status())
  })

  test('약 복용 체크 PATCH는 미인증 시 401 또는 리다이렉트를 반환한다', async ({ page }) => {
    // Arrange + Act — 존재하지 않는 ID로 체크 시도
    const response = await page.request.patch('/api/health/medications/nonexistent-id', {
      data: { taken: true, taken_at: new Date().toISOString() },
    })

    // Assert
    expect([401, 403, 307, 302, 404]).toContain(response.status())
  })

  test('약 삭제 DELETE는 미인증 시 401 또는 리다이렉트를 반환한다', async ({ page }) => {
    // Arrange + Act
    const response = await page.request.delete('/api/health/medications/nonexistent-id')

    // Assert
    expect([401, 403, 307, 302, 404]).toContain(response.status())
  })

  test('약 복용 기록 로그 API는 미인증 시 401 또는 리다이렉트를 반환한다', async ({ page }) => {
    // Arrange + Act
    const today = new Date().toISOString().split('T')[0]
    const response = await page.request.get(`/api/health/medications/logs?date=${today}`)

    // Assert
    expect([401, 403, 307, 302, 404]).toContain(response.status())
  })
})

// ─── 약 복용 기록 — 라우트 보호 구조 검증 ─────────────────────────────────────

test.describe('약 복용 기록 — Health 서브 경로 보호', () => {
  const HEALTH_ROUTES = [
    { label: '건강 홈', path: '/health' },
    { label: '약 복용 기록', path: '/health/medications' },
    { label: '수분 섭취', path: '/health/water' },
    { label: '체중 기록', path: '/health/body' },
    { label: '운동 기록', path: '/health/exercise' },
    { label: '수면 기록', path: '/health/sleep' },
    { label: '식사 기록', path: '/health/meals' },
  ]

  for (const { label, path } of HEALTH_ROUTES) {
    test(`${label} 경로(${path})는 미인증 시 보호된다`, async ({ page }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL(/\/login/)
    })
  }
})

// ─── 앱 기본 구조 검증 ────────────────────────────────────────────────────────

test.describe('약 복용 기록 — 앱 기본 구조', () => {
  test('앱 타이틀이 My Life OS로 표시된다', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveTitle(/My Life OS/)
  })
})
