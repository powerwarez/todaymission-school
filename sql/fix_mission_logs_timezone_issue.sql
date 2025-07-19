-- mission_logs 테이블의 시간대 문제 해결
-- 한국 시간 기준으로 날짜별 중복 체크가 되도록 수정
-- 2024-01-07 작성

-- 1. 기존 UNIQUE 제약 조건 제거 (개별적으로 시도)
ALTER TABLE mission_logs 
DROP CONSTRAINT IF EXISTS mission_logs_student_id_mission_id_completed_at_key;

ALTER TABLE mission_logs 
DROP CONSTRAINT IF EXISTS mission_logs_unique_student_mission_kst_date;

-- 다른 가능한 제약 조건들도 제거
DO $$ 
DECLARE
    constraint_record RECORD;
BEGIN
    -- 테이블의 모든 UNIQUE 제약 조건 찾아서 제거
    FOR constraint_record IN 
        SELECT conname 
        FROM pg_constraint
        WHERE conrelid = 'mission_logs'::regclass
        AND contype = 'u'
    LOOP
        EXECUTE format('ALTER TABLE mission_logs DROP CONSTRAINT IF EXISTS %I', constraint_record.conname);
    END LOOP;
END $$;

-- 2. 한국 시간 기준 날짜를 계산하는 함수 생성
CREATE OR REPLACE FUNCTION get_kst_date(timestamptz) 
RETURNS date AS $$
BEGIN
    RETURN ($1 AT TIME ZONE 'Asia/Seoul')::date;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. 기존 중복 인덱스 제거
DROP INDEX IF EXISTS mission_logs_unique_student_mission_kst_date;
DROP INDEX IF EXISTS idx_mission_logs_kst_date;

-- 4. 새로운 UNIQUE INDEX 생성 (한국 시간 기준)
-- 같은 학생이 같은 미션을 한국 시간 기준 같은 날에는 한 번만 완료할 수 있음
CREATE UNIQUE INDEX mission_logs_unique_student_mission_kst_date 
ON mission_logs (student_id, mission_id, get_kst_date(completed_at));

-- 5. 일반 인덱스 추가 (성능 최적화)
CREATE INDEX idx_mission_logs_kst_date 
ON mission_logs (student_id, get_kst_date(completed_at));

-- 6. 코멘트 추가
COMMENT ON FUNCTION get_kst_date(timestamptz) 
IS 'UTC 시간을 한국 시간으로 변환하여 날짜만 반환';

COMMENT ON INDEX mission_logs_unique_student_mission_kst_date 
IS '한국 시간 기준으로 같은 날에 같은 미션을 중복 완료할 수 없도록 제한'; 