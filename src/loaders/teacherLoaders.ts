import { supabase } from "../lib/supabaseClient";

export const teacherDashboardLoader = async () => {
  // Get auth user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    throw new Response("Unauthorized", { status: 401 });

  // Get user profile
  const { data: profile } = await supabase
    .from("users")
    .select("*, school:schools(*)")
    .eq("auth_uid", user.id)
    .single();

  if (!profile || profile.role !== "teacher") {
    throw new Response("Forbidden", { status: 403 });
  }

  // Get missions
  const { data: missions } = await supabase
    .from("missions")
    .select("*")
    .eq("school_id", profile.school_id)
    .order("order_index");

  // Get students
  const { data: students } = await supabase
    .from("users")
    .select("*")
    .eq("teacher_id", profile.id)
    .eq("role", "student");

  return { profile, missions, students };
};

export const teacherStudentsLoader = async () => {
  // Get auth user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    throw new Response("Unauthorized", { status: 401 });

  // Get user profile
  const { data: profile } = await supabase
    .from("users")
    .select("*, school:schools(*)")
    .eq("auth_uid", user.id)
    .single();

  if (!profile || profile.role !== "teacher") {
    throw new Response("Forbidden", { status: 403 });
  }

  // Get students
  const { data: students } = await supabase
    .from("users")
    .select("*")
    .eq("teacher_id", profile.id)
    .eq("role", "student")
    .order("name");

  return { profile, students: students || [] };
};

export const teacherStatisticsLoader = async () => {
  // Get auth user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    throw new Response("Unauthorized", { status: 401 });

  // Get user profile
  const { data: profile } = await supabase
    .from("users")
    .select("*, school:schools(*)")
    .eq("auth_uid", user.id)
    .single();

  if (!profile || profile.role !== "teacher") {
    throw new Response("Forbidden", { status: 403 });
  }

  return { profile };
};
