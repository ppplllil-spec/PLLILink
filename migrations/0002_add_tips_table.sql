-- 투표앱별 팁 공유 테이블
CREATE TABLE IF NOT EXISTS vote_tips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vote_id INTEGER,
  platform TEXT NOT NULL,
  tip_title TEXT NOT NULL,
  tip_content TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vote_id) REFERENCES votes(id) ON DELETE CASCADE
);

-- 팁 좋아요/도움됨 기록 테이블
CREATE TABLE IF NOT EXISTS tip_reactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tip_id INTEGER NOT NULL,
  user_identifier TEXT NOT NULL,
  reaction_type TEXT DEFAULT 'helpful',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tip_id) REFERENCES vote_tips(id) ON DELETE CASCADE,
  UNIQUE(tip_id, user_identifier)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_vote_tips_vote_id ON vote_tips(vote_id);
CREATE INDEX IF NOT EXISTS idx_vote_tips_platform ON vote_tips(platform);
CREATE INDEX IF NOT EXISTS idx_vote_tips_created_at ON vote_tips(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vote_tips_helpful_count ON vote_tips(helpful_count DESC);
CREATE INDEX IF NOT EXISTS idx_tip_reactions_tip_id ON tip_reactions(tip_id);
