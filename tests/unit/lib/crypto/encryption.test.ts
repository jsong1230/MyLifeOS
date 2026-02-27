/**
 * lib/crypto/encryption.ts 단위 테스트
 * 테스트 대상: deriveKey, encrypt, decrypt
 * 커버 범위: 키 파생 일관성, 암복호화 왕복, 잘못된 키, 엣지케이스
 */
import { describe, it, expect } from 'vitest'
import { deriveKey, encrypt, decrypt } from '@/lib/crypto/encryption'

const TEST_PIN = '123456'
const TEST_SALT = 'test-salt-value-abc'

// ─────────────────────────────────────────────
// deriveKey
// ─────────────────────────────────────────────
describe('deriveKey', () => {
  it('같은 PIN과 salt로 두 번 호출하면 항상 같은 키를 반환한다 (일관성)', () => {
    const key1 = deriveKey(TEST_PIN, TEST_SALT)
    const key2 = deriveKey(TEST_PIN, TEST_SALT)
    expect(key1).toBe(key2)
  })

  it('다른 PIN을 사용하면 다른 키를 반환한다', () => {
    const key1 = deriveKey('111111', TEST_SALT)
    const key2 = deriveKey('222222', TEST_SALT)
    expect(key1).not.toBe(key2)
  })

  it('다른 salt를 사용하면 다른 키를 반환한다', () => {
    const key1 = deriveKey(TEST_PIN, 'salt-a')
    const key2 = deriveKey(TEST_PIN, 'salt-b')
    expect(key1).not.toBe(key2)
  })

  it('파생된 키는 16진수 문자열 형태이다', () => {
    const key = deriveKey(TEST_PIN, TEST_SALT)
    expect(key).toMatch(/^[0-9a-f]+$/)
  })
})

// ─────────────────────────────────────────────
// encrypt / decrypt 왕복 검증
// ─────────────────────────────────────────────
describe('encrypt / decrypt 왕복', () => {
  const key = deriveKey(TEST_PIN, TEST_SALT)

  it('암호화 후 복호화하면 원문을 그대로 복원한다', () => {
    const plaintext = '안녕하세요, 비밀 메모입니다.'
    const ciphertext = encrypt(plaintext, key)
    expect(decrypt(ciphertext, key)).toBe(plaintext)
  })

  it('영문 텍스트도 암복호화 왕복이 가능하다', () => {
    const plaintext = 'Hello, Secret Note!'
    expect(decrypt(encrypt(plaintext, key), key)).toBe(plaintext)
  })

  it('암호화 결과는 원문과 다른 문자열이다', () => {
    const plaintext = 'test data'
    const ciphertext = encrypt(plaintext, key)
    expect(ciphertext).not.toBe(plaintext)
  })

  it('같은 원문을 두 번 암호화하면 서로 다른 암호문이 생성된다 (랜덤 IV)', () => {
    const plaintext = '동일한 텍스트'
    const ciphertext1 = encrypt(plaintext, key)
    const ciphertext2 = encrypt(plaintext, key)
    expect(ciphertext1).not.toBe(ciphertext2)
  })
})

// ─────────────────────────────────────────────
// 다른 키로 복호화
// ─────────────────────────────────────────────
describe('다른 키로 복호화', () => {
  it('잘못된 키로 복호화하면 오류를 던진다', () => {
    const correctKey = deriveKey(TEST_PIN, TEST_SALT)
    const wrongKey = deriveKey('999999', TEST_SALT)
    const ciphertext = encrypt('비밀 데이터', correctKey)
    expect(() => decrypt(ciphertext, wrongKey)).toThrow()
  })

  it('잘못된 키로 복호화하면 복호화 실패 메시지가 포함된 오류를 던진다', () => {
    const correctKey = deriveKey(TEST_PIN, TEST_SALT)
    const wrongKey = deriveKey('000000', 'wrong-salt')
    const ciphertext = encrypt('중요한 정보', correctKey)
    expect(() => decrypt(ciphertext, wrongKey)).toThrow('복호화에 실패했습니다')
  })
})

// ─────────────────────────────────────────────
// 빈 문자열 엣지케이스
// ─────────────────────────────────────────────
describe('빈 문자열 엣지케이스', () => {
  const key = deriveKey(TEST_PIN, TEST_SALT)

  it('빈 문자열 암호화는 성공하고 비어있지 않은 암호문을 반환한다', () => {
    const ciphertext = encrypt('', key)
    expect(ciphertext).toBeTruthy()
  })

  it('빈 문자열을 암호화 후 복호화하면 오류를 던진다 (빈 결과는 실패로 처리)', () => {
    const ciphertext = encrypt('', key)
    expect(() => decrypt(ciphertext, key)).toThrow()
  })

  it('빈 PIN으로 키를 파생해도 일관된 결과를 반환한다', () => {
    const key1 = deriveKey('', TEST_SALT)
    const key2 = deriveKey('', TEST_SALT)
    expect(key1).toBe(key2)
  })
})

// ─────────────────────────────────────────────
// 특수문자 포함 텍스트 암복호화
// ─────────────────────────────────────────────
describe('특수문자 포함 텍스트 암복호화', () => {
  const key = deriveKey(TEST_PIN, TEST_SALT)

  it('이모지 포함 텍스트도 왕복 검증이 통과한다', () => {
    const plaintext = '오늘 기분 😊 최고! 🎉'
    expect(decrypt(encrypt(plaintext, key), key)).toBe(plaintext)
  })

  it('JSON 문자열도 왕복 검증이 통과한다', () => {
    const plaintext = JSON.stringify({ name: '홍길동', secret: 'abc123!@#' })
    expect(decrypt(encrypt(plaintext, key), key)).toBe(plaintext)
  })

  it('특수문자가 포함된 텍스트도 왕복 검증이 통과한다', () => {
    const plaintext = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/\\`~'
    expect(decrypt(encrypt(plaintext, key), key)).toBe(plaintext)
  })

  it('긴 텍스트도 왕복 검증이 통과한다', () => {
    const plaintext = '가'.repeat(1000)
    expect(decrypt(encrypt(plaintext, key), key)).toBe(plaintext)
  })
})
