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
      console.log("Page visible: Checking Supabase connection");

      // 세션 갱신 시도
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (error) {
          console.error("Error refreshing session:", error);
        } else if (session) {
          console.log("Session refreshed successfully");
        }
      });

      // Realtime 연결 재시작 (필요한 경우)
      // 현재는 Supabase가 자동으로 처리하므로 추가 작업 불필요
    }
  });
}

console.log("Supabase 클라이언트가 초기화되었습니다.");
