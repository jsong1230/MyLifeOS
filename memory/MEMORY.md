# MyLifeOS 프로젝트 메모리

## 사용자 워크플로우 선호
- **작업 완료 후 항상 다음 작업 리스트업**: 작업이 끝날 때마다 추가적으로 필요한 작업들을 자동으로 정리해서 보여줄 것

## 프로젝트 상태 (2026-02-25)
- F-01~F-33 전체 기능 구현 완료
- Wave 1~3 품질 개선 완료 (i18n, API 표준화, 보안 수정)
- Vercel 배포 완료

## 성능 개선 이력
- Wave 4 (오늘): 대시보드 API 통합 + React Query 최적화 + Skeleton UI + lazy load
  - `/api/dashboard/summary` — 5개 → 1개 요청
  - `hooks/use-dashboard-summary.ts` — 4카드 공유 쿼리
  - `staleTime` 5분 / `gcTime` 10분
  - `loading.tsx` 4개 (money, health, time, private)
  - Recharts `next/dynamic` lazy load (5개 페이지)

## 잔여 작업 목록 (우선순위 순)
### 완료
- [x] ③ 미들웨어 인증 최적화: middleware.ts에서 x-user-id 헤더 주입, 45개 route getUser() 제거
  - exchange-rates는 인증 불필요라 미수정
  - users/pin POST는 user.email/user_metadata 사용으로 getUser() 유지
- [x] ④ error.tsx 추가 (money, health, time, private 4개)

### 중기 (신규 기능 — CLAUDE.md 로드맵)
- [ ] ⑤ AI 인사이트 (지출/운동/수면 패턴 분석 카드)
- [ ] ⑥ PWA 푸시 알림 (Service Worker + Web Push)
- [ ] ⑦ 투자 트래킹 (주식/코인 자산 연동)
- [ ] ⑧ 장기 목표 관리 (목표 설정 + 진행률 추적)
