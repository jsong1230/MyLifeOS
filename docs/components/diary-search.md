# DiarySearch 컴포넌트

## 개요
일기를 클라이언트 사이드에서 복호화하여 키워드 및 감정 태그로 검색하는 컴포넌트.

## 파일 위치
- 컴포넌트: `components/private/diary-search.tsx`
- 페이지: `app/(dashboard)/private/diary/search/page.tsx`
- API: `app/api/diaries/search/route.ts`
- 훅: `hooks/use-diary-search.ts`

## 인수조건 (F-26)
- AC-01: 키워드 입력 시 복호화된 일기 본문에서 매칭 항목 반환
- AC-02: 감정 태그 기반 필터링 (복수 선택, OR 조건)
- AC-03: 매칭 키워드를 `<mark>` 태그로 하이라이트 (노란 배경)

## 동작 방식

### 데이터 흐름
1. `useDiarySearch(12)` 훅으로 최근 12개월 암호화된 일기 목록 fetch
2. `sessionStorage`에서 `enc_key` 조회
3. `decrypt(content_encrypted, encKey)` 호출로 클라이언트 복호화
4. 키워드 + 감정 태그 필터링 적용
5. 매칭된 위치 앞뒤 50자 발췌 + 세그먼트 분리

### 하이라이트 로직 (buildExcerptSegments)
```
content: "오늘 날씨가 맑아서 기분이 좋았다"
keyword: "기분"
→ segments: [
    { text: "...날씨가 맑아서 ", highlight: false },
    { text: "기분", highlight: true },
    { text: "이 좋았다", highlight: false }
  ]
```

## Props
컴포넌트는 props를 받지 않습니다 (내부 상태로 관리).

## 주요 내부 상태
| 상태 | 타입 | 설명 |
|------|------|------|
| keyword | string | 검색 키워드 |
| selectedEmotions | EmotionType[] | 선택된 감정 태그 목록 |

## 에러 처리
- `enc_key`가 sessionStorage에 없으면 "PIN을 다시 입력해주세요" 에러 표시
- API 오류 시 에러 메시지 표시
- 개별 일기 복호화 실패 시 해당 항목 검색 결과에서 제외 (전체 오류 미발생)

## 성능 고려사항
- `useMemo`로 복호화 및 필터링 결과 캐싱 (keyword, selectedEmotions, rawDiaries 변경 시만 재계산)
- `useDiarySearch` 훅의 `staleTime: 5분` 설정으로 불필요한 API 재호출 방지
- 필터 입력이 없을 때 결과를 표시하지 않아 초기 복호화 비용 절감

## 라우팅
- 검색 결과 클릭 시 `/private/diary?date=YYYY-MM-DD`로 이동
- 진입 경로: `/private/diary` 페이지 우측 상단 검색 아이콘 버튼

## API 스키마

### GET /api/diaries/search
**Query Parameters**
- `months` (optional, default: 12, max: 60): 조회 기간 (개월)

**Response**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "date": "2026-02-23",
      "content_encrypted": "AES256 암호화된 문자열",
      "emotion_tags": ["happy", "grateful"]
    }
  ]
}
```
