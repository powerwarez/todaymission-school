import React, { useState, useEffect } from "react";
// import { supabase } from '@/lib/supabaseClient'; // 경로 별칭 대신 상대 경로 사용
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { useMissions } from "../hooks/useMissions";
import { Badge } from "../types"; // Badge 타입 import 추가
import {
  LuLoader,
  LuTriangle,
  LuPlus,
  LuX,
  LuUpload,
  LuSparkles,
  LuTrash,
} from "react-icons/lu"; // 아이콘 추가
import toast from "react-hot-toast"; // toast 추가

// Badge 타입 정의 (Supabase 스키마 기반)
// Badge는 이미 @/types에 정의되어 있음

// 표시용 Badge 타입 (count 포함)
interface DisplayBadge extends Badge {
  count: number;
}

const BadgeSettingsPage: React.FC = () => {
  const { userProfile } = useAuth();
  const { missions } = useMissions();
  const [badges, setBadges] = useState<DisplayBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 배지 생성 모달 상태
  const [showCreateModal, setShowCreateModal] =
    useState(false);
  const [creating, setCreating] = useState(false);

  // 배지 생성 폼 상태
  const [newBadge, setNewBadge] = useState({
    name: "",
    description: "",
    missionId: "",
    targetCount: 1,
    icon: "",
    iconType: "emoji" as "emoji" | "upload" | "ai",
  });

  // 삭제 관련 상태 추가
  const [deletingBadgeId, setDeletingBadgeId] = useState<
    string | null
  >(null);
  const [showDeleteConfirm, setShowDeleteConfirm] =
    useState(false);
  const [badgeToDelete, setBadgeToDelete] =
    useState<DisplayBadge | null>(null);

  // 학생 목록 표시 관련 상태 추가
  const [showStudentList, setShowStudentList] =
    useState(false);
  const [selectedBadgeForList, setSelectedBadgeForList] =
    useState<DisplayBadge | null>(null);
  const [studentList, setStudentList] = useState<
    Array<{
      student_id: string;
      student_name: string;
      earned_date: string;
    }>
  >([]);
  const [loadingStudentList, setLoadingStudentList] =
    useState(false);

  useEffect(() => {
    const fetchBadgeData = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. 현재 사용자 정보 확인
        if (!userProfile) {
          console.log("사용자 프로필이 없습니다.");
          setLoading(false);
          return;
        }

        // 2. 교사의 배지 목록 가져오기 (badges 테이블)
        console.log(
          "배지 조회 시작, teacher_id:",
          userProfile.id
        );

        const { data: allBadges, error: badgesError } =
          await supabase
            .from("badges")
            .select("*") // 모든 컬럼 선택
            .eq("teacher_id", userProfile.id)
            .eq("is_active", true);

        console.log("배지 조회 결과:", {
          data: allBadges,
          error: badgesError,
          count: allBadges?.length || 0,
        });

        if (badgesError) throw badgesError;
        if (!allBadges)
          throw new Error(
            "배지 정보를 가져올 수 없습니다."
          );

        // 3. 교사의 학교 학생들의 배지 획득 기록 가져오기
        // earned_badges는 아직 사용하지 않으므로 주석 처리
        /*
        const {
          data: earnedBadgesData,
          error: earnedBadgesError,
        } = await supabase
          .from("earned_badges")
          .select("badge_id");

        if (earnedBadgesError) {
          console.error(
            "earned_badges 조회 오류:",
            earnedBadgesError
          );
        }
        */
        const earnedBadgesData = [];

        // 4. 배지별 획득 횟수 계산
        const badgeCounts: { [key: string]: number } = {};

        if (earnedBadgesData) {
          earnedBadgesData.forEach(
            (record: { badge_id: string }) => {
              // 일반 배지 카운트
              badgeCounts[record.badge_id] =
                (badgeCounts[record.badge_id] || 0) + 1;
            }
          );
        }

        // weekly_streak_1 배지의 카운트는 별도로 계산 필요 (TODO)

        // 5. 배지 데이터 준비
        const displayData: DisplayBadge[] = (
          allBadges as Badge[]
        ).map((badge) => {
          return {
            ...badge,
            count: badgeCounts[badge.id] || 0,
          } as DisplayBadge;
        });

        setBadges(displayData);
      } catch (err: unknown) {
        console.error("데이터 로딩 중 에러 발생:", err);
        if (err instanceof Error) {
          setError(err.message);
        } else if (typeof err === "string") {
          setError(err);
        } else {
          setError(
            "데이터를 불러오는 중 알 수 없는 오류가 발생했습니다."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBadgeData();
  }, []); // 컴포넌트 마운트 시 1회 실행

  // 배지 생성 함수
  const handleCreateBadge = async () => {
    if (!userProfile) return;

    // school_id 확인
    if (!userProfile.school_id) {
      setError(
        "학교 정보가 없습니다. 관리자에게 문의하세요."
      );
      return;
    }

    try {
      setCreating(true);

      // 배지 데이터 준비
      console.log("현재 userProfile:", userProfile);
      console.log("school_id:", userProfile.school_id);

      const badgeData = {
        teacher_id: userProfile.id,
        school_id: userProfile.school_id,
        name: newBadge.name,
        description: newBadge.description || null,
        icon: newBadge.icon || null,
        type: "special",
        criteria: {
          mission_id: newBadge.missionId,
          target_count: newBadge.targetCount,
        },
        is_active: true,
      };

      console.log("전송할 배지 데이터:", badgeData);

      const { error: insertError } = await supabase
        .from("badges")
        .insert(badgeData)
        .select()
        .single();

      if (insertError) throw insertError;

      // 성공 시 페이지 새로고침
      window.location.reload();

      // 모달 닫기 및 폼 초기화
      setShowCreateModal(false);
      setNewBadge({
        name: "",
        description: "",
        missionId: "",
        targetCount: 1,
        icon: "",
        iconType: "emoji",
      });

      // 성공 메시지 (toast가 있다면)
      console.log("배지가 성공적으로 생성되었습니다!");
    } catch (err) {
      console.error("배지 생성 중 오류:", err);
      if (err instanceof Error) {
        console.error("에러 메시지:", err.message);
        setError(
          err.message || "배지 생성 중 오류가 발생했습니다."
        );
      } else {
        setError("배지 생성 중 오류가 발생했습니다.");
      }
    } finally {
      setCreating(false);
    }
  };

  // 배지 삭제 확인 시작
  const handleDeleteClick = (badge: DisplayBadge) => {
    setBadgeToDelete(badge);
    setShowDeleteConfirm(true);
  };

  // 배지 삭제 확인 취소
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setBadgeToDelete(null);
  };

  // 배지 삭제 실행
  const handleConfirmDelete = async () => {
    if (!badgeToDelete || !userProfile) return;

    try {
      setDeletingBadgeId(badgeToDelete.id);

      // 삭제 전에 이 배지를 획득한 학생이 있는지 확인
      const { data: earnedBadges, error: checkError } =
        await supabase
          .from("student_custom_badges")
          .select("id")
          .eq("badge_id", badgeToDelete.id)
          .limit(1);

      if (checkError) throw checkError;

      if (earnedBadges && earnedBadges.length > 0) {
        // 학생이 이미 획득한 배지는 비활성화만 함
        const { error: updateError } = await supabase
          .from("badges")
          .update({ is_active: false })
          .eq("id", badgeToDelete.id);

        if (updateError) throw updateError;

        toast.success(
          "배지가 비활성화되었습니다. (학생이 이미 획득한 배지)"
        );
      } else {
        // 아무도 획득하지 않은 배지는 완전히 삭제
        const { error: deleteError } = await supabase
          .from("badges")
          .delete()
          .eq("id", badgeToDelete.id);

        if (deleteError) throw deleteError;

        toast.success("배지가 삭제되었습니다.");
      }

      // 목록에서 제거
      setBadges(
        badges.filter((b) => b.id !== badgeToDelete.id)
      );
    } catch (err: unknown) {
      console.error("배지 삭제 중 오류:", err);
      toast.error("배지 삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingBadgeId(null);
      setShowDeleteConfirm(false);
      setBadgeToDelete(null);
    }
  };

  // 배지를 달성한 학생 목록 가져오기
  const fetchStudentList = async (badge: DisplayBadge) => {
    setLoadingStudentList(true);
    try {
      // student_custom_badges 테이블에서 해당 배지를 획득한 학생 정보 가져오기
      const { data, error } = await supabase
        .from("student_custom_badges")
        .select(
          `
          student_id,
          earned_date,
          users:users!student_custom_badges_student_id_fkey (
            name
          )
        `
        )
        .eq("badge_id", badge.id)
        .order("earned_date", { ascending: false });

      if (error) throw error;

      // 데이터 형식 변환
      // Supabase join은 1:1 관계에서 단일 객체를 반환
      type StudentBadgeRow = {
        student_id: string;
        earned_date: string;
        users: { name: string } | null;
      };

      const formattedData =
        (data as StudentBadgeRow[])?.map((item) => ({
          student_id: item.student_id,
          student_name: item.users?.name || "알 수 없음",
          earned_date: item.earned_date,
        })) || [];

      setStudentList(formattedData);
    } catch (err) {
      console.error("학생 목록 가져오기 오류:", err);
      toast.error(
        "학생 목록을 가져오는 중 오류가 발생했습니다."
      );
    } finally {
      setLoadingStudentList(false);
    }
  };

  // 배지 클릭 시 학생 목록 모달 표시
  const handleBadgeClick = async (badge: DisplayBadge) => {
    setSelectedBadgeForList(badge);
    setShowStudentList(true);
    await fetchStudentList(badge);
  };

  // 학생 목록 모달 닫기
  const handleCloseStudentList = () => {
    setShowStudentList(false);
    setSelectedBadgeForList(null);
    setStudentList([]);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 페이지 제목 및 생성 버튼 */}
      <div className="flex justify-between items-center mb-8">
        <h1
          className="text-3xl font-bold"
          style={{ color: "var(--color-text-primary)" }}>
          도전과제 설정
        </h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 rounded-lg text-white transition-colors"
          style={{
            backgroundColor: "var(--color-primary-medium)",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor =
              "var(--color-primary-dark)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor =
              "var(--color-primary-medium)")
          }>
          <LuPlus className="mr-2" size={20} />새 배지
          만들기
        </button>
      </div>

      {/* 로딩 상태 표시 */}
      {loading && (
        <div className="flex justify-center items-center py-10">
          <LuLoader
            className="animate-spin"
            style={{ color: "var(--color-primary-medium)" }}
            size={40}
          />
          <p className="ml-3 text-lg text-gray-600">
            데이터를 불러오는 중...
          </p>
        </div>
      )}

      {/* 에러 상태 표시 */}
      {error && (
        <div
          className="border px-4 py-3 rounded relative mb-6 max-w-2xl mx-auto"
          role="alert"
          style={{
            backgroundColor: "var(--color-bg-error)",
            borderColor: "var(--color-border-error)",
            color: "var(--color-text-error)",
          }}>
          <LuTriangle className="inline mr-2" />
          <span className="block sm:inline">
            오류가 발생했습니다: {error}
          </span>
        </div>
      )}

      {/* 데이터 로딩 완료 및 에러 없는 경우 */}
      {!loading && !error && (
        <div>
          <h2
            className="text-2xl font-semibold mb-6 text-center"
            style={{ color: "var(--color-text-primary)" }}>
            달성 가능한 배지 목록
          </h2>
          {badges.length > 0 ? (
            <ul className="space-y-4 max-w-2xl mx-auto">
              {badges.map((badge) => (
                <li
                  key={badge.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm hover:bg-gray-50 transition-colors">
                  <div
                    className="flex items-center space-x-4 flex-grow cursor-pointer"
                    onClick={() => handleBadgeClick(badge)}>
                    {/* 배지 아이콘 표시 */}
                    {badge.icon &&
                    badge.icon.startsWith("http") ? (
                      <img
                        src={badge.icon}
                        alt={badge.name}
                        className="w-14 h-14 object-contain bg-gray-100 rounded p-1"
                      />
                    ) : badge.icon ? (
                      <div className="w-14 h-14 bg-gray-100 rounded flex items-center justify-center text-2xl">
                        {badge.icon}
                      </div>
                    ) : (
                      <div className="w-14 h-14 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                        No Icon
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {badge.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {badge.description || "설명 없음"}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        클릭하여 달성한 학생 목록 보기
                      </p>
                    </div>
                  </div>
                  {/* 달성 횟수 표시 */}
                  <div className="text-right flex items-center space-x-2">
                    {badge.count > 0 && (
                      <span
                        className="text-lg font-bold"
                        style={{
                          color:
                            "var(--color-primary-medium)",
                        }}>
                        {badge.count}회 달성
                      </span>
                    )}
                    {/* 삭제 버튼 추가 */}
                    <button
                      onClick={() =>
                        handleDeleteClick(badge)
                      }
                      disabled={
                        deletingBadgeId === badge.id
                      }
                      className="ml-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="배지 삭제">
                      {deletingBadgeId === badge.id ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-500"></div>
                      ) : (
                        <LuTrash className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center py-4">
              표시할 배지가 없습니다.
            </p>
          )}
        </div>
      )}

      {/* 배지 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowCreateModal(false)}></div>
          <div className="relative bg-white rounded-lg p-6 max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
              <LuX size={24} />
            </button>

            <h2
              className="text-2xl font-bold mb-4"
              style={{
                color: "var(--color-text-primary)",
              }}>
              새 배지 만들기
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateBadge();
              }}>
              {/* 미션 선택 - 가장 상위로 이동 */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  대상 미션 *
                </label>
                <select
                  value={newBadge.missionId}
                  onChange={(e) =>
                    setNewBadge({
                      ...newBadge,
                      missionId: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded-lg"
                  required>
                  <option value="">
                    미션을 선택하세요
                  </option>
                  {/* 시스템 배지 옵션 추가 */}
                  <optgroup label="시스템 배지">
                    <option value="system_daily_complete">
                      오늘의 미션 달성!
                    </option>
                    <option value="system_weekly_complete">
                      주간 미션 달성!
                    </option>
                  </optgroup>
                  {/* 일반 미션 옵션 */}
                  <optgroup label="오늘의 미션">
                    {missions?.map((mission) => (
                      <option
                        key={mission.id}
                        value={mission.id}>
                        {mission.content}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* 배지 이름 */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  배지 이름 *
                </label>
                <input
                  type="text"
                  value={newBadge.name}
                  onChange={(e) =>
                    setNewBadge({
                      ...newBadge,
                      name: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded-lg"
                  placeholder="예: 수학 마스터"
                  required
                />
              </div>

              {/* 배지 설명 */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  배지 설명
                </label>
                <textarea
                  value={newBadge.description}
                  onChange={(e) =>
                    setNewBadge({
                      ...newBadge,
                      description: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded-lg"
                  rows={2}
                  placeholder="예: 수학 문제를 10번 완료했어요!"
                />
              </div>

              {/* 달성 횟수 */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  달성 횟수 *
                </label>
                <input
                  type="number"
                  value={newBadge.targetCount}
                  onChange={(e) =>
                    setNewBadge({
                      ...newBadge,
                      targetCount:
                        parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full p-2 border rounded-lg"
                  min="1"
                  required
                />
              </div>

              {/* 아이콘 선택 */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  배지 아이콘
                </label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() =>
                      setNewBadge({
                        ...newBadge,
                        iconType: "emoji",
                      })
                    }
                    className={`px-3 py-1 rounded ${
                      newBadge.iconType === "emoji"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200"
                    }`}>
                    이모지
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setNewBadge({
                        ...newBadge,
                        iconType: "upload",
                      })
                    }
                    className={`px-3 py-1 rounded ${
                      newBadge.iconType === "upload"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200"
                    }`}>
                    <LuUpload
                      className="inline mr-1"
                      size={16}
                    />
                    업로드
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setNewBadge({
                        ...newBadge,
                        iconType: "ai",
                      })
                    }
                    className={`px-3 py-1 rounded ${
                      newBadge.iconType === "ai"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200"
                    }`}>
                    <LuSparkles
                      className="inline mr-1"
                      size={16}
                    />
                    AI 생성
                  </button>
                </div>

                {newBadge.iconType === "emoji" && (
                  <input
                    type="text"
                    value={newBadge.icon}
                    onChange={(e) =>
                      setNewBadge({
                        ...newBadge,
                        icon: e.target.value,
                      })
                    }
                    className="w-full p-2 border rounded-lg"
                    placeholder="이모지 입력 (예: 🏆)"
                  />
                )}

                {newBadge.iconType === "upload" && (
                  <div className="text-gray-500 text-sm">
                    이미지 업로드 기능 구현 예정
                  </div>
                )}

                {newBadge.iconType === "ai" && (
                  <div className="text-gray-500 text-sm">
                    AI 이미지 생성 기능 구현 예정
                  </div>
                )}
              </div>

              {/* 제출 버튼 */}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                  취소
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-lg text-white disabled:opacity-50"
                  style={{
                    backgroundColor:
                      "var(--color-primary-medium)",
                  }}>
                  {creating ? "생성 중..." : "배지 생성"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && badgeToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full m-4">
            <h3 className="text-lg font-semibold mb-4">
              배지 삭제 확인
            </h3>
            <p className="text-gray-600 mb-6">
              정말로{" "}
              <span className="font-semibold">
                {badgeToDelete.name}
              </span>{" "}
              배지를 삭제하시겠습니까?
              {badgeToDelete.count > 0 && (
                <span className="block mt-2 text-sm text-amber-600">
                  이 배지를 획득한 학생이 있는 경우
                  비활성화만 됩니다.
                </span>
              )}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                취소
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={
                  deletingBadgeId === badgeToDelete.id
                }
                className="px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50">
                {deletingBadgeId === badgeToDelete.id
                  ? "삭제 중..."
                  : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 학생 목록 모달 */}
      {showStudentList && selectedBadgeForList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full m-4 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {selectedBadgeForList.name} 달성 학생 목록
              </h3>
              <button
                onClick={handleCloseStudentList}
                className="text-gray-500 hover:text-gray-700">
                <LuX className="h-6 w-6" />
              </button>
            </div>

            {loadingStudentList ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : studentList.length > 0 ? (
              <div className="overflow-y-auto flex-1">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        학생 이름
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        달성 날짜
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {studentList.map((student) => (
                      <tr
                        key={student.student_id}
                        className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          {student.student_name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                          {new Date(
                            student.earned_date
                          ).toLocaleDateString("ko-KR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                아직 이 배지를 달성한 학생이 없습니다.
              </div>
            )}

            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600 text-center">
                총 {studentList.length}명의 학생이
                달성했습니다.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BadgeSettingsPage;
