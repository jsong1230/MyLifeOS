# Changelog

## [미정] - 2026-02-24

### Added
- **i18n Phase 1-6: 영문 지원 + 다중 통화 (KRW/CAD/USD) 전체 구현 완성**
  - `next-intl` 쿠키 기반 설정 (URL 변경 없는 언어 전환)
  - `lib/currency.ts`: KRW/CAD/USD 통합 포맷 유틸 (`formatCurrency`, `formatCurrencyCompact`, `parseAmountInput` 등)
  - `lib/api-errors.ts`: API 에러 코드 상수 + `apiError()` 헬퍼
  - `app/api/settings/route.ts`: 사용자 설정 GET/PATCH API (locale 변경 시 쿠키 동기화)
  - `hooks/use-settings.ts`: React Query 기반 설정 훅
  - `hooks/use-api-error.ts`: 클라이언트 에러 번역 훅
  - `store/settings.store.ts`: Zustand 언어/통화 전역 상태
  - `types/settings.ts`: `UserSettings` 타입 (locale, default_currency)
  - `components/common/currency-select.tsx`: 재사용 통화 셀렉터 컴포넌트
  - `docs/migrations/009_user_settings_currency.sql`: user_settings 테이블 + currency 컬럼 추가
  - 설정 페이지: 언어(한국어/English) + 기본 통화(KRW/CAD/USD) 선택 UI
  - messages/ko.json, messages/en.json: ~500개 번역 키 (Phase 3-6 적용)
  - 금전/리포트/사적기록/설정 컴포넌트 7개 번역 키 적용 완료

---

## Phase 1-6 이전 완료 기능 (F-01~F-33)

모든 기능 구현 완료 — 상세 이력은 git log 참조.
