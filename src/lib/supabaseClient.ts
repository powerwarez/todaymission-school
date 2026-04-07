import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL과 Anon Key가 필요합니다.");
}

// --- 401 자동 재시도 fetch 래퍼 ---
// 만료된 토큰으로 인한 401 응답 시 세션을 갱신하고 요청을 재시도한다.
// 이를 통해 브라우저 탭 비활성화 후 복귀 시 발생하는 인증 실패를 자동으로 복구한다.
let supabaseRef: SupabaseClient | null = null;
let refreshingPromise: Promise<{
  data: { session: { access_token: string } | null };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any;
}> | null = null;

const fetchWithAutoRetry: typeof fetch = async (input, init) => {
  const response = await fetch(input, init);

  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : (input as Request).url;

  if (response.status !== 401 || url.includes("/auth/") || !supabaseRef) {
    return response;
  }

  if (!refreshingPromise) {
    refreshingPromise = supabaseRef.auth.refreshSession() as typeof refreshingPromise;
    refreshingPromise!.finally(() => {
      refreshingPromise = null;
    });
  }

  try {
    const { data } = await refreshingPromise!;
    if (data?.session?.access_token) {
      const retryHeaders = new Headers(init?.headers as HeadersInit | undefined);
      retryHeaders.set(
        "Authorization",
        `Bearer ${data.session.access_token}`
      );
      return fetch(input, { ...init, headers: retryHeaders });
    }
  } catch (e) {
    console.warn("Auto-retry session refresh failed:", e);
  }

  return response;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: fetchWithAutoRetry,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

supabaseRef = supabase;

// 페이지가 다시 보일 때 선제적으로 세션을 갱신한다.
// auto-retry가 반응형(reactive) 보호라면, 이것은 예방적(proactive) 보호이다.
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      supabase.auth
        .refreshSession()
        .then(({ data: { session }, error }) => {
          if (error) {
            console.warn(
              "Session refresh on visibility change:",
              error.message
            );
          } else if (session) {
            console.log("Session refreshed on visibility change");
          }
        });
    }
  });
}

// Supabase URL을 가져오는 헬퍼 함수
export function getSupabaseUrl(): string {
  return supabaseUrl || "";
}
