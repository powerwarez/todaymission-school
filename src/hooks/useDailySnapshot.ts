import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { DailyMissionSnapshot, Mission } from "../types"; // 타입 정의 필요

// 사용하지 않는 formatDate 함수 제거

// 파라미터 타입을 string으로 변경
export const useDailySnapshot = (formattedDate: string) => {
  const { userProfile } = useAuth(); // userProfile 추가
  const [snapshot, setSnapshot] =
    useState<DailyMissionSnapshot | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 내부 formatDate 호출 제거

  const fetchSnapshot = useCallback(async () => {
    if (!userProfile || !formattedDate) {
      // user 체크 제거
      // userProfile 체크 추가
      // formattedDate 유효성 검사 추가
      setSnapshot(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("daily_snapshots")
        .select("*")
        .eq("student_id", userProfile.id) // user.id -> userProfile.id
        .eq("snapshot_date", formattedDate)
        .maybeSingle(); // 결과가 없거나 하나일 수 있음

      if (fetchError) throw fetchError;

      // 데이터베이스 구조를 타입 정의에 맞게 변환
      if (data) {
        const transformedData = {
          ...data,
          user_id: data.student_id,
          date: data.snapshot_date,
          missions_snapshot: data.missions || [],
          total_missions_count:
            (data.missions as Mission[])?.length || 0,
          completed_missions_count:
            (data.completed_missions as string[])?.length ||
            0,
        };
        setSnapshot(transformedData);
      } else {
        setSnapshot(null);
      }
    } catch (err: unknown) {
      console.error("Error fetching daily snapshot:", err);
      setError(
        "일일 스냅샷을 불러오는 중 오류가 발생했습니다."
      );
      // 에러 발생 시 스냅샷 상태를 null로 설정하는 것이 좋을 수 있음
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
    // 의존성 배열에 user와 formattedDate 추가
  }, [userProfile, formattedDate]); // user 제거

  useEffect(() => {
    fetchSnapshot();
  }, [fetchSnapshot]);

  return {
    snapshot,
    loading,
    error,
    refetch: fetchSnapshot,
  };
};
