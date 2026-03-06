/**
 * lib/crypto/encryption.ts 단위 테스트
 * 테스트 대상: deriveKey (Web Crypto), encrypt, decrypt, legacyDeriveKey
 * 커버 범위: 키 파생 일관성, 암복호화 왕복, 잘못된 키, 레거시 형식 호환, 엣지케이스
 */
import { describe, it, expect } from 'vitest'
import { deriveKey, legacyDeriveKey, encrypt, decrypt } from '@/lib/crypto/encryption'

const TEST_PIN = '123456'
const TEST_SALT = 'test-salt-value-abc'

// ─────────────────────────────────────────────
// deriveKey (Web Crypto)
// ─────────────────────────────────────────────
describe('deriveKey (Web Crypto)', () => {
  it('같은 PIN과 salt로 두 번 호출하면 항상 같은 키를 반환한다 (일관성)', async () => {
    const key1 = await deriveKey(TEST_PIN, TEST_SALT)
    const key2 = await deriveKey(TEST_PIN, TEST_SALT)
    expect(key1).toBe(key2)
  })

  it('다른 PIN을 사용하면 다른 키를 반환한다', async () => {
    const key1 = await deriveKey('111111', TEST_SALT)
    const key2 = await deriveKey('222222', TEST_SALT)
    expect(key1).not.toBe(key2)
  })

  it('다른 salt를 사용하면 다른 키를 반환한다', async () => {
    const key1 = await deriveKey(TEST_PIN, 'salt-a')
    const key2 = await deriveKey(TEST_PIN, 'salt-b')
    expect(key1).not.toBe(key2)
  })

  it('파생된 키는 base64 문자열이다', async () => {
    const key = await deriveKey(TEST_PIN, TEST_SALT)
    expect(() => atob(key)).not.toThrow()
    // 256비트 = 32바이트 → base64 44자
    expect(atob(key).length).toBe(32)
  })

  it('레거시 hex 키와 다른 포맷이다', async () => {
    const newKey = await deriveKey(TEST_PIN, TEST_SALT)
    const legacyKey = legacyDeriveKey(TEST_PIN, TEST_SALT)
    // 레거시는 hex, 신규는 base64 — 값이 달라야 한다
    expect(newKey).not.toBe(legacyKey)
  })
})

// ─────────────────────────────────────────────
// legacyDeriveKey (crypto-js, 하위 호환)
// ─────────────────────────────────────────────
describe('legacyDeriveKey', () => {
  it('같은 PIN과 salt로 항상 같은 hex 키를 반환한다', () => {
    const key1 = legacyDeriveKey(TEST_PIN, TEST_SALT)
    const key2 = legacyDeriveKey(TEST_PIN, TEST_SALT)
    expect(key1).toBe(key2)
  })

  it('파생된 키는 16진수 문자열이다', () => {
    const key = legacyDeriveKey(TEST_PIN, TEST_SALT)
    expect(key).toMatch(/^[0-9a-f]+$/)
  })
})

// ─────────────────────────────────────────────
// encrypt / decrypt 왕복 검증 (Web Crypto v2)
// ─────────────────────────────────────────────
describe('encrypt / decrypt 왕복 (v2 형식)', () => {
  it('암호화 후 복호화하면 원문을 그대로 복원한다', async () => {
    const key = await deriveKey(TEST_PIN, TEST_SALT)
    const plaintext = '안녕하세요, 비밀 메모입니다.'
    const ciphertext = await encrypt(plaintext, key)
    expect(await decrypt(ciphertext, key)).toBe(plaintext)
  })

  it('영문 텍스트도 암복호화 왕복이 가능하다', async () => {
    const key = await deriveKey(TEST_PIN, TEST_SALT)
    const plaintext = 'Hello, Secret Note!'
    expect(await decrypt(await encrypt(plaintext, key), key)).toBe(plaintext)
  })

  it('암호화 결과는 "v2:" 접두사를 가진다', async () => {
    const key = await deriveKey(TEST_PIN, TEST_SALT)
    const ciphertext = await encrypt('test', key)
    expect(ciphertext.startsWith('v2:')).toBe(true)
  })

  it('암호화 결과는 원문과 다른 문자열이다', async () => {
    const key = await deriveKey(TEST_PIN, TEST_SALT)
    const plaintext = 'test data'
    const ciphertext = await encrypt(plaintext, key)
    expect(ciphertext).not.toBe(plaintext)
  })

  it('같은 원문을 두 번 암호화하면 서로 다른 암호문이 생성된다 (랜덤 IV)', async () => {
    const key = await deriveKey(TEST_PIN, TEST_SALT)
    const plaintext = '동일한 텍스트'
    const ciphertext1 = await encrypt(plaintext, key)
    const ciphertext2 = await encrypt(plaintext, key)
    expect(ciphertext1).not.toBe(ciphertext2)
  })
})

// ─────────────────────────────────────────────
// 다른 키로 복호화
// ─────────────────────────────────────────────
describe('다른 키로 복호화', () => {
  it('잘못된 키로 v2 복호화하면 오류를 던진다', async () => {
    const correctKey = await deriveKey(TEST_PIN, TEST_SALT)
    const wrongKey = await deriveKey('999999', TEST_SALT)
    const ciphertext = await encrypt('비밀 데이터', correctKey)
    await expect(decrypt(ciphertext, wrongKey)).rejects.toThrow()
  })

  it('잘못된 키로 복호화하면 복호화 실패 메시지가 포함된 오류를 던진다', async () => {
    const correctKey = await deriveKey(TEST_PIN, TEST_SALT)
    const wrongKey = await deriveKey('000000', 'wrong-salt')
    const ciphertext = await encrypt('중요한 정보', correctKey)
    await expect(decrypt(ciphertext, wrongKey)).rejects.toThrow('복호화에 실패했습니다')
  })
})

// ─────────────────────────────────────────────
// 레거시 형식 복호화 호환성
// ─────────────────────────────────────────────
describe('레거시 형식 (crypto-js) 복호화 호환', () => {
  it('legacyKey 없이 레거시 암호문을 복호화하면 오류를 던진다', async () => {
    const newKey = await deriveKey(TEST_PIN, TEST_SALT)
    // 레거시 형식은 "v2:" 접두사가 없는 문자열
    const fakeLegacyCiphertext = 'U2FsdGVkX1+abc123fakedata'
    await expect(decrypt(fakeLegacyCiphertext, newKey)).rejects.toThrow('복호화에 실패했습니다')
  })
})

// ─────────────────────────────────────────────
// 빈 문자열 엣지케이스
// ─────────────────────────────────────────────
describe('빈 문자열 엣지케이스', () => {
  it('빈 문자열 암호화는 성공하고 v2 접두사를 가진 암호문을 반환한다', async () => {
    const key = await deriveKey(TEST_PIN, TEST_SALT)
    const ciphertext = await encrypt('', key)
    expect(ciphertext.startsWith('v2:')).toBe(true)
  })

  it('빈 문자열을 암호화 후 복호화하면 빈 문자열을 반환한다', async () => {
    const key = await deriveKey(TEST_PIN, TEST_SALT)
    const ciphertext = await encrypt('', key)
    expect(await decrypt(ciphertext, key)).toBe('')
  })

  it('빈 PIN으로 키를 파생해도 일관된 결과를 반환한다', async () => {
    const key1 = await deriveKey('', TEST_SALT)
    const key2 = await deriveKey('', TEST_SALT)
    expect(key1).toBe(key2)
  })
})

// ─────────────────────────────────────────────
// 특수문자 포함 텍스트 암복호화
// ─────────────────────────────────────────────
describe('특수문자 포함 텍스트 암복호화', () => {
  it('이모지 포함 텍스트도 왕복 검증이 통과한다', async () => {
    const key = await deriveKey(TEST_PIN, TEST_SALT)
    const plaintext = '오늘 기분 😊 최고! 🎉'
    expect(await decrypt(await encrypt(plaintext, key), key)).toBe(plaintext)
  })

  it('JSON 문자열도 왕복 검증이 통과한다', async () => {
    const key = await deriveKey(TEST_PIN, TEST_SALT)
    const plaintext = JSON.stringify({ name: '홍길동', secret: 'abc123!@#' })
    expect(await decrypt(await encrypt(plaintext, key), key)).toBe(plaintext)
  })

  it('특수문자가 포함된 텍스트도 왕복 검증이 통과한다', async () => {
    const key = await deriveKey(TEST_PIN, TEST_SALT)
    const plaintext = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/\\`~'
    expect(await decrypt(await encrypt(plaintext, key), key)).toBe(plaintext)
  })

  it('긴 텍스트도 왕복 검증이 통과한다', async () => {
    const key = await deriveKey(TEST_PIN, TEST_SALT)
    const plaintext = '가'.repeat(1000)
    expect(await decrypt(await encrypt(plaintext, key), key)).toBe(plaintext)
  })
})
