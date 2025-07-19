import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../contexts/NotificationContext";
import { MissionLog } from "../types";
import toast from "react-hot-toast";
import { DateTime } from "luxon";

// 오디오 재생 함수
const playSound = (soundFile: string) => {
  const audio = new Audio(soundFile);
  audio.load();
  audio.play().catch((e) => console.error("Error playing sound:", e));
};

export const useMissionLogs = (formattedDate: string) => {
  const { user, userProfile } = useAuth();
  const { showBadgeNotification } = useNotification();
  const [logs, setLogs] = useState<MissionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 오늘 완료된 로그 수 상태 추가 (예측용)
  const [completedTodayCount, setCompletedTodayCount] = useState(0);
  // 전체 완료 로그 수 상태 추가 (예측용)
  const [totalCompletedCount, setTotalCompletedCount] = useState<number | null>(
    null
  );
  // 오늘 필요한 총 미션 수 상태 추가 (예측용)
  const [totalMissionsToday, setTotalMissionsToday] = useState<number | null>(
    null
  );
  // 이전에 획득한 배지 ID 목록 상태 추가 (예측용, Set 사용) - 최초 획득 확인용
  const [previouslyEarnedBadgeIds, setPreviouslyEarnedBadgeIds] = useState<
    Set<string>
  >(new Set());

  const fetchLogs = useCallback(async () => {
    console.log("[useMissionLogs] fetchLogs called", {
      user: !!user,
      userProfile: !!userProfile,
      formattedDate,
    });

    if (!userProfile) {
      console.log("[useMissionLogs] Waiting for userProfile...");
      return;
    }

    console.log("[useMissionLogs] Fetching logs...");
    setLoading(true);
    setError(null);
    try {
      // completed_at이 timestamptz이므로 날짜 범위 쿼리 사용
      // formattedDate는 yyyy-MM-dd 형식이므로 한국 시간대로 해석
      const kstDate = DateTime.fromISO(formattedDate, {
        zone: "Asia/Seoul",
      });
      const startOfDay = kstDate.startOf("day").toISO()!;
      const endOfDay = kstDate.endOf("day").toISO()!;

      console.log("[useMissionLogs] 조회 조건:", {
        student_id: userProfile.id,
        startOfDay,
        endOfDay,
      });

      const { data, error: fetchError } = await supabase
        .from("mission_logs")
        .select("*")
        .eq("student_id", userProfile.id)
        .gte("completed_at", startOfDay)
        .lte("completed_at", endOfDay);

      if (fetchError) {
        console.error("[useMissionLogs] 조회 에러:", fetchError);
        throw fetchError;
      }

      const logsData = data || [];
      console.log("[useMissionLogs] Fetched logs:", logsData);
      setLogs(logsData);
      setCompletedTodayCount(logsData.length);
    } catch (err: unknown) {
      console.error("Error fetching mission logs:", err);
      setError("미션 로그를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [userProfile, formattedDate]);

  useEffect(() => {
    console.log("[useMissionLogs] useEffect triggered for fetchLogs");
    fetchLogs();
  }, [fetchLogs]);

  // 데이터 로딩 시 관련 상태 업데이트
  const fetchInitialData = useCallback(async () => {
    console.log("[useMissionLogs] fetchInitialData called", {
      user: !!user,
      userProfile: !!userProfile,
      formattedDate,
    });

    if (!userProfile) {
      console.log(
        "[useMissionLogs] Waiting for userProfile in fetchInitialData..."
      );
      return;
    }
    console.log(
      "[useMissionLogs] Fetching initial data for badge prediction..."
    );
    setLoading(true); // 로딩 시작
    setError(null);
    try {
      // Fetch logs for the specific date to get initial completedTodayCount
      const { data: logsData, error: logsError } = await supabase
        .from("mission_logs")
        .select("*") // count만 필요하므로 id만 가져옴
        .eq("student_id", userProfile.id)
        .gte(
          "completed_at",
          DateTime.fromISO(formattedDate, {
            zone: "Asia/Seoul",
          })
            .startOf("day")
            .toISO()!
        )
        .lte(
          "completed_at",
          DateTime.fromISO(formattedDate, {
            zone: "Asia/Seoul",
          })
            .endOf("day")
            .toISO()!
        );

      if (logsError) throw logsError;
      const initialLogs = logsData || [];
      setLogs(initialLogs); // 기존 로그 상태 설정
      setCompletedTodayCount(initialLogs.length); // 오늘 완료 개수 초기화
      console.log(
        `[useMissionLogs] Initial completedTodayCount: ${initialLogs.length}`
      );

      // Fetch total mission count for today
      // school_id 결정: 교사는 직접, 학생도 직접 school_id 사용
      let schoolId: string | null = null;
      if (userProfile?.school_id) {
        schoolId = userProfile.school_id;
      }

      if (!schoolId) {
        console.error("[useMissionLogs] School ID not found", {
          userProfile,
          role: userProfile?.role,
          school_id: userProfile?.school_id,
        });
        return;
      }

      const { count: missionsCount, error: missionsError } = await supabase
        .from("missions")
        .select("id", { count: "exact", head: true })
        .eq("school_id", schoolId);

      if (missionsError) throw missionsError;
      setTotalMissionsToday(missionsCount ?? 0);
      console.log(
        `[useMissionLogs] Initial totalMissionsToday: ${missionsCount}`
      );

      // Fetch total completed count (all time)
      const { count: totalCount, error: totalCountError } = await supabase
        .from("mission_logs")
        .select("id", { count: "exact", head: true }) // count만 가져옴
        .eq("student_id", userProfile.id);

      if (totalCountError) throw totalCountError;
      setTotalCompletedCount(totalCount ?? 0);
      console.log(
        `[useMissionLogs] Initial totalCompletedCount: ${totalCount}`
      );

      // Fetch previously earned one-time badges ('첫 도전', '열정 가득')
      // 실제 badge_id는 challenges 테이블 확인 후 정확히 기입해야 함
      // 배지 시스템이 아직 구현되지 않았으므로 일단 스킵
      /*
      const oneTimeBadgeIds = [
        "first_mission_completed",
        "ten_missions_completed",
      ]; // 예시 ID
      const {
        data: earnedBadgesData,
        error: earnedBadgesError,
      } = await supabase
        .from("earned_badges")
        .select("badge_id")
        .eq("student_id", userProfile.id)
        .in("badge_id", oneTimeBadgeIds);

      if (earnedBadgesError) throw earnedBadgesError;
      const earnedSet = new Set(
        earnedBadgesData?.map((b) => b.badge_id) || []
      );
      setPreviouslyEarnedBadgeIds(earnedSet);
      console.log(
        "[useMissionLogs] Initial previouslyEarnedBadgeIds:",
        earnedSet
      );
      */

      // 배지 시스템이 구현될 때까지 빈 Set 사용
      setPreviouslyEarnedBadgeIds(new Set());
    } catch (err: unknown) {
      console.error("Error fetching initial data for badge prediction:", err);
      // 에러가 발생해도 기본 기능은 작동하도록 에러 메시지 제거
      // setError("초기 데이터 로딩 중 오류 발생");
    } finally {
      setLoading(false); // 초기 데이터 로딩 완료
    }
  }, [userProfile, formattedDate]);

  // 컴포넌트 마운트 또는 사용자/날짜 변경 시 초기 데이터 로드
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const addLog = async (missionId: string) => {
    if (!userProfile || !formattedDate) return null;

    // 상태 로드 확인 (totalMissionsToday는 null일 수 있음)
    if (totalMissionsToday === null) {
      console.warn("[addLog] totalMissionsToday state not loaded yet.");
      return null;
    }

    // 1. 현재 상태 스냅샷 (badge 체크 로직 이동을 위해 필요)
    const currentCompletedToday = completedTodayCount;
    const currentTotalCompleted = totalCompletedCount ?? 0;

    // 2. 다음 상태 예측
    const newCompletedToday = currentCompletedToday + 1;
    const newTotalCompleted = currentTotalCompleted + 1;

    // 3. 배지 획득 조건 한 번에 검사
    const newlyEarnedBadgeIds: string[] = []; // 이번에 획득한 배지 IDs
    const badgesToUpdateInSet = new Set<string>(); // 상태 업데이트 시 previouslyEarnedBadgeIds에 추가할 배지들

    // 첫 도전 배지 체크
    const firstMissionBadgeId = "first_mission_completed";
    if (
      newTotalCompleted === 1 &&
      !previouslyEarnedBadgeIds.has(firstMissionBadgeId)
    ) {
      console.log("🎉 Predicted badge earn: 첫 도전");
      newlyEarnedBadgeIds.push(firstMissionBadgeId);
      badgesToUpdateInSet.add(firstMissionBadgeId);
    }

    // 열정 가득 배지 체크 (10개 완료)
    const passionBadgeId = "ten_missions_completed";
    if (
      newTotalCompleted >= 10 &&
      !previouslyEarnedBadgeIds.has(passionBadgeId)
    ) {
      console.log("🎉 Predicted badge earn: 열정 가득");
      newlyEarnedBadgeIds.push(passionBadgeId);
      badgesToUpdateInSet.add(passionBadgeId);
    }

    // 오늘의 미션 달성 배지 체크 (오늘 할당량 모두 완료)
    const dailyCompleteBadgeId = "daily_mission_complete";
    if (
      totalMissionsToday > 0 &&
      newCompletedToday >= totalMissionsToday &&
      currentCompletedToday < totalMissionsToday
    ) {
      console.log("🎉 일일 미션 모두 달성!");
      // 시스템 배지 자동 부여
      try {
        const { error } = await supabase.from("student_system_badges").insert({
          student_id: userProfile.id,
          system_badge_id: dailyCompleteBadgeId,
          earned_date: formattedDate,
        });

        if (error && error.code !== "23505") {
          // 중복 에러가 아닌 경우만 로그
          console.error("일일미션 달성 배지 저장 실패:", error);
        } else if (!error) {
          console.log("✅ 일일미션 달성 배지 획득!");
          // Toast 알림 표시
          toast.success("🏆 오늘의 미션 달성! 배지를 획득했습니다!", {
            duration: 4000,
            position: "top-center",
          });
          showBadgeNotification("daily_mission_complete");
        }
      } catch (err) {
        console.error("배지 저장 중 오류:", err);
      }
    }

    // --- DB 작업 시작 ---
    try {
      const todayKSTString = formattedDate;

      // 로그 존재 여부 확인
      const { error: checkError, count: existingLogCount } = await supabase
        .from("mission_logs")
        .select("id", { count: "exact", head: true })
        .eq("student_id", userProfile.id)
        .eq("mission_id", missionId)
        .gte("completed_at", `${todayKSTString}T00:00:00`)
        .lte("completed_at", `${todayKSTString}T23:59:59`);

      if (checkError) throw checkError;
      if (existingLogCount && existingLogCount > 0) {
        console.log("[useMissionLogs] Log already exists.");
        return null;
      }

      // 4. 로그 삽입
      // 한국 시간 기준으로 현재 시간 설정
      const nowKST = DateTime.now().setZone("Asia/Seoul");

      // 오늘 날짜가 formattedDate와 같은지 확인
      const todayKST = nowKST.toFormat("yyyy-MM-dd");

      // formattedDate와 오늘이 같으면 현재 시간 사용, 아니면 해당 날짜의 정오 사용
      const completedAt =
        todayKST === formattedDate
          ? nowKST.toISO()!
          : DateTime.fromISO(formattedDate, {
              zone: "Asia/Seoul",
            })
              .set({ hour: 12, minute: 0, second: 0 })
              .toISO()!;

      console.log("[addLog] 삽입할 데이터:", {
        student_id: userProfile.id,
        mission_id: missionId,
        completed_at: completedAt,
        formattedDate,
        note: todayKST === formattedDate ? "실시간 기록" : "과거 날짜 기록",
      });

      const { data: insertedLog, error: insertError } = await supabase
        .from("mission_logs")
        .insert({
          student_id: userProfile.id,
          mission_id: missionId,
          completed_at: completedAt,
        })
        .select()
        .single();

      if (insertError) {
        console.error("[addLog] 삽입 에러 상세:", {
          error: insertError,
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          data: {
            student_id: userProfile.id,
            mission_id: missionId,
            completed_at: completedAt,
            formattedDate,
          },
        });

        // 409 에러 (중복 키) 처리
        if (insertError.code === "23505") {
          console.error("[addLog] 중복 키 에러 - UNIQUE 제약 조건 위반");

          // 기존 로그 조회하여 확인
          const { data: existingLogs } = await supabase
            .from("mission_logs")
            .select("*")
            .eq("student_id", userProfile.id)
            .eq("mission_id", missionId)
            .order("completed_at", { ascending: false })
            .limit(5);

          console.error("[addLog] 해당 미션의 최근 로그:", existingLogs);
        }

        throw insertError;
      }

      console.log("[addLog] 삽입 성공:", insertedLog);
      if (!insertedLog) {
        console.error("[addLog] 삽입 후 데이터가 없음");
        return null;
      }

      // 5. 교사가 만든 커스텀 배지 체크
      console.log("[addLog] 커스텀 배지 체크 시작");

      try {
        // 해당 미션에 대한 완료 횟수 조회
        const { data: missionLogCount, error: countError } = await supabase
          .from("mission_logs")
          .select("id", { count: "exact" })
          .eq("student_id", userProfile.id)
          .eq("mission_id", missionId);

        if (!countError && missionLogCount !== null) {
          const completedCount = missionLogCount.length;
          console.log(`미션 ${missionId} 완료 횟수: ${completedCount}`);

          // 해당 미션과 관련된 배지 조회
          const { data: badges, error: badgeError } = await supabase
            .from("badges")
            .select("*")
            .eq("type", "special")
            .eq("is_active", true)
            .contains("criteria", {
              mission_id: missionId,
            });

          if (!badgeError && badges) {
            for (const badge of badges) {
              const targetCount = badge.criteria.target_count || 1;

              if (completedCount === targetCount) {
                console.log(`배지 획득 조건 충족: ${badge.name}`);

                // 이미 획득했는지 확인
                const { data: existingBadge } = await supabase
                  .from("student_custom_badges")
                  .select("id")
                  .eq("student_id", userProfile.id)
                  .eq("badge_id", badge.id)
                  .single();

                if (!existingBadge) {
                  // 배지 부여
                  const { error: insertError } = await supabase
                    .from("student_custom_badges")
                    .insert({
                      student_id: userProfile.id,
                      badge_id: badge.id,
                      earned_date: formattedDate,
                    });

                  if (!insertError) {
                    console.log(`✅ 커스텀 배지 획득: ${badge.name}`);
                    // Toast 알림 표시
                    toast.success(
                      `${badge.icon || "🏅"} ${
                        badge.name
                      } 배지를 획득했습니다!`,
                      {
                        duration: 4000,
                        position: "top-center",
                      }
                    );
                    showBadgeNotification(badge.id);
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        console.error("커스텀 배지 체크 중 오류:", err);
      }

      // 6. 스냅샷 업데이트 - completed_missions 배열에 mission_id 추가
      console.log("[addLog] 스냅샷 업데이트 시작");

      // 먼저 현재 스냅샷 가져오기
      const { data: snapshot, error: fetchError } = await supabase
        .from("daily_snapshots")
        .select("*")
        .eq("student_id", userProfile.id)
        .eq("snapshot_date", formattedDate)
        .single();

      if (fetchError) {
        console.error("[addLog] 스냅샷 조회 에러:", fetchError);
      } else if (snapshot) {
        // completed_missions 배열에 mission_id 추가
        const currentCompleted = snapshot.completed_missions || [];
        if (!currentCompleted.includes(missionId)) {
          const updatedCompleted = [...currentCompleted, missionId];

          const { error: updateError } = await supabase
            .from("daily_snapshots")
            .update({
              completed_missions: updatedCompleted,
            })
            .eq("student_id", userProfile.id)
            .eq("snapshot_date", formattedDate);

          if (updateError) {
            console.error("[addLog] 스냅샷 업데이트 에러:", updateError);
          } else {
            console.log("[addLog] 스냅샷 업데이트 성공:", {
              mission_id: missionId,
              total_completed: updatedCompleted.length,
            });
          }
        }
      }

      // 획득한 배지를 DB에 직접 저장 (badge_type을 명시적으로 "mission"으로 설정)
      // TODO: 배지 시스템이 제대로 구현될 때까지 임시로 비활성화
      /*
      if (newlyEarnedBadgeIds.length > 0) {
        console.log(
          "[useMissionLogs] 획득한 배지 저장 시작:",
          newlyEarnedBadgeIds
        );

        // 일반 배지와 daily_hero 배지 분리
        const dailyHeroBadgeIds =
          newlyEarnedBadgeIds.filter(
            (id) => id === "daily_hero"
          );
        const otherBadgeIds = newlyEarnedBadgeIds.filter(
          (id) => id !== "daily_hero"
        );

        // 1. 일반 배지 저장
        if (otherBadgeIds.length > 0) {
          const otherBadges = otherBadgeIds.map(
            (badgeId) => ({
              student_id: userProfile.id,
              badge_id: badgeId,
              earned_date: formattedDate, // date 형식
            })
          );

          const { data: otherData, error: otherError } =
            await supabase
              .from("earned_badges")
              .insert(otherBadges)
              .select();

          if (otherError) {
            console.error(
              "[useMissionLogs] 일반 배지 저장 오류:",
              otherError
            );
          } else {
            console.log(
              "[useMissionLogs] 일반 배지 저장 성공:",
              otherData
            );
          }
        }

        // 2. daily_hero 배지 저장 (직접 RPC 사용)
        if (dailyHeroBadgeIds.length > 0) {
          try {
            console.log(
              "[useMissionLogs] 오늘의 영웅 배지 저장 시작"
            );

            // RPC 함수 사용 시도
            // 학생의 경우 auth_uid가 없을 수 있으므로 체크
            if (userProfile.auth_uid) {
              const { error: rpcError } =
                await supabase.rpc(
                  "insert_badge_with_type",
                  {
                    p_user_id: userProfile.auth_uid,
                    p_badge_id: "daily_hero",
                    p_badge_type: "mission",
                  }
                );

              if (rpcError) {
                console.error(
                  "RPC function error:",
                  rpcError
                );
              }
            }

            // 실패하면 직접 저장 시도
            const { data: insertData, error: insertError } =
              await supabase
                .from("earned_badges")
                .insert({
                  student_id: userProfile.id,
                  badge_id: "daily_hero",
                  earned_date: formattedDate,
                })
                .select();

            if (insertError) {
              console.error(
                "[useMissionLogs] 오늘의 영웅 직접 저장 실패:",
                insertError
              );
            } else {
              console.log(
                "[useMissionLogs] 오늘의 영웅 직접 저장 성공:",
                insertData
              );
            }
          } catch (err) {
            console.error(
              "[useMissionLogs] 배지 저장 과정에서 예외 발생:",
              err
            );
          }
        }
      }
      */

      // --- DB 작업 성공 후 상태 업데이트 및 알림 ---

      // 6. 알림 표시 (예측된 모든 배지 동시 추가)
      // TODO: 배지 시스템이 제대로 구현될 때까지 임시로 비활성화
      /*
      if (newlyEarnedBadgeIds.length > 0) {
        console.log(
          `🔔 Queueing all earned badges simultaneously: ${newlyEarnedBadgeIds.join(
            ", "
          )}`
        );

        for (const badgeId of newlyEarnedBadgeIds) {
          console.log(
            `🔔 Queueing: ${badgeId} (${
              badgeId === "ten_missions_completed"
                ? "열정가득"
                : badgeId === "daily_hero"
                ? "오늘의 영웅"
                : "첫 도전"
            })`
          );
          showBadgeNotification(badgeId);
        }
      }
      */

      // 7. 상태 업데이트 (함수형 업데이트 사용)
      setLogs((prevLogs) => [...prevLogs, insertedLog]);
      setCompletedTodayCount((prevCount) => prevCount + 1);
      setTotalCompletedCount((prevCount) => (prevCount ?? 0) + 1);
      // 이전에 획득한 배지 Set 업데이트 (필요한 경우)
      if (badgesToUpdateInSet.size > 0) {
        setPreviouslyEarnedBadgeIds((prevSet) => {
          const newSet = new Set(prevSet);
          badgesToUpdateInSet.forEach((id) => newSet.add(id));
          return newSet;
        });
      }

      playSound("/sound/high_rune.flac");

      return insertedLog;
    } catch (err: unknown) {
      console.error("Error adding mission log:", err);
      setError("미션 기록 추가 중 오류가 발생했습니다.");
      return null;
    }
  };

  // deleteLog 함수 - 상태 업데이트 로직 추가 (함수형 업데이트 사용)
  const deleteLog = async (logId: string) => {
    if (!userProfile || !formattedDate) return;
    try {
      // 1. 삭제 전 해당 로그 정보 가져오기 (스냅샷 업데이트에 필요)
      const { data: logData, error: logError } = await supabase
        .from("mission_logs")
        .select("mission_id")
        .eq("id", logId)
        .single();

      if (logError) throw logError;
      if (!logData) {
        console.error("로그 정보를 찾을 수 없습니다:", logId);
        return;
      }

      // 2. DB에서 로그 삭제 (id로 삭제)
      const { error: deleteError } = await supabase
        .from("mission_logs")
        .delete()
        .eq("id", logId);

      if (deleteError) throw deleteError;

      // --- 삭제 성공 시 클라이언트 상태 업데이트 (함수형 업데이트) ---
      setLogs((prevLogs) => prevLogs.filter((log) => log.id !== logId));

      // 카운트 감소 (null 체크 및 0 미만 방지)
      setTotalCompletedCount((prevCount) => Math.max(0, (prevCount ?? 0) - 1));
      setCompletedTodayCount((prevCount) => Math.max(0, prevCount - 1));

      console.log("[deleteLog] States updated after deletion.");

      // 3. 스냅샷 업데이트 - completed_missions 배열에서 mission_id 제거
      console.log("[deleteLog] 스냅샷 업데이트 시작");

      // 먼저 현재 스냅샷 가져오기
      const { data: snapshot, error: fetchError } = await supabase
        .from("daily_snapshots")
        .select("*")
        .eq("student_id", userProfile.id)
        .eq("snapshot_date", formattedDate)
        .single();

      if (fetchError) {
        console.error("[deleteLog] 스냅샷 조회 에러:", fetchError);
      } else if (snapshot) {
        // completed_missions 배열에서 mission_id 제거
        const currentCompleted = snapshot.completed_missions || [];
        const updatedCompleted = currentCompleted.filter(
          (id: string) => id !== logData.mission_id
        );

        const { error: updateError } = await supabase
          .from("daily_snapshots")
          .update({
            completed_missions: updatedCompleted,
          })
          .eq("student_id", userProfile.id)
          .eq("snapshot_date", formattedDate);

        if (updateError) {
          console.error("[deleteLog] 스냅샷 업데이트 에러:", updateError);
        } else {
          console.log("[deleteLog] 스냅샷 업데이트 성공:", {
            removed_mission_id: logData.mission_id,
            total_completed: updatedCompleted.length,
          });
        }
      }
    } catch (err: unknown) {
      console.error("Error deleting mission log:", err);
      setError("미션 기록 삭제 중 오류가 발생했습니다.");
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
