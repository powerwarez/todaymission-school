-- Supabase Storage 버킷 생성 및 정책 설정

-- 버킷 생성 (이미 존재하는 경우 무시)
INSERT INTO storage.buckets (id, name, public)
VALUES ('badge-image', 'badge-image', true)
ON CONFLICT (id) DO NOTHING;

-- 기존 정책 삭제 (있는 경우)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload badge images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their badge images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their badge images" ON storage.objects;

-- 1. 모든 사용자가 배지 이미지를 볼 수 있도록 허용 (공개 버킷)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'badge-image');

-- 2. 인증된 사용자만 배지 이미지를 업로드할 수 있도록 허용
CREATE POLICY "Authenticated users can upload badge images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'badge-image');

-- 3. 인증된 사용자가 자신의 배지 이미지를 수정할 수 있도록 허용
CREATE POLICY "Authenticated users can update their badge images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'badge-image' AND auth.uid()::text = (storage.foldername(name))[2]);

-- 4. 인증된 사용자가 자신의 배지 이미지를 삭제할 수 있도록 허용
CREATE POLICY "Authenticated users can delete their badge images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'badge-image' AND auth.uid()::text = (storage.foldername(name))[2]); 