/**
 * F-01: auth 유효성 검증 단위 테스트
 * 테스트 대상: lib/validators/auth.ts
 * 커버 범위: U-28 ~ U-35, B-01 ~ B-04
 *
 * ※ i18n 리팩토링으로 validator는 에러 코드를 반환 (한국어 문자열 X)
 *    컴포넌트에서 useTranslations('errors.<code>') 로 번역 처리
 */
import { describe, it, expect } from 'vitest'
import {
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  getAuthErrorMessage,
} from '@/lib/validators/auth'

// ─────────────────────────────────────────────
// validateEmail
// ─────────────────────────────────────────────
describe('validateEmail', () => {
  // U-28: 유효한 이메일
  it('유효한 이메일을 통과시킨다', () => {
    expect(validateEmail('user@example.com')).toBeNull()
  })

  // B-01: 경계값 - 최소 유효 이메일
  it('최소 형식 이메일(a@b.c)을 유효로 처리한다', () => {
    expect(validateEmail('a@b.c')).toBeNull()
  })

  // B-02: 경계값 - 특수문자 포함 이메일
  it('플러스(+) 태그가 포함된 이메일을 유효로 처리한다', () => {
    expect(validateEmail('user+tag@example.com')).toBeNull()
  })

  it('빈 이메일에 오류를 반환한다', () => {
    expect(validateEmail('')).toBe('emailRequired')
  })

  // U-29: @ 없는 이메일
  it('@가 없는 이메일에 형식 오류를 반환한다', () => {
    expect(validateEmail('userexample.com')).toBe('emailInvalid')
  })

  // U-30: 도메인 없는 이메일
  it('도메인이 없는 이메일(user@)에 형식 오류를 반환한다', () => {
    expect(validateEmail('user@')).toBe('emailInvalid')
  })

  it('형식이 잘못된 이메일(not-an-email)에 오류를 반환한다', () => {
    expect(validateEmail('not-an-email')).toBe('emailInvalid')
  })
})

// ─────────────────────────────────────────────
// validatePassword
// ─────────────────────────────────────────────
describe('validatePassword', () => {
  // U-31: 유효한 비밀번호
  it('영문+숫자 조합 8자 이상 비밀번호를 통과시킨다', () => {
    expect(validatePassword('MyPass123')).toBeNull()
  })

  // B-03: 경계값 - 정확히 8자
  it('정확히 8자 비밀번호(Abcdefg1)를 유효로 처리한다', () => {
    expect(validatePassword('Abcdefg1')).toBeNull()
  })

  it('빈 비밀번호에 오류를 반환한다', () => {
    expect(validatePassword('')).toBe('passwordRequired')
  })

  // U-32: 7자 미만
  it('7자 비밀번호(Abcdef1)에 8자 미만 오류를 반환한다', () => {
    expect(validatePassword('Abcdef1')).toBe('passwordTooShort')
  })

  // B-04: 경계값 - 7자
  it('7자 비밀번호에 오류를 반환한다', () => {
    expect(validatePassword('short12')).toBe('passwordTooShort')
  })

  it('8자 미만 비밀번호(short)에 오류를 반환한다', () => {
    expect(validatePassword('short')).toBe('passwordTooShort')
  })

  // U-33: 숫자 없는 비밀번호
  it('숫자가 없는 8자 이상 비밀번호에 영문+숫자 조합 오류를 반환한다', () => {
    expect(validatePassword('abcdefgh')).toBe('passwordWeak')
  })

  it('영문이 없는 비밀번호에 영문+숫자 조합 오류를 반환한다', () => {
    expect(validatePassword('12345678')).toBe('passwordWeak')
  })
})

// ─────────────────────────────────────────────
// validateConfirmPassword
// ─────────────────────────────────────────────
describe('validateConfirmPassword', () => {
  it('일치하는 비밀번호를 통과시킨다', () => {
    expect(validateConfirmPassword('password123', 'password123')).toBeNull()
  })

  it('불일치 비밀번호에 오류를 반환한다', () => {
    expect(validateConfirmPassword('password123', 'different')).toBe('passwordMismatch')
  })

  // signup 모드 U-07 대응
  it('abcd1234와 abcd5678이 일치하지 않으면 오류를 반환한다', () => {
    expect(validateConfirmPassword('abcd1234', 'abcd5678')).toBe('passwordMismatch')
  })
})

// ─────────────────────────────────────────────
// getAuthErrorMessage
// ─────────────────────────────────────────────
describe('getAuthErrorMessage', () => {
  // U-34: Supabase 에러 → 에러 코드 변환
  it('"Invalid login credentials" 에러를 에러 코드로 변환한다', () => {
    expect(getAuthErrorMessage('Invalid login credentials')).toBe('INVALID_CREDENTIALS')
  })

  it('"Email not confirmed" 에러를 에러 코드로 변환한다', () => {
    expect(getAuthErrorMessage('Email not confirmed')).toBe('EMAIL_NOT_CONFIRMED')
  })

  it('"User already registered" 에러를 에러 코드로 변환한다', () => {
    expect(getAuthErrorMessage('User already registered')).toBe('USER_EXISTS')
  })

  it('rate limit 에러를 에러 코드로 변환한다', () => {
    expect(
      getAuthErrorMessage(
        'For security purposes, you can only request this once every 60 seconds'
      )
    ).toBe('RATE_LIMIT')
  })

  // U-35: 알 수 없는 에러
  it('알 수 없는 에러에 UNKNOWN 코드를 반환한다', () => {
    expect(getAuthErrorMessage('unknown error xyz')).toBe('UNKNOWN')
  })

  it('빈 문자열 에러에 UNKNOWN 코드를 반환한다', () => {
    expect(getAuthErrorMessage('')).toBe('UNKNOWN')
  })
})
