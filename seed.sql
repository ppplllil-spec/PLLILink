-- 투표 정보 테스트 데이터
INSERT OR IGNORE INTO votes (title, description, vote_url, deadline, platform, created_by) VALUES 
  ('2024 아시아 뮤직 어워드 투표', '우리 아티스트 투표 참여 부탁드립니다!', 'https://example.com/vote/ama2024', '2024-12-31 23:59:59', 'Twitter', '팬매니저'),
  ('Mnet 글로벌 팬 초이스', '글로벌 팬 투표 진행중', 'https://example.com/vote/mnet', '2024-11-30 23:59:59', 'Mnet', '관리자'),
  ('빌보드 소셜 아티스트 투표', '빌보드 소셜 부문 투표', 'https://billboard.com/vote', '2024-10-15 23:59:59', 'Billboard', '팬리더');

-- 광고 시안 요청 테스트 데이터
INSERT OR IGNORE INTO ad_requests (title, description, location, contact_info, deadline, status, created_by) VALUES 
  ('강남역 전광판 광고 시안 필요', '12월 컴백 기념 전광판 광고 시안이 필요합니다', '강남역 11번 출구', 'fandom@email.com', '2024-11-20 23:59:59', 'open', '광고팀'),
  ('명동 버스 정류장 광고', '버스 정류장 래핑 광고 디자인 요청', '명동 중앙 정류장', 'design@email.com', '2024-11-25 23:59:59', 'open', '디자인팀'),
  ('타임스퀘어 빌보드 광고', '뉴욕 타임스퀘어 대형 광고판', 'Times Square, NYC', 'global@email.com', '2024-12-01 23:59:59', 'in_progress', '글로벌팀');

-- 라디오 신청 정보 테스트 데이터
INSERT OR IGNORE INTO radio_requests (title, station_name, program_name, request_url, request_method, country, description, created_by) VALUES 
  ('KBS 쿨FM 신청 방법', 'KBS 쿨FM', '볼륨을 높여요', 'https://kbs.co.kr/radio/request', '앱 또는 웹사이트', 'domestic', '평일 저녁 7시~9시 신청 가능', '라디오팀'),
  ('MBC FM4U 신청', 'MBC FM4U', '정오의 희망곡', 'https://mbc.co.kr/radio', '문자 신청', 'domestic', '#1234로 문자 신청', '라디오팀'),
  ('SBS 파워FM', 'SBS 파워FM', '두시탈출 컬투쇼', 'https://sbsradio.co.kr', '전화/앱', 'domestic', '실시간 전화 연결 및 앱 신청', '라디오팀'),
  ('BBC Radio 1', 'BBC Radio 1', 'The Official Chart', 'https://bbc.co.uk/radio1', 'Online Form', 'international', 'Submit via official website', '글로벌팀'),
  ('iHeartRadio USA', 'iHeartRadio', 'Top 40 Countdown', 'https://iheart.com/request', 'App Request', 'international', 'Use iHeartRadio mobile app', '글로벌팀');
