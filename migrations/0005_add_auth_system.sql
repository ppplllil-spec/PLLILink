-- 사용자 테이블 추가 (간단한 비밀번호 기반)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user', -- 'admin', 'moderator', 'user'
  display_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);

-- 기본 관리자 계정 생성 (비밀번호: plave2024)
-- SHA-256 해시값
INSERT INTO users (username, password_hash, role, display_name) VALUES 
('admin', 'c52656b88351c2da48b97fbddeac2b8cbac044695146534aecfd7024ca4671a5', 'admin', '관리자'),
('plave', 'c52656b88351c2da48b97fbddeac2b8cbac044695146534aecfd7024ca4671a5', 'moderator', 'PLAVE 팀');

-- 기존 테이블에 작성자 정보 추가
ALTER TABLE votes ADD COLUMN user_id INTEGER;
ALTER TABLE votes ADD COLUMN password_hash TEXT; -- 비회원용 수정/삭제 비밀번호
ALTER TABLE ad_requests ADD COLUMN user_id INTEGER;
ALTER TABLE ad_requests ADD COLUMN password_hash TEXT;
ALTER TABLE radio_requests ADD COLUMN user_id INTEGER;
ALTER TABLE radio_requests ADD COLUMN password_hash TEXT;
ALTER TABLE vote_tips ADD COLUMN user_id INTEGER;
ALTER TABLE vote_tips ADD COLUMN password_hash TEXT;

-- 세션 테이블 (선택적, localStorage 사용 시 불필요)
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_token TEXT UNIQUE NOT NULL,
  user_id INTEGER NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_requests_user_id ON ad_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_radio_requests_user_id ON radio_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_tips_user_id ON vote_tips(user_id);
