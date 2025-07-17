-- 1. 먼저 기존 정책들을 모두 삭제
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can view students in their school" ON users;
DROP POLICY IF EXISTS "Users can view their teacher" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Teachers can create students" ON users;
DROP POLICY IF EXISTS "Users can view their school" ON schools;
DROP POLICY IF EXISTS "New teachers can create schools" ON schools;
DROP POLICY IF EXISTS "Users can view missions for their school" ON missions;
DROP POLICY IF EXISTS "Teachers can manage missions" ON missions;
DROP POLICY IF EXISTS "Students can view their own logs" ON mission_logs;
DROP POLICY IF EXISTS "Teachers can view logs for their school" ON mission_logs;
DROP POLICY IF EXISTS "Students can create their own logs" ON mission_logs;
DROP POLICY IF EXISTS "Students can delete their own logs" ON mission_logs;
DROP POLICY IF EXISTS "Students can view their own snapshots" ON daily_snapshots;
DROP POLICY IF EXISTS "Teachers can view snapshots for their school" ON daily_snapshots;
DROP POLICY IF EXISTS "System can manage snapshots" ON daily_snapshots;
DROP POLICY IF EXISTS "Students can view their own monthly snapshots" ON monthly_snapshots;
DROP POLICY IF EXISTS "Teachers can view monthly snapshots for their school" ON monthly_snapshots;
DROP POLICY IF EXISTS "Users can view badges for their school" ON badges;
DROP POLICY IF EXISTS "Teachers can manage badges" ON badges;
DROP POLICY IF EXISTS "Students can view their own earned badges" ON earned_badges;
DROP POLICY IF EXISTS "Teachers can view earned badges for their school" ON earned_badges;
DROP POLICY IF EXISTS "Students can earn badges" ON earned_badges;
DROP POLICY IF EXISTS "Students can update their earned badges" ON earned_badges;
DROP POLICY IF EXISTS "Teachers can view QR codes for their students" ON student_qr_codes;
DROP POLICY IF EXISTS "Teachers can manage QR codes" ON student_qr_codes;

-- 2. 새로운 RLS 정책 생성 (무한 재귀 방지)

-- users 테이블 정책 (순환 참조 제거)
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = auth_uid);

-- 교사는 같은 학교의 모든 사용자를 볼 수 있음 (자기 자신의 school_id 직접 사용)
CREATE POLICY "Teachers can view users in their school" ON users
    FOR SELECT USING (
        auth.uid() IN (
            SELECT auth_uid FROM users u 
            WHERE u.role = 'teacher' 
            AND u.school_id = users.school_id
        )
    );

-- 학생은 자신의 교사만 볼 수 있음
CREATE POLICY "Students can view their teacher" ON users
    FOR SELECT USING (
        users.id IN (
            SELECT teacher_id FROM users 
            WHERE auth_uid = auth.uid() 
            AND teacher_id IS NOT NULL
        )
    );

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = auth_uid);

CREATE POLICY "Teachers can create students" ON users
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT auth_uid FROM users 
            WHERE role = 'teacher' 
            AND id = users.teacher_id
        )
    );

-- schools 테이블 정책
CREATE POLICY "Users can view their school" ON schools
    FOR SELECT USING (
        schools.id IN (
            SELECT school_id FROM users 
            WHERE auth_uid = auth.uid()
        )
    );

CREATE POLICY "New teachers can create schools" ON schools
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Teachers can update their school" ON schools
    FOR UPDATE USING (
        schools.id IN (
            SELECT school_id FROM users 
            WHERE auth_uid = auth.uid() 
            AND role = 'teacher'
        )
    );

-- missions 테이블 정책
CREATE POLICY "Users can view missions for their school" ON missions
    FOR SELECT USING (
        missions.school_id IN (
            SELECT school_id FROM users 
            WHERE auth_uid = auth.uid()
            UNION
            SELECT school_id FROM users 
            WHERE id IN (
                SELECT teacher_id FROM users 
                WHERE auth_uid = auth.uid()
            )
        )
    );

CREATE POLICY "Teachers can manage missions" ON missions
    FOR ALL USING (
        missions.school_id IN (
            SELECT school_id FROM users 
            WHERE auth_uid = auth.uid() 
            AND role = 'teacher'
        )
    );

-- mission_logs 테이블 정책
CREATE POLICY "Students can view their own logs" ON mission_logs
    FOR SELECT USING (
        mission_logs.student_id IN (
            SELECT id FROM users 
            WHERE auth_uid = auth.uid()
        )
    );

CREATE POLICY "Teachers can view logs for their school" ON mission_logs
    FOR SELECT USING (
        mission_logs.student_id IN (
            SELECT id FROM users AS students
            WHERE students.school_id IN (
                SELECT school_id FROM users 
                WHERE auth_uid = auth.uid() 
                AND role = 'teacher'
            )
        )
    );

CREATE POLICY "Students can create their own logs" ON mission_logs
    FOR INSERT WITH CHECK (
        mission_logs.student_id IN (
            SELECT id FROM users 
            WHERE auth_uid = auth.uid()
        )
    );

CREATE POLICY "Students can delete their own logs" ON mission_logs
    FOR DELETE USING (
        mission_logs.student_id IN (
            SELECT id FROM users 
            WHERE auth_uid = auth.uid()
        )
    );

-- daily_snapshots 테이블 정책
CREATE POLICY "Students can view their own snapshots" ON daily_snapshots
    FOR SELECT USING (
        daily_snapshots.student_id IN (
            SELECT id FROM users 
            WHERE auth_uid = auth.uid()
        )
    );

CREATE POLICY "Teachers can view snapshots for their school" ON daily_snapshots
    FOR SELECT USING (
        daily_snapshots.student_id IN (
            SELECT id FROM users AS students
            WHERE students.school_id IN (
                SELECT school_id FROM users 
                WHERE auth_uid = auth.uid() 
                AND role = 'teacher'
            )
        )
    );

CREATE POLICY "System can manage snapshots" ON daily_snapshots
    FOR ALL USING (true);

-- monthly_snapshots 테이블 정책
CREATE POLICY "Students can view their own monthly snapshots" ON monthly_snapshots
    FOR SELECT USING (
        monthly_snapshots.student_id IN (
            SELECT id FROM users 
            WHERE auth_uid = auth.uid()
        )
    );

CREATE POLICY "Teachers can view monthly snapshots for their school" ON monthly_snapshots
    FOR SELECT USING (
        monthly_snapshots.student_id IN (
            SELECT id FROM users AS students
            WHERE students.school_id IN (
                SELECT school_id FROM users 
                WHERE auth_uid = auth.uid() 
                AND role = 'teacher'
            )
        )
    );

-- badges 테이블 정책
CREATE POLICY "Users can view badges for their school" ON badges
    FOR SELECT USING (
        badges.school_id IN (
            SELECT school_id FROM users 
            WHERE auth_uid = auth.uid()
            UNION
            SELECT school_id FROM users 
            WHERE id IN (
                SELECT teacher_id FROM users 
                WHERE auth_uid = auth.uid()
            )
        )
    );

CREATE POLICY "Teachers can manage badges" ON badges
    FOR ALL USING (
        badges.school_id IN (
            SELECT school_id FROM users 
            WHERE auth_uid = auth.uid() 
            AND role = 'teacher'
        )
    );

-- earned_badges 테이블 정책
CREATE POLICY "Students can view their own earned badges" ON earned_badges
    FOR SELECT USING (
        earned_badges.student_id IN (
            SELECT id FROM users 
            WHERE auth_uid = auth.uid()
        )
    );

CREATE POLICY "Teachers can view earned badges for their school" ON earned_badges
    FOR SELECT USING (
        earned_badges.student_id IN (
            SELECT id FROM users AS students
            WHERE students.school_id IN (
                SELECT school_id FROM users 
                WHERE auth_uid = auth.uid() 
                AND role = 'teacher'
            )
        )
    );

CREATE POLICY "Students can earn badges" ON earned_badges
    FOR INSERT WITH CHECK (
        earned_badges.student_id IN (
            SELECT id FROM users 
            WHERE auth_uid = auth.uid()
        )
    );

CREATE POLICY "Students can update their earned badges" ON earned_badges
    FOR UPDATE USING (
        earned_badges.student_id IN (
            SELECT id FROM users 
            WHERE auth_uid = auth.uid()
        )
    );

-- student_qr_codes 테이블 정책 (테이블이 존재하는 경우)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'student_qr_codes') THEN
        CREATE POLICY "Teachers can view QR codes for their students" ON student_qr_codes
            FOR SELECT USING (
                student_qr_codes.student_id IN (
                    SELECT id FROM users AS students
                    WHERE students.teacher_id IN (
                        SELECT id FROM users 
                        WHERE auth_uid = auth.uid() 
                        AND role = 'teacher'
                    )
                )
            );

        CREATE POLICY "Teachers can manage QR codes" ON student_qr_codes
            FOR ALL USING (
                student_qr_codes.student_id IN (
                    SELECT id FROM users AS students
                    WHERE students.teacher_id IN (
                        SELECT id FROM users 
                        WHERE auth_uid = auth.uid() 
                        AND role = 'teacher'
                    )
                )
            );
    END IF;
END $$; 