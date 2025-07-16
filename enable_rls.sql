-- RLS (Row Level Security) 활성화
ALTER TABLE mission_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE earned_badges ENABLE ROW LEVEL SECURITY;

-- users 테이블 정책
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = auth_uid);

CREATE POLICY "Users can view students in their school" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users AS teacher
            WHERE teacher.auth_uid = auth.uid()
            AND teacher.school_id = users.school_id
        )
    );

CREATE POLICY "Users can view their teacher" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users AS student
            WHERE student.auth_uid = auth.uid()
            AND student.teacher_id = users.id
        )
    );

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = auth_uid);

CREATE POLICY "Teachers can create students" ON users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users AS teacher
            WHERE teacher.auth_uid = auth.uid()
            AND teacher.role = 'teacher'
            AND teacher.id = users.teacher_id
        )
    );

-- schools 테이블 정책
CREATE POLICY "Users can view their school" ON schools
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_uid = auth.uid()
            AND users.school_id = schools.id
        )
    );

CREATE POLICY "New teachers can create schools" ON schools
    FOR INSERT WITH CHECK (true);

-- missions 테이블 정책
CREATE POLICY "Users can view missions for their school" ON missions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_uid = auth.uid()
            AND (
                users.school_id = missions.school_id
                OR EXISTS (
                    SELECT 1 FROM users AS teacher
                    WHERE teacher.id = users.teacher_id
                    AND teacher.school_id = missions.school_id
                )
            )
        )
    );

CREATE POLICY "Teachers can manage missions" ON missions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_uid = auth.uid()
            AND users.role = 'teacher'
            AND users.school_id = missions.school_id
        )
    );

-- mission_logs 테이블 정책
CREATE POLICY "Students can view their own logs" ON mission_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_uid = auth.uid()
            AND users.id = mission_logs.student_id
        )
    );

CREATE POLICY "Teachers can view logs for their school" ON mission_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users AS teacher
            WHERE teacher.auth_uid = auth.uid()
            AND teacher.role = 'teacher'
            AND EXISTS (
                SELECT 1 FROM users AS student
                WHERE student.id = mission_logs.student_id
                AND student.school_id = teacher.school_id
            )
        )
    );

CREATE POLICY "Students can create their own logs" ON mission_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_uid = auth.uid()
            AND users.id = mission_logs.student_id
        )
    );

CREATE POLICY "Students can delete their own logs" ON mission_logs
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_uid = auth.uid()
            AND users.id = mission_logs.student_id
        )
    );

-- daily_snapshots 테이블 정책
CREATE POLICY "Students can view their own snapshots" ON daily_snapshots
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_uid = auth.uid()
            AND users.id = daily_snapshots.student_id
        )
    );

CREATE POLICY "Teachers can view snapshots for their school" ON daily_snapshots
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users AS teacher
            WHERE teacher.auth_uid = auth.uid()
            AND teacher.role = 'teacher'
            AND EXISTS (
                SELECT 1 FROM users AS student
                WHERE student.id = daily_snapshots.student_id
                AND student.school_id = teacher.school_id
            )
        )
    );

CREATE POLICY "System can manage snapshots" ON daily_snapshots
    FOR ALL USING (true);

-- monthly_snapshots 테이블 정책
CREATE POLICY "Students can view their own monthly snapshots" ON monthly_snapshots
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_uid = auth.uid()
            AND users.id = monthly_snapshots.student_id
        )
    );

CREATE POLICY "Teachers can view monthly snapshots for their school" ON monthly_snapshots
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users AS teacher
            WHERE teacher.auth_uid = auth.uid()
            AND teacher.role = 'teacher'
            AND EXISTS (
                SELECT 1 FROM users AS student
                WHERE student.id = monthly_snapshots.student_id
                AND student.school_id = teacher.school_id
            )
        )
    );

-- badges 테이블 정책
CREATE POLICY "Users can view badges for their school" ON badges
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_uid = auth.uid()
            AND (
                users.school_id = badges.school_id
                OR EXISTS (
                    SELECT 1 FROM users AS teacher
                    WHERE teacher.id = users.teacher_id
                    AND teacher.school_id = badges.school_id
                )
            )
        )
    );

CREATE POLICY "Teachers can manage badges" ON badges
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_uid = auth.uid()
            AND users.role = 'teacher'
            AND users.school_id = badges.school_id
        )
    );

-- earned_badges 테이블 정책
CREATE POLICY "Students can view their own earned badges" ON earned_badges
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_uid = auth.uid()
            AND users.id = earned_badges.student_id
        )
    );

CREATE POLICY "Teachers can view earned badges for their school" ON earned_badges
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users AS teacher
            WHERE teacher.auth_uid = auth.uid()
            AND teacher.role = 'teacher'
            AND EXISTS (
                SELECT 1 FROM users AS student
                WHERE student.id = earned_badges.student_id
                AND student.school_id = teacher.school_id
            )
        )
    );

CREATE POLICY "Students can earn badges" ON earned_badges
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_uid = auth.uid()
            AND users.id = earned_badges.student_id
        )
    );

CREATE POLICY "Students can update their earned badges" ON earned_badges
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_uid = auth.uid()
            AND users.id = earned_badges.student_id
        )
    );

-- student_qr_codes 테이블이 있다면 RLS 정책 추가
ALTER TABLE student_qr_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view QR codes for their students" ON student_qr_codes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users AS teacher
            WHERE teacher.auth_uid = auth.uid()
            AND teacher.role = 'teacher'
            AND EXISTS (
                SELECT 1 FROM users AS student
                WHERE student.id = student_qr_codes.student_id
                AND student.teacher_id = teacher.id
            )
        )
    );

CREATE POLICY "Teachers can manage QR codes" ON student_qr_codes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users AS teacher
            WHERE teacher.auth_uid = auth.uid()
            AND teacher.role = 'teacher'
            AND EXISTS (
                SELECT 1 FROM users AS student
                WHERE student.id = student_qr_codes.student_id
                AND student.teacher_id = teacher.id
            )
        )
    ); 