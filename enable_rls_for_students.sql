-- QR 로그인 학생들을 위한 추가 정책
-- (auth_uid가 null인 학생들은 별도 처리 필요)

-- student_qr_codes 테이블에 대한 공개 읽기 정책
CREATE POLICY "Public can view QR codes for login" ON student_qr_codes
    FOR SELECT USING (true);

-- users 테이블에서 QR 토큰으로 조회 가능
CREATE POLICY "Public can view students by QR token" ON users
    FOR SELECT USING (
        users.role = 'student' 
        AND users.qr_token IS NOT NULL
    );

-- 공개 정책이 필요한 경우 anon 역할에 권한 부여
GRANT SELECT ON users TO anon;
GRANT SELECT ON student_qr_codes TO anon;
GRANT SELECT ON missions TO anon;
GRANT SELECT ON schools TO anon;

-- mission_logs에 대한 익명 사용자 정책 (QR 로그인 학생용)
CREATE POLICY "Students can manage their logs without auth" ON mission_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = mission_logs.student_id
            AND users.role = 'student'
        )
    );

-- daily_snapshots에 대한 익명 사용자 정책
CREATE POLICY "Students can view snapshots without auth" ON daily_snapshots
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = daily_snapshots.student_id
            AND users.role = 'student'
        )
    );

-- earned_badges에 대한 익명 사용자 정책
CREATE POLICY "Students can manage badges without auth" ON earned_badges
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = earned_badges.student_id
            AND users.role = 'student'
        )
    ); 