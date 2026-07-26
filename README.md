# 🍢 anor — 헬로 명동 (명동 올인원 가이드)

서울 명동을 돌아다니는 **일본인 관광객(주 타깃: 20~30대 여성)** 을 위한 모바일 웹앱.
콘텐츠 축은 셋: **길거리 음식 · 올리브영 · 다이소**.
**일본어가 기본**, 한국어가 유일한 추가 언어다.

**프로덕션: [hellomyeongdong.com](https://hellomyeongdong.com)** (Vercel)

```bash
npm install
npm run dev        # → http://localhost:3000 — .env.local 없이도 그냥 뜬다
```

`DATABASE_URL` 이 없으면 내장 샘플 데이터로 렌더되기 때문에 **설정 0으로 UI 작업이
가능하다.** 실제 데이터로 띄우려면 `.env.local` 이 필요하다 → [`DEPLOY.md`](DEPLOY.md).

---

## 세 개의 콘텐츠 축

| 축 | 경로 | 내용 |
|---|---|---|
| 🍢 **길거리 음식** | `/` (홈) | 노점 피드 · 지도 · 검색 |
| 💄 **올리브영** | `/beauty` | K-뷰티 제품 랭킹 + 제품 검색 |
| 🛍️ **다이소** | `/daiso` | 생활용품 랭킹 + 제품 검색 |
| 🔥 **트렌딩** | `/trending` | 세 축을 한 화면에 모은 허브 |
| 🔎 **검색** | `/search` | 세 축 통합 검색 (전체 / 길거리 / 올영 / 다이소 선택) |

각 축마다 랭킹 피드 · 상세 페이지 · 짧은 링크(`/s/{code}`, `/p/{code}`)가 있고,
길거리 음식은 구글 지도(`/map`)가 붙는다.

---

## 스택

**Next.js (App Router)** + TypeScript + Tailwind ·
**Neon Postgres** (raw SQL) · **Cloudflare R2** (이미지) ·
**next-intl** (ja 기본 / ko) · vitest + Playwright

관리자 인증은 외부 서비스 없이 **비밀번호 + 서명된 HttpOnly 쿠키**(Web Crypto HMAC)로 처리한다.

---

## 문서 지도

| 문서 | 무엇이 있나 | 언제 읽나 |
|---|---|---|
| [`CLAUDE.md`](CLAUDE.md) | 아키텍처 · **불변조건** · 디자인 시스템 · i18n 규칙 · 파일 배치 | **코드 고치기 전에** |
| [`SKILL.md`](SKILL.md) | 실행 · 스크린샷 · 검증 · 푸시 · CSV/R2 콘텐츠 관리 절차 | 실제로 뭔가 할 때 |
| [`DEPLOY.md`](DEPLOY.md) | Neon · R2 · Google Maps · Vercel 배포, 환경변수 전체 | 처음 세팅하거나 배포할 때 |

**규칙은 `CLAUDE.md`, 절차는 `SKILL.md`** 로 나눠 두었다. 두 문서가 같은 내용을
중복해 담지 않으니, 카운트·콘텐츠·번역 관련 작업은 두 곳을 함께 봐야 한다.

특히 조심할 것 두 가지 (자세한 건 `CLAUDE.md`):

- **조회수 > 좋아요 불변조건** — SQL 에서 원자적으로 강제한다. 카운트 코드를 만지면
  `tests/unit/counts.test.ts` 를 반드시 돌릴 것.
- **모노크롬 디자인 시스템** — 색은 전부 `app/globals.css` 의 그레이스케일 변수에서
  온다. 컬러 리터럴(`text-pink-*`, `#ff…`)을 새로 넣지 말 것.

---

## 주요 명령

```bash
npm run dev            # 개발 서버
npm run build          # db:push(스키마 동기화) 후 프로덕션 빌드
npm run typecheck      # tsc --noEmit
npm run test           # vitest (단위)
npm run test:e2e       # playwright (빌드 후 chromium + 모바일)
npm run db:push        # db/schema.sql 적용 (멱등, 빌드에 자동 포함)
npm run data:export    # DB → CSV (콘텐츠 관리)
npm run data:sync      # CSV + 이미지 → DB + R2
```

스키마 변경은 **`db/schema.sql` 만 고친다** — 빌드가 자동으로 적용하므로 Neon 콘솔에
직접 SQL 을 붙여넣지 않는다. (자세한 규칙은 `CLAUDE.md`)

---

## 이 저장소의 위치

`Desktop/github` 아래 7개 프로젝트 중 하나다. 다른 프로젝트와 달리 **본체가 Vercel 에
있어서** 로컬 서버는 개발용이고 평소엔 꺼져 있는 게 정상이다.
전체 그림은 [`../README.md`](../README.md), 상태 확인은 `hub` (`hub` → anor 행).
