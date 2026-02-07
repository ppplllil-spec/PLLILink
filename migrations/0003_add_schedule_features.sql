-- 투표 테이블에 반복 일정 관련 컬럼 추가
ALTER TABLE votes ADD COLUMN is_recurring BOOLEAN DEFAULT 0;
ALTER TABLE votes ADD COLUMN recurrence_type TEXT; -- 'daily', 'weekly', 'monthly'
ALTER TABLE votes ADD COLUMN recurrence_time TEXT; -- 'HH:MM' 형식
ALTER TABLE votes ADD COLUMN recurrence_days TEXT; -- 요일 (JSON 배열: '["mon","tue","wed"]')
ALTER TABLE votes ADD COLUMN reminder_enabled BOOLEAN DEFAULT 0;
ALTER TABLE votes ADD COLUMN reminder_minutes INTEGER DEFAULT 30; -- 알림 시간 (분 단위)

-- 라디오 신청 테이블에 특정일 알림 관련 컬럼 추가
ALTER TABLE radio_requests ADD COLUMN request_date DATE; -- 특정 요청 날짜
ALTER TABLE radio_requests ADD COLUMN request_time TEXT; -- 'HH:MM' 형식
ALTER TABLE radio_requests ADD COLUMN is_recurring BOOLEAN DEFAULT 0;
ALTER TABLE radio_requests ADD COLUMN recurrence_type TEXT;
ALTER TABLE radio_requests ADD COLUMN recurrence_days TEXT;
ALTER TABLE radio_requests ADD COLUMN reminder_enabled BOOLEAN DEFAULT 0;
ALTER TABLE radio_requests ADD COLUMN reminder_minutes INTEGER DEFAULT 30;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_votes_deadline_date ON votes(date(deadline));
CREATE INDEX IF NOT EXISTS idx_votes_is_recurring ON votes(is_recurring);
CREATE INDEX IF NOT EXISTS idx_radio_request_date ON radio_requests(request_date);
CREATE INDEX IF NOT EXISTS idx_radio_is_recurring ON radio_requests(is_recurring);
