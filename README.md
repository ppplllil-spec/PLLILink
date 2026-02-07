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
  - **링크 자동 인식** ⭐ - URL 입력 시 자동으로 제목, 설명 등 메타데이터 추출
  - **일정 관리** ⭐ - 오늘 마감 투표, 매일 반복 투표, 오늘 라디오 요청
  - **해외 라디오 예시문** ⭐ NEW - 방송국별 신청 예시문 제공 및 원클릭 복사
  - **PWA 지원** ⭐ NEW - 스마트폰 홈 화면에 앱으로 설치 가능

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

### 5. 링크 자동 인식 기능 ⭐
- URL 입력 시 자동으로 웹페이지 메타데이터 추출
- Open Graph 및 일반 메타태그 파싱
- 제목, 설명, 플랫폼/방송국 정보 자동 입력
- 실시간 로딩 표시 및 성공 메시지
- 투표 URL 및 라디오 신청 URL 지원

### 6. 일정 관리 기능 ⭐
- **오늘 마감 투표**: 오늘 마감 예정인 투표 한눈에 확인
- **매일 반복 투표**: 매일 특정 시간에 진행되는 투표 등록
- **오늘 라디오 요청**: 오늘 신청해야 하는 라디오 정보
- 요일별 반복 설정 (월, 수, 금 등)
- 알림 시간 설정

### 7. 해외 라디오 예시문 ⭐ NEW
- **8개 주요 방송국 예시문 제공**:
  - BBC Radio 1, iHeartRadio, Z100 New York
  - Kiss FM UK, Capital FM
  - KBS 쿨FM, MBC FM4U, SBS 파워FM
- 아티스트명/곡명 실시간 치환
- 원클릭 복사 기능
- 한국어/영어 예시문 자동 구분
- 커스터마이징 가능한 신청 템플릿

### 8. PWA (Progressive Web App) 지원 ⭐ NEW
- **스마트폰 홈 화면에 앱으로 설치 가능**
- Android: 자동 설치 안내 배너 표시
- iOS: Safari 공유 메뉴에서 "홈 화면에 추가"
- 오프라인 캐싱 지원 (Service Worker)
- 앱 아이콘 및 스플래시 스크린
- 독립 실행형(Standalone) 모드

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

#### 6. radio_templates (라디오 예시문) ⭐ NEW
- id, station_name, template_text, language, template_type, placeholder_fields, example_text, created_at, updated_at

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

### 유틸리티 API ⭐
- `POST /api/utils/fetch-metadata` - URL 메타데이터 추출
  - Body: `{ "url": "https://example.com" }`
  - Response: `{ "success": true, "data": { "title": "...", "description": "...", "site_name": "...", "url": "..." } }`

### 일정 관리 API ⭐ NEW
- `GET /api/schedule/today` - 오늘의 일정 조회 (마감 투표, 반복 투표, 라디오)
- `GET /api/schedule/upcoming` - 다가오는 일정 (7일)
- `GET /api/schedule/recurring` - 모든 반복 일정 조회

### 라디오 예시문 API ⭐ NEW
- `GET /api/radio-templates` - 모든 예시문 조회
- `GET /api/radio-templates/station/:stationName` - 특정 방송국 예시문 조회
- `POST /api/radio-templates/generate` - 아티스트/곡명 치환하여 텍스트 생성
  - Body: `{ "template_id": 1, "artist_name": "PLAVE", "song_name": "Way 4 Luv" }`
- `POST /api/radio-templates` - 새 예시문 추가 (커뮤니티 기여용)

## 🎨 사용자 가이드

### 정보 조회하기
1. 상단 탭에서 원하는 카테고리 선택 (투표, 광고, 라디오, 팁)
2. 카드 형태로 표시된 정보 확인
3. 라디오는 국내/해외 필터링 가능

### 새 정보 추가하기
1. 우측 상단 "새 정보 추가" 버튼 클릭
2. 현재 탭에 맞는 폼이 자동으로 표시됨
3. 필수 항목 입력 후 저장

### 링크 자동 인식 기능 사용하기 ⭐ NEW
1. 투표 또는 라디오 정보 추가 시 URL 필드에 링크 입력
2. URL 입력 후 다른 필드를 클릭하거나 Tab 키 누르기
3. 자동으로 제목, 설명, 플랫폼/방송국 정보가 채워짐
4. 원하는 경우 자동 입력된 정보를 수정 가능
5. 로딩 중에는 스피너 표시, 완료 시 체크 아이콘과 메시지 표시

### 투표 팁 활용하기
1. 투표 카드 하단 "이 투표의 팁 보기" 클릭
2. 해당 투표에 관련된 팁만 필터링하여 표시
3. 도움이 된 팁에 '도움됨' 버튼 클릭 (중복 불가)
4. 도움됨이 많은 팁이 상단에 표시됨

### 정보 삭제하기
- 각 카드 우측 상단 휴지통 아이콘 클릭

### 해외 라디오 예시문 사용하기 ⭐ NEW
1. 라디오 정보 카드에서 "예시문" 버튼 클릭 (해외 라디오만)
2. 방송국별 예시문 모달 열림
3. 아티스트명과 곡명 입력 (기본값: PLAVE, Way 4 Luv)
4. 실시간으로 텍스트 자동 생성
5. "복사하기" 버튼으로 클립보드에 복사
6. 방송국 홈페이지나 앱에서 붙여넣기

### 앱으로 설치하기 (PWA) ⭐ NEW
#### Android (Chrome, Samsung Internet)
1. 웹사이트 접속 시 하단에 "앱으로 설치하기" 배너 표시
2. "설치하기" 버튼 클릭
3. 홈 화면에 앱 아이콘 추가 완료

#### iOS (Safari)
1. Safari에서 웹사이트 접속
2. 하단 공유 버튼 (⬆️) 클릭
3. "홈 화면에 추가" 선택
4. "추가" 버튼 클릭
5. 홈 화면에 앱 아이콘 추가 완료

#### 설치 후 장점
- 독립된 앱처럼 실행 (브라우저 UI 없음)
- 빠른 접속 (홈 화면에서 바로 실행)
- 오프라인에서도 일부 기능 사용 가능
- 푸시 알림 지원 (향후 추가 예정)

## 💰 비용 정보

### 100% 무료! 추가 비용 없음

이 프로젝트는 **Cloudflare의 무료 플랜**으로 운영되며, 일반적인 팬덤 활동 규모에서는 **영구적으로 무료**입니다.

#### Cloudflare Pages (무료 플랜)
- ✅ 무제한 요청 (트래픽 제한 없음)
- ✅ 무료 SSL 인증서 (HTTPS)
- ✅ 글로벌 CDN (빠른 접속 속도)
- ✅ 자동 배포 및 버전 관리

#### Cloudflare D1 Database (무료 플랜)
- ✅ 일일 읽기: 100,000건 (충분!)
- ✅ 일일 쓰기: 50,000건 (충분!)
- ✅ 저장 공간: 5GB (수백만 개 데이터 저장 가능)

#### Cloudflare Workers (무료 플랜)
- ✅ 일일 요청: 100,000건
- ✅ CPU 시간: 10ms/요청

### 유료가 필요한 경우는?

**거의 없습니다!** 다음과 같은 극단적인 경우에만 필요:
- 하루 10만 명 이상 동시 접속 (전국 규모 이벤트)
- 데이터베이스 5GB 초과 (수백만 개 데이터)

**결론**: 일반적인 팬덤 커뮤니티 사용량으로는 **영원히 무료**입니다! 🎉

## 🚀 배포

### 플랫폼
- **Cloudflare Pages** (배포 대기중)

### 상태
- ✅ 로컬 개발 환경 구축 완료
- ✅ D1 데이터베이스 마이그레이션 완료
- ✅ 모든 API 엔드포인트 정상 작동
- ✅ 프론트엔드 UI 완성
- ✅ PLAVE 테마 디자인 적용 (사이버틱 네온 스타일)
- ✅ 링크 자동 인식 기능 (URL 메타데이터 추출)
- ✅ 일정 관리 기능 (오늘 마감, 매일 반복, 라디오 요청)
- ✅ 해외 라디오 예시문 (8개 방송국, 원클릭 복사)
- ✅ PWA 지원 (앱 설치, Service Worker, 오프라인 캐싱)
- ⏳ Cloudflare Pages 프로덕션 배포 예정

### 기술 스택
- **프론트엔드**: HTML5, Tailwind CSS, Vanilla JavaScript, Axios
- **폰트**: Pretendard (한글), Inter (영문) - 가독성과 미적 감각 우수
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
- **가독성 우수**: Pretendard & Inter 폰트로 한글/영문 최적화

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
- ✅ PLAVE 테마 (사이버틱 네온 스타일)
- ✅ 링크 자동 인식 (URL 메타데이터 추출)
- ✅ 일정 관리 (오늘 마감, 매일 반복, 요일별 설정)
- ✅ 해외 라디오 예시문 (8개 방송국, 자동 치환, 복사 기능)
- ✅ PWA 지원 (앱 설치, Service Worker, 오프라인)

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
