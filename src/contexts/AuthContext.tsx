import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import {
  Session,
  User,
  AuthChangeEvent,
} from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import { UserProfile } from "../types/index";

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
  updateUserProfile: (
    updates: Partial<UserProfile>
  ) => Promise<void>;
  timeZone: string;
}

const AuthContext = createContext<
  AuthContextType | undefined
>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(
    null
  );
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] =
    useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const timeZone = "Asia/Seoul";

  const fetchUserProfile = async (
    authUser: User | null
  ) => {
    if (!authUser) {
      setUserProfile(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("users")
        .select("*, school:schools(*)")
        .eq("auth_uid", authUser.id)
        .single();

      if (error) {
        console.error(
          "Error fetching user profile:",
          error
        );
        return;
      }

      setUserProfile(data);
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
    }
  };

  const fetchStudentProfile = async (qrToken: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select(
          "*, school:schools(*), teacher:users!teacher_id(*)"
        )
        .eq("qr_token", qrToken)
        .single();

      if (error) {
        console.error(
          "Error fetching student profile:",
          error
        );
        return null;
      }

      return data;
    } catch (err) {
      console.error(
        "Failed to fetch student profile:",
        err
      );
      return null;
    }
  };

  useEffect(() => {
    const getSession = async () => {
      try {
        // Check for QR token in cookies first
        const cookies = document.cookie.split(";");
        const qrTokenCookie = cookies.find((cookie) =>
          cookie.trim().startsWith("student_qr_token=")
        );

        if (qrTokenCookie) {
          const qrToken = qrTokenCookie.split("=")[1];
          const profile = await fetchStudentProfile(
            qrToken
          );
          if (profile) {
            setUserProfile(profile);
            setLoading(false);
            return;
          }
        }

        // Otherwise check for normal auth session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) {
          console.error("Error getting session:", error);
        }
        setSession(session);
        setUser(session?.user ?? null);
        await fetchUserProfile(session?.user ?? null);
      } catch (err) {
        console.error("Failed to get session:", err);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    try {
      const { data: authListener } =
        supabase.auth.onAuthStateChange(
          async (
            _event: AuthChangeEvent,
            session: Session | null
          ) => {
            setSession(session);
            setUser(session?.user ?? null);
            await fetchUserProfile(session?.user ?? null);
            setLoading(false);
          }
        );

      return () => {
        if (authListener?.subscription) {
          authListener.subscription.unsubscribe();
        }
      };
    } catch (err) {
      console.error("Error setting up auth listener:", err);
      setLoading(false);
      return () => {};
    }
  }, []);

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
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error("Error logging out:", error);
        }
      }
    } catch (err) {
      console.error("Failed to sign out:", err);
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

  const updateUserProfile = async (
    updates: Partial<UserProfile>
  ) => {
    if (!userProfile) return;

    try {
      const { error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", userProfile.id);

      if (error) {
        console.error(
          "Error updating user profile:",
          error
        );
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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error(
      "useAuth must be used within an AuthProvider"
    );
  }
  return context;
};
