import { supabase } from "../lib/supabaseClient";

// Helper function to get student profile from cookie
const getStudentFromCookie = async () => {
  const cookies = document.cookie.split(";");
  const qrTokenCookie = cookies.find((cookie) =>
    cookie.trim().startsWith("student_qr_token=")
  );

  if (!qrTokenCookie) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const qrToken = qrTokenCookie.split("=")[1];

  const { data: profile } = await supabase
    .from("users")
    .select(
      "*, school:schools(*), teacher:users!teacher_id(*)"
    )
    .eq("qr_token", qrToken)
    .single();

  if (!profile || profile.role !== "student") {
    throw new Response("Forbidden", { status: 403 });
  }

  return profile;
};

export const studentDashboardLoader = async () => {
  const profile = await getStudentFromCookie();

  // Get missions for the student's school
  const { data: missions } = await supabase
    .from("missions")
    .select("*")
    .eq("school_id", profile.school_id)
    .eq("is_active", true)
    .order("order_index");

  // Get today's mission logs
  const today = new Date().toISOString().split("T")[0];
  const { data: todayLogs } = await supabase
    .from("mission_logs")
    .select("*")
    .eq("student_id", profile.id)
    .gte("completed_at", `${today}T00:00:00`)
    .lt("completed_at", `${today}T23:59:59`);

  return { profile, missions, todayLogs };
};

export const studentHallOfFameLoader = async () => {
  const profile = await getStudentFromCookie();

  // Get student's badges
  const { data: earnedBadges } = await supabase
    .from("earned_badges")
    .select("*, badge:badges(*)")
    .eq("student_id", profile.id)
    .order("earned_date", { ascending: false });

  // Get monthly statistics
  const { data: monthlyStats } = await supabase
    .from("monthly_snapshots")
    .select("*")
    .eq("student_id", profile.id)
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .limit(12);

  return { profile, earnedBadges, monthlyStats };
};
