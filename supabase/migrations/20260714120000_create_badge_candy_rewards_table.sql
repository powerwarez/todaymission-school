-- 도전과제 달성 사탕 지급 기록
CREATE TABLE public.badge_candy_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  given_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE (badge_id, student_id)
);

CREATE INDEX idx_badge_candy_rewards_badge_id ON public.badge_candy_rewards(badge_id);
CREATE INDEX idx_badge_candy_rewards_teacher_id ON public.badge_candy_rewards(teacher_id);

ALTER TABLE public.badge_candy_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view their candy rewards"
  ON public.badge_candy_rewards
  FOR SELECT
  USING (
    teacher_id IN (
      SELECT id FROM public.users
      WHERE auth_uid = auth.uid() AND role = 'teacher'
    )
  );

CREATE POLICY "Teachers can mark candy rewards"
  ON public.badge_candy_rewards
  FOR INSERT
  WITH CHECK (
    teacher_id IN (
      SELECT id FROM public.users
      WHERE auth_uid = auth.uid() AND role = 'teacher'
    )
    AND badge_id IN (
      SELECT id FROM public.badges
      WHERE teacher_id = badge_candy_rewards.teacher_id
    )
    AND student_id IN (
      SELECT id FROM public.users
      WHERE teacher_id = badge_candy_rewards.teacher_id AND role = 'student'
    )
  );
