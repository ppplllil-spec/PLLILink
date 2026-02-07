# 팬덤 정보 공유 플랫폼

## 프로젝트 개요
- **이름**: 팬덤 정보 공유 플랫폼
- **목표**: 팬들이 모여 투표 정보, 광고 시안 요청, 국내외 라디오 신청 정보를 실시간으로 공유하는 웹 플랫폼
- **주요 기능**:
  - 📊 투표 정보 등록 및 공유
  - 🎨 광고 시안 요청 관리
  - 📻 국내/해외 라디오 신청 정보 제공
  - 실시간 정보 업데이트
  - 카테고리별 필터링 기능

## URLs
- **개발 서버**: https://3000-i5354ajam1oqpq3wdemye-02b9cc79.sandbox.novita.ai
- **API 엔드포인트**:
  - 투표: `/api/votes`
  - 광고 시안: `/api/ad-requests`
  - 라디오: `/api/radio-requests`

## 데이터 아키텍처

### 데이터 모델

#### Votes (투표 정보)
```sql
- id: INTEGER (자동증가)
- title: TEXT (필수) - 투표 제목
- description: TEXT - 설명
- vote_url: TEXT (필수) - 투표 링크
- deadline: DATETIME - 마감일
- platform: TEXT - 플랫폼명 (Twitter, Mnet 등)
- category: TEXT - 카테고리 (기본값: 'vote')
- created_by: TEXT - 작성자
- created_at: DATETIME - 등록일
- updated_at: DATETIME - 수정일
```

#### Ad Requests (광고 시안 요청)
```sql
- id: INTEGER (자동증가)
- title: TEXT (필수) - 제목
- description: TEXT - 설명
- location: TEXT (필수) - 광고 위치
- contact_info: TEXT - 연락처
- deadline: DATETIME - 마감일
- category: TEXT - 카테고리 (기본값: 'ad')
- status: TEXT - 상태 (open, in_progress, closed)
- created_by: TEXT - 작성자
- created_at: DATETIME - 등록일
- updated_at: DATETIME - 수정일
```

#### Radio Requests (라디오 신청 정보)
```sql
- id: INTEGER (자동증가)
- title: TEXT (필수) - 제목
- station_name: TEXT (필수) - 방송국명
- program_name: TEXT - 프로그램명
- request_url: TEXT - 신청 링크
- request_method: TEXT - 신청 방법
- country: TEXT - 국가 (domestic, international)
- category: TEXT - 카테고리 (기본값: 'radio')
- description: TEXT - 설명
- created_by: TEXT - 작성자
- created_at: DATETIME - 등록일
- updated_at: DATETIME - 수정일
```

### 스토리지 서비스
- **Cloudflare D1**: SQLite 기반 관계형 데이터베이스
  - 로컬 개발: `.wrangler/state/v3/d1` (--local 플래그 사용)
  - 프로덕션: webapp-production 데이터베이스

### 데이터 흐름
1. 사용자가 웹 인터페이스에서 정보 등록
2. Axios를 통해 Hono API로 POST 요청
3. Hono 라우트 핸들러가 D1 데이터베이스에 저장
4. 저장된 데이터를 GET 요청으로 실시간 조회
5. 프론트엔드에서 목록으로 표시

## 사용자 가이드

### 투표 정보 등록
1. "투표 정보" 탭 선택
2. 투표 제목과 투표 링크 입력 (필수)
3. 플랫폼, 설명, 마감일, 작성자 정보 입력 (선택)
4. "등록하기" 버튼 클릭
5. 등록된 정보가 아래 목록에 실시간 표시

### 광고 시안 요청
1. "광고 시안 요청" 탭 선택
2. 제목과 위치 입력 (필수)
3. 설명, 연락처, 마감일, 상태, 작성자 입력 (선택)
4. 상태는 "진행중", "작업중", "완료" 중 선택
5. "등록하기" 버튼 클릭

### 라디오 신청 정보
1. "라디오 신청" 탭 선택
2. 제목과 방송국명 입력 (필수)
3. 프로그램명, 국가(국내/해외), 신청 링크, 신청 방법, 설명 입력 (선택)
4. "등록하기" 버튼 클릭
5. "전체", "국내", "해외" 필터로 정보 검색

### 정보 삭제
- 각 카드 우측 상단의 휴지통 아이콘 클릭
- 확인 대화상자에서 "확인" 클릭

## 배포 현황
- **플랫폼**: Cloudflare Pages (준비 중)
- **상태**: ✅ 개발 서버 활성화
- **기술 스택**: 
  - Backend: Hono + TypeScript
  - Frontend: Vanilla JavaScript + Tailwind CSS
  - Database: Cloudflare D1 (SQLite)
  - Deployment: Cloudflare Pages + Wrangler
- **마지막 업데이트**: 2026-02-07

## 로컬 개발 환경 설정

### 필수 요구사항
- Node.js 18+
- npm

### 설치 및 실행
```bash
# 의존성 설치
npm install

# D1 로컬 데이터베이스 마이그레이션
npm run db:migrate:local

# 테스트 데이터 삽입
npm run db:seed

# 프로젝트 빌드
npm run build

# PM2로 개발 서버 시작
pm2 start ecosystem.config.cjs

# 서비스 상태 확인
pm2 list

# 로그 확인
pm2 logs fandom-webapp --nostream

# 서비스 재시작
pm2 restart fandom-webapp

# 서비스 중지
pm2 stop fandom-webapp
```

### 주요 npm 스크립트
```bash
npm run dev              # Vite 개발 서버
npm run build            # 프로덕션 빌드
npm run dev:d1           # D1 연동 개발 서버
npm run db:migrate:local # 로컬 DB 마이그레이션
npm run db:seed          # 테스트 데이터 삽입
npm run db:reset         # DB 초기화 및 재설정
npm run deploy           # Cloudflare Pages 배포
```

## API 문서

### 투표 정보 API

#### GET /api/votes
모든 투표 정보 조회
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "2024 아시아 뮤직 어워드 투표",
      "description": "우리 아티스트 투표 참여 부탁드립니다!",
      "vote_url": "https://example.com/vote/ama2024",
      "deadline": "2024-12-31 23:59:59",
      "platform": "Twitter",
      "category": "vote",
      "created_by": "팬매니저",
      "created_at": "2026-02-07 14:17:49",
      "updated_at": "2026-02-07 14:17:49"
    }
  ]
}
```

#### POST /api/votes
새 투표 정보 등록
```json
// Request
{
  "title": "투표 제목",
  "vote_url": "https://example.com/vote",
  "description": "설명",
  "platform": "Twitter",
  "deadline": "2024-12-31 23:59:59",
  "created_by": "작성자"
}

// Response
{
  "success": true,
  "data": { ... }
}
```

#### DELETE /api/votes/:id
투표 정보 삭제

### 광고 시안 API

#### GET /api/ad-requests
모든 광고 시안 요청 조회

#### POST /api/ad-requests
새 광고 시안 요청 등록
```json
// Request
{
  "title": "강남역 전광판 광고",
  "location": "강남역 11번 출구",
  "description": "설명",
  "contact_info": "email@example.com",
  "deadline": "2024-12-31 23:59:59",
  "status": "open",
  "created_by": "작성자"
}
```

### 라디오 신청 API

#### GET /api/radio-requests?country=domestic
라디오 신청 정보 조회 (필터링 옵션)
- Query Parameter: `country` (domestic, international, 또는 생략)

#### POST /api/radio-requests
새 라디오 신청 정보 등록
```json
// Request
{
  "title": "KBS 쿨FM 신청 방법",
  "station_name": "KBS 쿨FM",
  "program_name": "볼륨을 높여요",
  "request_url": "https://kbs.co.kr/radio/request",
  "request_method": "앱 또는 웹사이트",
  "country": "domestic",
  "description": "평일 저녁 7시~9시 신청 가능",
  "created_by": "작성자"
}
```

## 완료된 기능
- ✅ Cloudflare D1 데이터베이스 설계 및 마이그레이션
- ✅ 투표 정보 CRUD API
- ✅ 광고 시안 요청 CRUD API
- ✅ 라디오 신청 정보 CRUD API (국내/해외 필터링)
- ✅ 반응형 UI (Tailwind CSS)
- ✅ 실시간 데이터 로딩
- ✅ 카테고리별 탭 전환
- ✅ 삭제 기능
- ✅ PM2 프로세스 관리
- ✅ 테스트 데이터 시딩

## 미구현 기능 및 개선 사항
- ⏳ 투표/광고/라디오 정보 수정 기능
- ⏳ 사용자 인증 및 권한 관리
- ⏳ 이미지 업로드 (Cloudflare R2 연동)
- ⏳ 검색 기능
- ⏳ 페이지네이션
- ⏳ 좋아요/북마크 기능
- ⏳ 댓글 시스템
- ⏳ 알림 기능
- ⏳ Cloudflare Pages 프로덕션 배포

## 추천 다음 단계
1. **수정 기능 구현**: PUT API와 수정 UI 추가
2. **검색 기능**: 제목/설명 기반 전체 검색
3. **페이지네이션**: 대량 데이터 처리를 위한 페이징
4. **사용자 인증**: Cloudflare Access 또는 OAuth 연동
5. **프로덕션 배포**: Cloudflare Pages에 배포 및 커스텀 도메인 설정

## 프로젝트 구조
```
webapp/
├── src/
│   ├── index.tsx              # 메인 애플리케이션 + UI
│   ├── types/
│   │   └── index.ts           # TypeScript 타입 정의
│   └── routes/
│       ├── votes.ts           # 투표 API 라우트
│       ├── adRequests.ts      # 광고 시안 API 라우트
│       └── radioRequests.ts   # 라디오 API 라우트
├── migrations/
│   └── 0001_initial_schema.sql # D1 데이터베이스 스키마
├── dist/                      # 빌드 결과물
├── .wrangler/                 # 로컬 D1 데이터베이스
├── seed.sql                   # 테스트 데이터
├── ecosystem.config.cjs       # PM2 설정
├── wrangler.jsonc            # Cloudflare 설정
├── package.json              # 프로젝트 의존성
└── README.md                 # 프로젝트 문서

```

## 기술 스택 상세
- **Backend Framework**: Hono 4.11+ (경량 엣지 웹 프레임워크)
- **Frontend**: Vanilla JavaScript + Tailwind CSS 3.x
- **Database**: Cloudflare D1 (SQLite)
- **HTTP Client**: Axios 1.6+
- **Icons**: Font Awesome 6.4+
- **Build Tool**: Vite 6.x
- **Process Manager**: PM2
- **TypeScript**: 5.x
- **Deployment**: Cloudflare Pages + Wrangler 4.x

## 라이선스
MIT License

## 기여자
- 개발: AI Assistant
- 기획: 팬덤 커뮤니티

---

**팬들을 위한, 팬들에 의한 정보 공유 서비스** 💜
