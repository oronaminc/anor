# 배포 가이드 (Deploy)

명동 길거리 음식 가이드 배포 가이드. 공개 페이지는 **로그인 없이** 쓰고,
`/admin`은 **비밀번호로 나만** 접근합니다.

스택: **Next.js + Neon(Postgres) + Cloudflare R2(이미지) + 비밀번호 쿠키 인증**.

---

## 0. 한눈에 보기

| 영역 | 동작 |
| --- | --- |
| 공개 페이지 (홈/검색/지도/상세) | 로그인 불필요 |
| 좋아요 | 로그인 불필요 · **IP당 1회** (DB UNIQUE) + localStorage + rate limit |
| 조회수 | 자동 집계 · 6시간 디바이스 중복 방지 + rate limit |
| 검색어 수집 | 자동 집계 → `/admin/analytics` |
| 이미지 | **R2에 저장**, DB엔 URL(위치)만 |
| `/admin` | **비밀번호 + 서명 쿠키** · 검색엔진 noindex · API 외부호출 차단 |

---

## 1. Neon 데이터베이스

1. https://neon.tech 에서 프로젝트 생성.
2. 스키마 적용 (로컬에서 `psql` 또는 Neon SQL Editor에 붙여넣기):
   ```bash
   psql "$DATABASE_URL" -f db/schema.sql
   psql "$DATABASE_URL" -f db/seed.sql   # (선택) 샘플 8개
   ```
   `db/schema.sql` 은 테이블(foods/food_likes/search_events) + 함수
   (increment_view_count / toggle_like / log_search)를 만듭니다. RLS·역할은
   없습니다 — 모든 DB 접근은 서버에서 `DATABASE_URL` 한 역할로만 일어나고,
   인가는 앱 레이어(비밀번호 세션)가 담당합니다.
3. **Connection string**(pooled)을 복사 → 배포 환경변수 `DATABASE_URL`.

## 2. 관리자 로그인 (나만)

비밀번호 1개 + 서명된 HttpOnly 쿠키. 유저 테이블·외부 인증 서비스 없음.

- `ADMIN_PASSWORD` : 강한 비밀번호 (또는 `ADMIN_PASSWORD_HASH` = sha256 hex)
- `SESSION_SECRET` : 쿠키 서명용 랜덤 문자열 (`openssl rand -hex 32`)

> 비밀번호를 모르면 아무도 `/admin`에 못 들어갑니다. `ADMIN_PASSWORD`/
> `ADMIN_PASSWORD_HASH`를 둘 다 비워두면 로그인은 **비활성화**(잠김)됩니다.

## 3. Cloudflare R2 (이미지)

1. Cloudflare 대시보드 → R2 → 버킷 생성 (예: `anor-thumbnails`).
2. **R2 API 토큰**(Access Key/Secret) 발급.
3. 버킷 **Public access**(r2.dev) 또는 커스텀 도메인 연결 → 그 URL이
   `R2_PUBLIC_BASE_URL`.
4. 환경변수: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
   `R2_BUCKET`, `R2_PUBLIC_BASE_URL`.

> 동작: admin에서 이미지를 업로드하면 **R2에 저장**되고 **DB엔 그 공개 URL만**
> 저장됩니다. R2 미설정 시 admin 폼에서 이미지 **URL 직접 입력**으로 대체 가능.

## 4. Google Maps (선택)

- Cloud Console → "Maps JavaScript API" 활성화 → 키 발급 → 도메인 제한.
- 키가 없어도 앱은 동작합니다(지도 자리에 안내 문구).

## 5. 환경변수 (요약)

`.env.local.example` 참고. 필수:

```
DATABASE_URL=postgresql://...neon.tech/...?sslmode=require
ADMIN_PASSWORD=...              # 또는 ADMIN_PASSWORD_HASH
SESSION_SECRET=$(openssl rand -hex 32)
IP_HASH_SALT=$(openssl rand -hex 32)
NEXT_PUBLIC_SITE_URL=https://your-domain.com
# R2 (이미지 업로드 쓸 경우)
R2_ACCOUNT_ID=...  R2_ACCESS_KEY_ID=...  R2_SECRET_ACCESS_KEY=...
R2_BUCKET=...      R2_PUBLIC_BASE_URL=https://pub-xxxx.r2.dev
```

권장: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `ALLOWED_ORIGINS`,
`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`(분산 rate limit).

## 6. Vercel 배포

1. GitHub 저장소를 Vercel에 Import.
2. 위 환경변수 등록 (Production + Preview).
3. Deploy (`next build`, Node 22).
4. 배포 후 `NEXT_PUBLIC_SITE_URL`을 실제 도메인으로 맞추고 재배포.

> Neon 서버리스 드라이버는 HTTP로 동작해 Vercel/엣지에서 커넥션 풀 문제 없이
> 잘 맞습니다. 다른 호스팅(Cloudflare/OCI 등)도 동일하게 동작합니다.

## 7. 배포 후 점검

- [ ] 홈/검색/지도/상세가 로그인 없이 열린다.
- [ ] 상세에서 **좋아요** 토글 → 새로고침해도 유지, 카운트 반영.
- [ ] 같은 기기로 좋아요 연타 → 1로 고정(중복 방지 + rate limit).
- [ ] `/admin` 비로그인 접근 → `/admin/login` 리다이렉트.
- [ ] 틀린 비번 → "비밀번호가 올바르지 않습니다", 맞으면 대시보드.
- [ ] admin에서 음식 추가/수정/삭제, 이미지 업로드 시 R2 URL 저장 확인.
- [ ] `/admin/analytics` 검색어 집계 확인.
- [ ] `https://도메인/robots.txt` 에 `Disallow: /admin` 노출 확인.

## 8. 보안 요약

- **CORS / 외부호출 차단**: `like`/`view`/`search-log` API는 동일 출처만 허용.
- **Rate limit**: IP당 좋아요 20회/10초, 조회 60회/분, 검색로그 40회/분.
  Upstash 설정 시 인스턴스 간 공유, 미설정 시 인메모리 폴백.
- **중복 방지**: DB `food_likes (food_id, ip_hash)` UNIQUE = IP당 1회 보장.
- **개인정보**: 원본 IP 저장 안 함. `sha256(IP + IP_HASH_SALT)` 만 저장.
  위조 가능한 `x-forwarded-for` 대신 `cf-connecting-ip`/`x-real-ip` 우선.
- **admin 비공개**: 미들웨어 + 레이아웃 + 서버액션 3중 게이트(서명 쿠키 검증),
  `noindex`, robots `Disallow`, `Cache-Control: no-store`. API는 원시 DB 오류
  미노출.

## 9. 운영 팁

- `SESSION_SECRET`을 바꾸면 즉시 로그아웃됩니다.
- `IP_HASH_SALT`를 바꾸면 좋아요 중복 상태가 초기화됩니다(누적 카운트는 유지).
- 검색어 분석은 최근 1,000건 기준 집계입니다.
