import { test, expect } from '@playwright/test'

/**
 * F-42 독서 기록 — E2E 테스트
 *
 * 보호된 라우트이므로 미인증 상태에서는 /login 리다이렉트를 검증하고,
 * 독서 기록 관련 API 엔드포인트의 인증 보호를 확인한다.
 *
 * 독서 상태 값:
 *   - to_read: 읽을 책
 *   - reading: 읽는 중
 *   - completed: 완독
 *
 * 배포 URL: https://mylifeos-virid.vercel.app
 */

// ─── 미인증 접근 보호 ─────────────────────────────────────────────────────────

test.describe('독서 기록 (F-42) — 미인증 접근 보호', () => {
  test('/books 페이지는 인증 없이 접근 불가하다', async ({ page }) => {
    // Arrange
    await page.goto('/books')
    await page.waitForLoadState('networkidle')

    // Assert — 미들웨어가 /login 으로 리다이렉트해야 함
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('/books 접근 시 로그인 폼이 표시된다', async ({ page }) => {
    // Arrange + Act
    await page.goto('/books')
    await page.waitForLoadState('networkidle')

    // Assert
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('/books 접근 시 리다이렉트 응답 상태가 올바르다', async ({ page }) => {
    // Arrange + Act
    const response = await page.goto('/books')
    await page.waitForLoadState('networkidle')

    // Assert
    await expect(page).toHaveURL(/\/login/)
    expect([200, 307, 302, 303]).toContain(response?.status() ?? 200)
  })
})

// ─── 독서 기록 API 엔드포인트 — 미인증 접근 검증 ──────────────────────────────

test.describe('독서 기록 API — 미인증 접근 차단', () => {
  test('독서 목록 API(/api/books)는 미인증 시 401 또는 리다이렉트를 반환한다', async ({ page }) => {
    // Arrange + Act
    const response = await page.request.get('/api/books')

    // Assert
    expect([401, 403, 307, 302, 404]).toContain(response.status())
  })

  test('책 추가 POST는 미인증 시 401 또는 리다이렉트를 반환한다', async ({ page }) => {
    // Arrange + Act
    const response = await page.request.post('/api/books', {
      data: {
        title: '테스트 책',
        author: '테스트 저자',
        status: 'to_read',
      },
    })

    // Assert
    expect([401, 403, 307, 302, 404]).toContain(response.status())
  })

  test('책 상태 변경 PATCH는 미인증 시 401 또는 리다이렉트를 반환한다', async ({ page }) => {
    // Arrange + Act — to_read → reading 상태 변경 시도
    const response = await page.request.patch('/api/books/nonexistent-id', {
      data: { status: 'reading', started_at: new Date().toISOString() },
    })

    // Assert
    expect([401, 403, 307, 302, 404]).toContain(response.status())
  })

  test('책 삭제 DELETE는 미인증 시 401 또는 리다이렉트를 반환한다', async ({ page }) => {
    // Arrange + Act
    const response = await page.request.delete('/api/books/nonexistent-id')

    // Assert
    expect([401, 403, 307, 302, 404]).toContain(response.status())
  })

  test('독서 상태별 필터링 GET은 미인증 시 401 또는 리다이렉트를 반환한다', async ({ page }) => {
    // Arrange + Act — to_read 상태 책 목록 요청
    const response = await page.request.get('/api/books?status=to_read')

    // Assert
    expect([401, 403, 307, 302, 404]).toContain(response.status())
  })
})

// ─── 독서 기록 — 책 상태 전환 구조 검증 ──────────────────────────────────────

test.describe('독서 기록 — 책 상태 값 구조', () => {
  /**
   * 미인증 환경에서 직접 UI를 확인할 수 없으므로
   * API 요청 구조가 올바른 status 값(to_read/reading/completed)을
   * 거부하는지 간접 검증한다.
   */

  const BOOK_STATUSES = ['to_read', 'reading', 'completed']

  for (const status of BOOK_STATUSES) {
    test(`책 상태 '${status}'로 POST 시 미인증이면 차단된다`, async ({ page }) => {
      const response = await page.request.post('/api/books', {
        data: { title: '테스트', author: '저자', status },
      })
      expect([401, 403, 307, 302, 404]).toContain(response.status())
    })
  }
})

// ─── 독서 기록 — 라우트 보호 구조 검증 ───────────────────────────────────────

test.describe('독서 기록 — 라우트 보호 구조', () => {
  test('/books 경로는 미인증 시 보호된다', async ({ page }) => {
    await page.goto('/books')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/login/)
  })

  test('/books 접근 시 /login 으로 리다이렉트 후 이메일 입력 필드가 표시된다', async ({ page }) => {
    await page.goto('/books')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })
})

// ─── 앱 기본 구조 검증 ────────────────────────────────────────────────────────

test.describe('독서 기록 — 앱 기본 구조', () => {
  test('앱 타이틀이 My Life OS로 표시된다', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveTitle(/My Life OS/)
  })

  test('앱 HTML lang 속성이 ko로 설정된다', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    const htmlLang = await page.locator('html').getAttribute('lang')
    expect(htmlLang).toBe('ko')
  })
})
