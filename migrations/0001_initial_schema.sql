-- 투표 정보 테이블
CREATE TABLE IF NOT EXISTS votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  vote_url TEXT NOT NULL,
  deadline DATETIME,
  platform TEXT,
  category TEXT DEFAULT 'vote',
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 광고 시안 요청 테이블
CREATE TABLE IF NOT EXISTS ad_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  contact_info TEXT,
  deadline DATETIME,
  category TEXT DEFAULT 'ad',
  status TEXT DEFAULT 'open',
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 라디오 신청 정보 테이블
CREATE TABLE IF NOT EXISTS radio_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  station_name TEXT NOT NULL,
  program_name TEXT,
  request_url TEXT,
  request_method TEXT,
  country TEXT DEFAULT 'domestic',
  category TEXT DEFAULT 'radio',
  description TEXT,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_votes_created_at ON votes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_votes_category ON votes(category);
CREATE INDEX IF NOT EXISTS idx_ad_requests_created_at ON ad_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ad_requests_category ON ad_requests(category);
CREATE INDEX IF NOT EXISTS idx_ad_requests_status ON ad_requests(status);
CREATE INDEX IF NOT EXISTS idx_radio_requests_created_at ON radio_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_radio_requests_category ON radio_requests(category);
CREATE INDEX IF NOT EXISTS idx_radio_requests_country ON radio_requests(country);
