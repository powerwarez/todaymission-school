import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import { Session, User, AuthChangeEvent } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import { UserProfile } from "../types/index";
import { useOnPageVisible } from "../hooks/usePageVisibility";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  logout: () => Promise<void>;
  loginWithQR: (
    qrToken: string
  ) => Promise<{ success: boolean; error?: string }>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  timeZone: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const timeZone = "Asia/Seoul";

  const fetchUserProfile = async (
    authUser: User
  ): Promise<UserProfile | null> => {
    if (!authUser) return null;

    try {
      console.log("Fetching user profile for auth_uid:", authUser.id);

      // 먼저 기본 사용자 정보를 가져옵니다
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("auth_uid", authUser.id)
        .single();

      if (userError) {
        console.error("Error fetching user profile:", userError);
        return null;
      }

      if (!userData) {
        return null;
      }

      // 교사인 경우 school 정보를 별도로 가져옵니다
      let schoolData = null;
      if (userData.role === "teacher" && userData.school_id) {
        const { data: school, error: schoolError } = await supabase
          .from("schools")
          .select("*")
          .eq("id", userData.school_id)
          .single();

        if (!schoolError && school) {
          schoolData = school;
        }
      }

      // 학생인 경우 teacher 정보를 별도로 가져옵니다
      let teacherData = null;
      if (userData.role === "student" && userData.teacher_id) {
        const { data: teacher, error: teacherError } = await supabase
          .from("users")
          .select("*")
          .eq("id", userData.teacher_id)
          .single();

        if (!teacherError && teacher) {
          teacherData = teacher;
        }
      }

      // userData와 관련 데이터를 합쳐서 반환합니다
      const userWithRelations = {
        ...userData,
        school: schoolData,
        teacher: teacherData,
      };

      console.log("User profile fetched:", userWithRelations);
      return userWithRelations;
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
      return null;
    }
  };

  const fetchStudentProfile = async (qrToken: string) => {
    try {
      const { data: userData, error } = await supabase
        .from("users")
        .select("*")
        .eq("qr_token", qrToken)
        .single();

      if (error) {
        console.error("Error fetching student profile:", error);
        return null;
      }

      if (!userData) return null;

      // 학교 정보 가져오기
      let schoolData = null;
      if (userData.school_id) {
        const { data: school } = await supabase
          .from("schools")
          .select("*")
          .eq("id", userData.school_id)
          .single();

        if (school) schoolData = school;
      }

      // 교사 정보 가져오기
      let teacherData = null;
      if (userData.teacher_id) {
        const { data: teacher } = await supabase
          .from("users")
          .select("*")
          .eq("id", userData.teacher_id)
          .single();

        if (teacher) teacherData = teacher;
      }

      return {
        ...userData,
        school: schoolData,
        teacher: teacherData,
      };
    } catch (err) {
      console.error("Failed to fetch student profile:", err);
      return null;
    }
  };

  useEffect(() => {
    let authListener: {
      subscription: { unsubscribe: () => void };
    } | null = null;

    const initAuth = async () => {
      try {
        // Check for QR token in cookies first
        const cookies = document.cookie.split(";");
        const qrTokenCookie = cookies.find((cookie) =>
          cookie.trim().startsWith("student_qr_token=")
        );

        if (qrTokenCookie) {
          const qrToken = qrTokenCookie.split("=")[1];
          const profile = await fetchStudentProfile(qrToken);
          if (profile) {
            setUserProfile(profile);
            setLoading(false);
            return;
          }
        }

        // Get initial session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
          setLoading(false);
          return;
        }

        if (session) {
          setSession(session);
          setUser(session.user);
          const profile = await fetchUserProfile(session.user);
          if (profile) {
            setUserProfile(profile);
          }
        }

        setLoading(false);

        // Setup auth state listener
        const { data } = supabase.auth.onAuthStateChange(
          async (_event: AuthChangeEvent, session: Session | null) => {
            console.log("Auth state changed:", _event);
            console.log("Session:", session?.user?.id);

            // 로그아웃이나 세션 만료가 아닌 경우에만 프로필 업데이트
            if (_event !== "SIGNED_OUT" && session) {
              setSession(session);
              setUser(session.user);
              const profile = await fetchUserProfile(session.user);
              if (profile) {
                setUserProfile(profile);
              } else if (
                _event === "TOKEN_REFRESHED" ||
                _event === "USER_UPDATED"
              ) {
                // 토큰이 갱신되거나 사용자가 업데이트된 경우는 프로필이 없어도 정상
                console.log("Token refreshed or user updated without profile");
              } else {
                // 새로운 사용자인 경우
                setUserProfile(null);
              }
            } else if (_event === "SIGNED_OUT") {
              console.log("User signed out, clearing state");
              setSession(null);
              setUser(null);
              setUserProfile(null);
            }
          }
        );

        authListener = data;
      } catch (err) {
        console.error("Error initializing auth:", err);
        setLoading(false);
      }
    };

    initAuth();

    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // 페이지가 다시 보일 때 세션과 프로필 새로고침
  useOnPageVisible(() => {
    const refreshAuthState = async () => {
      try {
        // 현재 세션 확인
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (currentSession) {
          console.log("Page visible: Refreshing auth state");
          setSession(currentSession);
          setUser(currentSession.user);

          // 프로필 새로고침
          const profile = await fetchUserProfile(currentSession.user);
          if (profile) {
            setUserProfile(profile);
          }
        } else if (
          userProfile &&
          userProfile.role === "student" &&
          userProfile.qr_token
        ) {
          // QR 로그인 학생의 경우 프로필만 새로고침
          console.log("Page visible: Refreshing student profile");
          const { data: refreshedProfile } = await supabase
            .from("users")
            .select("*")
            .eq("id", userProfile.id)
            .single();

          if (refreshedProfile) {
            setUserProfile(refreshedProfile as UserProfile);
          }
        }
      } catch (error) {
        console.error("Error refreshing auth state on page visible:", error);
      }
    };

    refreshAuthState();
  }, [userProfile?.id]);

  const logout = async () => {
    try {
      if (userProfile?.role === "student") {
        // Clear student cookie
        document.cookie =
          "student_qr_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        setUserProfile(null);
        setUser(null);
        setSession(null);
      } else {
        // 교사 로그아웃
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error("Error logging out:", error);
          throw error;
        }

        // 상태 초기화
        setSession(null);
        setUser(null);
        setUserProfile(null);
      }
    } catch (err) {
      console.error("Failed to sign out:", err);
      throw err; // 에러를 상위로 전달
    }
  };

  const loginWithQR = async (
    qrToken: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const profile = await fetchStudentProfile(qrToken);

      if (!profile) {
        return { success: false, error: "Invalid QR code" };
      }

      // Set cookie to expire on next March 1st
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      let expiryYear = currentYear;
      if (currentMonth >= 2) {
        // March is month 2 (0-indexed)
        expiryYear = currentYear + 1;
      }

      const expiryDate = new Date(expiryYear, 2, 1); // March 1st
      document.cookie = `student_qr_token=${qrToken}; expires=${expiryDate.toUTCString()}; path=/;`;

      setUserProfile(profile);
      return { success: true };
    } catch (err) {
      console.error("Failed to login with QR:", err);
      return { success: false, error: "Login failed" };
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!userProfile) return;

    try {
      const { error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", userProfile.id);

      if (error) {
        console.error("Error updating user profile:", error);
        return;
      }

      setUserProfile({ ...userProfile, ...updates });
    } catch (err) {
      console.error("Failed to update user profile:", err);
    }
  };

  const value = {
    session,
    user,
    userProfile,
    loading,
    isTeacher: userProfile?.role === "teacher",
    isStudent: userProfile?.role === "student",
    logout,
    loginWithQR,
    updateUserProfile,
    timeZone,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
