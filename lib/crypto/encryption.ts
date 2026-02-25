import CryptoJS from 'crypto-js'

const ITERATIONS = 100000

/**
 * PBKDF2로 암호화 키를 파생한다.
 * @param pin - 사용자 PIN 문자열
 * @param salt - bcrypt genSalt에서 받은 salt 문자열
 */
export function deriveKey(pin: string, salt: string): string {
  const key = CryptoJS.PBKDF2(pin, salt, {
    keySize: 256 / 32,
    iterations: ITERATIONS,
    hasher: CryptoJS.algo.SHA256,
  })
  return key.toString()
}

export function encrypt(plaintext: string, key: string): string {
  return CryptoJS.AES.encrypt(plaintext, key).toString()
}

export function decrypt(ciphertext: string, key: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, key)
    const result = bytes.toString(CryptoJS.enc.Utf8)
    if (!result) throw new Error()
    return result
  } catch {
    throw new Error('복호화에 실패했습니다. PIN을 다시 입력하거나 앱을 재시작해주세요.')
  }
}
