import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { EarnedBadge } from "../types"; // types.ts에서 import

export const useEarnedBadges = (
  badgeType?: "mission" | "weekly"
) => {
  const { userProfile } = useAuth();
  const [earnedBadges, setEarnedBadges] = useState<
    EarnedBadge[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEarnedBadges = useCallback(async () => {
    if (!userProfile) {
      console.log(
        "[useEarnedBadges] No userProfile, skipping fetch"
      );
      setEarnedBadges([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(
        "[useEarnedBadges] Fetching for student:",
        userProfile.id
      );

      const results: EarnedBadge[] = [];

      // 1. 시스템 배지 가져오기
      const { data: systemBadges, error: systemError } =
        await supabase
          .from("student_system_badges")
          .select(
            `
          *,
          system_badges (*)
        `
          )
          .eq("student_id", userProfile.id)
          .order("earned_date", { ascending: false });

      if (systemError) {
        console.error(
          "[useEarnedBadges] System badges error:",
          systemError
        );
      } else if (systemBadges) {
        // 시스템 배지를 EarnedBadge 형식으로 변환
        systemBadges.forEach((sb) => {
          if (sb.system_badges) {
            results.push({
              id: sb.id,
              user_id: sb.student_id,
              badge_id: sb.system_badge_id,
              earned_at: sb.earned_at || sb.earned_date,
              badge: {
                id: sb.system_badge_id,
                name: sb.system_badges.name,
                description:
                  sb.system_badges.description || "",
                image_path: sb.system_badges.icon || "",
                badge_type:
                  sb.system_badges.type || "achievement",
                created_at:
                  sb.system_badges.created_at ||
                  new Date().toISOString(),
              },
              // 주간 보상 관련 필드는 undefined
              weekly_reward_goal: undefined,
              reward_used: false,
            });
          }
        });
      }

      // 2. 커스텀 배지 가져오기
      const { data: customBadges, error: customError } =
        await supabase
          .from("student_custom_badges")
          .select(
            `
          *,
          badges (*)
        `
          )
          .eq("student_id", userProfile.id)
          .order("earned_date", { ascending: false });

      if (customError) {
        console.error(
          "[useEarnedBadges] Custom badges error:",
          customError
        );
      } else if (customBadges) {
        // 커스텀 배지를 EarnedBadge 형식으로 변환
        customBadges.forEach((cb) => {
          if (cb.badges) {
            results.push({
              id: cb.id,
              user_id: cb.student_id,
              badge_id: cb.badge_id,
              earned_at: cb.earned_at || cb.earned_date,
              badge: {
                id: cb.badge_id,
                name: cb.badges.name,
                description: cb.badges.description || "",
                image_path: cb.badges.icon || "",
                badge_type: cb.badges.type || "achievement",
                created_at:
                  cb.badges.created_at ||
                  new Date().toISOString(),
              },
              // 주간 보상 관련 필드는 undefined
              weekly_reward_goal: undefined,
              reward_used: false,
            });
          }
        });
      }

      // badgeType에 따른 필터링
      let filteredResults = results;
      if (badgeType) {
        filteredResults = results.filter(
          (badge) => badge.badge?.badge_type === badgeType
        );
      }

      console.log("[useEarnedBadges] Query result:", {
        totalResults: results.length,
        filteredResults: filteredResults.length,
        userProfileId: userProfile.id,
        badgeType,
      });

      setEarnedBadges(filteredResults);
    } catch (err) {
      console.error(
        "획득한 배지 목록을 가져오는 중 오류 발생:",
        err
      );
      setError(
        "배지 정보를 불러오는 중 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  }, [userProfile, badgeType]);

  useEffect(() => {
    fetchEarnedBadges();
  }, [fetchEarnedBadges]);

  return {
    earnedBadges,
    loading,
    error,
    refetch: fetchEarnedBadges,
  };
};
