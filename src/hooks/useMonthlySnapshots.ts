import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { DailyMissionSnapshot, Mission } from "../types";
import { DateTime } from "luxon";

// 특정 연도와 월의 시작일과 종료일을 KST 기준 YYYY-MM-DD 형식으로 반환
const getMonthDateRangeKST = (
  year: number,
  month: number
): { startDate: string; endDate: string } => {
  // 해당 월의 1일과 마지막 날을 한국 시간대로 계산
  const kstDate = DateTime.fromObject(
    { year, month, day: 1 },
    { zone: "Asia/Seoul" }
  );
  const startDate = kstDate
    .startOf("month")
    .toFormat("yyyy-MM-dd");
  const endDate = kstDate
    .endOf("month")
    .toFormat("yyyy-MM-dd");

  return {
    startDate,
    endDate,
  };
};

export const useMonthlySnapshots = (
  year: number,
  month: number
) => {
  const { userProfile } = useAuth();
  const [snapshots, setSnapshots] = useState<
    DailyMissionSnapshot[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMonthlySnapshots = useCallback(async () => {
    if (!userProfile) return;
    setLoading(true);
    setError(null);

    // KST 기준 월 시작/종료일 사용
    const { startDate, endDate } = getMonthDateRangeKST(
      year,
      month
    );
    console.log(
      "[useMonthlySnapshots] Fetching for KST range:",
      startDate,
      "-",
      endDate
    ); // 범위 확인 로그

    try {
      const { data, error: fetchError } = await supabase
        .from("daily_snapshots")
        .select("*") // date, completed_missions_count, total_missions_count 등 포함
        .eq("student_id", userProfile.id)
        // KST 기준 날짜 문자열로 비교
        .gte("snapshot_date", startDate)
        .lte("snapshot_date", endDate)
        .order("snapshot_date", { ascending: true }); // 날짜순 정렬

      if (fetchError) throw fetchError;

      console.log(
        "[useMonthlySnapshots] 원본 데이터:",
        data
      );

      // 데이터베이스 구조를 타입 정의에 맞게 변환
      const transformedData = (data || []).map(
        (snapshot) => ({
          ...snapshot,
          user_id: snapshot.student_id,
          date: snapshot.snapshot_date,
          missions_snapshot: snapshot.missions || [],
          total_missions_count:
            (snapshot.missions as Mission[])?.length || 0,
          completed_missions_count:
            (snapshot.completed_missions as string[])
              ?.length || 0,
        })
      );

      console.log(
        "[useMonthlySnapshots] 변환된 데이터:",
        transformedData
      );

      setSnapshots(transformedData);
    } catch (err: unknown) {
      console.error(
        "Error fetching monthly snapshots:",
        err
      );
      setError(
        "월간 스냅샷을 불러오는 중 오류가 발생했습니다."
      );
      setSnapshots([]); // 에러 시 빈 배열
    } finally {
      setLoading(false);
    }
  }, [userProfile, year, month]);

  useEffect(() => {
    fetchMonthlySnapshots();
  }, [fetchMonthlySnapshots]);

  return {
    snapshots,
    loading,
    error,
    refetch: fetchMonthlySnapshots,
  };
};
