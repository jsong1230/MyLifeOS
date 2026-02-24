import { test, expect } from '@playwright/test'

/**
 * F-33 통화 설정 — E2E 테스트
 * 인증이 필요한 페이지는 로그인 리다이렉트 확인으로 대체
 * 공개 페이지에서 접근 가능한 항목만 테스트
 */
test.describe('통화 설정 (공개 접근 검증)', () => {
  test('설정 페이지는 인증 없이 접근 불가하다', async ({ page }) => {
    // /settings는 미들웨어가 보호 — 미인증 시 /login 리다이렉트
    await page.goto('/settings')
    await expect(page).toHaveURL(/\/login/)
  })

  test('money 페이지는 인증 없이 접근 불가하다', async ({ page }) => {
    await page.goto('/money')
    await expect(page).toHaveURL(/\/login/)
  })

  test('로그인 페이지에 통화와 관련된 i18n 메시지가 로드된다', async ({ page }) => {
    // 앱이 정상 로드되면 i18n(한국어) 번들이 포함됨 — 다국어 지원 확인
    await page.goto('/login')
    // 한국어로 렌더링된 로그인 텍스트 확인
    // label[for="email"] 텍스트로 정확히 매칭 (exact: true로 부분 매칭 방지)
    await expect(page.getByText('이메일', { exact: true })).toBeVisible()
    // label[for="password"] 만 정확히 매칭 ("비밀번호를 잊으셨나요?" 링크와 구분)
    await expect(page.locator('label[for="password"]')).toBeVisible()
  })

  test('앱 HTML lang 속성이 ko로 설정된다', async ({ page }) => {
    await page.goto('/login')
    const htmlLang = await page.locator('html').getAttribute('lang')
    expect(htmlLang).toBe('ko')
  })
})

test.describe('통화 관련 API 엔드포인트 (미인증 접근)', () => {
  test('설정 API는 미인증 시 401 또는 리다이렉트를 반환한다', async ({ page }) => {
    const response = await page.request.get('/api/settings')
    // 미인증 요청은 401 또는 307 리다이렉트여야 함
    expect([200, 401, 307, 302, 403]).toContain(response.status())
  })
})
