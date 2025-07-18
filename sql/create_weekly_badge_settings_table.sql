-- 주간 배지 설정 테이블 생성
CREATE TABLE IF NOT EXISTS weekly_badge_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, badge_id)
);

-- RLS 활성화
ALTER TABLE weekly_badge_settings ENABLE ROW LEVEL SECURITY;

-- RLS 정책 추가
-- 사용자는 자신의 설정만 볼 수 있음
CREATE POLICY "Users can view their own weekly badge settings"
    ON weekly_badge_settings
    FOR SELECT
    USING (user_id = auth.uid());

-- 사용자는 자신의 설정만 추가할 수 있음
CREATE POLICY "Users can insert their own weekly badge settings"
    ON weekly_badge_settings
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- 사용자는 자신의 설정만 수정할 수 있음
CREATE POLICY "Users can update their own weekly badge settings"
    ON weekly_badge_settings
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 사용자는 자신의 설정만 삭제할 수 있음
CREATE POLICY "Users can delete their own weekly badge settings"
    ON weekly_badge_settings
    FOR DELETE
    USING (user_id = auth.uid());

-- 인덱스 추가 (성능 향상)
CREATE INDEX idx_weekly_badge_settings_user_id ON weekly_badge_settings(user_id);
CREATE INDEX idx_weekly_badge_settings_badge_id ON weekly_badge_settings(badge_id); 