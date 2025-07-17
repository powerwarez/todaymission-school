-- 교사 로그인 시 프로필 조회 및 생성 문제 완전 해결
-- 2024-12-28 작성

-- 모든 관련 정책 삭제 후 재생성
BEGIN;

-- 1. users 테이블의 모든 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Teachers can view users in their school" ON users;
DROP POLICY IF EXISTS "Students can view their teacher" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Teachers can create students" ON users;
DROP POLICY IF EXISTS "New users can create their own profile" ON users;
DROP POLICY IF EXISTS "TEMP_DEBUG_teachers_can_see_all_errors" ON users;

-- 2. users 테이블 새로운 정책들

-- 2-1. 모든 인증된 사용자는 자신의 auth_uid로 조회 가능 (프로필이 없어도 빈 결과 반환)
CREATE POLICY "Anyone can check their profile exists" ON users
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND 
        (auth.uid() = auth_uid OR auth.uid()::text = auth_uid::text)
    );

-- 2-2. 새 사용자는 자신의 프로필을 생성할 수 있음
CREATE POLICY "New users can create their profile" ON users
    FOR INSERT WITH CHECK (
        auth.uid() = auth_uid AND
        role IN ('teacher', 'student')
    );

-- 2-3. 사용자는 자신의 프로필을 수정할 수 있음
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = auth_uid)
    WITH CHECK (auth.uid() = auth_uid);

-- 2-4. 교사는 같은 학교의 다른 사용자를 볼 수 있음
CREATE POLICY "Teachers can view school members" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users AS viewer
            WHERE viewer.auth_uid = auth.uid()
            AND viewer.role = 'teacher'
            AND viewer.school_id = users.school_id
            AND viewer.school_id IS NOT NULL
        )
    );

-- 2-5. 교사는 학생을 생성할 수 있음
CREATE POLICY "Teachers can create students" ON users
    FOR INSERT WITH CHECK (
        role = 'student' AND
        EXISTS (
            SELECT 1 FROM users AS teacher
            WHERE teacher.auth_uid = auth.uid()
            AND teacher.role = 'teacher'
            AND teacher.id = users.teacher_id
        )
    );

-- 3. schools 테이블 정책들

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view their school" ON schools;
DROP POLICY IF EXISTS "New teachers can create schools" ON schools;
DROP POLICY IF EXISTS "Authenticated teachers can create schools" ON schools;
DROP POLICY IF EXISTS "Teachers can update their school" ON schools;

-- 3-1. 인증된 사용자는 학교를 생성할 수 있음
CREATE POLICY "Authenticated users can create schools" ON schools
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 3-2. 학교 구성원은 자신의 학교를 볼 수 있음
CREATE POLICY "School members can view their school" ON schools
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_uid = auth.uid()
            AND users.school_id = schools.id
        )
    );

-- 3-3. 교사는 자신의 학교 정보를 수정할 수 있음
CREATE POLICY "Teachers can update their school" ON schools
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_uid = auth.uid()
            AND users.role = 'teacher'
            AND users.school_id = schools.id
        )
    );

-- 4. 기타 테이블들의 정책도 auth.uid() IS NOT NULL 체크 추가

-- missions 테이블
DROP POLICY IF EXISTS "Users can view missions for their school" ON missions;
CREATE POLICY "School members can view missions" ON missions
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_uid = auth.uid()
            AND users.school_id = missions.school_id
        )
    );

-- 5. 디버깅을 위한 함수 생성 (운영환경에서는 제거)
CREATE OR REPLACE FUNCTION debug_auth_info()
RETURNS TABLE (
    current_auth_uid uuid,
    user_exists boolean,
    user_count integer
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        auth.uid() as current_auth_uid,
        EXISTS(SELECT 1 FROM users WHERE auth_uid = auth.uid()) as user_exists,
        (SELECT COUNT(*)::integer FROM users WHERE auth_uid = auth.uid()) as user_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- 실행 후 테스트:
-- 1. 이 SQL을 Supabase SQL Editor에서 실행
-- 2. 브라우저의 쿠키와 로컬 스토리지를 모두 삭제
-- 3. 다시 로그인해서 테스트
-- 4. SELECT * FROM debug_auth_info(); 를 실행해서 auth 상태 확인 가능 