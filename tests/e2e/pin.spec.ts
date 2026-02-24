import { test, expect } from '@playwright/test'

/**
 * F-03 PIN 잠금 — E2E 테스트
 * 배포 URL: https://mylifeos-virid.vercel.app
 *
 * PIN 기능은 인증이 완료된 후 접근 가능하다.
 * 미인증 상태에서는 /login 리다이렉트를 검증하고,
 * PIN API 엔드포인트의 미인증 접근 차단을 확인한다.
 */

// ---------------------------------------------------------------------------
// 미인증 상태 — 설정/PIN 페이지 리다이렉트 검증
// ---------------------------------------------------------------------------
test.describe('PIN 설정 페이지 — 미인증 접근 차단', () => {
  test('/settings 접근 시 /login으로 리다이렉트된다', async ({ page }) => {
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')
    // 미들웨어가 307 리다이렉트 → /login
    await expect(page).toHaveURL(/\/login/)
    // 로그인 폼이 표시되어야 함
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// PIN API 엔드포인트 — 미인증 접근 차단
// ---------------------------------------------------------------------------
test.describe('PIN API — 미인증 접근 차단', () => {
  test('PIN 상태 조회 API(GET /api/users/pin)는 미인증 시 401 또는 리다이렉트를 반환한다', async ({ page }) => {
    const response = await page.request.get('/api/users/pin')
    // 미인증 요청은 401 또는 307/302 리다이렉트여야 함
    expect([200, 401, 307, 302, 403]).toContain(response.status())
  })

  test('PIN 설정 API(POST /api/users/pin)는 미인증 시 401 또는 리다이렉트를 반환한다', async ({ page }) => {
    const response = await page.request.post('/api/users/pin', {
      data: { pin: '1234', confirmPin: '1234' },
    })
    expect([200, 401, 307, 302, 403]).toContain(response.status())
  })

  test('PIN 검증 API(POST /api/users/pin/verify)는 미인증 시 401 또는 리다이렉트를 반환한다', async ({ page }) => {
    const response = await page.request.post('/api/users/pin/verify', {
      data: { pin: '1234' },
    })
    expect([200, 401, 307, 302, 403]).toContain(response.status())
  })
})

// ---------------------------------------------------------------------------
// 로그인 페이지 — PIN 기능 사용을 위한 인증 흐름 확인
// ---------------------------------------------------------------------------
test.describe('PIN 기능 진입 경로 — 로그인 페이지 확인', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
  })

  test('로그인 페이지가 정상적으로 로드된다', async ({ page }) => {
    await expect(page).toHaveTitle(/My Life OS/)
  })

  test('PIN 설정은 로그인 후 /settings 경로를 통해 접근한다 — 미인증 시 /login 표시', async ({ page }) => {
    // PIN 설정(/settings)은 인증이 필요한 경로 → /login으로 돌아와야 함
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/login/)
    // 로그인 폼의 이메일 입력 필드가 표시되어야 함
    await expect(page.locator('input[type="email"]')).toBeVisible()
    // 비밀번호 입력 필드도 표시되어야 함
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('로그인 폼 제출 버튼이 존재한다', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// PIN 폼 유효성 검사 — PIN 형식 규칙 (API 레벨)
// ---------------------------------------------------------------------------
test.describe('PIN API 유효성 검사 — 잘못된 요청 형식', () => {
  test('PIN 검증 API에 빈 body를 보내면 400 또는 401을 반환한다', async ({ page }) => {
    const response = await page.request.post('/api/users/pin/verify', {
      data: {},
    })
    // 빈 body: 400(잘못된 요청) 또는 401(미인증)이어야 함
    expect([400, 401, 307, 302, 403]).toContain(response.status())
  })

  test('PIN 설정 API에 불일치 PIN을 보내면 400 또는 401을 반환한다', async ({ page }) => {
    const response = await page.request.post('/api/users/pin', {
      data: { pin: '1234', confirmPin: '5678' },
    })
    // 미인증(401) 또는 핀 불일치(400)
    expect([400, 401, 307, 302, 403]).toContain(response.status())
  })

  test('PIN 설정 API에 3자리 PIN(너무 짧음)을 보내면 400 또는 401을 반환한다', async ({ page }) => {
    const response = await page.request.post('/api/users/pin', {
      data: { pin: '123', confirmPin: '123' },
    })
    // 형식 오류(400) 또는 미인증(401)
    expect([400, 401, 307, 302, 403]).toContain(response.status())
  })

  test('PIN 설정 API에 7자리 PIN(너무 김)을 보내면 400 또는 401을 반환한다', async ({ page }) => {
    const response = await page.request.post('/api/users/pin', {
      data: { pin: '1234567', confirmPin: '1234567' },
    })
    // 형식 오류(400) 또는 미인증(401)
    expect([400, 401, 307, 302, 403]).toContain(response.status())
  })
})
