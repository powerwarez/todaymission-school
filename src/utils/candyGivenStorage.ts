import { supabase } from "../lib/supabaseClient";

export async function fetchCandyGivenStudents(
  badgeId: string
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("badge_candy_rewards")
    .select("student_id")
    .eq("badge_id", badgeId);

  if (error) throw error;
  return new Set(data?.map((row) => row.student_id) ?? []);
}

export async function markCandyGiven(
  badgeId: string,
  studentId: string,
  teacherId: string
): Promise<void> {
  const { error } = await supabase.from("badge_candy_rewards").insert({
    badge_id: badgeId,
    student_id: studentId,
    teacher_id: teacherId,
  });

  if (error) {
    if (error.code === "23505") return;
    throw error;
  }
}
