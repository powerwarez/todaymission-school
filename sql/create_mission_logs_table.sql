-- mission_logs 테이블 생성
-- 학생들의 미션 완료 기록을 저장하는 테이블

CREATE TABLE IF NOT EXISTS mission_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 동일한 날짜에 같은 미션을 중복 완료하는 것을 방지
    UNIQUE(student_id, mission_id, completed_at::date)
);

-- 인덱스 생성 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_mission_logs_student_id ON mission_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_mission_logs_mission_id ON mission_logs(mission_id);
CREATE INDEX IF NOT EXISTS idx_mission_logs_completed_at ON mission_logs(completed_at);
CREATE INDEX IF NOT EXISTS idx_mission_logs_student_date ON mission_logs(student_id, completed_at::date);

-- RLS (Row Level Security) 활성화
ALTER TABLE mission_logs ENABLE ROW LEVEL SECURITY;

-- RLS 정책 1: 학생은 자신의 미션 로그만 생성할 수 있음
CREATE POLICY "Students can create own mission logs" ON mission_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (
        student_id = (SELECT id FROM users WHERE auth_uid = auth.uid())
    );

-- RLS 정책 2: 학생은 자신의 미션 로그만 조회할 수 있음
CREATE POLICY "Students can view own mission logs" ON mission_logs
    FOR SELECT
    TO authenticated
    USING (
        student_id = (SELECT id FROM users WHERE auth_uid = auth.uid())
    );

-- RLS 정책 3: 교사는 자신의 학교 학생들의 미션 로그를 조회할 수 있음
CREATE POLICY "Teachers can view student mission logs" ON mission_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u1
            JOIN users u2 ON u1.school_id = u2.school_id
            WHERE u1.auth_uid = auth.uid()
            AND u1.role = 'teacher'
            AND u2.id = mission_logs.student_id
        )
    );

-- RLS 정책 4: 학생은 자신의 미션 로그를 삭제할 수 있음
CREATE POLICY "Students can delete own mission logs" ON mission_logs
    FOR DELETE
    TO authenticated
    USING (
        student_id = (SELECT id FROM users WHERE auth_uid = auth.uid())
    ); 