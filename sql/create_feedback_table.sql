-- Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    contents JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX idx_feedback_student_id ON public.feedback(student_id);
CREATE INDEX idx_feedback_created_at ON public.feedback(created_at);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Students can only read their own feedback
CREATE POLICY "Students can view own feedback" ON public.feedback
    FOR SELECT USING (auth.uid()::text = student_id::text);

-- Teachers can view feedback for students in their school
CREATE POLICY "Teachers can view student feedback" ON public.feedback
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.students s
            INNER JOIN public.users u ON u.id = auth.uid()
            WHERE s.id = feedback.student_id
            AND s.school_id = u.school_id
        )
    );

-- Teachers can create feedback for students in their school
CREATE POLICY "Teachers can create student feedback" ON public.feedback
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.students s
            INNER JOIN public.users u ON u.id = auth.uid()
            WHERE s.id = feedback.student_id
            AND s.school_id = u.school_id
        )
    );

-- System can create feedback (for automated AI feedback)
CREATE POLICY "System can create feedback" ON public.feedback
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON public.feedback
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 