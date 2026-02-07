-- 라디오 신청 예시문 테이블 추가
CREATE TABLE IF NOT EXISTS radio_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  station_name TEXT NOT NULL,
  template_text TEXT NOT NULL,
  language TEXT DEFAULT 'en', -- 'en', 'ko'
  template_type TEXT DEFAULT 'request', -- 'request', 'dedication'
  placeholder_fields TEXT, -- JSON 배열로 치환 필드 정의 예: '["artist_name","song_name"]'
  example_text TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 기본 예시문 데이터 삽입
INSERT INTO radio_templates (station_name, template_text, language, template_type, placeholder_fields, example_text) VALUES 
-- BBC Radio 1
('BBC Radio 1', 'Hi! I would love to request {{song_name}} by {{artist_name}}. This song means so much to me and many fans worldwide. Thank you for considering!', 'en', 'request', '["song_name", "artist_name"]', 'Hi! I would love to request Virtual Idol by PLAVE. This song means so much to me and many fans worldwide. Thank you for considering!'),

-- iHeartRadio
('iHeartRadio', 'Hello! Can you please play {{song_name}} by {{artist_name}}? They are an amazing virtual idol group with a passionate fanbase. We would love to hear them on your show!', 'en', 'request', '["song_name", "artist_name"]', 'Hello! Can you please play Way 4 Luv by PLAVE? They are an amazing virtual idol group with a passionate fanbase. We would love to hear them on your show!'),

-- Z100 New York
('Z100 New York', 'Hey Z100! Please play {{song_name}} by {{artist_name}}! This track is trending and fans are requesting it everywhere. Love your show! 💙', 'en', 'request', '["song_name", "artist_name"]', 'Hey Z100! Please play Wait For You by PLAVE! This track is trending and fans are requesting it everywhere. Love your show! 💙'),

-- Kiss FM UK
('Kiss FM UK', 'Hi Kiss FM! Could you add {{song_name}} by {{artist_name}} to your playlist? The song is absolutely incredible and deserves airtime! Thank you! 🎵', 'en', 'request', '["song_name", "artist_name"]', 'Hi Kiss FM! Could you add Way 4 Luv by PLAVE to your playlist? The song is absolutely incredible and deserves airtime! Thank you! 🎵'),

-- Capital FM
('Capital FM', 'Hello! I am requesting {{song_name}} by {{artist_name}}. They are a rising virtual idol group with millions of fans. Please give them a spin!', 'en', 'request', '["song_name", "artist_name"]', 'Hello! I am requesting Pump Up The Volume by PLAVE. They are a rising virtual idol group with millions of fans. Please give them a spin!'),

-- 국내 라디오 예시문 (한국어)
('KBS 쿨FM', '안녕하세요! {{artist_name}}의 {{song_name}} 신청합니다. 플리들이 정말 사랑하는 곡이에요. 꼭 들려주세요! 💜', 'ko', 'request', '["song_name", "artist_name"]', '안녕하세요! 플레이브의 Way 4 Luv 신청합니다. 플리들이 정말 사랑하는 곡이에요. 꼭 들려주세요! 💜'),

('MBC FM4U', '{{artist_name}}의 {{song_name}} 신청합니다! 버추얼 아이돌 그룹인데 음악이 정말 좋아요. 많은 분들이 듣고 계세요 🎶', 'ko', 'request', '["song_name", "artist_name"]', '플레이브의 Pump Up The Volume 신청합니다! 버추얼 아이돌 그룹인데 음악이 정말 좋아요. 많은 분들이 듣고 계세요 🎶'),

('SBS 파워FM', 'DJ님 안녕하세요! {{artist_name}} {{song_name}} 꼭 신청하고 싶어요. 플리들 모두가 기다리고 있습니다! 🙏', 'ko', 'request', '["song_name", "artist_name"]', 'DJ님 안녕하세요! 플레이브 Wait For You 꼭 신청하고 싶어요. 플리들 모두가 기다리고 있습니다! 🙏');

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_radio_templates_station ON radio_templates(station_name);
CREATE INDEX IF NOT EXISTS idx_radio_templates_language ON radio_templates(language);
