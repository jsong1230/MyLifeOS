/** PIN 관련 스토리지 키 상수 */

/** PBKDF2 salt — localStorage에 영속 저장 (기기 간 이동 시 서버 enc_salt로 대체) */
export const PIN_ENC_SALT = 'pin_enc_salt'

/** 파생된 AES 암호화 키 — sessionStorage에 임시 저장 */
export const PIN_ENC_KEY = 'enc_key'

/** 사적 모듈 PIN 인증 세션 플래그 — sessionStorage */
export const PRIVATE_PIN_VERIFIED = 'private_pin_verified'
