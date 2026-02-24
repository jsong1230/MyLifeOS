import { test, expect } from '@playwright/test'

/**
 * F-01/F-02/F-03 — 미인증 상태 내비게이션 및 리다이렉트 E2E 테스트
 * 미들웨어가 미인증 사용자를 /login 으로 리다이렉트하는 동작을 검증한다
 */
test.describe('미인증 상태 내비게이션', () => {
  test('루트(/) 접근 시 /login으로 리다이렉트된다', async ({ page }) => {
    await page.goto('/')
    // 미들웨어가 307 리다이렉트 → /login
    await expect(page).toHaveURL(/\/login/)
    // 로그인 폼이 표시되어야 함
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('/money 접근 시 /login으로 리다이렉트된다', async ({ page }) => {
    await page.goto('/money')
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('/time 접근 시 /login으로 리다이렉트된다', async ({ page }) => {
    await page.goto('/time')
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('/health 접근 시 /login으로 리다이렉트된다', async ({ page }) => {
    await page.goto('/health')
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('/settings 접근 시 /login으로 리다이렉트된다', async ({ page }) => {
    await page.goto('/settings')
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })
})

test.describe('로그인 페이지 내 링크', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('회원가입 링크가 /signup을 가리킨다', async ({ page }) => {
    const signupLink = page.getByText('회원가입')
    await expect(signupLink).toBeVisible()
    await expect(signupLink).toHaveAttribute('href', '/signup')
  })

  test('회원가입 링크 클릭 시 /signup 페이지로 이동한다', async ({ page }) => {
    const signupLink = page.getByText('회원가입')
    await signupLink.click()
    await expect(page).toHaveURL(/\/signup/)
  })

  test('/signup 페이지에 회원가입 폼이 표시된다', async ({ page }) => {
    await page.goto('/signup')
    // 회원가입 페이지에 이메일/비밀번호 입력 필드가 있어야 함
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]').first()).toBeVisible()
  })

  test('/signup 페이지에 로그인 링크가 존재한다', async ({ page }) => {
    await page.goto('/signup')
    // "이미 계정이 있으신가요?" 텍스트와 /login 링크가 있어야 함
    // getByRole('link')로 <a href="/login"> 만 정확히 지정
    const loginLink = page.getByRole('link', { name: '로그인' })
    await expect(loginLink).toBeVisible()
    await expect(loginLink).toHaveAttribute('href', '/login')
  })
})
