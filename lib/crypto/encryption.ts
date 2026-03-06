import CryptoJS from 'crypto-js'

const ITERATIONS = 100000

// 신규 암호문 포맷 식별자 (Web Crypto AES-GCM)
const V2_PREFIX = 'v2:'

// ─── 레거시 (crypto-js) ── 기존 데이터 읽기 전용, 마이그레이션 완료 후 제거 예정 ───

/**
 * 레거시 PBKDF2 키 파생 (crypto-js). 기존 암호화 데이터 복호화용.
 * PIN 검증 시 legacyKey로 sessionStorage에 저장하고, 새 데이터 작성 시에는 사용하지 않는다.
 */
export function legacyDeriveKey(pin: string, salt: string): string {
  return CryptoJS.PBKDF2(pin, salt, {
    keySize: 256 / 32,
    iterations: ITERATIONS,
    hasher: CryptoJS.algo.SHA256,
  }).toString()
}

function legacyDecryptInternal(ciphertext: string, hexKey: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, hexKey)
    const result = bytes.toString(CryptoJS.enc.Utf8)
    if (!result) throw new Error()
    return result
  } catch {
    throw new Error('복호화에 실패했습니다. PIN을 다시 입력하거나 앱을 재시작해주세요.')
  }
}

// ─── Web Crypto API ───────────────────────────────────────────────────────────

/**
 * Web Crypto API PBKDF2-SHA256으로 AES-256-GCM 키를 파생한다.
 * @returns base64 인코딩된 256비트 raw 키 (sessionStorage 저장용)
 */
export async function deriveKey(pin: string, salt: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: encoder.encode(salt), iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  )
  const raw = await crypto.subtle.exportKey('raw', key)
  return btoa(String.fromCharCode(...new Uint8Array(raw)))
}

/**
 * AES-256-GCM으로 암호화한다. 랜덤 12바이트 IV 사용.
 * @param keyBase64 - deriveKey()가 반환한 base64 키
 * @returns "v2:<base64(12-byte IV + ciphertext + 16-byte auth tag)>"
 */
export async function encrypt(plaintext: string, keyBase64: string): Promise<string> {
  const keyBytes = Uint8Array.from(atob(keyBase64), (c) => c.charCodeAt(0))
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt'],
  )
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext),
  )
  const combined = new Uint8Array(12 + ciphertext.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(ciphertext), 12)
  return V2_PREFIX + btoa(String.fromCharCode(...combined))
}

/**
 * v2 형식(Web Crypto AES-GCM)과 레거시 형식(crypto-js AES)을 모두 복호화한다.
 * @param keyBase64 - 신규 base64 키 (v2 형식용)
 * @param legacyKey - 레거시 hex 키 (구버전 데이터용, 마이그레이션 완료 후 불필요)
 */
export async function decrypt(
  ciphertext: string,
  keyBase64: string,
  legacyKey?: string,
): Promise<string> {
  if (ciphertext.startsWith(V2_PREFIX)) {
    return decryptV2(ciphertext.slice(V2_PREFIX.length), keyBase64)
  }
  if (!legacyKey) {
    throw new Error('복호화에 실패했습니다. PIN을 다시 입력하거나 앱을 재시작해주세요.')
  }
  return legacyDecryptInternal(ciphertext, legacyKey)
}

async function decryptV2(base64Data: string, keyBase64: string): Promise<string> {
  const combined = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0))
  const iv = combined.slice(0, 12)
  const ciphertext = combined.slice(12)
  const keyBytes = Uint8Array.from(atob(keyBase64), (c) => c.charCodeAt(0))
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  )
  try {
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
    return new TextDecoder().decode(plaintext)
  } catch {
    throw new Error('복호화에 실패했습니다. PIN을 다시 입력하거나 앱을 재시작해주세요.')
  }
}
