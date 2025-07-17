-- 새로운 사용자(교사)가 처음 로그인할 때 프로필 생성 문제 해결
-- 2024-12-28 작성

-- 1. 기존 문제가 있는 정책들 삭제
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Teachers can view users in their school" ON users;
DROP POLICY IF EXISTS "Teachers can create students" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- 2. 새로운 사용자가 자신의 프로필을 생성할 수 있도록 INSERT 정책 추가
CREATE POLICY "New users can create their own profile" ON users
    FOR INSERT WITH CHECK (
        -- 새로운 사용자는 자신의 프로필만 생성 가능
        auth.uid() = users.auth_uid 
        AND users.role = 'teacher'  -- 교사로만 가입 가능 (학생은 교사가 생성)
    );

-- 3. 사용자가 자신의 프로필을 조회할 수 있도록 수정
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (
        -- 자신의 프로필 조회
        auth.uid() = auth_uid
        OR
        -- 또는 아직 프로필이 없는 새 사용자도 조회 시도 가능 (빈 결과 반환)
        NOT EXISTS (
            SELECT 1 FROM users WHERE auth_uid = auth.uid()
        )
    );

-- 4. 교사는 같은 학교의 사용자를 볼 수 있음
CREATE POLICY "Teachers can view users in their school" ON users
    FOR SELECT USING (
        -- 이미 school_id가 있는 교사는 같은 학교 사용자 조회 가능
        EXISTS (
            SELECT 1 FROM users AS teacher
            WHERE teacher.auth_uid = auth.uid()
            AND teacher.role = 'teacher'
            AND teacher.school_id = users.school_id
            AND teacher.school_id IS NOT NULL
        )
    );

-- 5. 사용자가 자신의 프로필을 업데이트할 수 있음
CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (
        auth.uid() = auth_uid
    )
    WITH CHECK (
        auth.uid() = auth_uid
    );

-- 6. 교사가 학생을 생성할 수 있음
CREATE POLICY "Teachers can create students" ON users
    FOR INSERT WITH CHECK (
        -- 교사만 학생을 생성할 수 있음
        EXISTS (
            SELECT 1 FROM users AS teacher
            WHERE teacher.auth_uid = auth.uid()
            AND teacher.role = 'teacher'
            AND teacher.id = users.teacher_id
        )
        AND users.role = 'student'
    );

-- 7. schools 테이블 정책도 수정 (새로운 교사가 학교를 생성할 수 있도록)
DROP POLICY IF EXISTS "New teachers can create schools" ON schools;
DROP POLICY IF EXISTS "Users can view their school" ON schools;
DROP POLICY IF EXISTS "Teachers can update their school" ON schools;

-- 인증된 교사만 학교를 생성할 수 있음
CREATE POLICY "Authenticated teachers can create schools" ON schools
    FOR INSERT WITH CHECK (
        -- Supabase Auth로 인증된 사용자만 가능
        auth.uid() IS NOT NULL
    );

-- 학교 조회는 해당 학교에 속한 사용자만 가능
CREATE POLICY "Users can view their school" ON schools
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_uid = auth.uid()
            AND users.school_id = schools.id
        )
    );

-- 교사는 자신의 학교 정보를 수정할 수 있음
CREATE POLICY "Teachers can update their school" ON schools
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_uid = auth.uid()
            AND users.role = 'teacher'
            AND users.school_id = schools.id
        )
    );

-- 8. 추가: 디버깅을 위한 임시 정책 (운영환경에서는 제거해야 함)
-- 이 정책은 문제 해결 후 즉시 제거하세요!
CREATE POLICY "TEMP_DEBUG_teachers_can_see_all_errors" ON users
    FOR SELECT USING (
        auth.uid() IS NOT NULL 
        AND auth.uid() = '8dae0402-51c3-4f48-9c8b-053d43ad42fe'
    );

-- 실행 후 확인사항:
-- 1. 새로운 교사가 로그인할 때 500 에러가 발생하지 않는지 확인
-- 2. 온보딩 페이지에서 학교 정보를 저장할 수 있는지 확인
-- 3. 학교 정보 저장 후 정상적으로 대시보드로 이동하는지 확인
-- 4. 위의 TEMP_DEBUG 정책은 테스트 후 반드시 제거할 것 