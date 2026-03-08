# iCal 캘린더 토큰 인증 구현 계획

## 배경 / 문제

현재 `/api/time/calendar/ical` 엔드포인트는 Supabase 세션 쿠키(`getUser()`)로 인증한다.
Google Calendar가 URL을 구독할 때는 **Google 서버**가 직접 HTTP 요청을 보내므로 사용자 브라우저 쿠키가 없고,
결과적으로 `AUTH_REQUIRED(401)` 가 반환되어 구독이 불가능하다.

## 해결 방법: 사용자별 캘린더 전용 토큰

```
구독 URL: /api/time/calendar/ical?token=<256-bit-hex-token>
```

- 토큰은 사용자별 1개, DB에 저장
- Google/Apple 서버는 URL만 알면 해당 사용자 데이터를 fetch
- 토큰 재발급 시 기존 구독 URL은 자동 만료 (보안 대응)

---

## 작업 목록

### T-01. Migration 034 — `user_settings.calendar_token` 컬럼 추가

**파일:** `supabase/migrations/20260308000034_calendar_token.sql`

```sql
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS calendar_token TEXT UNIQUE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_settings_calendar_token
  ON public.user_settings(calendar_token)
  WHERE calendar_token IS NOT NULL;
```

- `UNIQUE` 인덱스: 토큰으로 user 역조회 O(1)
- `WHERE NOT NULL` 부분 인덱스: NULL 행 제외

---

### T-02. API — 토큰 관리 Route Handler

**파일:** `app/api/users/calendar-token/route.ts`

#### `GET` — 현재 토큰 조회 (없으면 자동 발급)

```
Response: { success: true, data: { token: string, url: string } }
```

- `user_settings.calendar_token` 조회
- NULL이면 `crypto.randomUUID()` 기반 토큰 생성 후 upsert

#### `POST` — 토큰 재발급

```
Response: { success: true, data: { token: string, url: string } }
```

- 새 토큰 생성 → upsert
- 기존 구독 URL은 즉시 무효화됨

---

### T-03. iCal 엔드포인트 수정

**파일:** `app/api/time/calendar/ical/route.ts`

현재 인증 흐름:
```
getUser() → userId  (세션 쿠키 필요)
```

변경 후:
```
?token 파라미터 → user_settings 조회 → user_id  (쿠키 불필요)
```

**수정 내용:**

1. `request: NextRequest` 파라미터 추가
2. `searchParams.get('token')` 으로 토큰 추출
3. 토큰 없으면 → `AUTH_REQUIRED(401)`
4. `user_settings WHERE calendar_token = ?` 로 userId 조회
5. 기존 todos/routines/time_blocks 쿼리는 그대로 유지

---

### T-04. UI 컴포넌트 수정

**파일:** `components/settings/ical-export.tsx`

현재: 정적 URL 문자열 복사
변경 후:
- 마운트 시 `GET /api/users/calendar-token` 호출 → 토큰 포함 URL 수신
- URL 표시 + 복사 버튼
- "URL 재발급" 버튼 (재발급 확인 AlertDialog 포함)
- 로딩/에러 상태 처리

**UI 레이아웃:**

```
[캘린더 구독 URL]
https://…/api/time/calendar/ical?token=abc123...  [복사]
                                                   [URL 재발급]
⚠️ 재발급 시 기존 URL은 더 이상 작동하지 않습니다
```

---

### T-05. 번역 키 추가

**파일:** `messages/ko.json`, `messages/en.json`

| 키 | 한국어 | 영어 |
|---|---|---|
| `settings.ical_token_url_label` | 구독 URL | Subscription URL |
| `settings.ical_regenerate` | URL 재발급 | Regenerate URL |
| `settings.ical_regenerate_confirm_title` | URL을 재발급할까요? | Regenerate URL? |
| `settings.ical_regenerate_confirm_desc` | 기존 구독 URL은 즉시 만료됩니다. Google Calendar 등에서 새 URL로 다시 구독해야 합니다. | The current subscription URL will be invalidated. You'll need to re-subscribe in Google Calendar with the new URL. |
| `settings.ical_token_loading` | URL 불러오는 중... | Loading URL... |
| `settings.ical_token_error` | URL 불러오기 실패 | Failed to load URL |

---

## 작업 순서

```
T-01 (Migration) → T-02 (API: 토큰 관리) → T-03 (iCal 엔드포인트) → T-04 (UI) → T-05 (번역)
```

- T-02, T-03은 독립적이므로 병렬 구현 가능
- T-04는 T-02 API 완료 후 작업
- Migration은 먼저 로컬 생성 → 구현 완료 후 `supabase db push`

---

## 보안 고려사항

| 항목 | 내용 |
|---|---|
| 토큰 길이 | `crypto.randomUUID()` = 128bit UUID (충분한 엔트로피) |
| 전송 보안 | HTTPS 전용 (Vercel 배포 = 기본 HTTPS) |
| 토큰 노출 범위 | 설정 페이지에서만 확인 가능 (로그인 필요) |
| 재발급 | 사용자가 언제든 재발급 가능 → 구버전 URL 즉시 무효화 |
| DB | `calendar_token UNIQUE` 인덱스 → 충돌 불가 |
| 민감 데이터 | iCal에는 할일/루틴/타임블록 제목만 포함 (금액/일기 등 민감정보 없음) |

---

## 영향 범위

| 파일 | 변경 유형 |
|---|---|
| `supabase/migrations/20260308000034_calendar_token.sql` | 신규 |
| `app/api/users/calendar-token/route.ts` | 신규 |
| `app/api/time/calendar/ical/route.ts` | 수정 (인증 방식 교체) |
| `components/settings/ical-export.tsx` | 수정 (토큰 로드 + 재발급 UI) |
| `messages/ko.json` | 수정 (6개 키 추가) |
| `messages/en.json` | 수정 (6개 키 추가) |

수정 없는 파일: `settings/page.tsx` (ICalExport 컴포넌트 임포트 그대로 유지)

---

## 완료 기준 (Definition of Done)

- [ ] `supabase db push` 후 `user_settings.calendar_token` 컬럼 존재 확인
- [ ] 설정 페이지에서 토큰 포함 URL 표시됨
- [ ] URL 복사 후 브라우저 새 탭에서 열면 `.ics` 다운로드됨 (세션 없이도)
- [ ] URL 재발급 후 이전 URL로 접근 시 401 반환
- [ ] Google Calendar "URL로 구독" 에 붙여넣기 → 캘린더 이벤트 정상 표시
- [ ] ko/en 번역 키 누락 없음, 타입 체크 0 오류
