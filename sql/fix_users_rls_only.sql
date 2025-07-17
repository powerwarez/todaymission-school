-- users 테이블의 RLS 정책만 수정

-- 1. 기존 users 테이블 정책 삭제
DROP POLICY IF EXISTS "Teachers can manage their school users" ON users;
DROP POLICY IF EXISTS "Students can view own data" ON users;

-- 2. 더 간단한 정책으로 대체
-- 모든 사용자가 자신의 데이터만 볼 수 있음
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (
    auth.uid() = auth_uid
    OR 
    qr_token = current_setting('app.current_qr_token', true)
  );

-- 교사는 자신의 데이터를 수정할 수 있음
CREATE POLICY "Teachers can update own data" ON users
  FOR UPDATE USING (
    auth.uid() = auth_uid
  );

-- 새 사용자 생성은 인증된 사용자만 가능
CREATE POLICY "Authenticated users can insert" ON users
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  ); 