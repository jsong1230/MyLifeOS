# F-04 PWA 지원 -- 기술 설계서

## 1. 참조
- 인수조건: docs/project/features.md #F-04
- 시스템 설계: docs/system/system-design.md

## 2. 아키텍처 결정

### 결정 1: 매니페스트 제공 방식
- **선택지**: A) 정적 파일 `public/manifest.json` / B) 동적 생성 `app/manifest.ts`
- **결정**: A) 정적 파일 `public/manifest.json`
- **근거**: PWA 매니페스트는 런타임에 변경될 내용이 없으며, 정적 파일이 CDN 캐싱에 유리하고 구현이 단순하다. system-design.md에서 `app/manifest.ts`를 언급하고 있으나, 동적 생성이 필요한 시나리오(다국어, A/B 테스트 등)가 없으므로 정적 파일을 유지한다.

### 결정 2: 아이콘 파일 형식
- **선택지**: A) PNG 아이콘 / B) SVG placeholder
- **결정**: A) PNG 아이콘 (SVG를 PNG로 변환한 최소한의 placeholder)
- **근거**: iOS Safari의 `apple-touch-icon`은 PNG만 지원한다. SVG 파비콘은 브라우저 탭에서 사용 가능하지만, PWA 아이콘은 반드시 PNG여야 한다. 실제 디자인 아이콘이 준비될 때까지 프로그래밍적으로 생성한 placeholder PNG를 사용한다.

### 결정 3: Service Worker
- **선택지**: A) Service Worker 포함 / B) Service Worker 미포함 (순수 매니페스트 + 메타태그만)
- **결정**: B) Service Worker 미포함
- **근거**: F-04의 인수조건은 '홈 화면 추가' 및 'standalone 모드'에 한정된다. 오프라인 지원, 푸시 알림 등은 인수조건에 포함되어 있지 않다. iOS Safari는 Service Worker 지원이 제한적이며, Vercel 배포 환경에서 Service Worker 캐싱은 CDN과 충돌할 수 있다. 필요 시 향후 별도 기능으로 추가한다.

### 결정 4: Apple 메타태그 설정 위치
- **선택지**: A) Next.js Metadata API (`metadata.appleWebApp`) / B) `<head>` 태그에 직접 삽입
- **결정**: A + B 혼합 방식
- **근거**: Next.js의 `metadata.appleWebApp`이 `apple-mobile-web-app-capable`과 `apple-mobile-web-app-status-bar-style`을 자동 생성한다. 그러나 `apple-touch-icon`은 `<link>` 태그로 직접 지정해야 한다. 중복을 피하기 위해, `metadata.appleWebApp`으로 커버되는 메타태그는 `<head>`에서 제거하고, `apple-touch-icon`만 `<head>`에 유지한다.

### 결정 5: 테마 색상 전략
- **선택지**: A) 단일 theme-color / B) 라이트/다크 모드별 theme-color
- **결정**: A) 단일 theme-color (#ffffff)
- **근거**: 현재 다크 모드(F-28)가 미구현 상태이므로, 라이트 모드 기준 흰색 배경을 theme-color로 사용한다. F-28 구현 시 media query 기반 다중 theme-color로 전환한다.

## 3. 매니페스트 설계

### public/manifest.json

```json
{
  "name": "My Life OS",
  "short_name": "MyLifeOS",
  "description": "개인 라이프 매니지먼트 앱",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#ffffff",
  "orientation": "portrait",
  "scope": "/",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

**변경점** (기존 대비):
| 항목 | 기존 | 변경 | 이유 |
|------|------|------|------|
| `theme_color` | `#000000` | `#ffffff` | 라이트 모드 배경색과 일치시켜 status bar 깜빡임 방지 |
| `scope` | (없음) | `"/"` | PWA 범위를 명시적으로 설정 |
| 아이콘 파일명 | `icon-192.png` | `icon-192x192.png` | 표준 네이밍 컨벤션 (크기 명시) |

## 4. 메타태그 설계

### app/layout.tsx

**Metadata API 설정:**
```typescript
export const metadata: Metadata = {
  title: 'My Life OS',
  description: '개인 라이프 매니지먼트 앱',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'My Life OS',
  },
  formatDetection: { telephone: false },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
}
```

**Viewport 설정:**
```typescript
export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}
```

**<head> 태그:**
- `apple-touch-icon` link 태그는 `metadata.icons.apple`로 대체하므로 `<head>`에서 제거
- `apple-mobile-web-app-capable` 메타태그는 `metadata.appleWebApp.capable`로 대체하므로 `<head>`에서 제거
- `apple-mobile-web-app-status-bar-style` 메타태그는 `metadata.appleWebApp.statusBarStyle`로 대체하므로 `<head>`에서 제거

**결과**: `<head>` 태그에 수동으로 삽입할 내용이 없어지므로, `<head>` 태그 블록 자체를 제거한다.

## 5. 아이콘 파일 계획

### 필요 파일
| 파일 | 크기 | 용도 |
|------|------|------|
| `/public/icons/icon-192x192.png` | 192x192px | 일반 앱 아이콘 |
| `/public/icons/icon-512x512.png` | 512x512px | 스플래시 스크린, maskable |

### placeholder 아이콘 생성
실제 디자인 아이콘이 준비되기 전까지, 검정 배경에 흰색 "M" 문자가 표시되는 최소한의 placeholder PNG를 생성한다. Node.js 스크립트로 프로그래밍적으로 생성하거나, 수동으로 교체 가능하도록 `.gitkeep` 대신 실제 파일을 배치한다.

> **주의**: 현재 `public/icons/`에는 `.gitkeep`만 존재하여 `icon-192.png`, `icon-512.png` 경로가 모두 404를 반환한다. 이것이 아이콘 미표시의 직접적 원인이다.

## 6. 시퀀스 흐름

### iOS Safari '홈 화면에 추가' 시나리오
```
1. 사용자가 iOS Safari에서 앱 접속
2. Safari가 <link rel="manifest" href="/manifest.json"> 감지
3. Safari가 manifest.json 파싱 → display: "standalone" 확인
4. Safari가 <meta name="apple-mobile-web-app-capable" content="yes"> 감지
5. 사용자가 '공유' → '홈 화면에 추가' 실행
6. Safari가 apple-touch-icon (192x192) 또는 manifest icons에서 아이콘 로드
7. 홈 화면에 "My Life OS" 이름과 아이콘으로 바로가기 생성
8. 홈 화면에서 앱 탭 → standalone 모드로 실행 (주소창 없음)
9. status bar 스타일: default (검정 텍스트 + 투명 배경)
```

### Android Chrome '앱 설치' 시나리오
```
1. 사용자가 Chrome에서 앱 접속
2. Chrome이 manifest.json 파싱 → display: "standalone" + icons 확인
3. 설치 가능 여부 판단 (HTTPS + manifest + icons 조건 충족)
4. '앱 설치' 프롬프트 또는 메뉴에서 설치
5. 홈 화면에 앱 아이콘 생성
6. standalone 모드로 실행 (주소창 없음)
```

## 7. 영향 범위

### 수정 필요 파일
| 파일 | 변경 내용 |
|------|-----------|
| `public/manifest.json` | theme_color, scope, 아이콘 파일명 수정 |
| `app/layout.tsx` | Metadata/Viewport 설정 보완, 수동 `<head>` 태그 정리 |

### 신규 생성 파일
| 파일 | 내용 |
|------|------|
| `public/icons/icon-192x192.png` | 192x192 placeholder 아이콘 |
| `public/icons/icon-512x512.png` | 512x512 placeholder 아이콘 |

### 삭제 가능 파일
| 파일 | 이유 |
|------|------|
| `public/icons/.gitkeep` | 실제 아이콘 파일이 추가되므로 불필요 |

## 8. 성능 고려사항

### 캐싱
- `manifest.json`은 Vercel CDN에서 자동 캐싱됨
- 아이콘 파일은 `public/` 디렉토리에서 제공되므로 Vercel의 정적 파일 캐싱 적용
- 매니페스트 변경 시 브라우저 캐시 무효화를 위해 Vercel의 자동 캐시 버스팅에 의존

### 아이콘 최적화
- PNG 파일은 가능한 한 최적화(압축)하여 로드 시간 최소화
- maskable 아이콘의 safe zone (아이콘 중앙 80% 영역)에 핵심 그래픽 배치

## 변경 이력
| 날짜 | 변경 내용 | 이유 |
|------|-----------|------|
| 2026-02-23 | 초기 설계서 작성 | F-04 PWA 지원 기능 구현 착수 |
