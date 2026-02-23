# 시스템 설계서

**프로젝트**: My Life OS
**버전**: v1.0
**작성일**: 2026-02-23
**작성자**: system-architect

---

## 1. 아키텍처 개요

### 1.1 시스템 다이어그램

```
+------------------------------------------------------------------+
|                        Client (Browser / PWA)                     |
|                                                                   |
|  +------------------+  +------------------+  +-----------------+  |
|  | Next.js App      |  | Zustand Store    |  | crypto-js       |  |
|  | (App Router)     |  | (auth, pin, ui)  |  | (AES-256)       |  |
|  |                  |  |                  |  | 암호화/복호화   |  |
|  | - Server Comp.   |  +------------------+  +-----------------+  |
|  | - Client Comp.   |                                             |
|  | - Route Handlers |  +------------------+                       |
|  +------------------+  | React Query      |                       |
|           |            | (서버 상태 캐시)  |                       |
|           |            +------------------+                       |
+-----------|------------------------------------------------------|+
            | HTTPS
            v
+------------------------------------------------------------------+
|                     Vercel Edge Network                           |
|  +------------------------------------------------------------+  |
|  | Next.js Route Handlers (/app/api/*)                        |  |
|  |                                                            |  |
|  | - JWT 검증 (Supabase Auth)                                 |  |
|  | - 요청 유효성 검사                                         |  |
|  | - Supabase Client (서버 사이드)                            |  |
|  +------------------------------------------------------------+  |
+-----------|------------------------------------------------------+
            | HTTPS (Supabase SDK)
            v
+------------------------------------------------------------------+
|                        Supabase Platform                          |
|                                                                   |
|  +------------------+  +------------------+  +-----------------+  |
|  | Supabase Auth    |  | PostgreSQL       |  | Storage         |  |
|  | - 이메일 인증    |  | - RLS 적용      |  | (향후 확장)     |  |
|  | - Google OAuth   |  | - 11개 테이블   |  |                 |  |
|  | - JWT 발급       |  | - 인덱스 최적화  |  |                 |  |
|  +------------------+  +------------------+  +-----------------+  |
+------------------------------------------------------------------+
```

### 1.2 레이어 구조

| 레이어 | 기술 | 역할 |
|--------|------|------|
| **Presentation** | Next.js App Router + Tailwind + shadcn/ui | UI 렌더링, 사용자 인터랙션 |
| **State Management** | Zustand (클라이언트) + React Query (서버) | 전역 상태, 서버 데이터 캐시 |
| **Encryption** | crypto-js (AES-256) | 일기/관계 메모 클라이언트 암호화 |
| **API** | Next.js Route Handlers | 서버 사이드 로직, 인증 검증 |
| **Auth** | Supabase Auth | 이메일/OAuth 인증, JWT 세션 |
| **Data** | Supabase PostgreSQL + RLS | 데이터 저장, 행 수준 보안 |

### 1.3 데이터 흐름

**일반 데이터 (할일, 거래, 건강 기록 등)**:
```
사용자 입력 → React Component → React Query mutate
  → Route Handler (JWT 검증) → Supabase Client → PostgreSQL (RLS 필터)
  → 응답 → React Query 캐시 갱신 → UI 업데이트
```

**암호화 데이터 (일기, 관계 메모)**:
```
사용자 입력 → crypto-js AES-256 암호화 (클라이언트)
  → Route Handler → Supabase → PostgreSQL (암호문 저장)
  → 조회 시: PostgreSQL → Route Handler → 클라이언트
  → crypto-js 복호화 → 평문 표시
```

**인증 흐름**:
```
로그인 요청 → Supabase Auth (이메일/OAuth)
  → JWT 발급 → 쿠키 저장 (httpOnly)
  → 이후 요청마다 JWT 자동 첨부 → RLS가 auth.uid() 기반 필터링
```

---

## 2. 디렉토리 구조

```
my-life-os/
├── app/                              # Next.js App Router 페이지
│   ├── layout.tsx                    # 루트 레이아웃 (Providers 래핑)
│   ├── page.tsx                      # 랜딩 페이지 (비로그인 시)
│   ├── manifest.ts                   # PWA manifest 생성 (동적)
│   ├── globals.css                   # 전역 스타일 (Tailwind)
│   │
│   ├── (auth)/                       # 인증 라우트 그룹 (레이아웃 공유)
│   │   ├── layout.tsx                # 인증 전용 레이아웃 (센터 정렬)
│   │   ├── login/
│   │   │   └── page.tsx              # 로그인 페이지
│   │   ├── signup/
│   │   │   └── page.tsx              # 회원가입 페이지
│   │   ├── reset-password/
│   │   │   └── page.tsx              # 비밀번호 재설정
│   │   └── callback/
│   │       └── route.ts              # OAuth 콜백 핸들러
│   │
│   ├── (dashboard)/                  # 대시보드 라우트 그룹 (인증 필수)
│   │   ├── layout.tsx                # 대시보드 레이아웃 (네비게이션 포함)
│   │   ├── page.tsx                  # 메인 대시보드 (F-02)
│   │   └── settings/
│   │       └── page.tsx              # 사용자 설정 (PIN 변경, 테마 등)
│   │
│   ├── time/                         # 시간 관리 모듈
│   │   ├── layout.tsx                # 시간 모듈 레이아웃
│   │   ├── page.tsx                  # 시간 모듈 메인 (할일 목록)
│   │   ├── calendar/
│   │   │   └── page.tsx              # 캘린더 뷰 (F-06)
│   │   ├── routines/
│   │   │   └── page.tsx              # 루틴 관리 (F-07)
│   │   ├── stats/
│   │   │   └── page.tsx              # 완료율 통계 (F-20)
│   │   └── time-blocks/
│   │       └── page.tsx              # 시간 블록 (F-29, P2)
│   │
│   ├── money/                        # 금전 관리 모듈
│   │   ├── layout.tsx                # 금전 모듈 레이아웃
│   │   ├── page.tsx                  # 지출 현황 대시보드 (F-11)
│   │   ├── transactions/
│   │   │   └── page.tsx              # 수입/지출 목록 및 입력 (F-08)
│   │   ├── budget/
│   │   │   └── page.tsx              # 월별 예산 설정 (F-10)
│   │   ├── categories/
│   │   │   └── page.tsx              # 카테고리 관리 (F-09)
│   │   ├── assets/
│   │   │   └── page.tsx              # 자산 현황 (F-21, P1)
│   │   └── trends/
│   │       └── page.tsx              # 월별 지출 추이 (F-22, P1)
│   │
│   ├── health/                       # 건강 관리 모듈
│   │   ├── layout.tsx                # 건강 모듈 레이아웃
│   │   ├── page.tsx                  # 건강 대시보드 (F-15)
│   │   ├── meals/
│   │   │   └── page.tsx              # 식사 기록 (F-12)
│   │   ├── drinks/
│   │   │   └── page.tsx              # 음주 기록 (F-13)
│   │   ├── sleep/
│   │   │   └── page.tsx              # 수면 기록 (F-14)
│   │   ├── exercise/
│   │   │   └── page.tsx              # 운동 기록 (F-24, P1)
│   │   └── body/
│   │       └── page.tsx              # 체중/체성분 기록 (F-23, P1)
│   │
│   ├── private/                      # 사적 기록 모듈 (PIN 보호)
│   │   ├── layout.tsx                # PIN 검증 미들웨어 포함 레이아웃
│   │   ├── page.tsx                  # 사적 기록 메인 (감정 캘린더)
│   │   ├── diary/
│   │   │   ├── page.tsx              # 일기 목록 (F-16)
│   │   │   ├── new/
│   │   │   │   └── page.tsx          # 일기 작성
│   │   │   └── [id]/
│   │   │       └── page.tsx          # 일기 상세/편집
│   │   ├── relationships/
│   │   │   ├── page.tsx              # 인간관계 메모 목록 (F-27, P1)
│   │   │   └── [id]/
│   │   │       └── page.tsx          # 인물 상세
│   │   └── search/
│   │       └── page.tsx              # 일기 검색 (F-26, P1)
│   │
│   ├── reports/                      # 리포트 모듈
│   │   ├── page.tsx                  # 리포트 메인
│   │   ├── weekly/
│   │   │   └── page.tsx              # 주간 리포트 (F-19, P1)
│   │   └── monthly/
│   │       └── page.tsx              # 월간 리포트 (F-19, P1)
│   │
│   └── api/                          # Route Handlers (API)
│       ├── auth/
│       │   └── callback/
│       │       └── route.ts          # OAuth 콜백 처리
│       ├── todos/
│       │   ├── route.ts              # GET (목록), POST (생성)
│       │   └── [id]/
│       │       └── route.ts          # GET, PATCH, DELETE
│       ├── routines/
│       │   ├── route.ts              # GET, POST
│       │   ├── [id]/
│       │   │   └── route.ts          # GET, PATCH, DELETE
│       │   └── logs/
│       │       └── route.ts          # POST (체크인), GET (기록 조회)
│       ├── transactions/
│       │   ├── route.ts              # GET, POST
│       │   └── [id]/
│       │       └── route.ts          # GET, PATCH, DELETE
│       ├── budgets/
│       │   └── route.ts              # GET, POST, PATCH
│       ├── categories/
│       │   ├── route.ts              # GET, POST
│       │   └── [id]/
│       │       └── route.ts          # PATCH, DELETE
│       ├── health/
│       │   ├── meals/
│       │   │   ├── route.ts          # GET, POST
│       │   │   └── [id]/
│       │   │       └── route.ts      # PATCH, DELETE
│       │   ├── drinks/
│       │   │   ├── route.ts          # GET, POST
│       │   │   └── [id]/
│       │   │       └── route.ts      # PATCH, DELETE
│       │   ├── sleep/
│       │   │   ├── route.ts          # GET, POST
│       │   │   └── [id]/
│       │   │       └── route.ts      # PATCH, DELETE
│       │   ├── exercise/
│       │   │   ├── route.ts          # GET, POST
│       │   │   └── [id]/
│       │   │       └── route.ts      # PATCH, DELETE
│       │   └── body/
│       │       └── route.ts          # GET, POST
│       ├── diary/
│       │   ├── route.ts              # GET, POST
│       │   └── [id]/
│       │       └── route.ts          # GET, PATCH, DELETE
│       ├── relationships/
│       │   ├── route.ts              # GET, POST
│       │   └── [id]/
│       │       └── route.ts          # GET, PATCH, DELETE
│       ├── reports/
│       │   ├── weekly/
│       │   │   └── route.ts          # GET (주간 리포트 데이터)
│       │   └── monthly/
│       │       └── route.ts          # GET (월간 리포트 데이터)
│       └── export/
│           └── route.ts              # GET (CSV/JSON 내보내기)
│
├── components/                       # 재사용 가능한 컴포넌트
│   ├── ui/                           # shadcn/ui 기반 공통 UI
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── calendar.tsx
│   │   ├── progress.tsx
│   │   ├── toast.tsx
│   │   └── ...                       # shadcn/ui 설치 컴포넌트
│   │
│   ├── layout/                       # 레이아웃 관련
│   │   ├── header.tsx                # 상단 헤더
│   │   ├── bottom-nav.tsx            # 하단 네비게이션 바 (모바일)
│   │   ├── sidebar.tsx               # 사이드바 (데스크톱)
│   │   └── fab.tsx                   # Floating Action Button (빠른 입력)
│   │
│   ├── auth/                         # 인증 관련
│   │   ├── login-form.tsx            # 로그인 폼
│   │   ├── signup-form.tsx           # 회원가입 폼
│   │   ├── oauth-button.tsx          # Google OAuth 버튼
│   │   ├── pin-pad.tsx               # PIN 입력 키패드
│   │   ├── pin-setup.tsx             # PIN 초기 설정 모달
│   │   └── pin-guard.tsx             # PIN 보호 래퍼 컴포넌트
│   │
│   ├── dashboard/                    # 대시보드 요약 카드
│   │   ├── time-summary-card.tsx     # 시간 모듈 요약
│   │   ├── money-summary-card.tsx    # 금전 모듈 요약
│   │   ├── health-summary-card.tsx   # 건강 모듈 요약
│   │   └── private-summary-card.tsx  # 사적 기록 요약
│   │
│   ├── time/                         # 시간 관리 컴포넌트
│   │   ├── todo-list.tsx             # 할일 목록
│   │   ├── todo-item.tsx             # 할일 항목 (체크박스, 드래그)
│   │   ├── todo-form.tsx             # 할일 생성/수정 폼
│   │   ├── calendar-view.tsx         # 캘린더 뷰 (일/주/월)
│   │   ├── routine-list.tsx          # 루틴 목록
│   │   ├── routine-item.tsx          # 루틴 항목 (체크인, streak)
│   │   ├── routine-form.tsx          # 루틴 생성/수정 폼
│   │   └── completion-chart.tsx      # 완료율 차트 (Recharts)
│   │
│   ├── money/                        # 금전 관리 컴포넌트
│   │   ├── transaction-list.tsx      # 거래 목록
│   │   ├── transaction-form.tsx      # 수입/지출 입력 폼
│   │   ├── category-manager.tsx      # 카테고리 관리
│   │   ├── budget-settings.tsx       # 예산 설정
│   │   ├── budget-progress.tsx       # 예산 대비 지출 프로그레스
│   │   ├── expense-pie-chart.tsx     # 카테고리별 파이 차트
│   │   ├── expense-bar-chart.tsx     # 예산 달성률 바 차트
│   │   └── expense-trend-chart.tsx   # 월별 지출 추이 라인 차트
│   │
│   ├── health/                       # 건강 관리 컴포넌트
│   │   ├── meal-form.tsx             # 식사 기록 폼
│   │   ├── meal-list.tsx             # 식사 목록 (일별)
│   │   ├── drink-form.tsx            # 음주 기록 폼
│   │   ├── drink-summary.tsx         # 주간 음주 요약
│   │   ├── drink-warning.tsx         # 음주 경고 배너
│   │   ├── sleep-form.tsx            # 수면 기록 폼
│   │   ├── sleep-summary.tsx         # 수면 통계 요약
│   │   ├── exercise-form.tsx         # 운동 기록 폼
│   │   ├── body-form.tsx             # 체중/체성분 입력 폼
│   │   └── body-trend-chart.tsx      # 체중 추이 차트
│   │
│   ├── private/                      # 사적 기록 컴포넌트
│   │   ├── diary-editor.tsx          # 리치 텍스트 일기 에디터
│   │   ├── diary-list.tsx            # 일기 목록
│   │   ├── emotion-picker.tsx        # 감정 태그 선택기 (10개 아이콘)
│   │   ├── emotion-calendar.tsx      # 감정 캘린더 (월간)
│   │   ├── diary-search.tsx          # 일기 검색 (클라이언트 사이드)
│   │   ├── relationship-list.tsx     # 인간관계 목록
│   │   └── relationship-form.tsx     # 인간관계 메모 폼
│   │
│   └── reports/                      # 리포트 컴포넌트
│       ├── weekly-report.tsx         # 주간 통합 리포트
│       └── monthly-report.tsx        # 월간 통합 리포트
│
├── lib/                              # 유틸리티 및 라이브러리
│   ├── supabase/
│   │   ├── client.ts                 # 브라우저용 Supabase 클라이언트
│   │   ├── server.ts                 # 서버용 Supabase 클라이언트 (Route Handler)
│   │   ├── middleware.ts             # 인증 미들웨어 (세션 갱신)
│   │   └── types.ts                  # Supabase 자동 생성 타입
│   ├── crypto/
│   │   ├── encrypt.ts                # AES-256 암호화 함수
│   │   ├── decrypt.ts                # AES-256 복호화 함수
│   │   └── key-derivation.ts         # PBKDF2 키 파생 함수
│   ├── validators/
│   │   ├── todo.ts                   # 할일 입력 유효성 검사 (zod)
│   │   ├── transaction.ts            # 거래 입력 유효성 검사
│   │   ├── health.ts                 # 건강 기록 유효성 검사
│   │   └── diary.ts                  # 일기 입력 유효성 검사
│   ├── constants/
│   │   ├── categories.ts             # 기본 카테고리 목록
│   │   ├── emotions.ts               # 10개 감정 아이콘 정의
│   │   └── config.ts                 # 앱 설정 상수
│   └── utils/
│       ├── date.ts                   # 날짜 유틸리티 (dayjs 래퍼)
│       ├── format.ts                 # 숫자/통화 포맷
│       └── cn.ts                     # tailwind-merge + clsx 유틸
│
├── store/                            # Zustand 전역 상태
│   ├── auth-store.ts                 # 인증 상태 (user, session)
│   ├── pin-store.ts                  # PIN 관련 상태 (잠금, 시도 횟수)
│   └── ui-store.ts                   # UI 상태 (테마, 사이드바, 모달)
│
├── hooks/                            # 커스텀 React 훅
│   ├── use-auth.ts                   # 인증 상태 훅
│   ├── use-pin.ts                    # PIN 검증 훅
│   ├── use-todos.ts                  # 할일 CRUD 훅 (React Query)
│   ├── use-routines.ts               # 루틴 CRUD 훅
│   ├── use-transactions.ts           # 거래 CRUD 훅
│   ├── use-health.ts                 # 건강 기록 훅
│   ├── use-diary.ts                  # 일기 CRUD 훅 (암호화 포함)
│   └── use-relationships.ts          # 관계 메모 훅 (암호화 포함)
│
├── types/                            # TypeScript 타입 정의
│   ├── database.ts                   # DB 테이블 타입 (Supabase 생성)
│   ├── todo.ts                       # 할일 관련 타입
│   ├── routine.ts                    # 루틴 관련 타입
│   ├── transaction.ts                # 거래 관련 타입
│   ├── health.ts                     # 건강 기록 타입
│   ├── diary.ts                      # 일기 타입
│   └── relationship.ts              # 관계 메모 타입
│
├── public/                           # 정적 파일
│   ├── icons/                        # PWA 아이콘
│   │   ├── icon-192x192.png
│   │   ├── icon-512x512.png
│   │   └── apple-touch-icon.png
│   ├── sw.js                         # Service Worker
│   └── favicon.ico
│
├── middleware.ts                      # Next.js 미들웨어 (인증 리다이렉트)
├── next.config.js                    # Next.js 설정
├── tailwind.config.ts                # Tailwind CSS 설정
├── tsconfig.json                     # TypeScript 설정
├── package.json
├── .env.local                        # 환경변수 (git 제외)
└── .env.example                      # 환경변수 템플릿
```

---

## 3. 데이터베이스 스키마

### 3.1 공통 규칙

- 모든 테이블의 `id`는 `uuid` 타입, `gen_random_uuid()` 기본값 사용
- 모든 사용자 데이터 테이블에 `user_id` 외래키 포함 (auth.users 참조)
- `created_at`, `updated_at` 타임스탬프 자동 관리
- 모든 테이블에 RLS 활성화

### 3.2 테이블 DDL

#### users (사용자 프로필)

```sql
-- Supabase Auth의 auth.users를 확장하는 프로필 테이블
CREATE TABLE public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  name        TEXT,
  timezone    TEXT DEFAULT 'Asia/Seoul',
  pin_hash    TEXT,                        -- bcrypt 해시된 PIN
  pin_salt    TEXT,                        -- PIN 해싱용 salt
  pin_failed_count  INTEGER DEFAULT 0,    -- PIN 실패 횟수
  pin_locked_until  TIMESTAMPTZ,          -- PIN 잠금 해제 시각
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- 인덱스
CREATE INDEX idx_users_email ON public.users(email);

-- 트리거: updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

#### todos (할일 관리)

```sql
CREATE TABLE public.todos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  due_date    DATE,
  priority    TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  status      TEXT CHECK (status IN ('pending', 'completed', 'cancelled')) DEFAULT 'pending',
  category    TEXT,
  sort_order  INTEGER DEFAULT 0,            -- 드래그 정렬 순서
  completed_at TIMESTAMPTZ,                 -- 완료 시각
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "todos_select_own" ON public.todos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "todos_insert_own" ON public.todos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "todos_update_own" ON public.todos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "todos_delete_own" ON public.todos
  FOR DELETE USING (auth.uid() = user_id);

-- 인덱스
CREATE INDEX idx_todos_user_id ON public.todos(user_id);
CREATE INDEX idx_todos_due_date ON public.todos(user_id, due_date);
CREATE INDEX idx_todos_status ON public.todos(user_id, status);
CREATE INDEX idx_todos_sort_order ON public.todos(user_id, sort_order);

CREATE TRIGGER set_todos_updated_at
  BEFORE UPDATE ON public.todos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

#### routines (반복 루틴)

```sql
CREATE TABLE public.routines (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  frequency   TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'custom')),
  days_of_week INTEGER[],                   -- weekly인 경우: [0=일, 1=월, ..., 6=토]
  interval_days INTEGER,                    -- custom인 경우: N일 간격
  time_of_day  TIME,                        -- 실행 시각
  streak      INTEGER DEFAULT 0,            -- 연속 달성일
  is_active   BOOLEAN DEFAULT TRUE,         -- 활성/일시중지
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "routines_select_own" ON public.routines
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "routines_insert_own" ON public.routines
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "routines_update_own" ON public.routines
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "routines_delete_own" ON public.routines
  FOR DELETE USING (auth.uid() = user_id);

-- 인덱스
CREATE INDEX idx_routines_user_id ON public.routines(user_id);
CREATE INDEX idx_routines_active ON public.routines(user_id, is_active);

CREATE TRIGGER set_routines_updated_at
  BEFORE UPDATE ON public.routines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

#### routine_logs (루틴 실행 기록)

```sql
CREATE TABLE public.routine_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id  UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  completed   BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE public.routine_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "routine_logs_select_own" ON public.routine_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "routine_logs_insert_own" ON public.routine_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "routine_logs_update_own" ON public.routine_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "routine_logs_delete_own" ON public.routine_logs
  FOR DELETE USING (auth.uid() = user_id);

-- 인덱스
CREATE INDEX idx_routine_logs_routine_date ON public.routine_logs(routine_id, date);
CREATE INDEX idx_routine_logs_user_date ON public.routine_logs(user_id, date);

-- 유니크 제약: 같은 루틴의 같은 날짜에 중복 기록 방지
ALTER TABLE public.routine_logs
  ADD CONSTRAINT uq_routine_logs_routine_date UNIQUE (routine_id, date);
```

#### transactions (수입/지출)

```sql
CREATE TABLE public.transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount      DECIMAL(12, 2) NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category_id UUID REFERENCES public.categories(id),
  memo        TEXT,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  is_favorite BOOLEAN DEFAULT FALSE,         -- 즐겨찾기
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_select_own" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "transactions_insert_own" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transactions_update_own" ON public.transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "transactions_delete_own" ON public.transactions
  FOR DELETE USING (auth.uid() = user_id);

-- 인덱스
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_date ON public.transactions(user_id, date);
CREATE INDEX idx_transactions_type ON public.transactions(user_id, type);
CREATE INDEX idx_transactions_category ON public.transactions(user_id, category_id);
CREATE INDEX idx_transactions_favorite ON public.transactions(user_id, is_favorite)
  WHERE is_favorite = TRUE;

CREATE TRIGGER set_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

#### categories (카테고리 관리)

```sql
-- PRD에서는 transactions에 category 문자열이었으나,
-- F-09 카테고리 관리 기능을 위해 별도 테이블로 분리
CREATE TABLE public.categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES public.users(id) ON DELETE CASCADE, -- NULL이면 시스템 기본 카테고리
  name        TEXT NOT NULL,
  icon        TEXT,                           -- 이모지 또는 아이콘 코드
  color       TEXT,                           -- HEX 색상 코드
  type        TEXT NOT NULL CHECK (type IN ('income', 'expense', 'both')),
  is_system   BOOLEAN DEFAULT FALSE,         -- 시스템 기본 카테고리 여부
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책: 시스템 카테고리는 모두 조회, 사용자 카테고리는 본인만
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_select" ON public.categories
  FOR SELECT USING (is_system = TRUE OR auth.uid() = user_id);

CREATE POLICY "categories_insert_own" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() = user_id AND is_system = FALSE);

CREATE POLICY "categories_update_own" ON public.categories
  FOR UPDATE USING (auth.uid() = user_id AND is_system = FALSE);

CREATE POLICY "categories_delete_own" ON public.categories
  FOR DELETE USING (auth.uid() = user_id AND is_system = FALSE);

-- 인덱스
CREATE INDEX idx_categories_user_id ON public.categories(user_id);
CREATE INDEX idx_categories_type ON public.categories(type);
```

#### budgets (월별 예산)

```sql
CREATE TABLE public.budgets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id),
  amount      DECIMAL(12, 2) NOT NULL,
  year_month  TEXT NOT NULL,                 -- 형식: '2026-02'
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budgets_select_own" ON public.budgets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "budgets_insert_own" ON public.budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "budgets_update_own" ON public.budgets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "budgets_delete_own" ON public.budgets
  FOR DELETE USING (auth.uid() = user_id);

-- 인덱스
CREATE INDEX idx_budgets_user_month ON public.budgets(user_id, year_month);

-- 유니크 제약: 같은 사용자, 같은 월, 같은 카테고리에 중복 예산 방지
ALTER TABLE public.budgets
  ADD CONSTRAINT uq_budgets_user_category_month UNIQUE (user_id, category_id, year_month);

CREATE TRIGGER set_budgets_updated_at
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

#### health_logs (건강 통합 기록)

```sql
-- 수면, 운동, 체중/체성분 등 범용 건강 기록
CREATE TABLE public.health_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  log_type    TEXT NOT NULL CHECK (log_type IN ('sleep', 'exercise', 'weight', 'body_fat', 'muscle_mass')),
  value       DECIMAL(10, 2) NOT NULL,       -- 수면시간(h), 운동시간(min), 체중(kg) 등
  value2      DECIMAL(10, 2),                -- 수면 질(1-5), 운동 강도(1-3) 등 보조값
  unit        TEXT,                           -- 단위: hours, minutes, kg, % 등
  note        TEXT,                           -- 메모 (운동 종류, 비고 등)
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  time_start  TIME,                          -- 시작 시각 (수면 취침, 운동 시작)
  time_end    TIME,                          -- 종료 시각 (수면 기상, 운동 종료)
  calories    DECIMAL(8, 2),                 -- 소모 칼로리 (운동)
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE public.health_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "health_logs_select_own" ON public.health_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "health_logs_insert_own" ON public.health_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "health_logs_update_own" ON public.health_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "health_logs_delete_own" ON public.health_logs
  FOR DELETE USING (auth.uid() = user_id);

-- 인덱스
CREATE INDEX idx_health_logs_user_id ON public.health_logs(user_id);
CREATE INDEX idx_health_logs_type_date ON public.health_logs(user_id, log_type, date);
CREATE INDEX idx_health_logs_date ON public.health_logs(user_id, date);

CREATE TRIGGER set_health_logs_updated_at
  BEFORE UPDATE ON public.health_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

#### meal_logs (식단 기록)

```sql
CREATE TABLE public.meal_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  meal_type   TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  food_name   TEXT NOT NULL,
  calories    DECIMAL(8, 2),
  protein     DECIMAL(8, 2),                 -- 단백질(g)
  carbs       DECIMAL(8, 2),                 -- 탄수화물(g)
  fat         DECIMAL(8, 2),                 -- 지방(g)
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meal_logs_select_own" ON public.meal_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "meal_logs_insert_own" ON public.meal_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "meal_logs_update_own" ON public.meal_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "meal_logs_delete_own" ON public.meal_logs
  FOR DELETE USING (auth.uid() = user_id);

-- 인덱스
CREATE INDEX idx_meal_logs_user_id ON public.meal_logs(user_id);
CREATE INDEX idx_meal_logs_date ON public.meal_logs(user_id, date);
CREATE INDEX idx_meal_logs_type_date ON public.meal_logs(user_id, meal_type, date);

CREATE TRIGGER set_meal_logs_updated_at
  BEFORE UPDATE ON public.meal_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

#### drink_logs (음주 기록)

```sql
CREATE TABLE public.drink_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  drink_type  TEXT NOT NULL CHECK (drink_type IN ('beer', 'soju', 'wine', 'whiskey', 'other')),
  alcohol_pct DECIMAL(4, 1),                 -- 도수(%)
  amount_ml   DECIMAL(8, 1) NOT NULL,        -- 양(ml)
  drink_count DECIMAL(4, 1),                 -- 잔 수
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE public.drink_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "drink_logs_select_own" ON public.drink_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "drink_logs_insert_own" ON public.drink_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "drink_logs_update_own" ON public.drink_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "drink_logs_delete_own" ON public.drink_logs
  FOR DELETE USING (auth.uid() = user_id);

-- 인덱스
CREATE INDEX idx_drink_logs_user_id ON public.drink_logs(user_id);
CREATE INDEX idx_drink_logs_date ON public.drink_logs(user_id, date);

CREATE TRIGGER set_drink_logs_updated_at
  BEFORE UPDATE ON public.drink_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

#### diary_entries (일기 - 암호화)

```sql
CREATE TABLE public.diary_entries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content_encrypted TEXT NOT NULL,            -- AES-256 암호화된 일기 본문
  mood              TEXT[],                   -- 감정 태그 배열 (평문, 검색용)
  tags              TEXT[],                   -- 사용자 태그 (평문)
  date              DATE NOT NULL,
  iv                TEXT NOT NULL,            -- AES 초기화 벡터 (Base64)
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "diary_entries_select_own" ON public.diary_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "diary_entries_insert_own" ON public.diary_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "diary_entries_update_own" ON public.diary_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "diary_entries_delete_own" ON public.diary_entries
  FOR DELETE USING (auth.uid() = user_id);

-- 인덱스
CREATE INDEX idx_diary_entries_user_id ON public.diary_entries(user_id);
CREATE INDEX idx_diary_entries_date ON public.diary_entries(user_id, date);
CREATE INDEX idx_diary_entries_mood ON public.diary_entries USING GIN(mood);

-- 유니크 제약: 같은 사용자, 같은 날짜에 일기 1개
ALTER TABLE public.diary_entries
  ADD CONSTRAINT uq_diary_entries_user_date UNIQUE (user_id, date);

CREATE TRIGGER set_diary_entries_updated_at
  BEFORE UPDATE ON public.diary_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

#### relationships (인간관계 메모 - 암호화)

```sql
CREATE TABLE public.relationships (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  person_name     TEXT NOT NULL,              -- 인물 이름 (평문)
  relationship    TEXT CHECK (relationship IN ('family', 'friend', 'colleague', 'other')),
  last_met        DATE,
  notes_encrypted TEXT,                       -- AES-256 암호화된 메모
  iv              TEXT,                       -- AES 초기화 벡터 (Base64)
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "relationships_select_own" ON public.relationships
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "relationships_insert_own" ON public.relationships
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "relationships_update_own" ON public.relationships
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "relationships_delete_own" ON public.relationships
  FOR DELETE USING (auth.uid() = user_id);

-- 인덱스
CREATE INDEX idx_relationships_user_id ON public.relationships(user_id);
CREATE INDEX idx_relationships_last_met ON public.relationships(user_id, last_met);

CREATE TRIGGER set_relationships_updated_at
  BEFORE UPDATE ON public.relationships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 3.3 초기 데이터 (시스템 카테고리)

```sql
-- 기본 지출 카테고리
INSERT INTO public.categories (name, icon, color, type, is_system, sort_order) VALUES
  ('식비', '🍚', '#FF6B6B', 'expense', TRUE, 1),
  ('교통', '🚌', '#4ECDC4', 'expense', TRUE, 2),
  ('여가', '🎮', '#45B7D1', 'expense', TRUE, 3),
  ('쇼핑', '🛍️', '#96CEB4', 'expense', TRUE, 4),
  ('의료', '🏥', '#FFEAA7', 'expense', TRUE, 5),
  ('교육', '📚', '#DDA0DD', 'expense', TRUE, 6),
  ('주거', '🏠', '#98D8C8', 'expense', TRUE, 7),
  ('기타', '📌', '#B0B0B0', 'both', TRUE, 8);

-- 기본 수입 카테고리
INSERT INTO public.categories (name, icon, color, type, is_system, sort_order) VALUES
  ('급여', '💰', '#2ECC71', 'income', TRUE, 1),
  ('부수입', '💵', '#27AE60', 'income', TRUE, 2),
  ('투자수익', '📈', '#1ABC9C', 'income', TRUE, 3);
```

### 3.4 ER 다이어그램 (텍스트)

```
auth.users (Supabase 관리)
    |
    | 1:1
    v
+--------+        1:N        +---------+       1:N       +--------------+
| users  |------------------>| routines|---------------->| routine_logs |
+--------+                   +---------+                 +--------------+
    |
    | 1:N
    +-------------------> todos
    |
    | 1:N                              1:N
    +-------------------> categories --------> transactions
    |                          |
    | 1:N                      | 1:N
    +-------------------> budgets (category_id FK)
    |
    | 1:N
    +-------------------> health_logs
    |
    | 1:N
    +-------------------> meal_logs
    |
    | 1:N
    +-------------------> drink_logs
    |
    | 1:N
    +-------------------> diary_entries (암호화)
    |
    | 1:N
    +-------------------> relationships (암호화)
```

---

## 4. 인증 & 보안 설계

### 4.1 Supabase Auth 흐름

#### 이메일 인증

```
1. 회원가입: 이메일 + 비밀번호 입력
2. Supabase Auth → 인증 이메일 발송
3. 이메일 링크 클릭 → 계정 활성화
4. 로그인: 이메일 + 비밀번호 → JWT 발급
5. JWT는 Supabase 클라이언트가 자동으로 쿠키에 저장
```

#### Google OAuth

```
1. "Google로 로그인" 버튼 클릭
2. Supabase Auth → Google OAuth 리다이렉트
3. Google 인증 완료 → /auth/callback 리다이렉트
4. Supabase가 code를 세션으로 교환
5. JWT 발급 + 자동 쿠키 저장
6. 메인 대시보드로 리다이렉트
```

#### OAuth 콜백 처리 (Route Handler)

```typescript
// app/auth/callback/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = createServerClient(/* ... */);
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL('/', request.url));
}
```

### 4.2 JWT 세션 관리

| 항목 | 설정 |
|------|------|
| **토큰 타입** | Supabase JWT (access_token + refresh_token) |
| **access_token 수명** | 1시간 (Supabase 기본값) |
| **refresh_token 수명** | 60일 |
| **저장 방식** | Supabase JS 클라이언트가 자동 관리 (localStorage/cookie) |
| **갱신 방식** | Next.js 미들웨어에서 매 요청마다 세션 갱신 확인 |
| **비활동 타임아웃** | 30분 비활동 시 클라이언트 사이드에서 강제 로그아웃 |

#### Next.js 미들웨어 (세션 갱신)

```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response });

  // 세션 갱신 (만료 임박 시 자동 refresh)
  const { data: { session } } = await supabase.auth.getSession();

  // 비인증 상태에서 보호 경로 접근 시 리다이렉트
  const protectedPaths = ['/time', '/money', '/health', '/private', '/reports', '/settings'];
  const isProtected = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path));

  if (isProtected && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 인증 상태에서 로그인 페이지 접근 시 대시보드로
  if (session && request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|sw.js).*)'],
};
```

### 4.3 RLS 적용 원칙

1. **모든 public 스키마 테이블에 RLS 활성화** (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
2. **CRUD 4가지 정책 개별 생성**: SELECT, INSERT, UPDATE, DELETE 각각 정의
3. **조건식 통일**: `auth.uid() = user_id` (users 테이블은 `auth.uid() = id`)
4. **예외**: `categories` 테이블의 시스템 카테고리(`is_system = TRUE`)는 모든 인증 사용자 조회 가능
5. **Service Role Key는 서버 사이드에서만 사용**: 클라이언트에 노출 금지

### 4.4 PIN 잠금 구현 방식

#### 상태 관리: Zustand + sessionStorage

```typescript
// store/pin-store.ts
interface PinState {
  isPinSet: boolean;          // PIN 설정 여부
  isPinVerified: boolean;     // 현재 세션에서 PIN 인증 완료 여부
  failedAttempts: number;     // 연속 실패 횟수
  lockedUntil: number | null; // 잠금 해제 시각 (timestamp)

  verifyPin: (pin: string) => Promise<boolean>;
  setPin: (pin: string) => Promise<void>;
  resetPinState: () => void;
}
```

#### PIN 검증 흐름

```
1. 앱 진입 또는 /private 접근
2. pinStore.isPinVerified 확인
3. FALSE → PIN 입력 화면 (pin-pad.tsx) 표시
4. 사용자 PIN 입력
5. 서버에서 pin_hash와 bcrypt 비교
6. 일치 → isPinVerified = true (sessionStorage 동기화)
7. 불일치 → failedAttempts++
8. failedAttempts >= 5 → lockedUntil = Date.now() + 10분
9. 탭/브라우저 닫으면 sessionStorage 초기화 → 재인증 필요
```

#### PIN 저장 방식

- **서버**: `users.pin_hash` = bcrypt(PIN + salt), `users.pin_salt`
- **클라이언트**: PIN 원문은 절대 저장하지 않음
- **인증 상태**: `sessionStorage`에 `pin_verified: true` 저장 (탭 닫으면 소멸)

### 4.5 클라이언트 사이드 AES-256 암호화

#### 대상 테이블

| 테이블 | 암호화 컬럼 | 평문 유지 컬럼 |
|--------|-------------|----------------|
| `diary_entries` | `content_encrypted` | `mood`, `tags`, `date` |
| `relationships` | `notes_encrypted` | `person_name`, `relationship`, `last_met` |

#### 암호화 구현 (crypto-js)

```typescript
// lib/crypto/encrypt.ts
import CryptoJS from 'crypto-js';

export function encryptContent(plainText: string, encryptionKey: string): {
  encrypted: string;
  iv: string;
} {
  const iv = CryptoJS.lib.WordArray.random(16);
  const encrypted = CryptoJS.AES.encrypt(plainText, encryptionKey, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return {
    encrypted: encrypted.toString(),       // Base64 인코딩된 암호문
    iv: CryptoJS.enc.Base64.stringify(iv), // Base64 인코딩된 IV
  };
}
```

```typescript
// lib/crypto/decrypt.ts
import CryptoJS from 'crypto-js';

export function decryptContent(encryptedText: string, encryptionKey: string, iv: string): string {
  const ivParsed = CryptoJS.enc.Base64.parse(iv);
  const decrypted = CryptoJS.AES.decrypt(encryptedText, encryptionKey, {
    iv: ivParsed,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return decrypted.toString(CryptoJS.enc.Utf8);
}
```

### 4.6 PBKDF2 키 파생 방식

사용자의 PIN을 직접 암호화 키로 사용하지 않고, PBKDF2로 안전한 키를 파생합니다.

```typescript
// lib/crypto/key-derivation.ts
import CryptoJS from 'crypto-js';

const ITERATION_COUNT = 100000;
const KEY_SIZE = 256 / 32; // 256-bit key

export function deriveEncryptionKey(pin: string, salt: string): string {
  const key = CryptoJS.PBKDF2(pin, salt, {
    keySize: KEY_SIZE,
    iterations: ITERATION_COUNT,
    hasher: CryptoJS.algo.SHA256,
  });

  return key.toString();
}
```

#### 키 파생 흐름

```
1. PIN 인증 성공
2. 서버에서 사용자의 pin_salt 조회
3. PBKDF2(PIN, salt, 100000회) → 256-bit 암호화 키 파생
4. 파생된 키를 sessionStorage에 저장 (탭 생존 주기)
5. 일기/관계 메모 저장/조회 시 이 키로 암호화/복호화
6. 탭 닫으면 키 소멸 → 재인증 필요
```

#### 보안 고려사항

- PIN과 암호화 키는 서버에 전송하지 않음
- 암호화/복호화는 전부 클라이언트에서 수행
- DB에는 암호문만 저장 → 서버 관리자도 평문 조회 불가
- PIN 분실 시 암호화된 데이터 복구 불가 (사용자에게 사전 안내 필수)

---

## 5. PWA 설계

### 5.1 manifest 구성

```typescript
// app/manifest.ts
import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'My Life OS',
    short_name: 'MyLifeOS',
    description: '개인 생활 전반 관리 서비스',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3B82F6',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
```

### 5.2 iOS Safari 메타태그

```tsx
// app/layout.tsx <head> 영역
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="My Life OS" />
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />

<!-- iOS 스플래시 스크린 (주요 해상도) -->
<link rel="apple-touch-startup-image"
  media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)"
  href="/icons/splash-1179x2556.png" />
<link rel="apple-touch-startup-image"
  media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)"
  href="/icons/splash-1290x2796.png" />

<!-- viewport 설정 -->
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
```

### 5.3 Service Worker 캐시 전략

| 리소스 유형 | 전략 | 설명 |
|-------------|------|------|
| **App Shell** (HTML, CSS, JS) | Cache First | 빌드 시 생성된 정적 파일 선 캐시 |
| **API 응답** | Network First | 네트워크 우선, 실패 시 캐시 폴백 |
| **이미지/아이콘** | Cache First | 장기 캐시, 버전 변경 시 갱신 |
| **폰트** | Cache First | 장기 캐시 |

#### Service Worker 구현 방향

```javascript
// public/sw.js (기본 구조)
const CACHE_NAME = 'mylifeos-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install: 정적 자산 프리캐시
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

// Fetch: Network First (API), Cache First (정적)
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    // Network First
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Cache First
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  }
});
```

### 5.4 오프라인 지원 범위

| 기능 | 오프라인 지원 | 방식 |
|------|--------------|------|
| 대시보드 조회 | O | 마지막 동기화 데이터 캐시 표시 |
| 할일 목록 조회 | O | React Query 캐시 + Service Worker |
| 데이터 입력 (생성/수정) | X | 온라인 필수 (오프라인 큐 미구현, P2 이후 고려) |
| 일기 조회 | X | 복호화 키가 sessionStorage에 있을 때만 가능 |
| 차트/리포트 | O | 마지막 캐시 데이터로 렌더링 |

오프라인 시 상단에 "오프라인 상태입니다. 마지막 동기화: HH:mm" 배너를 표시합니다.

---

## 6. 주요 컴포넌트 설계

### 6.1 공통 컴포넌트

| 컴포넌트 | 파일 | 역할 |
|----------|------|------|
| `Header` | `components/layout/header.tsx` | 앱 상단바: 로고, 현재 페이지 제목, 설정 아이콘 |
| `BottomNav` | `components/layout/bottom-nav.tsx` | 모바일 하단 네비게이션: 대시보드/시간/금전/건강/사적기록 5탭 |
| `Sidebar` | `components/layout/sidebar.tsx` | 데스크톱 좌측 사이드바: 모듈 메뉴 + 서브 메뉴 |
| `FAB` | `components/layout/fab.tsx` | 빠른 입력 플로팅 버튼: 할일/지출/식사/일기 바로 입력 |
| `PinPad` | `components/auth/pin-pad.tsx` | 4-6자리 PIN 입력 키패드 (숫자 그리드) |
| `PinSetup` | `components/auth/pin-setup.tsx` | PIN 최초 설정 (입력 + 확인 2단계) |
| `PinGuard` | `components/auth/pin-guard.tsx` | PIN 보호 래퍼: children을 PIN 인증 후에만 렌더링 |
| `LoginForm` | `components/auth/login-form.tsx` | 이메일/비밀번호 로그인 폼 |
| `OAuthButton` | `components/auth/oauth-button.tsx` | Google OAuth 소셜 로그인 버튼 |

### 6.2 시간 관리 모듈 컴포넌트

| 컴포넌트 | 파일 | 역할 |
|----------|------|------|
| `TodoList` | `components/time/todo-list.tsx` | 할일 목록: 필터(전체/오늘/완료), 드래그 정렬(dnd-kit) |
| `TodoItem` | `components/time/todo-item.tsx` | 개별 할일: 체크박스, 제목, 마감일, 우선순위 뱃지 |
| `TodoForm` | `components/time/todo-form.tsx` | 할일 생성/수정 폼: 제목, 마감일, 우선순위, 카테고리 |
| `CalendarView` | `components/time/calendar-view.tsx` | 캘린더: 월/주/일 뷰 전환, 날짜별 할일 미리보기 |
| `RoutineList` | `components/time/routine-list.tsx` | 오늘의 루틴 목록: 체크인 UI |
| `RoutineItem` | `components/time/routine-item.tsx` | 개별 루틴: 체크 버튼, streak 카운터 |
| `RoutineForm` | `components/time/routine-form.tsx` | 루틴 생성/수정: 반복 주기, 시간 설정 |
| `CompletionChart` | `components/time/completion-chart.tsx` | 완료율 차트: Recharts 바/라인 차트 |

### 6.3 금전 관리 모듈 컴포넌트

| 컴포넌트 | 파일 | 역할 |
|----------|------|------|
| `TransactionList` | `components/money/transaction-list.tsx` | 거래 목록: 날짜/카테고리 필터, 무한 스크롤 |
| `TransactionForm` | `components/money/transaction-form.tsx` | 수입/지출 입력: 금액, 카테고리 선택, 즐겨찾기 |
| `CategoryManager` | `components/money/category-manager.tsx` | 카테고리 목록: 추가/수정/삭제, 아이콘/색상 설정 |
| `BudgetSettings` | `components/money/budget-settings.tsx` | 월별 예산 설정: 카테고리별 금액 입력 |
| `BudgetProgress` | `components/money/budget-progress.tsx` | 예산 소진률: 카테고리별 프로그레스 바 + 경고색 |
| `ExpensePieChart` | `components/money/expense-pie-chart.tsx` | 카테고리별 지출 비율 파이 차트 |
| `ExpenseBarChart` | `components/money/expense-bar-chart.tsx` | 예산 대비 지출 달성률 바 차트 |
| `ExpenseTrendChart` | `components/money/expense-trend-chart.tsx` | 월별 지출 추이 라인 차트 |

### 6.4 건강 모듈 컴포넌트

| 컴포넌트 | 파일 | 역할 |
|----------|------|------|
| `MealForm` | `components/health/meal-form.tsx` | 식사 기록: 식사 유형, 음식명, 칼로리, 영양소 |
| `MealList` | `components/health/meal-list.tsx` | 일별 식사 목록: 식사 유형별 그룹, 총 칼로리 합산 |
| `DrinkForm` | `components/health/drink-form.tsx` | 음주 기록: 주종, 도수, 양, 잔 수 |
| `DrinkSummary` | `components/health/drink-summary.tsx` | 주간 음주 요약: 횟수, 총량 |
| `DrinkWarning` | `components/health/drink-warning.tsx` | WHO 기준 초과 경고 배너 (노란/빨간) |
| `SleepForm` | `components/health/sleep-form.tsx` | 수면 기록: 취침/기상 시각 피커, 수면 질 슬라이더 |
| `SleepSummary` | `components/health/sleep-summary.tsx` | 주간 수면 통계: 평균 시간, 평균 질 |
| `ExerciseForm` | `components/health/exercise-form.tsx` | 운동 기록: 운동 종류, 시간, 강도, 칼로리 |
| `BodyForm` | `components/health/body-form.tsx` | 체중/체성분 입력 폼 |
| `BodyTrendChart` | `components/health/body-trend-chart.tsx` | 체중 변화 추이 라인 차트 |

### 6.5 사적 기록 모듈 컴포넌트

| 컴포넌트 | 파일 | 역할 |
|----------|------|------|
| `DiaryEditor` | `components/private/diary-editor.tsx` | 리치 텍스트 에디터 (Tiptap 기반): 볼드/이탤릭/리스트 |
| `DiaryList` | `components/private/diary-list.tsx` | 일기 목록: 날짜, 감정 아이콘, 내용 미리보기 (복호화) |
| `EmotionPicker` | `components/private/emotion-picker.tsx` | 10개 감정 아이콘 그리드: 선택/해제 토글 |
| `EmotionCalendar` | `components/private/emotion-calendar.tsx` | 월간 달력: 날짜별 감정 아이콘 표시, 클릭 시 일기로 이동 |
| `DiarySearch` | `components/private/diary-search.tsx` | 클라이언트 사이드 검색: 전체 일기 복호화 후 필터링 |
| `RelationshipList` | `components/private/relationship-list.tsx` | 인물 목록: 이름, 관계, 마지막 만남 |
| `RelationshipForm` | `components/private/relationship-form.tsx` | 인물 등록/수정: 이름, 관계, 메모 (암호화) |

---

## 7. API Route 설계

### 7.1 공통 응답 형식

```typescript
// 성공 응답
{ success: true, data: T }

// 에러 응답
{ success: false, error: string, code?: string }

// 목록 응답 (페이지네이션)
{ success: true, data: T[], count: number, page: number, limit: number }
```

### 7.2 인증 API

| 경로 | 메서드 | 기능 | 기능 ID |
|------|--------|------|---------|
| `/api/auth/callback` | GET | OAuth 콜백 처리 | F-01 |

> 회원가입/로그인/로그아웃은 Supabase Auth 클라이언트 SDK를 직접 호출합니다. Route Handler 불필요.

### 7.3 할일 API

| 경로 | 메서드 | 기능 | 기능 ID |
|------|--------|------|---------|
| `/api/todos` | GET | 할일 목록 조회 (필터: status, due_date, category) | F-05 |
| `/api/todos` | POST | 할일 생성 | F-05 |
| `/api/todos/[id]` | GET | 할일 상세 조회 | F-05 |
| `/api/todos/[id]` | PATCH | 할일 수정 (제목, 상태, 순서 등) | F-05 |
| `/api/todos/[id]` | DELETE | 할일 삭제 | F-05 |

### 7.4 루틴 API

| 경로 | 메서드 | 기능 | 기능 ID |
|------|--------|------|---------|
| `/api/routines` | GET | 루틴 목록 조회 | F-07 |
| `/api/routines` | POST | 루틴 생성 | F-07 |
| `/api/routines/[id]` | GET | 루틴 상세 조회 | F-07 |
| `/api/routines/[id]` | PATCH | 루틴 수정/일시중지 | F-07 |
| `/api/routines/[id]` | DELETE | 루틴 삭제 | F-07 |
| `/api/routines/logs` | GET | 루틴 실행 기록 조회 (기간 필터) | F-07 |
| `/api/routines/logs` | POST | 루틴 체크인 (완료 기록) | F-07 |

### 7.5 거래 API

| 경로 | 메서드 | 기능 | 기능 ID |
|------|--------|------|---------|
| `/api/transactions` | GET | 거래 목록 조회 (필터: type, category, date_range) | F-08 |
| `/api/transactions` | POST | 거래 생성 | F-08 |
| `/api/transactions/[id]` | GET | 거래 상세 | F-08 |
| `/api/transactions/[id]` | PATCH | 거래 수정 | F-08 |
| `/api/transactions/[id]` | DELETE | 거래 삭제 | F-08 |

### 7.6 카테고리 API

| 경로 | 메서드 | 기능 | 기능 ID |
|------|--------|------|---------|
| `/api/categories` | GET | 카테고리 목록 (시스템 + 사용자) | F-09 |
| `/api/categories` | POST | 커스텀 카테고리 생성 | F-09 |
| `/api/categories/[id]` | PATCH | 카테고리 수정 | F-09 |
| `/api/categories/[id]` | DELETE | 카테고리 삭제 (사용 중 확인) | F-09 |

### 7.7 예산 API

| 경로 | 메서드 | 기능 | 기능 ID |
|------|--------|------|---------|
| `/api/budgets` | GET | 월별 예산 조회 (?year_month=2026-02) | F-10 |
| `/api/budgets` | POST | 예산 설정/수정 (UPSERT) | F-10 |

### 7.8 건강 API

| 경로 | 메서드 | 기능 | 기능 ID |
|------|--------|------|---------|
| `/api/health/meals` | GET | 식사 기록 조회 (날짜 필터) | F-12 |
| `/api/health/meals` | POST | 식사 기록 생성 | F-12 |
| `/api/health/meals/[id]` | PATCH | 식사 기록 수정 | F-12 |
| `/api/health/meals/[id]` | DELETE | 식사 기록 삭제 | F-12 |
| `/api/health/drinks` | GET | 음주 기록 조회 (날짜/주간 필터) | F-13 |
| `/api/health/drinks` | POST | 음주 기록 생성 | F-13 |
| `/api/health/drinks/[id]` | PATCH | 음주 기록 수정 | F-13 |
| `/api/health/drinks/[id]` | DELETE | 음주 기록 삭제 | F-13 |
| `/api/health/sleep` | GET | 수면 기록 조회 | F-14 |
| `/api/health/sleep` | POST | 수면 기록 생성 | F-14 |
| `/api/health/sleep/[id]` | PATCH | 수면 기록 수정 | F-14 |
| `/api/health/sleep/[id]` | DELETE | 수면 기록 삭제 | F-14 |
| `/api/health/exercise` | GET | 운동 기록 조회 | F-24 |
| `/api/health/exercise` | POST | 운동 기록 생성 | F-24 |
| `/api/health/exercise/[id]` | PATCH | 운동 기록 수정 | F-24 |
| `/api/health/exercise/[id]` | DELETE | 운동 기록 삭제 | F-24 |
| `/api/health/body` | GET | 체중/체성분 기록 조회 | F-23 |
| `/api/health/body` | POST | 체중/체성분 기록 생성 | F-23 |

### 7.9 사적 기록 API

| 경로 | 메서드 | 기능 | 기능 ID |
|------|--------|------|---------|
| `/api/diary` | GET | 일기 목록 조회 (날짜, 감정 필터) | F-16 |
| `/api/diary` | POST | 일기 생성 (암호화된 본문 수신) | F-16 |
| `/api/diary/[id]` | GET | 일기 상세 조회 (암호문 반환) | F-16 |
| `/api/diary/[id]` | PATCH | 일기 수정 | F-16 |
| `/api/diary/[id]` | DELETE | 일기 삭제 | F-16 |
| `/api/relationships` | GET | 인간관계 목록 조회 | F-27 |
| `/api/relationships` | POST | 인물 등록 (메모 암호화) | F-27 |
| `/api/relationships/[id]` | GET | 인물 상세 (암호문 반환) | F-27 |
| `/api/relationships/[id]` | PATCH | 인물 수정 | F-27 |
| `/api/relationships/[id]` | DELETE | 인물 삭제 | F-27 |

### 7.10 리포트/내보내기 API

| 경로 | 메서드 | 기능 | 기능 ID |
|------|--------|------|---------|
| `/api/reports/weekly` | GET | 주간 통합 리포트 데이터 | F-19 |
| `/api/reports/monthly` | GET | 월간 통합 리포트 데이터 | F-19 |
| `/api/export` | GET | 데이터 내보내기 (?format=csv\|json&module=all\|time\|money...) | F-33 |

### 7.11 사용자 설정 API

| 경로 | 메서드 | 기능 | 기능 ID |
|------|--------|------|---------|
| `/api/users/profile` | GET | 프로필 조회 | F-01 |
| `/api/users/profile` | PATCH | 프로필 수정 (이름, 타임존) | F-01 |
| `/api/users/pin` | POST | PIN 설정/변경 | F-03 |
| `/api/users/pin/verify` | POST | PIN 검증 | F-03 |

---

## 8. 상태 관리 설계

### 8.1 Zustand Store 구조

#### auth-store (인증 상태)

```typescript
// store/auth-store.ts
interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  lastActivity: number;              // 마지막 활동 시각 (비활동 타임아웃용)

  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  updateLastActivity: () => void;
  checkInactivity: () => boolean;     // 30분 초과 여부 확인
  logout: () => Promise<void>;
}
```

**비활동 타임아웃 구현**:
- `updateLastActivity()`는 사용자 인터랙션(클릭, 키입력) 시 호출
- `checkInactivity()`는 1분 간격 setInterval로 체크
- `Date.now() - lastActivity > 30 * 60 * 1000`이면 자동 로그아웃

#### pin-store (PIN 상태)

```typescript
// store/pin-store.ts
interface PinState {
  isPinSet: boolean;                  // PIN 설정 완료 여부
  isPinVerified: boolean;             // 현재 세션 PIN 인증 여부
  failedAttempts: number;             // 연속 실패 횟수
  lockedUntil: number | null;         // 잠금 해제 Unix timestamp
  encryptionKey: string | null;       // PBKDF2 파생 키 (메모리 only)

  setPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  changePin: (oldPin: string, newPin: string) => Promise<boolean>;
  resetPinVerification: () => void;   // 앱 재진입 시 호출
  isLocked: () => boolean;            // 잠금 상태 확인
}
```

**persist 전략**:
- `isPinVerified`, `encryptionKey`: sessionStorage (탭 닫으면 초기화)
- `failedAttempts`, `lockedUntil`: sessionStorage (탭 닫으면 초기화)
- `isPinSet`: 서버에서 조회 (users.pin_hash 존재 여부)

#### ui-store (UI 상태)

```typescript
// store/ui-store.ts
interface UIState {
  theme: 'light' | 'dark' | 'system';  // 테마 설정
  sidebarOpen: boolean;                 // 데스크톱 사이드바 상태
  fabOpen: boolean;                     // FAB 메뉴 열림 상태
  isOnline: boolean;                    // 네트워크 연결 상태
  lastSyncAt: number | null;            // 마지막 동기화 시각

  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleSidebar: () => void;
  toggleFab: () => void;
  setOnlineStatus: (status: boolean) => void;
  updateSyncTime: () => void;
}
```

**persist 전략**:
- `theme`: localStorage (영구 저장)
- `sidebarOpen`: localStorage (영구 저장)
- 나머지: 메모리 only (새로고침 시 초기화)

### 8.2 React Query 캐시 키 전략

#### 키 구조 규칙

```
[모듈, 리소스, ...필터 파라미터]
```

#### 캐시 키 목록

| 키 | 용도 | staleTime |
|----|------|-----------|
| `['todos']` | 전체 할일 목록 | 5분 |
| `['todos', { status, dueDate }]` | 필터링된 할일 | 5분 |
| `['todos', id]` | 할일 상세 | 5분 |
| `['routines']` | 루틴 목록 | 5분 |
| `['routines', 'today']` | 오늘의 루틴 | 1분 |
| `['routines', 'logs', { startDate, endDate }]` | 루틴 기록 | 5분 |
| `['transactions', { type, categoryId, dateRange }]` | 거래 목록 | 5분 |
| `['categories']` | 카테고리 목록 | 30분 |
| `['budgets', yearMonth]` | 월별 예산 | 10분 |
| `['health', 'meals', date]` | 일별 식사 기록 | 5분 |
| `['health', 'drinks', { dateRange }]` | 음주 기록 | 5분 |
| `['health', 'sleep', { dateRange }]` | 수면 기록 | 5분 |
| `['health', 'exercise', { dateRange }]` | 운동 기록 | 5분 |
| `['health', 'body', { dateRange }]` | 체중/체성분 | 10분 |
| `['diary', { date, mood }]` | 일기 목록 | 5분 |
| `['diary', id]` | 일기 상세 | 5분 |
| `['relationships']` | 인간관계 목록 | 10분 |
| `['relationships', id]` | 인물 상세 | 10분 |
| `['reports', 'weekly', weekStart]` | 주간 리포트 | 30분 |
| `['reports', 'monthly', yearMonth]` | 월간 리포트 | 30분 |
| `['user', 'profile']` | 사용자 프로필 | 60분 |
| `['dashboard', 'summary']` | 대시보드 요약 | 1분 |

#### 전역 설정

```typescript
// lib/query-client.ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,       // 기본 5분
      gcTime: 30 * 60 * 1000,         // 30분 후 가비지 컬렉션
      retry: 2,                        // 실패 시 2회 재시도
      refetchOnWindowFocus: true,      // 윈도우 포커스 시 refetch
    },
  },
});
```

### 8.3 낙관적 업데이트 적용 기능

아래 기능들은 사용자 경험 향상을 위해 서버 응답을 기다리지 않고 UI를 즉시 업데이트합니다.

| 기능 | 캐시 키 | 낙관적 동작 | 롤백 조건 |
|------|---------|-------------|-----------|
| **할일 완료 토글** | `['todos']` | 체크박스 즉시 토글, status 변경 | 서버 에러 시 원복 |
| **할일 순서 변경** | `['todos']` | 드래그 완료 시 즉시 순서 반영 | 서버 에러 시 원복 |
| **루틴 체크인** | `['routines', 'today']` | 체크 즉시 반영, streak +1 | 서버 에러 시 원복 |
| **거래 삭제** | `['transactions']` | 목록에서 즉시 제거 | 서버 에러 시 복원 |
| **카테고리 수정** | `['categories']` | 이름/색상 즉시 반영 | 서버 에러 시 원복 |

#### 낙관적 업데이트 패턴 (예시: 할일 완료 토글)

```typescript
// hooks/use-todos.ts
const toggleTodoStatus = useMutation({
  mutationFn: (id: string) => toggleTodo(id),
  onMutate: async (id) => {
    // 진행 중인 쿼리 취소
    await queryClient.cancelQueries({ queryKey: ['todos'] });

    // 이전 데이터 스냅샷
    const previousTodos = queryClient.getQueryData(['todos']);

    // 낙관적 업데이트
    queryClient.setQueryData(['todos'], (old: Todo[]) =>
      old.map(todo =>
        todo.id === id
          ? { ...todo, status: todo.status === 'completed' ? 'pending' : 'completed' }
          : todo
      )
    );

    return { previousTodos }; // 롤백용 컨텍스트
  },
  onError: (err, id, context) => {
    // 에러 시 롤백
    queryClient.setQueryData(['todos'], context?.previousTodos);
    toast.error('변경에 실패했습니다.');
  },
  onSettled: () => {
    // 성공/실패 모두 서버 데이터로 동기화
    queryClient.invalidateQueries({ queryKey: ['todos'] });
  },
});
```

---

## 부록: 환경변수 목록

```env
# .env.local (git 제외)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# 서버 전용 (Route Handler에서만 사용)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# 환경 설정
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

```env
# .env.example (git 포함, 값 없음)

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **주의**: `ENCRYPTION_SECRET`은 환경변수로 관리하지 않습니다. 암호화 키는 사용자 PIN에서 PBKDF2로 런타임에 파생되며, 서버에 저장되지 않습니다.

---

## 부록: 주요 의존성 패키지

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `next` | ^14.x | 프레임워크 |
| `react` | ^18.x | UI 라이브러리 |
| `typescript` | ^5.x | 타입 시스템 |
| `tailwindcss` | ^3.x | CSS 유틸리티 |
| `@supabase/supabase-js` | ^2.x | Supabase 클라이언트 |
| `@supabase/auth-helpers-nextjs` | ^0.x | Next.js 인증 헬퍼 |
| `zustand` | ^4.x | 클라이언트 상태 관리 |
| `@tanstack/react-query` | ^5.x | 서버 상태 관리 |
| `crypto-js` | ^4.x | AES-256 암호화 |
| `recharts` | ^2.x | 차트/시각화 |
| `zod` | ^3.x | 입력 유효성 검사 |
| `@dnd-kit/core` | ^6.x | 드래그 앤 드롭 |
| `tiptap` | ^2.x | 리치 텍스트 에디터 (일기) |
| `dayjs` | ^1.x | 날짜 처리 |
| `bcryptjs` | ^2.x | PIN 해싱 (서버) |
