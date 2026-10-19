import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "./AuthContext";
import { AppLayout, isAppLayout } from "../theme/layouts";

interface LayoutContextValue {
  layout: AppLayout | null;
  isSaving: boolean;
  selectLayout: (layout: AppLayout) => Promise<void>;
}

const LayoutContext = createContext<LayoutContextValue | null>(null);

export const LayoutProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { userProfile } = useAuth();
  const [layout, setLayout] = useState<AppLayout | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.layout = layout ?? "classic";
  }, [layout]);

  useEffect(() => {
    const loadLayout = async () => {
      if (!userProfile) return;

      try {
        const { data, error } = await supabase
          .from("users")
          .select("layout")
          .eq("id", userProfile.id)
          .single();

        if (error) throw error;

        const stored = data?.layout ?? null;
        if (isAppLayout(stored)) {
          setLayout(stored);
          localStorage.setItem(`app-layout:${userProfile.id}`, stored);
        } else {
          setLayout(null);
          localStorage.removeItem(`app-layout:${userProfile.id}`);
        }
      } catch (error) {
        console.error("레이아웃을 불러오지 못했습니다.", error);
      }
    };

    loadLayout();
  }, [userProfile]);

  const selectLayout = async (next: AppLayout) => {
    if (!userProfile) return;

    setLayout(next);
    localStorage.setItem(`app-layout:${userProfile.id}`, next);

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({ layout: next })
        .eq("id", userProfile.id);

      if (error) throw error;
      toast.success("이 계정에 레이아웃이 저장되었습니다.");
    } catch (error) {
      console.error("레이아웃 저장 실패:", error);
      toast.error("레이아웃 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <LayoutContext.Provider value={{ layout, isSaving, selectLayout }}>
      {children}
    </LayoutContext.Provider>
  );
};

export function useLayout(): LayoutContextValue {
  const value = useContext(LayoutContext);
  if (!value) {
    throw new Error("useLayout은 LayoutProvider 안에서 사용해야 합니다.");
  }
  return value;
}
