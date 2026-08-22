# a1kor.com — 정적 3사이트

빌드 없음. HTML/CSS/JS 원본 그대로 Vercel 배포. `vercel.json`이 호스트별 rewrite 담당.

| 사이트 | 디렉터리 | 주소 | 자산 경로 규칙 |
|---|---|---|---|
| 허브 | `hub/` | a1kor.com (루트 rewrite) | **절대경로** `/hub/css/...` (루트에서 서빙되므로 상대경로 불가) |
| 원자재 | `main/` | material.a1kor.com | **상대경로** `css/...` (`/(.*)`→`/main/$1` rewrite) |
| 글러브 | `glove/` | glove.a1kor.com | **상대경로** `css/...` (`/(.*)`→`/glove/$1` rewrite) |

## 파일 맵 — 디자인 수정 시 여는 파일

### hub/ (진입 스플릿 화면)
- `css/layout.css` — 스테이지·패널·배경이미지·세로 구분선
- `css/panel.css` — 패널 태그/타이틀/서브 타이포
- `css/buttons.css` — 사이트 입장 버튼 · 시장 뉴스 버튼
- `css/header.css` — 상단 로고바 · 하단 힌트 · 진입 애니메이션 · 전환 플래시
- `css/responsive.css` — 768px 이하
- `js/hub.js` — 패널 클릭 시 플래시 후 이동

### main/ (원자재 · 해시 라우팅 SPA)
- `css/base.css` — **디자인 토큰(`:root` 색·폰트)** · 리셋
- `css/nav.css` — 상단 바 · 네비 · 햄버거 · 모바일 드로어
- `css/hero.css` — 화면 전환(`.pv`) · 히어로 · 히어로 통계바
- `css/sections.css` — 공통 섹션 · 필러 · 품목 카드 · 역량 · 네트워크
- `css/footer.css` — 다크 문의 배너 · 푸터
- `css/modal.css` — 품목 상세 모달
- `css/pages.css` — 회사소개 / 거래역량 / 문의 페이지 전용
- `css/responsive.css` — 1024 / 768 / 400px (다수 `!important`)
- `css/map.css` — Leaflet 라벨 오버라이드
- `js/data.js` — 품목 스펙 데이터(`PD`) · **내용 수정은 여기만**
- `js/modal.js` `js/nav.js` `js/router.js` `js/form.js` `js/reveal.js` `js/map.js`

### glove/ (글러브트리 · 단일 랜딩)
- `css/base.css` — **디자인 토큰** · 리셋
- `css/nav.css` — 탑바 · 네비 · 햄버거 · `.nav-links.open` 드로어
- `css/hero.css` — 섹션 공통 · 히어로 · 선택 가이드 · 배지
- `css/content.css` — 문제제기 · AQL · 특징 · 오트밀 · 라인업 · 소재비교 · 사이즈 · 사용장면
- `css/faq-footer.css` — FAQ · CTA · 푸터 · `.rv` 등장 애니메이션
- `css/responsive.css` — 900px 이하
- `js/nav.js` `js/faq.js` `js/reveal.js`

## 토큰 절약 규칙 (디자인 변경 작업)

1. **index.html은 열지 말 것.** 색/여백/폰트/그림자/반응형은 전부 `css/`에 있음.
   클래스명을 모르면 `grep -n "클래스명" <site>/css/*.css`로 파일부터 특정.
2. **색·폰트 전역 변경은 `css/base.css`의 `:root` 토큰만 수정.** main/glove 모두 토큰 기반.
   (hub는 토큰 없이 하드코딩 — `css/layout.css`·`panel.css` 직접 수정)
3. `main/index.html`·`glove/index.html`은 base64 로고가 한 줄에 30KB씩 박혀 있음 →
   **전체 Read 금지.** 필요하면 `sed -n 'A,Bp'`로 구간만.
4. 마크업을 꼭 바꿔야 하면 `grep -n`으로 위치 찾고 Edit로 그 줄만.
5. 검증은 `python -m http.server 8899` 후 `/main/index.html` 등으로 확인. rewrite 없이도
   상대경로라 그대로 동작 (hub는 `/hub/index.html`).
