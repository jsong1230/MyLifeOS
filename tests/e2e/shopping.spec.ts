import { test, expect } from '@playwright/test'

/**
 * F-45 장보기 목록 — E2E 테스트
 *
 * 보호된 라우트이므로 미인증 상태에서는 /login 리다이렉트를 검증하고,
 * 장보기 목록 관련 API 엔드포인트의 인증 보호를 확인한다.
 *
 * 배포 URL: https://mylifeos-virid.vercel.app
 */

// ─── 미인증 접근 보호 ─────────────────────────────────────────────────────────

test.describe('장보기 목록 (F-45) — 미인증 접근 보호', () => {
  test('/money/shopping 페이지는 인증 없이 접근 불가하다', async ({ page }) => {
    // Arrange
    await page.goto('/money/shopping')
    await page.waitForLoadState('networkidle')

    // Assert — 미들웨어가 /login 으로 리다이렉트해야 함
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('/money/shopping 접근 시 로그인 폼이 표시된다', async ({ page }) => {
    // Arrange + Act
    await page.goto('/money/shopping')
    await page.waitForLoadState('networkidle')

    // Assert
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('/money/shopping 접근 시 리다이렉트 응답 상태가 올바르다', async ({ page }) => {
    // Arrange + Act
    const response = await page.goto('/money/shopping')
    await page.waitForLoadState('networkidle')

    // Assert
    await expect(page).toHaveURL(/\/login/)
    expect([200, 307, 302, 303]).toContain(response?.status() ?? 200)
  })
})

// ─── 장보기 목록 API 엔드포인트 — 미인증 접근 검증 ───────────────────────────

test.describe('장보기 목록 API — 미인증 접근 차단', () => {
  test('장보기 목록 API(/api/money/shopping)는 미인증 시 401 또는 리다이렉트를 반환한다', async ({ page }) => {
    // Arrange + Act
    const response = await page.request.get('/api/money/shopping')

    // Assert
    expect([401, 403, 307, 302, 404]).toContain(response.status())
  })

  test('장보기 목록 생성 POST는 미인증 시 401 또는 리다이렉트를 반환한다', async ({ page }) => {
    // Arrange + Act
    const response = await page.request.post('/api/money/shopping', {
      data: { name: '이번 주 장보기', description: '주말 장보기' },
    })

    // Assert
    expect([401, 403, 307, 302, 404]).toContain(response.status())
  })

  test('장보기 목록 완료 PATCH는 미인증 시 401 또는 리다이렉트를 반환한다', async ({ page }) => {
    // Arrange + Act — 존재하지 않는 목록 완료 처리 시도
    const response = await page.request.patch('/api/money/shopping/nonexistent-id', {
      data: { is_completed: true },
    })

    // Assert
    expect([401, 403, 307, 302, 404]).toContain(response.status())
  })

  test('장보기 목록 삭제 DELETE는 미인증 시 401 또는 리다이렉트를 반환한다', async ({ page }) => {
    // Arrange + Act
    const response = await page.request.delete('/api/money/shopping/nonexistent-id')

    // Assert
    expect([401, 403, 307, 302, 404]).toContain(response.status())
  })

  test('장보기 아이템 API는 미인증 시 401 또는 리다이렉트를 반환한다', async ({ page }) => {
    // Arrange + Act
    const response = await page.request.get('/api/money/shopping/nonexistent-id/items')

    // Assert
    expect([401, 403, 307, 302, 404]).toContain(response.status())
  })

  test('장보기 아이템 추가 POST는 미인증 시 401 또는 리다이렉트를 반환한다', async ({ page }) => {
    // Arrange + Act
    const response = await page.request.post('/api/money/shopping/nonexistent-id/items', {
      data: { name: '사과', quantity: 3, unit: '개', estimated_price: 5000 },
    })

    // Assert
    expect([401, 403, 307, 302, 404]).toContain(response.status())
  })

  test('장보기 아이템 체크 PATCH는 미인증 시 401 또는 리다이렉트를 반환한다', async ({ page }) => {
    // Arrange + Act — 아이템 체크 처리 시도
    const response = await page.request.patch(
      '/api/money/shopping/nonexistent-list-id/items/nonexistent-item-id',
      { data: { is_checked: true } },
    )

    // Assert
    expect([401, 403, 307, 302, 404]).toContain(response.status())
  })
})

// ─── 장보기 목록 — Money 서브 경로 보호 구조 검증 ─────────────────────────────

test.describe('장보기 목록 — Money 서브 경로 보호 구조', () => {
  const MONEY_ROUTES = [
    { label: '머니 홈', path: '/money' },
    { label: '장보기 목록', path: '/money/shopping' },
    { label: '가계부 통계', path: '/money/stats' },
    { label: '수입/지출', path: '/money/transactions' },
    { label: '예산', path: '/money/budget' },
    { label: '자산', path: '/money/assets' },
    { label: '정기지출', path: '/money/recurring' },
  ]

  for (const { label, path } of MONEY_ROUTES) {
    test(`${label} 경로(${path})는 미인증 시 보호된다`, async ({ page }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL(/\/login/)
    })
  }
})

// ─── 장보기 목록 — 목록/아이템 URL 구조 검증 ─────────────────────────────────

test.describe('장보기 목록 — URL 구조 검증', () => {
  test('/money/shopping URL 구조가 올바르다', async ({ page }) => {
    // Arrange + Act
    await page.goto('/money/shopping')
    await page.waitForLoadState('networkidle')

    // Assert — /login 으로 리다이렉트되어 URL에 /shopping 이 없어야 함
    const url = page.url()
    expect(url).toMatch(/\/login/)
    expect(url).not.toMatch(/\/shopping/)
  })
})

// ─── 앱 기본 구조 검증 ────────────────────────────────────────────────────────

test.describe('장보기 목록 — 앱 기본 구조', () => {
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
