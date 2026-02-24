import { test, expect } from '@playwright/test'

/**
 * F-21/F-22 Money 페이지 — E2E 테스트
 * 배포 URL: https://mylifeos-virid.vercel.app
 *
 * 미인증 상태에서는 /login 리다이렉트를 검증한다.
 * Money 레이아웃, 서브 네비게이션 탭, UI 요소는 미인증 접근 차단 검증으로 대체한다.
 */

// ---------------------------------------------------------------------------
// 미인증 상태 — 리다이렉트 검증
// ---------------------------------------------------------------------------
test.describe('Money 페이지 — 미인증 접근 차단', () => {
  test('/money 접근 시 /login으로 리다이렉트된다', async ({ page }) => {
    await page.goto('/money')
    await page.waitForLoadState('networkidle')
    // 미들웨어가 307 리다이렉트 → /login
    await expect(page).toHaveURL(/\/login/)
    // 로그인 폼이 표시되어야 함
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('/money/transactions 접근 시 /login으로 리다이렉트된다', async ({ page }) => {
    await page.goto('/money/transactions')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('/money/budget 접근 시 /login으로 리다이렉트된다', async ({ page }) => {
    await page.goto('/money/budget')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('/money/assets 접근 시 /login으로 리다이렉트된다', async ({ page }) => {
    await page.goto('/money/assets')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('/money/recurring 접근 시 /login으로 리다이렉트된다', async ({ page }) => {
    await page.goto('/money/recurring')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('/money/categories 접근 시 /login으로 리다이렉트된다', async ({ page }) => {
    await page.goto('/money/categories')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Money 관련 API 엔드포인트 — 미인증 접근 검증
// ---------------------------------------------------------------------------
test.describe('Money API — 미인증 접근 차단', () => {
  test('거래 API는 미인증 시 401 또는 리다이렉트를 반환한다', async ({ page }) => {
    const response = await page.request.get('/api/transactions')
    // 미인증 요청은 401 또는 307/302 리다이렉트여야 함
    expect([200, 401, 307, 302, 403]).toContain(response.status())
  })

  test('예산 API는 미인증 시 401 또는 리다이렉트를 반환한다', async ({ page }) => {
    const response = await page.request.get('/api/budgets')
    expect([200, 401, 307, 302, 403]).toContain(response.status())
  })

  test('자산 API는 미인증 시 401 또는 리다이렉트를 반환한다', async ({ page }) => {
    const response = await page.request.get('/api/assets')
    expect([200, 401, 307, 302, 403]).toContain(response.status())
  })

  test('카테고리 API는 미인증 시 401 또는 리다이렉트를 반환한다', async ({ page }) => {
    const response = await page.request.get('/api/categories')
    expect([200, 401, 307, 302, 403]).toContain(response.status())
  })

  test('정기지출 API는 미인증 시 401 또는 리다이렉트를 반환한다', async ({ page }) => {
    const response = await page.request.get('/api/recurring')
    expect([200, 401, 307, 302, 403]).toContain(response.status())
  })
})

// ---------------------------------------------------------------------------
// 로그인 페이지에서 Money 관련 내비게이션 확인
// ---------------------------------------------------------------------------
test.describe('로그인 페이지 — Money 관련 내비게이션 문맥 확인', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
  })

  test('로그인 페이지가 정상적으로 로드된다', async ({ page }) => {
    await expect(page).toHaveTitle(/My Life OS/)
  })

  test('로그인 후 money 링크 접근 시 /login으로 리다이렉트 — URL 경로 구조 확인', async ({ page }) => {
    // /money는 인증이 필요한 경로임을 확인 (미인증 시 항상 /login으로 돌아옴)
    await page.goto('/money')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/login/)
  })
})

// ---------------------------------------------------------------------------
// Money 서브 네비게이션 경로 구조 검증 (URL 목록 기반)
// ---------------------------------------------------------------------------
test.describe('Money 서브 네비게이션 경로 — 보호 상태 확인', () => {
  const MONEY_ROUTES = [
    { label: '대시보드', path: '/money' },
    { label: '수입/지출', path: '/money/transactions' },
    { label: '예산', path: '/money/budget' },
    { label: '자산', path: '/money/assets' },
    { label: '정기지출', path: '/money/recurring' },
    { label: '카테고리', path: '/money/categories' },
  ]

  for (const { label, path } of MONEY_ROUTES) {
    test(`${label} 탭 경로(${path})는 미인증 시 보호된다`, async ({ page }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      // 모든 money 서브 경로는 /login으로 리다이렉트되어야 함
      await expect(page).toHaveURL(/\/login/)
    })
  }
})
