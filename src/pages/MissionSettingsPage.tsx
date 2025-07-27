import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { useMissions } from "../hooks/useMissions";
import { Mission } from "../types";
import MissionSettingItem from "../components/MissionSettingItem";
import LoadingWithRefresh from "../components/LoadingWithRefresh";
import {
  LuPlus,
  LuSettings,
  LuArrowUp,
  LuArrowDown,
  LuUser,
  LuPalette,
  LuGift,
  LuCheck,
  LuEye,
  LuEyeOff,
  LuSparkles,
} from "react-icons/lu";
import WeeklyBadgeSetting from "../components/WeeklyBadgeSetting";
import AccountSettings from "../components/AccountSettings";
import PinAuthModal from "../components/PinAuthModal";
import ThemeManager from "../components/ThemeManager";
import AIMissionRecommendModal from "../components/AIMissionRecommendModal";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { RainbowButton } from "../components/magicui/rainbow-button";

const MissionSettingsPage: React.FC = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const { missions, loading, error, addMission, deleteMission, updateMission } =
    useMissions();
  const [newMissionContent, setNewMissionContent] = useState("");

  // PIN 인증 관련 상태
  const [showPinAuth, setShowPinAuth] = useState<boolean>(true);
  const [pinVerified, setPinVerified] = useState<boolean>(false);

  // 주간 보상 관련 상태
  const [weeklyReward, setWeeklyReward] = useState("");
  const [showWeeklyReward, setShowWeeklyReward] = useState(true);
  const [savingWeeklyReward, setSavingWeeklyReward] = useState(false);

  // AI 추천 모달 상태
  const [showAIRecommendModal, setShowAIRecommendModal] = useState(false);

  // 페이지 로드 시 PIN 인증 상태 확인
  useEffect(() => {
    // 페이지 로드될 때마다 항상 PIN 인증 요구
    setPinVerified(false);
    setShowPinAuth(true);
  }, [user]);

  // 사용자 정보에서 주간 보상 설정 가져오기
  useEffect(() => {
    if (userProfile) {
      setWeeklyReward(
        userProfile.weekly_reward || "이번 주 미션을 모두 달성하면 받을 보상"
      );
      setShowWeeklyReward(userProfile.show_weekly_reward !== false);
    }
  }, [userProfile]);

  // 디버깅용 로그
  useEffect(() => {
    console.log("[MissionSettingsPage] State:", {
      user: !!user,
      userProfile: !!userProfile,
      userProfileId: userProfile?.id,
      schoolId: userProfile?.school_id,
      missions: missions.length,
      loading,
      error,
    });
  }, [user, userProfile, missions, loading, error]);

  // PIN 인증 성공 핸들러
  const handlePinSuccess = () => {
    setPinVerified(true);
    setShowPinAuth(false);
  };

  // PIN 인증 취소 핸들러
  const handlePinCancel = () => {
    // 이전 페이지로 이동
    navigate(-1);
  };

  const handleAddMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMissionContent.trim() === "") return;

    await addMission({
      content: newMissionContent.trim(),
      order: missions.length,
    });

    setNewMissionContent("");
  };

  // 주간 보상 설정 저장
  const saveWeeklyRewardSettings = async () => {
    if (!userProfile) return;

    setSavingWeeklyReward(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({
          weekly_reward: weeklyReward,
          show_weekly_reward: showWeeklyReward,
        })
        .eq("id", userProfile.id);

      if (error) throw error;

      toast.success("주간 보상 설정이 저장되었습니다.");
    } catch (error) {
      console.error("주간 보상 설정 저장 오류:", error);
      toast.error("주간 보상 설정 저장에 실패했습니다.");
    } finally {
      setSavingWeeklyReward(false);
    }
  };

  // 미션 순서 위로 이동
  const handleMoveUp = async (mission: Mission) => {
    const index = missions.findIndex((m) => m.id === mission.id);
    if (index <= 0) return; // 이미 첫 번째 항목이면 이동 불가

    const prevMission = missions[index - 1];

    // 순서 교환
    await updateMission(mission.id, {
      order: prevMission.order,
    });
    await updateMission(prevMission.id, {
      order: mission.order,
    });
  };

  // 미션 순서 아래로 이동
  const handleMoveDown = async (mission: Mission) => {
    const index = missions.findIndex((m) => m.id === mission.id);
    if (index >= missions.length - 1) return; // 이미 마지막 항목이면 이동 불가

    const nextMission = missions[index + 1];

    // 순서 교환
    await updateMission(mission.id, {
      order: nextMission.order,
    });
    await updateMission(nextMission.id, {
      order: mission.order,
    });
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto p-4">
        <p className="text-center text-gray-600">
          로그인이 필요한 페이지입니다.
        </p>
      </div>
    );
  }

  return (
    <>
      {showPinAuth && !pinVerified && (
        <PinAuthModal onSuccess={handlePinSuccess} onCancel={handlePinCancel} />
      )}

      {(!showPinAuth || pinVerified) && (
        <div className="max-w-4xl mx-auto p-4">
          {/* 일일 미션 설정 섹션 */}
          <h1
            className="text-2xl font-bold mb-8 flex items-center"
            style={{ color: "var(--color-text-primary)" }}
          >
            <LuSettings className="mr-2" /> 오늘의 미션 설정
          </h1>
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <p className="text-gray-600 mb-6">
              매일 수행할 오늘의 미션을 설정하세요. 수정, 삭제, 순서 변경이
              가능합니다.
            </p>

            {error && (
              <p style={{ color: "var(--color-text-error)" }} className="mb-4">
                {error}
              </p>
            )}

            {loading ? (
              <LoadingWithRefresh />
            ) : (
              <>
                {missions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">
                      등록된 미션이 없습니다.
                    </p>
                    <p className="text-sm text-gray-400">
                      아래에서 새로운 미션을 추가해주세요.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 mb-6">
                    {missions.map((mission, index) => (
                      <div key={mission.id} className="flex items-center gap-2">
                        <div className="flex flex-col justify-center">
                          <button
                            onClick={() => handleMoveUp(mission)}
                            disabled={index === 0}
                            className={`p-1 text-gray-500 ${
                              index === 0
                                ? "opacity-30 cursor-not-allowed"
                                : "hover:text-gray-700"
                            }`}
                            title="위로 이동"
                          >
                            <LuArrowUp size={16} />
                          </button>
                          <button
                            onClick={() => handleMoveDown(mission)}
                            disabled={index === missions.length - 1}
                            className={`p-1 text-gray-500 ${
                              index === missions.length - 1
                                ? "opacity-30 cursor-not-allowed"
                                : "hover:text-gray-700"
                            }`}
                            title="아래로 이동"
                          >
                            <LuArrowDown size={16} />
                          </button>
                        </div>
                        <MissionSettingItem
                          mission={mission}
                          onUpdate={updateMission}
                          onDelete={deleteMission}
                        />
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleAddMission} className="flex gap-2">
                  <input
                    type="text"
                    value={newMissionContent}
                    onChange={(e) => setNewMissionContent(e.target.value)}
                    placeholder="새 미션을 입력하세요"
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    type="submit"
                    className="text-white p-2 rounded-lg flex items-center"
                    style={{
                      backgroundColor: "var(--color-primary-medium)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--color-primary-dark)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--color-primary-medium)";
                    }}
                  >
                    <LuPlus className="mr-1" />
                    추가
                  </button>
                  <RainbowButton
                    type="button"
                    onClick={() => setShowAIRecommendModal(true)}
                    className="text-white p-2 rounded-lg flex items-center"
                    style={{
                      backgroundColor: "var(--color-secondary-medium)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--color-secondary-dark)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--color-secondary-medium)";
                    }}
                  >
                    <LuSparkles className="mr-1" />
                    AI 추천
                  </RainbowButton>
                </form>
              </>
            )}
          </div>

          {/* 테마 설정 섹션 */}
          <div className="mb-8">
            <h1
              className="text-2xl font-bold mb-6 flex items-center"
              style={{
                color: "var(--color-text-primary)",
              }}
            >
              <LuPalette className="mr-2" /> 테마 설정
            </h1>
            <ThemeManager />
          </div>

          {/* 계정 설정 섹션 */}
          <div className="mb-8">
            <h1
              className="text-2xl font-bold mb-6 flex items-center"
              style={{
                color: "var(--color-text-primary)",
              }}
            >
              <LuUser className="mr-2" /> 계정 설정
            </h1>
            <AccountSettings />
          </div>

          {/* 주간 보상 설정 섹션 */}
          <div className="mb-12">
            <h1
              className="text-xl font-bold mb-8 flex items-center"
              style={{
                color: "var(--color-text-primary)",
              }}
            >
              <LuGift className="mr-2" /> 주간 보상 설정
            </h1>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  주간 보상 내용
                </label>
                <textarea
                  value={weeklyReward}
                  onChange={(e) => setWeeklyReward(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                  rows={3}
                  placeholder="이번 주 미션을 모두 달성하면 받을 보상을 입력하세요"
                />
              </div>

              <div className="mb-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showWeeklyReward}
                    onChange={(e) => setShowWeeklyReward(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 flex items-center">
                    {showWeeklyReward ? (
                      <LuEye className="mr-1" size={16} />
                    ) : (
                      <LuEyeOff className="mr-1" size={16} />
                    )}
                    학생들에게 주간 보상 표시
                  </span>
                </label>
              </div>

              <button
                onClick={saveWeeklyRewardSettings}
                disabled={savingWeeklyReward}
                className="w-full px-4 py-2 rounded-lg text-white font-medium flex items-center justify-center transition-colors"
                style={{
                  backgroundColor: "var(--color-primary-medium)",
                }}
                onMouseEnter={(e) => {
                  if (!savingWeeklyReward) {
                    e.currentTarget.style.backgroundColor =
                      "var(--color-primary-dark)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "var(--color-primary-medium)";
                }}
              >
                {savingWeeklyReward ? (
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></span>
                ) : (
                  <LuCheck className="mr-2" />
                )}
                {savingWeeklyReward ? "저장 중..." : "저장하기"}
              </button>
            </div>
          </div>

          {/* 주간 배지 설정 섹션 */}
          <h1
            className="text-xl font-bold mb-8 flex items-center"
            style={{ color: "var(--color-text-primary)" }}
          >
            <LuSettings className="mr-2" /> 주간 배지 설정
          </h1>
          {userProfile && <WeeklyBadgeSetting userId={userProfile.id} />}
        </div>
      )}

      {/* AI 추천 모달 */}
      <AIMissionRecommendModal
        isOpen={showAIRecommendModal}
        onClose={() => setShowAIRecommendModal(false)}
        existingMissions={missions.map((m) => m.content)}
        onAddMission={async (content: string) => {
          await addMission({
            content,
            order: missions.length,
          });
        }}
      />
    </>
  );
};

export default MissionSettingsPage;
