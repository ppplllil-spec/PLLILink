# PLAVE PLLI - 투표·광고·라디오 정보 공유 플랫폼

## 프로젝트 개요

플레이브(PLAVE) 팬덤 플리(PLLI)들이 모여 투표 정보, 광고 시안 요청, 국내외 라디오 신청 정보를 실시간으로 공유하는 버추얼 아이돌 커뮤니티 웹 애플리케이션입니다. 투표앱별 유용한 팁도 공유하여 팬활동을 더욱 효율적으로 할 수 있습니다.

- **이름**: PLAVE PLLI 커뮤니티 웹앱
- **목표**: 플레이브 팬덤 활동에 필요한 정보를 한곳에서 관리하고 공유
- **콘셉트**: 버추얼 아이돌에 어울리는 사이버틱 네온 디자인
- **주요 기능**:
  - 투표 정보 등록 및 공유
  - 광고 시안 요청 등록
  - 국내외 라디오 신청 정보 관리
  - 투표앱별 팁 공유 및 '도움됨' 반응 시스템

## 🌐 URL

- **개발 서버**: https://3000-i5354ajam1oqpq3wdemye-02b9cc79.sandbox.novita.ai
- **API Base URL**: https://3000-i5354ajam1oqpq3wdemye-02b9cc79.sandbox.novita.ai/api

## ✨ 주요 기능

### 1. 투표 정보 관리
- 투표 제목, 설명, URL, 플랫폼, 마감일 등록
- 플랫폼별 분류 (Twitter, Mnet, Billboard 등)
- 투표 링크 원클릭 이동
- 각 투표별 팁 조회 기능

### 2. 광고 시안 요청 관리
- 광고 제목, 위치, 설명, 연락처 등록
- 상태 관리 (모집중, 진행중, 마감)
- 마감일 설정

### 3. 라디오 신청 정보 관리
- 방송국 및 프로그램 정보 등록
- 국내/해외 분류 필터링
- 신청 방법 및 URL 제공

### 4. 투표 팁 공유 시스템 ⭐ NEW
- 플랫폼별 투표 팁 공유
- 검증된 팁 표시 기능
- '도움됨' 반응 시스템 (중복 방지)
- 도움됨 수에 따른 정렬

## 🏗️ 데이터 아키텍처

### 데이터 모델

#### 1. votes (투표 정보)
- id, title, description, vote_url, deadline, platform, category, created_by, created_at, updated_at

#### 2. ad_requests (광고 시안 요청)
- id, title, description, location, contact_info, deadline, status, category, created_by, created_at, updated_at

#### 3. radio_requests (라디오 신청 정보)
- id, title, station_name, program_name, request_url, request_method, country, description, category, created_by, created_at, updated_at

#### 4. vote_tips (투표 팁)
- id, vote_id (FK), platform, tip_title, tip_content, is_verified, helpful_count, created_by, created_at, updated_at

#### 5. tip_reactions (팁 반응)
- id, tip_id (FK), user_identifier, reaction_type, created_at

### 스토리지 서비스
- **Cloudflare D1 Database**: SQLite 기반 관계형 데이터베이스
- **로컬 개발**: `.wrangler/state/v3/d1` 디렉토리에 로컬 SQLite DB
- **인덱싱**: 생성일시, 카테고리, 상태, 국가, 플랫폼별 인덱스 최적화

### 데이터 흐름
1. 사용자가 웹 UI에서 정보 입력
2. Axios를 통해 Hono API 엔드포인트로 POST 요청
3. Hono가 Cloudflare D1 데이터베이스에 저장
4. GET 요청으로 데이터 조회 및 화면 렌더링
5. 팁 '도움됨' 반응은 localStorage로 사용자 식별 (중복 방지)

## 📡 API 엔드포인트

### 투표 정보 API
- `GET /api/votes` - 투표 목록 조회
- `GET /api/votes/:id` - 투표 상세 조회
- `POST /api/votes` - 투표 생성
- `PUT /api/votes/:id` - 투표 수정
- `DELETE /api/votes/:id` - 투표 삭제

### 광고 시안 요청 API
- `GET /api/ad-requests` - 광고 요청 목록 조회
- `GET /api/ad-requests/:id` - 광고 요청 상세 조회
- `POST /api/ad-requests` - 광고 요청 생성
- `PUT /api/ad-requests/:id` - 광고 요청 수정
- `DELETE /api/ad-requests/:id` - 광고 요청 삭제

### 라디오 신청 정보 API
- `GET /api/radio-requests` - 라디오 정보 목록 조회
- `GET /api/radio-requests?country=domestic` - 국내 라디오만 조회
- `GET /api/radio-requests?country=international` - 해외 라디오만 조회
- `GET /api/radio-requests/:id` - 라디오 정보 상세 조회
- `POST /api/radio-requests` - 라디오 정보 생성
- `PUT /api/radio-requests/:id` - 라디오 정보 수정
- `DELETE /api/radio-requests/:id` - 라디오 정보 삭제

### 투표 팁 API ⭐ NEW
- `GET /api/tips` - 전체 팁 목록 조회 (도움됨 순)
- `GET /api/tips?vote_id=1` - 특정 투표의 팁만 조회
- `GET /api/tips?platform=Twitter` - 특정 플랫폼의 팁만 조회
- `GET /api/tips/:id` - 팁 상세 조회
- `POST /api/tips` - 팁 생성
- `PUT /api/tips/:id` - 팁 수정
- `DELETE /api/tips/:id` - 팁 삭제
- `POST /api/tips/:id/helpful` - 팁에 '도움됨' 반응 추가

## 🎨 사용자 가이드

### 정보 조회하기
1. 상단 탭에서 원하는 카테고리 선택 (투표, 광고, 라디오, 팁)
2. 카드 형태로 표시된 정보 확인
3. 라디오는 국내/해외 필터링 가능

### 새 정보 추가하기
1. 우측 상단 "새 정보 추가" 버튼 클릭
2. 현재 탭에 맞는 폼이 자동으로 표시됨
3. 필수 항목 입력 후 저장

### 투표 팁 활용하기
1. 투표 카드 하단 "이 투표의 팁 보기" 클릭
2. 해당 투표에 관련된 팁만 필터링하여 표시
3. 도움이 된 팁에 '도움됨' 버튼 클릭 (중복 불가)
4. 도움됨이 많은 팁이 상단에 표시됨

### 정보 삭제하기
- 각 카드 우측 상단 휴지통 아이콘 클릭

## 🚀 배포

### 플랫폼
- **Cloudflare Pages** (배포 대기중)

### 상태
- ✅ 로컬 개발 환경 구축 완료
- ✅ D1 데이터베이스 마이그레이션 완료
- ✅ 모든 API 엔드포인트 정상 작동
- ✅ 프론트엔드 UI 완성
- ✅ PLAVE 테마 디자인 적용 (사이버틱 네온 스타일)
- ⏳ Cloudflare Pages 프로덕션 배포 예정

### 기술 스택
- **프론트엔드**: HTML5, Tailwind CSS, Vanilla JavaScript, Axios
- **폰트**: Orbitron (사이버틱 스타일)
- **디자인**: 네온 블루 & 사이버 퍼플 그라데이션, 글로우 효과
- **백엔드**: Hono v4.11.8 (TypeScript)
- **데이터베이스**: Cloudflare D1 (SQLite)
- **빌드 도구**: Vite 6.4.1
- **배포**: Cloudflare Pages, Wrangler 4.63.0

### 디자인 특징 🎨
- **사이버틱 배경**: 다크 테마 + 네온 그리드 효과
- **네온 글로우**: 시안/퍼플 색상의 발광 효과
- **반응형 애니메이션**: 호버 시 카드 확대 및 글로우 강화
- **버추얼 아이돌 콘셉트**: 미래지향적이고 역동적인 UI/UX

### 마지막 업데이트
2026-02-07

## 🛠️ 로컬 개발

### 요구사항
- Node.js 18+
- npm

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 데이터베이스 마이그레이션
npm run db:migrate:local

# 테스트 데이터 시드
npm run db:seed

# 프로젝트 빌드
npm run build

# 개발 서버 시작 (PM2)
pm2 start ecosystem.config.cjs

# 서버 로그 확인
pm2 logs webapp --nostream

# 서버 중지
pm2 stop webapp
```

### 데이터베이스 관리

```bash
# 로컬 DB 리셋 (마이그레이션 + 시드)
npm run db:reset

# 로컬 DB 쿼리 실행
npm run db:console:local -- --command="SELECT * FROM votes"
```

## 📈 향후 개발 계획

### 완료된 기능
- ✅ 투표 정보 CRUD
- ✅ 광고 시안 요청 CRUD
- ✅ 라디오 신청 정보 CRUD
- ✅ 투표앱별 팁 공유 시스템
- ✅ 팁 '도움됨' 반응 시스템
- ✅ 실시간 목록 표시
- ✅ 반응형 UI 디자인

### 추천 개발 항목
1. **사용자 인증 시스템**
   - 로그인/회원가입 기능
   - 작성자 권한 관리

2. **댓글 시스템**
   - 각 정보에 댓글 작성 기능
   - 실시간 댓글 업데이트

3. **검색 및 필터링 강화**
   - 키워드 검색 기능
   - 다중 필터 조합

4. **알림 기능**
   - 마감일 임박 알림
   - 새 투표 정보 알림

5. **이미지 업로드**
   - 광고 시안 이미지 첨부
   - Cloudflare R2 스토리지 활용

6. **통계 대시보드**
   - 가장 인기있는 투표
   - 활동 통계 시각화

## 📝 라이선스

MIT License

## 👥 기여

풀 리퀘스트와 이슈는 언제나 환영합니다!
