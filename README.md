# 미리자리 (MiriJari)

키·취향·동행을 알려주면 콘서트·뮤지컬·영화·스포츠에서 예매 전에 미리 **나에게 맞는 자리 3곳**을 이유와 함께 추천하는 웹 서비스.
서비스 검토와 설계는 [docs/SERVICE_DESIGN.md](docs/SERVICE_DESIGN.md)에 있습니다.

## 로컬 실행

```bash
npm install
npm run dev
```

http://localhost:3000 에서 열립니다. API 키가 하나도 없어도 추천 기능은 전부 동작합니다.

```bash
npm run test:engine   # 추천 엔진 검증 (프로필이 다르면 추천이 달라지는지)
npm run typecheck
```

## 키 설정 (모두 선택)

`.env.example`을 `.env.local`로 복사해 채웁니다.

| 키 | 켜지는 기능 | 발급 |
|---|---|---|
| `KOPIS_API_KEY` | 이번 달~다다음 달 콘서트·뮤지컬 목록 | [KOPIS Open API](https://www.kopis.or.kr/por/cs/openapi/openApiInfo.do) (무료) |
| `KOBIS_API_KEY` | 현재 상영작(일별 박스오피스) | [KOBIS Open API](https://www.kobis.or.kr/kobisopenapi/homepg/main/main.do) (무료) |
| `ANTHROPIC_API_KEY` | AI 코멘트·고민 상담, 예매 화면 캡처 인식 | [Claude Platform](https://platform.claude.com/) (유료, 서버 배포에서만). **현재 보류** — 광고 수입이 생기면 입력 |

공연·영화 목록은 `npm run data`가 받아 `public/data/*.json`에 저장합니다 (`dev`/`build` 전에 자동 실행).

## 배포 ① GitHub Pages (무료, 기본)

1. GitHub에 저장소를 만들고 이 폴더를 `main` 브랜치로 푸시합니다.
2. 저장소 **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 바꿉니다.
3. (선택) **Settings → Secrets and variables → Actions**에 `KOPIS_API_KEY`, `KOBIS_API_KEY`를 등록합니다.
4. 푸시할 때마다, 그리고 매일 05:00(KST)에 [.github/workflows/deploy.yml](.github/workflows/deploy.yml)이 빌드·배포합니다.
   주소는 `https://<아이디>.github.io/<저장소 이름>/` 입니다.

배포 전에 로컬에서 확인하려면 워크플로와 같은 방식으로 빌드한 뒤 `npm run preview:pages`를 실행합니다.

GitHub Pages는 서버가 없는 정적 호스팅이라 **AI 코멘트와 캡처 인식은 꺼진 채** 배포됩니다. 추천 엔진, 좌석 지도, 공연·영화 목록은 모두 동작합니다.

## 배포 ② Vercel (AI 기능까지)

1. [vercel.com](https://vercel.com)에서 같은 GitHub 저장소를 Import 합니다 (설정 변경 없이 Next.js로 인식).
2. Environment Variables에 위 세 키를 넣습니다.
3. `main`에 푸시하면 자동 배포됩니다. 목록을 매일 갱신하려면 Vercel Deploy Hook을 만들어 예약 호출하세요.

## 구조

```
src/lib/engine/   추천 엔진 (grid: 좌석 격자형, zone: 구역형) — 순수 함수, 서버 불필요
src/lib/data/     공연장·경기장·상영관 데이터
src/components/   설문 → 대상 선택 → 결과 화면
src/app/api/      AI 서버 기능 (Vercel 등 서버 배포에서만)
scripts/          데이터 수집, 엔진 검증
```
