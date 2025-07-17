-- custom_badges 테이블 생성
-- 사용자가 업로드한 커스텀 배지 이미지를 저장하는 테이블

-- 테이블 생성
CREATE TABLE IF NOT EXISTS custom_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    badge_id VARCHAR(255) UNIQUE NOT NULL, -- custom_으로 시작하는 고유 ID
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_path TEXT NOT NULL, -- Supabase Storage의 이미지 경로
    badge_type VARCHAR(50) DEFAULT 'weekly', -- 배지 타입 (weekly, daily 등)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_custom_badges_user_id ON custom_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_badges_badge_id ON custom_badges(badge_id);

-- RLS (Row Level Security) 활성화
ALTER TABLE custom_badges ENABLE ROW LEVEL SECURITY;

-- RLS 정책 1: 사용자가 자신의 커스텀 배지를 생성할 수 있도록 허용
CREATE POLICY "Users can create own custom badges" ON custom_badges
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = (SELECT id FROM users WHERE auth_uid = auth.uid()));

-- RLS 정책 2: 사용자가 자신의 커스텀 배지를 조회할 수 있도록 허용
CREATE POLICY "Users can view own custom badges" ON custom_badges
    FOR SELECT
    TO authenticated
    USING (user_id = (SELECT id FROM users WHERE auth_uid = auth.uid()));

-- RLS 정책 3: 사용자가 자신의 커스텀 배지를 삭제할 수 있도록 허용
CREATE POLICY "Users can delete own custom badges" ON custom_badges
    FOR DELETE
    TO authenticated
    USING (user_id = (SELECT id FROM users WHERE auth_uid = auth.uid()));

-- RLS 정책 4: 사용자가 자신의 커스텀 배지를 수정할 수 있도록 허용
CREATE POLICY "Users can update own custom badges" ON custom_badges
    FOR UPDATE
    TO authenticated
    USING (user_id = (SELECT id FROM users WHERE auth_uid = auth.uid()))
    WITH CHECK (user_id = (SELECT id FROM users WHERE auth_uid = auth.uid()));

-- 삭제 함수 생성 (RLS 정책 우회용 - 필요한 경우)
CREATE OR REPLACE FUNCTION delete_custom_badge(badge_db_id UUID)
RETURNS VOID AS $$
BEGIN
    DELETE FROM custom_badges WHERE id = badge_db_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 함수 권한 부여
GRANT EXECUTE ON FUNCTION delete_custom_badge(UUID) TO authenticated; 