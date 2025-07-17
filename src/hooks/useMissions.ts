import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { Mission } from "../types";

export const useMissions = () => {
  const { userProfile, isTeacher } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMissions = useCallback(async () => {
    // 프로필이 없으면 미션을 조회하지 않음
    if (!userProfile) {
      console.log(
        "[useMissions] No userProfile, skipping fetch"
      );
      setMissions([]);
      setLoading(false);
      return;
    }

    // school_id 결정: 교사는 직접 school_id 사용, 학생은 자신의 school_id 사용
    let schoolId: string | null = null;
    if (isTeacher && userProfile.school_id) {
      schoolId = userProfile.school_id;
    } else if (!isTeacher && userProfile.school_id) {
      // 학생도 school_id를 가지고 있음
      schoolId = userProfile.school_id;
    }

    if (!schoolId) {
      console.log("[useMissions] No schoolId found", {
        isTeacher,
        userProfile,
        school_id: userProfile.school_id,
      });
      setMissions([]);
      setLoading(false);
      return;
    }

    console.log(
      "[useMissions] Fetching missions for school:",
      schoolId
    );
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("missions")
        .select("*")
        .eq("school_id", schoolId)
        .order("order_index", { ascending: true });

      console.log("[fetchMissions] DB response:", {
        data,
        error: fetchError,
      });

      if (fetchError) throw fetchError;

      // 데이터베이스 형태를 UI 형태로 변환
      const transformedData = (data || []).map(
        (mission) => ({
          ...mission,
          content: mission.title, // title을 content로 매핑
          order: mission.order_index, // order_index를 order로 매핑
        })
      );

      console.log(
        "[fetchMissions] Transformed data:",
        transformedData
      );

      setMissions(transformedData);
    } catch (err: unknown) {
      console.error("Error fetching missions:", err);
      setError("미션을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [userProfile, isTeacher]);

  useEffect(() => {
    fetchMissions();
  }, [fetchMissions]);

  const addMission = async (missionData: {
    content: string;
    order: number;
  }): Promise<Mission | null> => {
    console.log("[addMission] Input data:", missionData);
    if (!userProfile || !isTeacher) return null;
    try {
      const insertData = {
        school_id: userProfile.school_id,
        teacher_id: userProfile.id,
        title: missionData.content,
        order_index: missionData.order,
      };
      console.log(
        "[addMission] DB insert data:",
        insertData
      );

      const { data, error: insertError } = await supabase
        .from("missions")
        .insert(insertData)
        .select()
        .single();

      console.log("[addMission] DB response:", {
        data,
        error: insertError,
      });

      if (insertError) throw insertError;
      if (data) {
        // 데이터베이스 형태를 UI 형태로 변환
        const transformedMission = {
          ...data,
          content: data.title, // title을 content로 매핑
          order: data.order_index, // order_index를 order로 매핑
        };

        console.log(
          "[addMission] Transformed mission:",
          transformedMission
        );

        setMissions((prev) =>
          [...prev, transformedMission].sort(
            (a, b) => a.order - b.order
          )
        );
        return transformedMission;
      }
      return null;
    } catch (err: unknown) {
      console.error("Error adding mission:", err);
      setError("미션 추가 중 오류가 발생했습니다.");
      return null;
    }
  };

  const updateMission = async (
    id: string,
    updates: {
      content?: string;
      order?: number;
      description?: string;
      is_active?: boolean;
    }
  ) => {
    if (!userProfile || !isTeacher) return;
    try {
      // content를 title로, order를 order_index로 변환
      type DbUpdate = {
        title?: string;
        order_index?: number;
        description?: string;
        is_active?: boolean;
      };

      const dbUpdates: DbUpdate = {};
      if (
        "content" in updates &&
        updates.content !== undefined
      ) {
        dbUpdates.title = updates.content;
      }
      if (
        "order" in updates &&
        updates.order !== undefined
      ) {
        dbUpdates.order_index = updates.order;
      }
      // 다른 필드들은 그대로 복사
      if (
        "description" in updates &&
        updates.description !== undefined
      ) {
        dbUpdates.description = updates.description;
      }
      if (
        "is_active" in updates &&
        updates.is_active !== undefined
      ) {
        dbUpdates.is_active = updates.is_active;
      }

      const { error: updateError } = await supabase
        .from("missions")
        .update(dbUpdates)
        .eq("id", id)
        .eq("school_id", userProfile.school_id);

      if (updateError) throw updateError;
      setMissions((prev) =>
        prev
          .map((m) =>
            m.id === id ? { ...m, ...updates } : m
          )
          .sort((a, b) => a.order - b.order)
      );
    } catch (err: unknown) {
      console.error("Error updating mission:", err);
      setError("미션 수정 중 오류가 발생했습니다.");
    }
  };

  const deleteMission = async (id: string) => {
    if (!userProfile || !isTeacher) return;
    try {
      const { error: deleteError } = await supabase
        .from("missions")
        .delete()
        .eq("id", id)
        .eq("school_id", userProfile.school_id);

      if (deleteError) throw deleteError;
      setMissions((prev) =>
        prev.filter((m) => m.id !== id)
      );
    } catch (err: unknown) {
      console.error("Error deleting mission:", err);
      setError("미션 삭제 중 오류가 발생했습니다.");
    }
  };

  return {
    missions,
    loading,
    error,
    fetchMissions,
    addMission,
    updateMission,
    deleteMission,
    setMissions,
  };
};
