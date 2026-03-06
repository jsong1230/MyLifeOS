/** PIN 관련 스토리지 키 상수 */

/** PBKDF2 salt — localStorage에 영속 저장 (기기 간 이동 시 서버 enc_salt로 대체) */
export const PIN_ENC_SALT = 'pin_enc_salt'

/** Web Crypto AES-GCM 파생 키 (base64) — sessionStorage에 임시 저장 */
export const PIN_ENC_KEY = 'enc_key'

/** 레거시 crypto-js PBKDF2 키 (hex) — 기존 데이터 복호화용, 마이그레이션 완료 후 자동 삭제 */
export const PIN_ENC_KEY_LEGACY = 'enc_key_legacy'

/** 사적 모듈 PIN 인증 세션 플래그 — sessionStorage */
export const PRIVATE_PIN_VERIFIED = 'private_pin_verified'
