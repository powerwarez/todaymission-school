-- Supabase 데이터베이스 스키마

-- 학교 테이블
CREATE TABLE schools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사용자 테이블 (교사와 학생 통합)
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'student')),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES users(id) ON DELETE CASCADE, -- 학생의 경우 담당 교사
  auth_provider TEXT CHECK (auth_provider IN ('kakao', 'qr')),
  auth_uid TEXT, -- Supabase Auth UID (교사용)
  qr_token TEXT UNIQUE, -- QR 로그인용 토큰 (학생용)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT teacher_must_have_school CHECK (
    (role = 'teacher' AND school_id IS NOT NULL) OR role = 'student'
  ),
  CONSTRAINT student_must_have_teacher CHECK (
    (role = 'student' AND teacher_id IS NOT NULL) OR role = 'teacher'
  )
);

-- 미션 테이블
CREATE TABLE missions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 미션 로그 테이블 (학생들의 미션 수행 기록)
CREATE TABLE mission_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, mission_id, completed_at::date)
);

-- 일일 스냅샷 테이블
CREATE TABLE daily_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  missions JSONB NOT NULL DEFAULT '[]',
  completed_missions JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, snapshot_date)
);

-- 월간 스냅샷 테이블
CREATE TABLE monthly_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  days_data JSONB NOT NULL DEFAULT '{}',
  total_missions INTEGER DEFAULT 0,
  completed_missions INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, year, month)
);

-- 배지 테이블
CREATE TABLE badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  type TEXT NOT NULL CHECK (type IN ('weekly', 'monthly', 'special')),
  criteria JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 획득한 배지 테이블
CREATE TABLE earned_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_date DATE NOT NULL,
  week_start_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, badge_id, earned_date)
);

-- 학생 QR 코드 정보 테이블
CREATE TABLE student_qr_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  qr_data TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id)
);

-- 인덱스 생성
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_school_id ON users(school_id);
CREATE INDEX idx_users_teacher_id ON users(teacher_id);
CREATE INDEX idx_missions_teacher_id ON missions(teacher_id);
CREATE INDEX idx_missions_school_id ON missions(school_id);
CREATE INDEX idx_mission_logs_student_id ON mission_logs(student_id);
CREATE INDEX idx_mission_logs_completed_at ON mission_logs(completed_at);
CREATE INDEX idx_daily_snapshots_student_date ON daily_snapshots(student_id, snapshot_date);
CREATE INDEX idx_monthly_snapshots_student_period ON monthly_snapshots(student_id, year, month);
CREATE INDEX idx_badges_teacher_id ON badges(teacher_id);
CREATE INDEX idx_earned_badges_student_id ON earned_badges(student_id);

-- RLS (Row Level Security) 정책
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE earned_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_qr_codes ENABLE ROW LEVEL SECURITY;

-- 교사는 자신의 학교 데이터만 볼 수 있음
CREATE POLICY "Teachers can view their school" ON schools
  FOR SELECT USING (
    auth.uid() IN (
      SELECT auth_uid FROM users 
      WHERE role = 'teacher' AND school_id = schools.id
    )
  );

-- 교사는 자신의 학교 사용자만 관리할 수 있음
CREATE POLICY "Teachers can manage their school users" ON users
  FOR ALL USING (
    auth.uid() IN (
      SELECT auth_uid FROM users u 
      WHERE u.role = 'teacher' AND u.school_id = users.school_id
    )
  );

-- 학생은 자신의 정보만 볼 수 있음
CREATE POLICY "Students can view own data" ON users
  FOR SELECT USING (
    users.qr_token = current_setting('app.current_qr_token', true)
    AND users.id = users.id
  );

-- 미션 관련 정책
CREATE POLICY "Teachers can manage missions" ON missions
  FOR ALL USING (
    auth.uid() IN (
      SELECT auth_uid FROM users 
      WHERE id = missions.teacher_id AND role = 'teacher'
    )
  );

CREATE POLICY "Students can view missions" ON missions
  FOR SELECT USING (
    missions.school_id IN (
      SELECT school_id FROM users 
      WHERE qr_token = current_setting('app.current_qr_token', true)
    )
  );

-- 미션 로그 정책
CREATE POLICY "Students can manage own mission logs" ON mission_logs
  FOR ALL USING (
    mission_logs.student_id IN (
      SELECT id FROM users 
      WHERE qr_token = current_setting('app.current_qr_token', true)
    )
  );

CREATE POLICY "Teachers can view student mission logs" ON mission_logs
  FOR SELECT USING (
    auth.uid() IN (
      SELECT u.auth_uid FROM users u
      JOIN users s ON s.teacher_id = u.id
      WHERE s.id = mission_logs.student_id AND u.role = 'teacher'
    )
  );

-- 트리거: updated_at 자동 업데이트 (이것은 유용하므로 유지)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_missions_updated_at BEFORE UPDATE ON missions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_snapshots_updated_at BEFORE UPDATE ON daily_snapshots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_snapshots_updated_at BEFORE UPDATE ON monthly_snapshots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_badges_updated_at BEFORE UPDATE ON badges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 