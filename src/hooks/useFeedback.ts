import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { DateTime } from "luxon";
import { GeneratedFeedback } from "../utils/geminiFeedbackGenerator";

export interface FeedbackData {
  id: string;
  student_id: string;
  contents: GeneratedFeedback;
  created_at: string;
  updated_at: string;
}

export const useFeedback = (
  studentId: string | undefined,
  timeZone: string
) => {
  const [feedbacks, setFeedbacks] = useState<FeedbackData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 오늘 날짜의 피드백 가져오기
  const getTodaysFeedback = () => {
    const today = DateTime.now().setZone(timeZone).toFormat("yyyy-MM-dd");

    for (const feedback of feedbacks) {
      if (Array.isArray(feedback.contents)) {
        const todayFeedback = feedback.contents.find(
          (content: GeneratedFeedback) => content.date === today
        );
        if (todayFeedback) {
          return { ...feedback, contents: todayFeedback };
        }
      } else if (feedback.contents.date === today) {
        return feedback;
      }
    }
    return null;
  };

  // 특정 날짜의 피드백 가져오기
  const getFeedbackByDate = (date: string) => {
    for (const feedback of feedbacks) {
      if (Array.isArray(feedback.contents)) {
        const dateFeedback = feedback.contents.find(
          (content: GeneratedFeedback) => content.date === date
        );
        if (dateFeedback) {
          return { ...feedback, contents: dateFeedback };
        }
      } else if (feedback.contents.date === date) {
        return feedback;
      }
    }
    return null;
  };

  // 가장 최근 피드백 가져오기
  const getLatestFeedback = () => {
    if (feedbacks.length === 0) return null;

    const feedback = feedbacks[0];
    if (Array.isArray(feedback.contents)) {
      // 날짜 기준으로 정렬하여 가장 최근 것 반환
      const sortedContents = [...feedback.contents].sort(
        (a: GeneratedFeedback, b: GeneratedFeedback) =>
          b.date.localeCompare(a.date)
      );
      return { ...feedback, contents: sortedContents[0] };
    }
    return feedback;
  };

  // 피드백 생성 (기존 레코드에 누적)
  const createFeedback = async (feedbackData: GeneratedFeedback) => {
    if (!studentId) {
      setError("학생 ID가 없습니다.");
      return null;
    }

    try {
      // 먼저 해당 학생의 기존 피드백 레코드가 있는지 확인
      const { data: existingFeedback, error: fetchError } = await supabase
        .from("feedback")
        .select("*")
        .eq("student_id", studentId)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        // PGRST116은 no rows found 에러
        throw fetchError;
      }

      let result;

      if (existingFeedback) {
        // 기존 레코드가 있으면 contents 배열에 추가
        const updatedContents = Array.isArray(existingFeedback.contents)
          ? [...existingFeedback.contents, feedbackData]
          : [existingFeedback.contents, feedbackData]; // 기존 데이터가 배열이 아닌 경우 처리

        const { data, error: updateError } = await supabase
          .from("feedback")
          .update({
            contents: updatedContents,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingFeedback.id)
          .select()
          .single();

        if (updateError) throw updateError;
        result = data;
      } else {
        // 새로운 레코드 생성 (contents를 배열로 시작)
        const { data, error: insertError } = await supabase
          .from("feedback")
          .insert({
            student_id: studentId,
            contents: [feedbackData], // 배열로 저장
          })
          .select()
          .single();

        if (insertError) throw insertError;
        result = data;
      }

      // 로컬 상태 업데이트
      if (existingFeedback) {
        setFeedbacks((prev) =>
          prev.map((f) => (f.id === result.id ? result : f))
        );
      } else {
        setFeedbacks((prev) => [...prev, result]);
      }

      return result;
    } catch (err) {
      console.error("피드백 생성 오류:", err);
      setError(
        err instanceof Error
          ? err.message
          : "피드백 생성 중 오류가 발생했습니다."
      );
      return null;
    }
  };

  // 피드백 목록 가져오기
  const fetchFeedbacks = async () => {
    if (!studentId) {
      setError("학생 ID가 없습니다.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("feedback")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setFeedbacks(data || []);
    } catch (err) {
      console.error("피드백 조회 오류:", err);
      setError(
        err instanceof Error
          ? err.message
          : "피드백을 불러오는 중 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  // 주말 여부 확인 (Luxon 사용) [[memory:3631665]]
  const isWeekend = (date: DateTime) => {
    const dayOfWeek = date.weekday; // 1 = Monday, 7 = Sunday
    return dayOfWeek === 6 || dayOfWeek === 7; // Saturday or Sunday
  };

  // 이전 평일 날짜 가져오기 (주말 제외)
  const getPreviousWeekday = (date: DateTime): DateTime => {
    let previousDate = date.minus({ days: 1 });

    // 주말이면 금요일로 이동
    while (isWeekend(previousDate)) {
      previousDate = previousDate.minus({ days: 1 });
    }

    return previousDate;
  };

  // 피드백 생성이 필요한지 확인
  const shouldGenerateFeedback = (): {
    should: boolean;
    targetDate: string | null;
  } => {
    const now = DateTime.now().setZone(timeZone);

    // 주말이면 피드백 생성하지 않음
    if (isWeekend(now)) {
      return { should: false, targetDate: null };
    }

    // 오늘 피드백이 이미 있으면 생성하지 않음
    const todayFeedback = getTodaysFeedback();
    if (todayFeedback) {
      return { should: false, targetDate: null };
    }

    // 이전 평일 날짜 계산
    const previousWeekday = getPreviousWeekday(now);
    const targetDate = previousWeekday.toFormat("yyyy-MM-dd");

    return { should: true, targetDate };
  };

  useEffect(() => {
    if (studentId) {
      fetchFeedbacks();
    }
  }, [studentId]);

  return {
    feedbacks,
    loading,
    error,
    getTodaysFeedback,
    getFeedbackByDate,
    getLatestFeedback,
    createFeedback,
    fetchFeedbacks,
    shouldGenerateFeedback,
    isWeekend,
    getPreviousWeekday,
  };
};
