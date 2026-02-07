-- 반복 일정에 시작/종료 시간 범위 추가
ALTER TABLE votes ADD COLUMN recurrence_start_time TEXT; -- 'HH:MM' 형식 (NULL이면 하루 종일)
ALTER TABLE votes ADD COLUMN recurrence_end_time TEXT; -- 'HH:MM' 형식 (NULL이면 하루 종일)

ALTER TABLE radio_requests ADD COLUMN recurrence_start_time TEXT; -- 'HH:MM' 형식
ALTER TABLE radio_requests ADD COLUMN recurrence_end_time TEXT; -- 'HH:MM' 형식

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_votes_time_range ON votes(recurrence_start_time, recurrence_end_time);
CREATE INDEX IF NOT EXISTS idx_radio_time_range ON radio_requests(recurrence_start_time, recurrence_end_time);
