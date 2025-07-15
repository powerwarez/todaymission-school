import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { MissionLog } from "../types";

export const useMissionLogsForStudents = (
  formattedDate: string
) => {
  const { userProfile } = useAuth();
  const [logs, setLogs] = useState<MissionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    if (
      !userProfile ||
      userProfile.role !== "student" ||
      !formattedDate
    ) {
      setLogs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 해당 날짜의 시작과 끝 계산
      const startOfDay = `${formattedDate}T00:00:00`;
      const endOfDay = `${formattedDate}T23:59:59`;

      const { data, error: fetchError } = await supabase
        .from("mission_logs")
        .select("*")
        .eq("student_id", userProfile.id)
        .gte("completed_at", startOfDay)
        .lte("completed_at", endOfDay);

      if (fetchError) throw fetchError;

      setLogs(data || []);
    } catch (err) {
      console.error("Error fetching mission logs:", err);
      setError(
        "미션 기록을 불러오는 중 오류가 발생했습니다."
      );
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [userProfile, formattedDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const addLog = async (missionId: string) => {
    if (!userProfile || userProfile.role !== "student")
      return null;

    try {
      // 중복 체크
      const existingLog = logs.find(
        (log) => log.mission_id === missionId
      );
      if (existingLog) {
        console.log(
          "Log already exists for this mission today"
        );
        return null;
      }

      // 미션 로그 추가
      const { data: insertedLog, error: insertError } =
        await supabase
          .from("mission_logs")
          .insert({
            student_id: userProfile.id,
            mission_id: missionId,
            completed_at: new Date().toISOString(),
          })
          .select()
          .single();

      if (insertError) throw insertError;

      // 로컬 상태 업데이트
      setLogs((prevLogs) => [...prevLogs, insertedLog]);

      // 일일 스냅샷 업데이트 (있으면)
      await updateDailySnapshot(formattedDate);

      return insertedLog;
    } catch (err) {
      console.error("Error adding mission log:", err);
      setError("미션 기록 추가 중 오류가 발생했습니다.");
      return null;
    }
  };

  const deleteLog = async (logId: string) => {
    if (!userProfile || userProfile.role !== "student")
      return;

    try {
      const { error: deleteError } = await supabase
        .from("mission_logs")
        .delete()
        .eq("id", logId)
        .eq("student_id", userProfile.id);

      if (deleteError) throw deleteError;

      // 로컬 상태 업데이트
      setLogs((prevLogs) =>
        prevLogs.filter((log) => log.id !== logId)
      );

      // 일일 스냅샷 업데이트
      await updateDailySnapshot(formattedDate);
    } catch (err) {
      console.error("Error deleting mission log:", err);
      setError("미션 기록 삭제 중 오류가 발생했습니다.");
    }
  };

  // 일일 스냅샷 업데이트 헬퍼 함수
  const updateDailySnapshot = async (date: string) => {
    if (!userProfile) return;

    try {
      // 현재 스냅샷 가져오기
      const { data: snapshot } = await supabase
        .from("daily_snapshots")
        .select("*")
        .eq("student_id", userProfile.id)
        .eq("snapshot_date", date)
        .single();

      if (snapshot) {
        // 실제 완료된 미션 ID 목록 가져오기
        const { data: completedMissions } = await supabase
          .from("mission_logs")
          .select("mission_id")
          .eq("student_id", userProfile.id)
          .gte("completed_at", `${date}T00:00:00`)
          .lte("completed_at", `${date}T23:59:59`);

        const completedMissionIds =
          completedMissions?.map((m) => m.mission_id) || [];

        await supabase
          .from("daily_snapshots")
          .update({
            completed_missions: completedMissionIds,
            updated_at: new Date().toISOString(),
          })
          .eq("id", snapshot.id);
      }
    } catch (err) {
      console.error("Error updating daily snapshot:", err);
      // 스냅샷 업데이트 실패는 무시 (중요하지 않음)
    }
  };

  return {
    logs,
    loading,
    error,
    fetchLogs,
    addLog,
    deleteLog,
  };
};
