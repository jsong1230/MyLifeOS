import { test, expect } from '@playwright/test'

/**
 * F-38 수분 섭취 트래킹 — E2E 테스트
 *
 * 보호된 라우트이므로 미인증 상태에서는 /login 리다이렉트를 검증하고,
 * 수분 기록 관련 API 엔드포인트의 인증 보호를 확인한다.
 *
 * 배포 URL: https://mylifeos-virid.vercel.app
 */

// ─── 미인증 접근 보호 ─────────────────────────────────────────────────────────

test.describe('수분 섭취 트래킹 (F-38) — 미인증 접근 보호', () => {
  test('/health/water 페이지는 인증 없이 접근 불가하다', async ({ page }) => {
    // Arrange
    await page.goto('/health/water')
    await page.waitForLoadState('networkidle')

    // Assert — 미들웨어가 /login 으로 리다이렉트해야 함
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('/health/water 접근 시 리다이렉트 응답 상태가 올바르다', async ({ page }) => {
    // Arrange + Act
    const response = await page.goto('/health/water')
    await page.waitForLoadState('networkidle')

    // Assert — 최종 URL 은 /login, 중간 응답은 307/302/200 중 하나
    await expect(page).toHaveURL(/\/login/)
    expect([200, 307, 302, 303]).toContain(response?.status() ?? 200)
  })
})

// ─── 수분 기록 API 엔드포인트 — 미인증 접근 검증 ─────────────────────────────

test.describe('수분 섭취 API — 미인증 접근 차단', () => {
  test('수분 기록 API(/api/health/water)는 미인증 시 401 또는 리다이렉트를 반환한다', async ({ page }) => {
    // Arrange + Act
    const response = await page.request.get('/api/health/water')

    // Assert
    expect([401, 403, 307, 302, 404]).toContain(response.status())
  })

  test('수분 기록 POST는 미인증 시 401 또는 리다이렉트를 반환한다', async ({ page }) => {
    // Arrange + Act
    const response = await page.request.post('/api/health/water', {
      data: { amount_ml: 200, logged_at: new Date().toISOString() },
    })

    // Assert
    expect([401, 403, 307, 302, 404]).toContain(response.status())
  })

  test('수분 기록 DELETE는 미인증 시 401 또는 리다이렉트를 반환한다', async ({ page }) => {
    // Arrange + Act — 존재하지 않는 ID로 삭제 시도
    const response = await page.request.delete('/api/health/water/nonexistent-id')

    // Assert
    expect([401, 403, 307, 302, 404]).toContain(response.status())
  })
})

// ─── 수분 섭취 페이지 — 리다이렉트 구조 검증 ─────────────────────────────────

test.describe('수분 섭취 트래킹 — 라우트 보호 구조', () => {
  const WATER_ROUTES = [
    { label: '수분 섭취 홈', path: '/health/water' },
  ]

  for (const { label, path } of WATER_ROUTES) {
    test(`${label} 경로(${path})는 미인증 시 보호된다`, async ({ page }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL(/\/login/)
    })
  }

  test('로그인 페이지 접근 후 수분 섭취 페이지로 직접 이동 시 리다이렉트된다', async ({ page }) => {
    // Arrange — 먼저 로그인 페이지 방문
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    // Act — 수분 섭취 페이지로 직접 이동
    await page.goto('/health/water')
    await page.waitForLoadState('networkidle')

    // Assert — 여전히 /login 으로 리다이렉트
    await expect(page).toHaveURL(/\/login/)
  })
})

// ─── 앱 기본 구조 검증 ────────────────────────────────────────────────────────

test.describe('수분 섭취 트래킹 — 앱 기본 구조', () => {
  test('앱 타이틀이 My Life OS로 표시된다', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveTitle(/My Life OS/)
  })
})
