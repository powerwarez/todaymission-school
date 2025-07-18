import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: SupabaseClient;

try {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase URL or Anon Key is missing. Using a mock client.");
    // 가짜 클라이언트 생성
    supabase = {
      auth: {
        getSession: () =>
          Promise.resolve({
            data: { session: null },
            error: null,
          }),
        onAuthStateChange: () => ({
          data: { subscription: { unsubscribe: () => {} } },
        }),
        signOut: () => Promise.resolve({ error: null }),
        signInWithOAuth: () =>
          Promise.resolve({
            data: { provider: "kakao", url: null },
            error: null,
          }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({
                data: null,
                error: { message: "Mock client" },
              }),
          }),
        }),
        update: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
        insert: () => Promise.resolve({ data: null, error: null }),
      }),
    } as unknown as SupabaseClient;
  } else {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log("Supabase client initialized successfully");
  }
} catch (error) {
  console.error("Error initializing Supabase client:", error);
  // 가짜 클라이언트 생성
  supabase = {
    auth: {
      getSession: () =>
        Promise.resolve({
          data: { session: null },
          error: null,
        }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
      signOut: () => Promise.resolve({ error: null }),
      signInWithOAuth: () =>
        Promise.resolve({
          data: { provider: "kakao", url: null },
          error: null,
        }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () =>
            Promise.resolve({
              data: null,
              error: { message: "Mock client" },
            }),
        }),
      }),
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
      insert: () => Promise.resolve({ data: null, error: null }),
    }),
  } as unknown as SupabaseClient;
}

export { supabase };

// Supabase URL을 가져오는 헬퍼 함수
export function getSupabaseUrl(): string {
  return supabaseUrl || "";
}
