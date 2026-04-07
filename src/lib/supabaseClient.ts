import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL과 Anon Key가 필요합니다.");
}

// --- 401 자동 재시도 fetch 래퍼 ---
// 요청이 401을 반환하면 세션을 갱신하고 자동으로 재시도한다.
// visibilitychange 핸들러의 세션 갱신이 완료된 후에 요청이 실행되므로
// 대부분의 경우 401이 발생하지 않지만, 안전망으로 유지한다.
let supabaseRef: SupabaseClient | null = null;

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

  try {
    const { data } = await supabaseRef.auth.refreshSession();
    if (data?.session?.access_token) {
      const retryHeaders = new Headers(
        init?.headers as HeadersInit | undefined
      );
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

// --- 중앙 집중식 세션 갱신 ---
// 탭이 다시 보일 때 세션을 갱신하고, 다른 코드가 갱신 완료를 기다릴 수 있게 한다.
// 핵심: refreshSession()이 진행 중인 동안 Supabase 내부 getSession() 락이
// 충돌할 수 있으므로, 모든 데이터 fetch는 갱신이 끝난 뒤에 실행해야 한다.
let _sessionReadyPromise: Promise<void> = Promise.resolve();

/**
 * 현재 진행 중인 세션 갱신이 완료될 때까지 기다린다.
 * 갱신이 진행 중이 아니면 즉시 resolve된다.
 * 모든 visibilitychange 핸들러에서 데이터 fetch 전에 호출해야 한다.
 */
export function waitForSession(): Promise<void> {
  return _sessionReadyPromise;
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      const refresh = supabase.auth
        .refreshSession()
        .then(({ data: { session }, error }) => {
          if (error) {
            console.warn("Session refresh on visibility:", error.message);
          } else if (session) {
            console.log("Session refreshed on visibility change");
          }
        })
        .catch((e: unknown) => {
          console.warn("Session refresh error:", e);
        });

      _sessionReadyPromise = Promise.race([
        refresh,
        new Promise<void>((resolve) => setTimeout(resolve, 5000)),
      ]);
    }
  });
}

export function getSupabaseUrl(): string {
  return supabaseUrl || "";
}
