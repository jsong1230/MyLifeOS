# F-04 PWA 지원 -- 테스트 명세

## 참조
- 설계서: docs/specs/F-04/design.md
- 인수조건: docs/project/features.md #F-04

## 단위 테스트

### manifest.json 검증
| 대상 | 시나리오 | 입력 | 예상 결과 |
|------|----------|------|-----------|
| manifest.json | JSON 파싱 가능 여부 | manifest.json 파일 내용 | 유효한 JSON으로 파싱됨 |
| manifest.json | name 필드 존재 | manifest.json | `name` === "My Life OS" |
| manifest.json | short_name 필드 존재 | manifest.json | `short_name` === "MyLifeOS" |
| manifest.json | display 필드 값 | manifest.json | `display` === "standalone" |
| manifest.json | start_url 필드 값 | manifest.json | `start_url` === "/" |
| manifest.json | theme_color 필드 값 | manifest.json | `theme_color`이 유효한 색상 코드 |
| manifest.json | background_color 필드 값 | manifest.json | `background_color`이 유효한 색상 코드 |
| manifest.json | icons 배열에 192x192 아이콘 존재 | manifest.json | icons 배열에 sizes "192x192"인 항목 1개 이상 |
| manifest.json | icons 배열에 512x512 아이콘 존재 | manifest.json | icons 배열에 sizes "512x512"인 항목 1개 이상 |
| manifest.json | icons 배열에 maskable 아이콘 존재 | manifest.json | icons 배열에 purpose "maskable"인 항목 1개 이상 |
| manifest.json | 아이콘 type이 image/png | manifest.json | 모든 아이콘의 type === "image/png" |
| manifest.json | scope 필드 존재 | manifest.json | `scope` === "/" |

### 아이콘 파일 존재 검증
| 대상 | 시나리오 | 입력 | 예상 결과 |
|------|----------|------|-----------|
| icon-192x192.png | 파일 존재 여부 | 파일 시스템 체크 | `/public/icons/icon-192x192.png` 파일 존재 |
| icon-512x512.png | 파일 존재 여부 | 파일 시스템 체크 | `/public/icons/icon-512x512.png` 파일 존재 |
| icon-192x192.png | 파일 크기 0 아님 | 파일 시스템 체크 | 파일 크기 > 0 bytes |
| icon-512x512.png | 파일 크기 0 아님 | 파일 시스템 체크 | 파일 크기 > 0 bytes |

### layout.tsx 메타데이터 검증
| 대상 | 시나리오 | 입력 | 예상 결과 |
|------|----------|------|-----------|
| metadata | manifest 경로 설정 | metadata 객체 | `manifest` === "/manifest.json" |
| metadata | appleWebApp.capable 설정 | metadata 객체 | `appleWebApp.capable` === true |
| metadata | appleWebApp.statusBarStyle 설정 | metadata 객체 | `appleWebApp.statusBarStyle` === "default" |
| metadata | appleWebApp.title 설정 | metadata 객체 | `appleWebApp.title` === "My Life OS" |
| viewport | themeColor 설정 | viewport 객체 | `themeColor`이 유효한 색상 코드 |
| viewport | viewportFit 설정 | viewport 객체 | `viewportFit` === "cover" |

## 통합 테스트

### HTTP 응답 검증 (개발 서버 기준)
| API | 시나리오 | 입력 | 예상 결과 |
|-----|----------|------|-----------|
| GET /manifest.json | 매니페스트 접근 가능 | HTTP GET 요청 | 200 OK, Content-Type: application/json |
| GET /icons/icon-192x192.png | 192 아이콘 접근 가능 | HTTP GET 요청 | 200 OK, Content-Type: image/png |
| GET /icons/icon-512x512.png | 512 아이콘 접근 가능 | HTTP GET 요청 | 200 OK, Content-Type: image/png |

### HTML 메타태그 렌더링 검증
| 대상 | 시나리오 | 입력 | 예상 결과 |
|------|----------|------|-----------|
| HTML head | manifest link 태그 존재 | 루트 페이지 HTML | `<link rel="manifest" href="/manifest.json">` 포함 |
| HTML head | apple-mobile-web-app-capable 메타태그 | 루트 페이지 HTML | `<meta name="apple-mobile-web-app-capable" content="yes">` 포함 |
| HTML head | apple-mobile-web-app-status-bar-style 메타태그 | 루트 페이지 HTML | `<meta name="apple-mobile-web-app-status-bar-style" content="default">` 포함 |
| HTML head | apple-mobile-web-app-title 메타태그 | 루트 페이지 HTML | `<meta name="apple-mobile-web-app-title" content="My Life OS">` 포함 |
| HTML head | theme-color 메타태그 | 루트 페이지 HTML | `<meta name="theme-color" content="...">` 포함 |
| HTML head | apple-touch-icon link 태그 | 루트 페이지 HTML | `<link rel="apple-touch-icon" href="/icons/icon-192x192.png">` 포함 |

## 경계 조건 / 에러 케이스

- manifest.json 아이콘 경로에 지정된 파일이 실제로 존재하지 않는 경우 (404 반환) -- 현재 발생 중인 버그
- manifest.json이 유효하지 않은 JSON인 경우 (파싱 실패)
- 아이콘 파일이 손상된 PNG인 경우 (브라우저에서 대체 아이콘 표시)
- viewport 설정에서 userScalable: false 적용 시 접근성(a11y) 관련 경고 가능성
- `display: standalone` 모드에서 뒤로가기 네비게이션이 없는 경우 사용자 경험 저하 (앱 내 네비게이션으로 해결 필요)

## 수동 검증 체크리스트 (자동화 불가 항목)

### iOS Safari (AC-03, AC-04)
- [ ] iOS Safari에서 앱 접속 후 '공유' > '홈 화면에 추가' 실행
- [ ] 홈 화면에 "My Life OS" 이름과 아이콘이 정상 표시되는지 확인
- [ ] 홈 화면에서 앱 탭 시 주소창 없이 전체 화면(standalone)으로 실행되는지 확인
- [ ] status bar가 default 스타일(검정 텍스트)로 표시되는지 확인
- [ ] 앱을 백그라운드로 보냈다가 다시 열었을 때 standalone 모드 유지되는지 확인

### Android Chrome
- [ ] Chrome에서 앱 접속 후 '앱 설치' 또는 메뉴에서 설치
- [ ] 홈 화면에 앱 아이콘 정상 표시 확인
- [ ] standalone 모드로 실행 확인 (주소창 없음)

### Desktop Chrome
- [ ] 주소창에 앱 설치 아이콘이 표시되는지 확인
- [ ] Lighthouse PWA 감사에서 기본 항목 통과 확인
