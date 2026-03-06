/**
 * 레거시 암호화 키(enc_key_legacy) 자동 정리 유틸리티
 *
 * PIN 검증 성공 후 백그라운드에서 실행:
 * 1. 사용자의 일기/인간관계 데이터에 레거시 포맷(v2: 미접두)이 없으면
 * 2. sessionStorage에서 enc_key_legacy를 제거한다
 *
 * lazy migration 완료 감지를 위한 경량 체크 — 네트워크 오류 시 조용히 건너뜀
 */

import { PIN_ENC_KEY_LEGACY } from '@/lib/constants/pin-storage-keys'

const LEGACY_CLEAN_FLAG = 'enc_legacy_cleaned'

/** 암호화된 값이 v2 포맷(Web Crypto AES-GCM)인지 확인 */
function isV2Format(value: string): boolean {
  return value.startsWith('v2:')
}

/** 일기 데이터에 레거시 포맷이 남아있는지 확인 */
async function hasLegacyDiaries(): Promise<boolean> {
  try {
    const res = await fetch('/api/diaries/all-encrypted', { method: 'GET' })
    if (!res.ok) return true // 확인 불가 시 안전하게 유지
    const json = await res.json() as { data?: { content_encrypted: string }[] }
    return (json.data ?? []).some((d) => !isV2Format(d.content_encrypted))
  } catch {
    return true // 네트워크 오류 시 안전하게 유지
  }
}

/** 인간관계 메모에 레거시 포맷이 남아있는지 확인 */
async function hasLegacyRelations(): Promise<boolean> {
  try {
    // /api/relations는 이미 memo_encrypted 컬럼을 반환하므로 재사용
    const res = await fetch('/api/relations', { method: 'GET' })
    if (!res.ok) return true
    const json = await res.json() as { data?: { memo_encrypted: string | null }[] }
    return (json.data ?? []).some(
      (r) => r.memo_encrypted != null && !isV2Format(r.memo_encrypted),
    )
  } catch {
    return true
  }
}

/**
 * 모든 암호화 데이터가 v2 포맷인지 확인 후 레거시 키 정리
 *
 * - 이미 정리된 경우(localStorage 플래그 존재) 즉시 반환
 * - 레거시 키가 없으면 즉시 반환
 * - 비동기 백그라운드 실행 — await 불필요
 */
export async function cleanupLegacyKeyIfMigrated(): Promise<void> {
  // 이미 정리 완료된 경우
  if (localStorage.getItem(LEGACY_CLEAN_FLAG) === 'true') {
    sessionStorage.removeItem(PIN_ENC_KEY_LEGACY)
    return
  }

  // 레거시 키가 없으면 스킵
  if (!sessionStorage.getItem(PIN_ENC_KEY_LEGACY)) return

  // 데이터 확인 (병렬)
  const [diaryLegacy, relationLegacy] = await Promise.all([
    hasLegacyDiaries(),
    hasLegacyRelations(),
  ])

  if (!diaryLegacy && !relationLegacy) {
    // 모든 데이터가 v2 포맷 → 레거시 키 제거 + 플래그 저장
    sessionStorage.removeItem(PIN_ENC_KEY_LEGACY)
    localStorage.setItem(LEGACY_CLEAN_FLAG, 'true')
  }
}
