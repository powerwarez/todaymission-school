import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL과 Anon Key가 필요합니다.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// 페이지 가시성 변화 감지 및 연결 복구
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      console.log("Page visible: Refreshing Supabase session");

      supabase.auth
        .refreshSession()
        .then(({ data: { session }, error }) => {
          if (error) {
            console.warn("Session refresh on visibility change:", error.message);
          } else if (session) {
            console.log("Session refreshed successfully");
          }
        });
    }
  });
}

console.log("Supabase 클라이언트가 초기화되었습니다.");

// Supabase URL을 가져오는 헬퍼 함수
export function getSupabaseUrl(): string {
  return supabaseUrl || "";
}
