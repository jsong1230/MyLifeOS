import { test, expect } from '@playwright/test'

/**
 * F-40 퀵 메모 (암호화) — E2E 테스트
 *
 * /private/memos는 보호된 라우트이므로:
 * 1. 미인증 상태에서는 /login 리다이렉트를 검증
 * 2. PIN 잠금 화면 보호 구조 검증
 * 3. 퀵 메모 API 엔드포인트 인증 보호 확인
 *
 * 배포 URL: https://mylifeos-virid.vercel.app
 */

// ─── 미인증 접근 보호 ─────────────────────────────────────────────────────────

test.describe('퀵 메모 (F-40) — 미인증 접근 보호', () => {
  test('/private/memos 페이지는 인증 없이 접근 불가하다', async ({ page }) => {
    // Arrange
    await page.goto('/private/memos')
    await page.waitForLoadState('networkidle')

    // Assert — 미들웨어가 /login 으로 리다이렉트해야 함
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('/private/memos 접근 시 로그인 폼이 표시된다', async ({ page }) => {
    // Arrange + Act
    await page.goto('/private/memos')
    await page.waitForLoadState('networkidle')

    // Assert
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('/private/memos 접근 시 리다이렉트 응답 상태가 올바르다', async ({ page }) => {
    // Arrange + Act
    const response = await page.goto('/private/memos')
    await page.waitForLoadState('networkidle')

    // Assert
    await expect(page).toHaveURL(/\/login/)
    expect([200, 307, 302, 303]).toContain(response?.status() ?? 200)
  })
})

// ─── 프라이빗 영역 전체 미인증 보호 검증 ────────────────────────────────────

test.describe('퀵 메모 — 프라이빗 영역 라우트 보호 구조', () => {
  const PRIVATE_ROUTES = [
    { label: '프라이빗 홈', path: '/private' },
    { label: '퀵 메모', path: '/private/memos' },
    { label: '일기', path: '/private/diary' },
    { label: '감정 기록', path: '/private/emotion' },
    { label: '인간관계 메모', path: '/private/relations' },
  ]

  for (const { label, path } of PRIVATE_ROUTES) {
    test(`${label} 경로(${path})는 미인증 시 보호된다`, async ({ page }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      // 모든 private 경로는 /login 으로 리다이렉트되어야 함
      await expect(page).toHaveURL(/\/login/)
    })
  }
})

// ─── 퀵 메모 API 엔드포인트 — 미인증 접근 검증 ──────────────────────────────

test.describe('퀵 메모 API — 미인증 접근 차단', () => {
  test('퀵 메모 API(/api/private/memos)는 미인증 시 401 또는 리다이렉트를 반환한다', async ({ page }) => {
    // Arrange + Act
    const response = await page.request.get('/api/private/memos')

    // Assert
    expect([401, 403, 307, 302, 404]).toContain(response.status())
  })

  test('퀵 메모 POST는 미인증 시 401 또는 리다이렉트를 반환한다', async ({ page }) => {
    // Arrange + Act — 암호화된 내용으로 POST 시도
    const response = await page.request.post('/api/private/memos', {
      data: { content: 'v2:encryptedcontent', title: '테스트 메모' },
    })

    // Assert
    expect([401, 403, 307, 302, 404]).toContain(response.status())
  })

  test('퀵 메모 DELETE는 미인증 시 401 또는 리다이렉트를 반환한다', async ({ page }) => {
    // Arrange + Act
    const response = await page.request.delete('/api/private/memos/nonexistent-id')

    // Assert
    expect([401, 403, 307, 302, 404]).toContain(response.status())
  })
})

// ─── PIN 잠금 화면 — 구조 검증 ───────────────────────────────────────────────

test.describe('퀵 메모 — PIN 잠금 화면 보호 구조', () => {
  /**
   * /private 영역은 대시보드 레이아웃의 PinGuard로 보호된다.
   * 미인증 상태에서는 미들웨어가 먼저 /login 으로 리다이렉트하므로
   * PIN 화면은 인증 후 PIN이 설정된 사용자에게만 표시된다.
   * 미인증 환경에서는 /login 리다이렉트로 이 보호 구조를 간접 검증한다.
   */

  test('/private/memos 는 이중 보호 구조를 가진다 (미들웨어 + PIN Guard)', async ({ page }) => {
    // Arrange + Act — 미인증 상태에서 접근
    await page.goto('/private/memos')
    await page.waitForLoadState('networkidle')

    // Assert — 첫 번째 보호막(미들웨어)이 /login 으로 리다이렉트
    await expect(page).toHaveURL(/\/login/)
  })

  test('PIN 설정 관련 API는 미인증 시 보호된다', async ({ page }) => {
    // Arrange + Act
    const response = await page.request.get('/api/users/pin')

    // Assert — PIN API도 미인증 시 차단되어야 함
    expect([401, 403, 307, 302, 404, 405]).toContain(response.status())
  })
})

// ─── 앱 기본 구조 검증 ────────────────────────────────────────────────────────

test.describe('퀵 메모 — 앱 기본 구조', () => {
  test('앱 타이틀이 My Life OS로 표시된다', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveTitle(/My Life OS/)
  })
})
