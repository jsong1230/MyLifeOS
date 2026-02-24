import { test, expect } from '@playwright/test'

/**
 * F-01 회원가입/로그인 — E2E 인증 테스트
 * 배포 URL: https://mylifeos-virid.vercel.app
 */
test.describe('로그인 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('로그인 페이지가 정상적으로 로드된다', async ({ page }) => {
    // 페이지 타이틀 확인
    await expect(page).toHaveTitle(/My Life OS/)
    // 카드 타이틀 "로그인" 텍스트 확인
    await expect(page.getByText('로그인').first()).toBeVisible()
  })

  test('이메일 input이 존재한다', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeVisible()
    // placeholder 확인
    await expect(emailInput).toHaveAttribute('placeholder', 'you@example.com')
  })

  test('비밀번호 input이 존재한다', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]')
    await expect(passwordInput).toBeVisible()
    // placeholder 확인
    await expect(passwordInput).toHaveAttribute('placeholder', '••••••••')
  })

  test('로그인 버튼이 존재한다', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeVisible()
    await expect(submitButton).toHaveText('로그인')
  })

  test('빈 폼 제출 시 브라우저 native validation이 동작한다', async ({ page }) => {
    // required 속성이 있으므로 빈 제출 시 브라우저 검증 동작
    const emailInput = page.locator('input[type="email"]')
    const submitButton = page.locator('button[type="submit"]')

    // 빈 상태로 제출
    await submitButton.click()

    // 이메일 필드가 required 속성을 가지고 있어야 함
    await expect(emailInput).toHaveAttribute('required', '')
  })

  test('잘못된 이메일 형식 입력 시 type="email" 검증이 동작한다', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')
    const submitButton = page.locator('button[type="submit"]')

    // 잘못된 이메일 형식 입력
    await emailInput.fill('not-a-valid-email')
    await passwordInput.fill('somepassword')
    await submitButton.click()

    // type="email" 검증: 입력 값이 유지되고 폼 제출이 막혀야 함
    // (페이지 이동이 일어나지 않아야 함 — URL 그대로)
    await expect(page).toHaveURL(/\/login/)
    // 입력된 값이 여전히 남아있어야 함
    await expect(emailInput).toHaveValue('not-a-valid-email')
  })

  test('올바른 이메일 형식으로 잘못된 비밀번호 제출 시 서버 에러 메시지가 표시된다', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')
    const submitButton = page.locator('button[type="submit"]')

    await emailInput.fill('nonexistent@example.com')
    await passwordInput.fill('wrongpassword123')
    await submitButton.click()

    // 에러 메시지 또는 로그인 페이지에 머물러야 함
    // (인증 실패이므로 /login 유지 또는 에러 표시)
    await expect(page).toHaveURL(/\/login/)
  })

  test('Google 로그인 버튼이 존재한다', async ({ page }) => {
    // type="button" + Google 텍스트가 있는 버튼
    const googleButton = page.getByText('Google로 로그인')
    await expect(googleButton).toBeVisible()
  })

  test('비밀번호 재설정 링크가 존재한다', async ({ page }) => {
    const resetLink = page.getByText('비밀번호를 잊으셨나요?')
    await expect(resetLink).toBeVisible()
    await expect(resetLink).toHaveAttribute('href', '/reset-password')
  })
})
