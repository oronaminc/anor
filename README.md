# 명동 길거리 음식 가이드 (Myeongdong Street Food Guide)

Next.js (App Router) + Neon(Postgres) + Cloudflare R2 + 비밀번호 쿠키 인증.

## 로컬 실행

```bash
npm install
npm run dev          # http://localhost:3000  (DATABASE_URL 없으면 데모 데이터)
```

## 환경 변수

`.env.local.example` 를 복사해 채웁니다.

```bash
cp .env.local.example .env.local
```

핵심: `DATABASE_URL`, `ADMIN_PASSWORD`, `SESSION_SECRET`, `IP_HASH_SALT`,
`R2_*`(이미지 업로드), `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.

## 데이터베이스 (Neon)

```bash
psql "$DATABASE_URL" -f db/schema.sql     # 테이블 + 함수
psql "$DATABASE_URL" -f db/seed.sql       # (선택) 샘플 8종
```

## 관리자

`/admin/login` 에서 `ADMIN_PASSWORD` 로 로그인.

## 스크립트

```bash
npm run build      # 프로덕션 빌드
npm run start      # 프로덕션 서버
npm run lint
npm run typecheck
npm run test       # vitest (unit)
npm run test:e2e   # playwright (e2e)
```

## 배포

[DEPLOY.md](./DEPLOY.md) 참고.
