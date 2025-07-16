-- RLS 정책 수정 스크립트
-- Supabase SQL Editor에서 실행하세요

-- 1. 기존 정책들을 모두 삭제
DROP POLICY IF EXISTS "Teachers can view their school" ON schools;
DROP POLICY IF EXISTS "Teachers can manage their school users" ON users;
DROP POLICY IF EXISTS "Students can view own data" ON users;
DROP POLICY IF EXISTS "Teachers can manage missions" ON missions;
DROP POLICY IF EXISTS "Students can view missions" ON missions;
DROP POLICY IF EXISTS "Students can manage own mission logs" ON mission_logs;
DROP POLICY IF EXISTS "Teachers can view student mission logs" ON mission_logs;

-- 2. 새로운 정책들을 생성 (무한 재귀를 방지하도록 수정)

-- 교사는 자신의 학교 데이터만 볼 수 있음
CREATE POLICY "Teachers can view their school" ON schools
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_uid = auth.uid() 
      AND users.role = 'teacher' 
      AND users.school_id = schools.id
    )
  );

-- 교사는 자신의 학교 사용자만 관리할 수 있음
CREATE POLICY "Teachers can manage their school users" ON users
  FOR ALL USING (
    -- 자기 자신의 정보는 항상 접근 가능
    auth.uid() = users.auth_uid
    OR
    -- 같은 학교의 교사인 경우
    EXISTS (
      SELECT 1 FROM users AS teacher
      WHERE teacher.auth_uid = auth.uid() 
      AND teacher.role = 'teacher' 
      AND teacher.school_id = users.school_id
    )
  );

-- 학생은 자신의 정보만 볼 수 있음
CREATE POLICY "Students can view own data" ON users
  FOR SELECT USING (
    users.qr_token = current_setting('app.current_qr_token', true)
  );

-- 미션 관련 정책
CREATE POLICY "Teachers can manage missions" ON missions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_uid = auth.uid() 
      AND users.id = missions.teacher_id 
      AND users.role = 'teacher'
    )
  );

CREATE POLICY "Students can view missions" ON missions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.qr_token = current_setting('app.current_qr_token', true)
      AND users.school_id = missions.school_id
    )
  );

-- 미션 로그 정책
CREATE POLICY "Students can manage own mission logs" ON mission_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.qr_token = current_setting('app.current_qr_token', true)
      AND users.id = mission_logs.student_id
    )
  );

CREATE POLICY "Teachers can view student mission logs" ON mission_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users AS teacher
      JOIN users AS student ON student.teacher_id = teacher.id
      WHERE teacher.auth_uid = auth.uid() 
      AND teacher.role = 'teacher'
      AND student.id = mission_logs.student_id
    )
  ); 