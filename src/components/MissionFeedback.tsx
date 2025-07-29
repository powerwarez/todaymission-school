import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import {
  GeneratedFeedback,
  generateMissionFeedback,
} from "../utils/geminiFeedbackGenerator";
import { useFeedback } from "../hooks/useFeedback";
import { Mission } from "../types";
import { supabase } from "../lib/supabaseClient";
import { DateTime } from "luxon";
import { LuSparkles, LuRefreshCw, LuCalendarDays } from "react-icons/lu";

interface MissionFeedbackProps {
  studentId: string;
  studentName: string;
  missions: Mission[];
  timeZone: string;
}

const MissionFeedback: React.FC<MissionFeedbackProps> = ({
  studentId,
  studentName,
  missions,
  timeZone,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentFeedback, setCurrentFeedback] =
    useState<GeneratedFeedback | null>(null);

  const {
    feedbacks,
    loading,
    error,
    getTodaysFeedback,
    getLatestFeedback,
    createFeedback,
    shouldGenerateFeedback,
  } = useFeedback(studentId, timeZone);

  // 피드백 생성 함수
  const handleGenerateFeedback = async () => {
    const { should, targetDate } = shouldGenerateFeedback();

    if (!should || !targetDate) {
      return;
    }

    setIsGenerating(true);

    try {
      // 이전 평일의 미션 로그 가져오기
      const { data: missionLogs, error: logsError } = await supabase
        .from("mission_logs")
        .select(
          `
          mission_id,
          completed_at,
          missions:mission_id(
            id,
            teacher_id,
            school_id,
            title,
            content,
            description,
            is_active,
            order_index,
            created_at,
            updated_at
          )
        `
        )
        .eq("student_id", studentId)
        .gte("completed_at", `${targetDate}T00:00:00`)
        .lt("completed_at", `${targetDate}T23:59:59`);

      if (logsError) throw logsError;

      // 미션 로그 형식 변환
      const formattedLogs =
        missionLogs?.map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (log: any) => ({
            mission_id: log.mission_id,
            completed_at: log.completed_at,
            mission: {
              id: log.missions.id,
              teacher_id: log.missions.teacher_id,
              school_id: log.missions.school_id,
              title: log.missions.title,
              content: log.missions.content || log.missions.title,
              description: log.missions.description,
              is_active: log.missions.is_active,
              order_index: log.missions.order_index,
              order: log.missions.order_index,
              created_at: log.missions.created_at,
              updated_at: log.missions.updated_at,
              user_id: log.missions.teacher_id,
            } as Mission,
          })
        ) || [];

      // AI 피드백 생성
      const feedback = await generateMissionFeedback(
        studentName,
        formattedLogs,
        missions,
        targetDate
      );

      if (feedback) {
        // 피드백 저장
        await createFeedback(feedback);
        setCurrentFeedback(feedback);
      }
    } catch (err) {
      console.error("피드백 생성 중 오류:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  // 컴포넌트 마운트 시 자동으로 피드백 생성 확인
  useEffect(() => {
    const checkAndGenerateFeedback = async () => {
      console.log("=== MissionFeedback 체크 시작 ===");
      console.log("Feedbacks loaded:", feedbacks);
      console.log("현재 시간대:", timeZone);

      const todayFeedback = getTodaysFeedback();

      if (todayFeedback) {
        console.log("이전 평일의 피드백 발견:", todayFeedback);
        setCurrentFeedback(todayFeedback.contents);
      } else {
        // 오늘 피드백이 없으면 가장 최근 피드백을 표시
        const latestFeedback = getLatestFeedback();
        if (latestFeedback) {
          console.log("가장 최근 피드백 표시:", latestFeedback);
          setCurrentFeedback(latestFeedback.contents);
        } else {
          // 피드백이 전혀 없고 생성이 필요한 경우에만 생성
          const { should, targetDate } = shouldGenerateFeedback();
          console.log(
            "피드백 생성 필요 여부:",
            should,
            "타겟 날짜:",
            targetDate
          );
          if (should) {
            await handleGenerateFeedback();
          }
        }
      }
    };

    if (!loading && feedbacks) {
      checkAndGenerateFeedback();
    }
  }, [loading, feedbacks]);

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = DateTime.fromISO(dateString).setZone(timeZone);
    return date.toFormat("M월 d일 (EEE)", { locale: "ko" });
  };

  if (loading) {
    return (
      <Card className="mt-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <LuRefreshCw className="animate-spin h-5 w-5 mr-2" />
            <span>피드백을 불러오는 중...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mt-6 border-red-200">
        <CardContent className="p-6">
          <p className="text-red-600">
            피드백을 불러오는 중 오류가 발생했습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  // 주말이거나 피드백이 필요없는 경우
  const { should } = shouldGenerateFeedback();

  // 디버깅: 항상 컴포넌트를 표시하도록 임시 수정
  console.log("MissionFeedback Debug:", {
    feedbacksLength: feedbacks.length,
    should,
    currentFeedback: currentFeedback ? "있음" : "없음",
    loading,
    error,
    feedbacks: feedbacks,
  });

  return (
    <Card className="mt-6 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-700">
          <LuSparkles className="h-5 w-5" />
          오늘의 미션 AI 도우미
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 디버깅 정보 */}
        {process.env.NODE_ENV === "development" && (
          <div className="mb-4 p-3 bg-gray-100 text-xs rounded space-y-1">
            <p className="font-semibold">🔍 디버깅 정보</p>
            <p>피드백 개수: {feedbacks.length}</p>
            <p>
              현재 피드백:{" "}
              {currentFeedback ? `있음 (${currentFeedback.date})` : "없음"}
            </p>
            <p>생성 필요: {should ? "예" : "아니오"}</p>
            <p>
              현재 시간:{" "}
              {DateTime.now()
                .setZone(timeZone)
                .toFormat("yyyy-MM-dd HH:mm:ss (EEE)")}
            </p>
            <p>
              타겟 날짜 (이전 평일):{" "}
              {DateTime.now()
                .setZone(timeZone)
                .minus({ days: 1 })
                .toFormat("yyyy-MM-dd (EEE)")}
            </p>
            {feedbacks.length > 0 && (
              <div className="mt-2">
                <p className="font-semibold">저장된 피드백 목록:</p>
                {feedbacks.map((fb, idx) => (
                  <div key={fb.id} className="ml-2 text-xs">
                    <p>
                      #{idx + 1}:{" "}
                      {Array.isArray(fb.contents)
                        ? `배열 (${fb.contents.length}개)`
                        : `날짜: ${fb.contents.date}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-2">
              <Button
                onClick={handleGenerateFeedback}
                disabled={isGenerating}
                size="sm"
                variant="outline"
                className="text-xs"
              >
                수동으로 피드백 생성 (테스트)
              </Button>
            </div>
          </div>
        )}
        {isGenerating ? (
          <div className="flex items-center justify-center py-8">
            <LuRefreshCw className="animate-spin h-6 w-6 mr-3 text-purple-600" />
            <span className="text-purple-700">
              AI 선생님이 피드백을 작성하고 있어요...
            </span>
          </div>
        ) : currentFeedback ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <LuCalendarDays className="h-4 w-4" />
              <span>{formatDate(currentFeedback.date)} 미션 수행 결과</span>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-purple-700">달성률</span>
                  <span className="text-2xl font-bold text-purple-600">
                    {currentFeedback.completionRate}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${currentFeedback.completionRate}%` }}
                  />
                </div>
              </div>

              <div className="space-y-3 text-gray-700">
                <p className="leading-relaxed">{currentFeedback.feedback}</p>
                <p className="leading-relaxed font-medium text-purple-700">
                  {currentFeedback.encouragement}
                </p>
              </div>
            </div>

            {currentFeedback.completedMissions.length > 0 && (
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-sm font-semibold text-green-700 mb-1">
                  ✅ 완료한 미션 ({currentFeedback.completedMissions.length}개)
                </p>
                <ul className="text-sm text-green-600 space-y-1">
                  {currentFeedback.completedMissions.map((mission, index) => (
                    <li key={index}>• {mission}</li>
                  ))}
                </ul>
              </div>
            )}

            {currentFeedback.incompleteMissions.length > 0 && (
              <div className="bg-orange-50 rounded-lg p-3">
                <p className="text-sm font-semibold text-orange-700 mb-1">
                  💪 다음에 도전해볼 미션 (
                  {currentFeedback.incompleteMissions.length}개)
                </p>
                <ul className="text-sm text-orange-600 space-y-1">
                  {currentFeedback.incompleteMissions.map((mission, index) => (
                    <li key={index}>• {mission}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">아직 피드백이 없어요</p>
            {should && (
              <Button
                onClick={handleGenerateFeedback}
                disabled={isGenerating}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <LuSparkles className="h-4 w-4 mr-2" />
                피드백 받기
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MissionFeedback;
