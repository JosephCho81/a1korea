# a1kor.com — 정적 3사이트

빌드 없음. HTML/CSS/JS 원본 그대로 Vercel 배포. `vercel.json`이 호스트별 rewrite 담당.
`samples/`는 시안 작업 폴더(git 제외) — 3D 수정은 여기서 확인 후 main/hub로 복사.

| 사이트 | 디렉터리 | 주소 | 자산 경로 규칙 |
|---|---|---|---|
| 허브 | `hub/` | a1kor.com (루트 rewrite) | **절대경로** `/hub/js/...` (루트에서 서빙되므로 상대경로 불가) |
| 원자재 | `main/` | material.a1kor.com | **상대경로** `js/...` `media/...` (`/(.*)`→`/main/$1` rewrite) |
| 글러브 | `glove/` | glove.a1kor.com | **상대경로** `css/...` (`/(.*)`→`/glove/$1` rewrite) |

## 파일 맵 — 디자인 수정 시 여는 파일

### hub/ (진입 스플릿 화면, 2026-11 3D 개편)
- `index.html` — CSS·JS 인라인 (토큰은 `<style>` 맨 위 `:root`). 왼쪽 원자재 / 오른쪽 글러브 패널, 마우스 올린 쪽이 넓어짐
- `js/steel-line.js` — main과 같은 파일. `mount(el, null, { view })`로 라벨 없이 한 장면 고정
- `js/glove-line.js` — 니트릴 딥핑 라인(손 모양 틀 → 응고제 · 니트릴 · 세척조 → 탈형 → 상자 포장). 상자 디자인은 `boxMaterials()` (Glovetree 파랑 · 검정 · 오트밀, `glove/img/box-*.jpg` 실물 기준)
- `img/a1-logo.png` — 로고
- 경로는 절대경로(`/hub/js/...`)라 file://로는 안 열림 → 확인은 http 서버나 `samples/hub-3d.html`(상대경로 사본)

### main/ (원자재 · 단일 페이지, 2026-11 전면 개편)
- `index.html` — CSS·JS 인라인 (토큰은 `<style>` 맨 위 `:root`). base64 로고 없음
  - 순서: nav → 3D 공정도(`#process`, 첫 화면) → 취급 품목(`#items`) → 원료가 오는 길(`#story`, 영상 4장면) → 문의(`#contact`)
  - `?hero=video` 면 용해로 영상 첫 화면 (기본은 3D)
- `js/steel-line.js` — three r147 아이소메트릭 제강 · 알루미늄 라인. 라벨(`L`) · 카메라 단계(`steps`)가 `#cap .c` 캡션 순서와 1:1. **hub/js에 같은 사본** — 고치면 둘 다 복사
- `js/data.js` — 품목 스펙 데이터(`PD`) · **품목 내용 수정은 여기만**
- `media/` — 영상(1080p, crf27) · 포스터 · `img/` 품목 참고 사진 (Pexels). 원본은 `samples/media/raw`(git 제외)

### glove/ (글러브트리 · 단일 랜딩)
- `css/base.css` — **디자인 토큰** · 리셋
- `css/nav.css` — 탑바 · 네비 · 햄버거 · `.nav-links.open` 드로어
- `css/hero.css` — 섹션 공통 · 히어로 · 선택 가이드 · 배지
- `css/content.css` — 문제제기 · AQL · 특징 · 오트밀 · 라인업 · 소재비교 · 사이즈 · 사용장면
- `css/faq-footer.css` — FAQ · CTA · 푸터 · `.rv` 등장 애니메이션
- `css/responsive.css` — 900px 이하
- `js/nav.js` `js/faq.js` `js/reveal.js`

## 토큰 절약 규칙 (디자인 변경 작업)

1. **glove의 index.html은 열지 말 것.** 색/여백/폰트/그림자/반응형은 전부 `css/`에 있음.
   클래스명을 모르면 `grep -n "클래스명" <site>/css/*.css`로 파일부터 특정.
2. **색·폰트 전역 변경은 `:root` 토큰만 수정.** glove는 `css/base.css`, main·hub는 `index.html` `<style>` 맨 위.
3. `glove/index.html`은 base64 로고가 한 줄에 30KB씩 박혀 있음 →
   **전체 Read 금지.** 필요하면 `sed -n 'A,Bp'`로 구간만.
4. 마크업을 꼭 바꿔야 하면 `grep -n`으로 위치 찾고 Edit로 그 줄만.
5. 검증은 `python -m http.server 8899` 후 `/main/index.html` 등으로 확인. rewrite 없이도
   상대경로라 그대로 동작 (hub는 `/hub/index.html`).
