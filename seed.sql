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

-- 투표앱별 팁 테스트 데이터
INSERT OR IGNORE INTO vote_tips (vote_id, platform, tip_title, tip_content, is_verified, helpful_count, created_by) VALUES 
  (1, 'Twitter', '트위터 투표 빠르게 하는 법', '1. 여러 계정 준비하기\n2. 해시태그 복사해두기\n3. 알람 설정으로 정시 투표 놓치지 않기', 1, 15, '투표왕'),
  (1, 'Twitter', 'VPN 사용 팁', 'VPN을 사용하면 다른 지역에서도 투표 가능합니다. 추천 VPN: NordVPN, ExpressVPN', 1, 23, '글로벌팬'),
  (2, 'Mnet', 'Mnet 앱 투표 꿀팁', '앱에서 로그인 유지하면 매일 자동으로 투표 알림이 옵니다. 설정에서 푸시 알림 켜두세요!', 1, 18, '엠넷러버'),
  (2, 'Mnet', '일일 투표권 최대로 받기', '출석체크, 미션 완료, 친구 초대로 추가 투표권 획득 가능합니다', 0, 9, '팬활고수'),
  (3, 'Billboard', '빌보드 투표 주의사항', '같은 IP에서 너무 많이 투표하면 무효 처리될 수 있으니 시간 간격을 두고 투표하세요', 1, 31, '빌보드마스터'),
  (NULL, 'General', '투표 독려 문구 모음', '친구들에게 공유할 때 사용하기 좋은 문구:\n- "1초만 투자해주세요!"\n- "우리 가수 1위 가자!"\n- "링크 클릭만 하면 끝!"', 0, 42, '홍보담당');

