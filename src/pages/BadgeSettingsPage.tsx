import React, { useState, useEffect } from "react";
// import { supabase } from '@/lib/supabaseClient'; // 경로 별칭 대신 상대 경로 사용
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { useMissions } from "../hooks/useMissions";
import { Badge as BadgeType } from "../types"; // Badge 타입 import 추가
import { generateImagePrompt } from "../utils/geminiPromptGenerator"; // Gemini 프롬프트 생성 함수 import
import { generateImage } from "../utils/geminiImageGenerator"; // Gemini 이미지 생성 함수 import 추가
import LoadingWithRefresh from "../components/LoadingWithRefresh";
import {
  LuTriangle,
  LuPlus,
  LuX,
  LuUpload,
  LuSparkles,
  LuTrash,
  LuRefreshCw,
} from "react-icons/lu"; // 아이콘 추가
import toast from "react-hot-toast"; // toast 추가

// Badge 타입 정의 (Supabase 스키마 기반)
// Badge는 이미 @/types에 정의되어 있음

// 표시용 Badge 타입 (count 포함)
interface DisplayBadge {
  id: string;
  name: string;
  image_path: string;
  description?: string;
  created_at: string;
  badge_type?: "mission" | "weekly";
  teacher_id?: string;
  icon?: string;
  type?: string;
  criteria?: {
    mission_id?: string;
    target_count?: number;
  };
  is_active?: boolean;
  count: number;
}

const BadgeSettingsPage: React.FC = () => {
  const { userProfile } = useAuth();
  const { missions } = useMissions();
  const [badges, setBadges] = useState<DisplayBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 배지 생성 모달 상태
  const [showCreateModal, setShowCreateModal] = useState(false);
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
  const [deletingBadgeId, setDeletingBadgeId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [badgeToDelete, setBadgeToDelete] = useState<DisplayBadge | null>(null);

  // 학생 목록 표시 관련 상태 추가
  const [showStudentList, setShowStudentList] = useState(false);
  const [selectedBadgeForList, setSelectedBadgeForList] =
    useState<DisplayBadge | null>(null);
  const [studentList, setStudentList] = useState<
    Array<{
      student_id: string;
      student_name: string;
      earned_date: string;
    }>
  >([]);
  const [loadingStudentList, setLoadingStudentList] = useState(false);

  // AI 이미지 생성 관련 상태 추가
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatingPrompt, setGeneratingPrompt] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
    null
  );
  const [imageGenerationError, setImageGenerationError] = useState<
    string | null
  >(null);

  // 컴포넌트 언마운트 시 blob URL 정리
  useEffect(() => {
    return () => {
      // 생성된 이미지 URL이 blob URL인 경우 정리
      if (generatedImageUrl && generatedImageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(generatedImageUrl);
      }
      if (newBadge.icon && newBadge.icon.startsWith("blob:")) {
        URL.revokeObjectURL(newBadge.icon);
      }
    };
  }, [generatedImageUrl, newBadge.icon]);

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
        console.log("배지 조회 시작, teacher_id:", userProfile.id);

        const { data: allBadges, error: badgesError } = await supabase
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
        if (!allBadges) throw new Error("배지 정보를 가져올 수 없습니다.");

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
          earnedBadgesData.forEach((record: { badge_id: string }) => {
            // 일반 배지 카운트
            badgeCounts[record.badge_id] =
              (badgeCounts[record.badge_id] || 0) + 1;
          });
        }

        // weekly_streak_1 배지의 카운트는 별도로 계산 필요 (TODO)

        // 5. 배지 데이터 준비
        const displayData: DisplayBadge[] = (allBadges as BadgeType[]).map(
          (badge) => {
            return {
              ...badge,
              count: badgeCounts[badge.id] || 0,
            } as DisplayBadge;
          }
        );

        setBadges(displayData);
      } catch (err: unknown) {
        console.error("데이터 로딩 중 에러 발생:", err);
        if (err instanceof Error) {
          setError(err.message);
        } else if (typeof err === "string") {
          setError(err);
        } else {
          setError("데이터를 불러오는 중 알 수 없는 오류가 발생했습니다.");
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
      setError("학교 정보가 없습니다. 관리자에게 문의하세요.");
      return;
    }

    // 필수 필드 검증
    if (!newBadge.name || newBadge.name.trim() === "") {
      toast.error("배지 이름을 입력해주세요.");
      return;
    }

    if (!newBadge.description || newBadge.description.trim() === "") {
      toast.error("배지 설명을 입력해주세요.");
      return;
    }

    if (!newBadge.icon || newBadge.icon.trim() === "") {
      toast.error("배지 아이콘을 선택해주세요.");
      return;
    }

    try {
      setCreating(true);

      let finalImagePath = newBadge.icon;

      // AI로 생성한 이미지인 경우 Supabase Storage에 업로드
      if (
        newBadge.icon &&
        (newBadge.icon.startsWith("blob:") || newBadge.icon.startsWith("data:"))
      ) {
        try {
          let blob: Blob;

          if (newBadge.icon.startsWith("data:")) {
            // data URL을 blob으로 변환
            const response = await fetch(newBadge.icon);
            blob = await response.blob();
          } else {
            // blob URL을 실제 파일로 변환
            const response = await fetch(newBadge.icon);
            blob = await response.blob();
          }

          // 5MB 제한 확인
          const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
          if (blob.size > MAX_FILE_SIZE) {
            toast.error("이미지 크기가 5MB를 초과합니다. 다시 생성해주세요.");
            return;
          }

          // 파일명 생성
          const fileName = `badge_${Date.now()}_${Math.random()
            .toString(36)
            .substring(7)}.png`;
          const filePath = `badges/${userProfile.id}/${fileName}`;

          // Supabase Storage에 업로드
          console.log("업로드 시도:", {
            filePath,
            blobSize: blob.size,
            blobType: blob.type,
          });

          const { data: uploadData, error: uploadError } =
            await supabase.storage.from("badge-image").upload(filePath, blob, {
              contentType: blob.type || "image/png",
              cacheControl: "3600",
              upsert: true,
            });

          if (uploadError) {
            console.error("Supabase 업로드 에러:", uploadError);
            throw uploadError;
          }

          console.log("업로드 성공:", uploadData);

          // 공개 URL 가져오기
          const {
            data: { publicUrl },
          } = supabase.storage.from("badge-image").getPublicUrl(filePath);

          finalImagePath = publicUrl;
        } catch (uploadError) {
          console.error("이미지 업로드 오류:", uploadError);
          toast.error("이미지 업로드에 실패했습니다.");
          return;
        }
      }

      // 배지 데이터 준비
      console.log("현재 userProfile:", userProfile);
      console.log("school_id:", userProfile.school_id);

      const badgeData = {
        teacher_id: userProfile.id,
        school_id: userProfile.school_id,
        name: newBadge.name,
        description: newBadge.description,
        icon: finalImagePath || null,
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

      // URL 정리 (blob URL인 경우만)
      if (newBadge.icon && newBadge.icon.startsWith("blob:")) {
        URL.revokeObjectURL(newBadge.icon);
      }
      if (generatedImageUrl && generatedImageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(generatedImageUrl);
      }

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
      setGeneratedImageUrl(null);

      // 성공 메시지
      toast.success("배지가 성공적으로 생성되었습니다!");
    } catch (err) {
      console.error("배지 생성 중 오류:", err);
      if (err instanceof Error) {
        console.error("에러 메시지:", err.message);
        setError(err.message || "배지 생성 중 오류가 발생했습니다.");
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
      const { data: earnedBadges, error: checkError } = await supabase
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

        toast.success("배지가 비활성화되었습니다. (학생이 이미 획득한 배지)");
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
      setBadges(badges.filter((b) => b.id !== badgeToDelete.id));
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
        (data as unknown as StudentBadgeRow[])?.map((item) => ({
          student_id: item.student_id,
          student_name: item.users?.name || "알 수 없음",
          earned_date: item.earned_date,
        })) || [];

      setStudentList(formattedData);
    } catch (err) {
      console.error("학생 목록 가져오기 오류:", err);
      toast.error("학생 목록을 가져오는 중 오류가 발생했습니다.");
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
      <div className="mb-8">
        <h1
          className="text-3xl font-bold text-center mb-6"
          style={{ color: "var(--color-text-primary)" }}
        >
          도전과제 설정
        </h1>
        <div className="flex justify-end">
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
            }
          >
            <LuPlus className="mr-2" size={20} />새 배지 만들기
          </button>
        </div>
      </div>

      {/* 로딩 상태 표시 */}
      {loading && (
        <LoadingWithRefresh
          onRefresh={() => {
            setLoading(true);
            setError(null);
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
                console.log("배지 조회 시작, teacher_id:", userProfile.id);

                const { data: allBadges, error: badgesError } = await supabase
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
                  throw new Error("배지 정보를 가져올 수 없습니다.");

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
                  earnedBadgesData.forEach((record: { badge_id: string }) => {
                    // 일반 배지 카운트
                    badgeCounts[record.badge_id] =
                      (badgeCounts[record.badge_id] || 0) + 1;
                  });
                }

                // weekly_streak_1 배지의 카운트는 별도로 계산 필요 (TODO)

                // 5. 배지 데이터 준비
                const displayData: DisplayBadge[] = (
                  allBadges as BadgeType[]
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
          }}
        />
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
          }}
        >
          <LuTriangle className="inline mr-2" />
          <span className="block sm:inline">오류가 발생했습니다: {error}</span>
        </div>
      )}

      {/* 데이터 로딩 완료 및 에러 없는 경우 */}
      {!loading && !error && (
        <div>
          <h2
            className="text-2xl font-semibold mb-6 text-center"
            style={{ color: "var(--color-text-primary)" }}
          >
            달성 가능한 배지 목록
          </h2>
          {badges.length > 0 ? (
            <ul className="space-y-4 max-w-2xl mx-auto">
              {badges.map((badge) => (
                <li
                  key={badge.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm hover:bg-gray-50 transition-colors"
                >
                  <div
                    className="flex items-center space-x-4 flex-grow cursor-pointer"
                    onClick={() => handleBadgeClick(badge)}
                  >
                    {/* 배지 아이콘 표시 */}
                    {badge.icon && badge.icon.startsWith("http") ? (
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
                          color: "var(--color-primary-medium)",
                        }}
                      >
                        {badge.count}회 달성
                      </span>
                    )}
                    {/* 삭제 버튼 추가 */}
                    <button
                      onClick={() => handleDeleteClick(badge)}
                      disabled={deletingBadgeId === badge.id}
                      className="ml-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="배지 삭제"
                    >
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
            onClick={() => {
              setShowCreateModal(false);
              // blob URL 정리
              if (newBadge.icon && newBadge.icon.startsWith("blob:")) {
                URL.revokeObjectURL(newBadge.icon);
              }
            }}
          ></div>
          <div className="relative bg-white rounded-lg p-6 max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowCreateModal(false);
                // blob URL 정리
                if (newBadge.icon && newBadge.icon.startsWith("blob:")) {
                  URL.revokeObjectURL(newBadge.icon);
                }
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <LuX size={24} />
            </button>

            <h2
              className="text-2xl font-bold mb-4"
              style={{
                color: "var(--color-text-primary)",
              }}
            >
              새 배지 만들기
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateBadge();
              }}
            >
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
                  required
                >
                  <option value="">미션을 선택하세요</option>
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
                      <option key={mission.id} value={mission.id}>
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
                  배지 설명 *
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
                  required
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
                      targetCount: parseInt(e.target.value) || 1,
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
                    }`}
                  >
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
                    }`}
                  >
                    <LuUpload className="inline mr-1" size={16} />
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
                    }`}
                  >
                    <LuSparkles className="inline mr-1" size={16} />
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
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        // 파일 크기 제한 (5MB)
                        const MAX_FILE_SIZE = 5 * 1024 * 1024;
                        if (file.size > MAX_FILE_SIZE) {
                          toast.error("이미지 크기는 5MB 이하여야 합니다.");
                          return;
                        }

                        // 이미지 파일 타입 확인
                        if (!file.type.startsWith("image/")) {
                          toast.error("이미지 파일만 업로드 가능합니다.");
                          return;
                        }

                        try {
                          // 파일을 data URL로 변환하여 미리보기
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            const dataUrl = e.target?.result as string;
                            setNewBadge({
                              ...newBadge,
                              icon: dataUrl,
                            });
                          };
                          reader.readAsDataURL(file);
                        } catch (error) {
                          console.error("파일 읽기 오류:", error);
                          toast.error("파일을 읽는 중 오류가 발생했습니다.");
                        }
                      }}
                      className="w-full p-2 border rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />

                    {newBadge.icon && (
                      <div className="mt-2 relative">
                        <img
                          src={newBadge.icon}
                          alt="업로드된 배지"
                          className="w-32 h-32 object-contain mx-auto border rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setNewBadge({
                              ...newBadge,
                              icon: "",
                            });
                          }}
                          className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <LuX size={16} />
                        </button>
                      </div>
                    )}

                    <p className="text-xs text-gray-500">
                      * 권장 크기: 512x512px, 최대 5MB
                    </p>
                  </div>
                )}

                {newBadge.iconType === "ai" && (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={async () => {
                        // 배지 설명이 없으면 안내
                        if (
                          !newBadge.description ||
                          newBadge.description.trim() === ""
                        ) {
                          toast.error(
                            "AI 이미지 생성을 위해 배지 설명이 필요합니다."
                          );
                          // 배지 설명 textarea에 포커스
                          const descriptionTextarea = document.querySelector(
                            'textarea[placeholder*="수학 문제를"]'
                          ) as HTMLTextAreaElement;
                          if (descriptionTextarea) {
                            descriptionTextarea.focus();
                            descriptionTextarea.scrollIntoView({
                              behavior: "smooth",
                              block: "center",
                            });
                          }
                          return;
                        }

                        try {
                          setGeneratingPrompt(true);

                          // Gemini로 이미지 생성 프롬프트 생성
                          const generatedPrompt = await generateImagePrompt(
                            newBadge.name,
                            newBadge.description
                          );

                          if (generatedPrompt !== null) {
                            setAiPrompt(generatedPrompt);
                            setShowAiModal(true);
                          } else {
                            toast.error(
                              "프롬프트 생성에 실패했습니다. Gemini API 키를 확인해주세요."
                            );
                          }
                        } catch (error) {
                          console.error("프롬프트 생성 오류:", error);
                          toast.error("프롬프트 생성 중 오류가 발생했습니다.");
                        } finally {
                          setGeneratingPrompt(false);
                        }
                      }}
                      disabled={generatingPrompt}
                      className="w-full px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {generatingPrompt ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          이미지 생성 프롬프트 생성 중...
                        </>
                      ) : (
                        <>
                          <LuSparkles className="mr-2" size={16} />
                          AI로 이미지 생성하기
                        </>
                      )}
                    </button>
                    {newBadge.icon && (
                      <div className="mt-2">
                        <img
                          src={newBadge.icon}
                          alt="생성된 배지"
                          className="w-32 h-32 object-contain mx-auto border rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 제출 버튼 */}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    // blob URL 정리
                    if (newBadge.icon && newBadge.icon.startsWith("blob:")) {
                      URL.revokeObjectURL(newBadge.icon);
                    }
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={
                    creating || !newBadge.icon || newBadge.icon.trim() === ""
                  }
                  className="px-4 py-2 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: "var(--color-primary-medium)",
                  }}
                  title={!newBadge.icon ? "배지 아이콘을 선택해주세요" : ""}
                >
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
            <h3 className="text-lg font-semibold mb-4">배지 삭제 확인</h3>
            <p className="text-gray-600 mb-6">
              정말로 <span className="font-semibold">{badgeToDelete.name}</span>{" "}
              배지를 삭제하시겠습니까?
              {badgeToDelete.count > 0 && (
                <span className="block mt-2 text-sm text-amber-600">
                  이 배지를 획득한 학생이 있는 경우 비활성화만 됩니다.
                </span>
              )}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deletingBadgeId === badgeToDelete.id}
                className="px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
              >
                {deletingBadgeId === badgeToDelete.id ? "삭제 중..." : "삭제"}
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
                className="text-gray-500 hover:text-gray-700"
              >
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
                      <tr key={student.student_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          {student.student_name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                          {new Date(student.earned_date).toLocaleDateString(
                            "ko-KR",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
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
                총 {studentList.length}명의 학생이 달성했습니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI 이미지 생성 모달 */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">AI 배지 이미지 생성</h3>
              <button
                onClick={() => {
                  setShowAiModal(false);
                  // blob URL 정리 (사용하지 않는 경우에만)
                  if (
                    generatedImageUrl &&
                    generatedImageUrl.startsWith("blob:") &&
                    newBadge.icon !== generatedImageUrl
                  ) {
                    URL.revokeObjectURL(generatedImageUrl);
                  }
                  setGeneratedImageUrl(null);
                  setImageGenerationError(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <LuX className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  이미지 생성 프롬프트
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                  rows={3}
                  placeholder="이미지 생성을 위한 프롬프트..."
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500">
                    AI가 생성한 프롬프트를 수정할 수 있습니다. 이 프롬프트로
                    배지 아이콘이 생성됩니다.
                  </p>
                  <button
                    onClick={async () => {
                      try {
                        setGeneratingPrompt(true);
                        toast.loading("새로운 프롬프트를 생성하는 중...", {
                          id: "regenerate-prompt",
                        });

                        // Gemini로 새로운 이미지 생성 프롬프트 생성
                        const generatedPrompt = await generateImagePrompt(
                          newBadge.name,
                          newBadge.description
                        );

                        toast.dismiss("regenerate-prompt");

                        if (generatedPrompt !== null) {
                          setAiPrompt(generatedPrompt);
                          toast.success("새로운 프롬프트가 생성되었습니다!");
                        } else {
                          toast.error(
                            "프롬프트 재생성에 실패했습니다. Gemini API 키를 확인해주세요."
                          );
                        }
                      } catch (error) {
                        console.error("프롬프트 재생성 오류:", error);
                        toast.dismiss("regenerate-prompt");
                        toast.error("프롬프트 재생성 중 오류가 발생했습니다.");
                      } finally {
                        setGeneratingPrompt(false);
                      }
                    }}
                    disabled={generatingPrompt}
                    className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1 disabled:opacity-50"
                  >
                    <LuRefreshCw
                      className={`h-4 w-4 ${
                        generatingPrompt ? "animate-spin" : ""
                      }`}
                    />
                    프롬프트 다시 생성
                  </button>
                </div>
              </div>

              {imageGenerationError && (
                <div className="p-3 bg-red-50 border border-red-300 rounded-lg text-red-700 text-sm">
                  {imageGenerationError}
                </div>
              )}

              {generatedImageUrl && (
                <div className="text-center">
                  <img
                    src={generatedImageUrl}
                    alt="생성된 배지 이미지"
                    className="w-64 h-64 object-contain mx-auto border rounded-lg"
                  />
                </div>
              )}

              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-3">
                  프롬프트를 수정하거나 이미지를 생성할 수 있습니다.
                </p>
                <div className="flex gap-2">
                  {!generatedImageUrl ? (
                    <button
                      onClick={async () => {
                        try {
                          setGeneratingImage(true);
                          setImageGenerationError(null);

                          // Gemini로 이미지 생성
                          const result = await generateImage(aiPrompt);

                          if (result.url) {
                            setGeneratedImageUrl(result.url);
                            toast.success("이미지가 생성되었습니다!");
                          } else {
                            setImageGenerationError(
                              result.error || "이미지 생성에 실패했습니다."
                            );
                            toast.error(
                              result.error || "이미지 생성에 실패했습니다."
                            );
                          }
                        } catch (error) {
                          console.error("이미지 생성 오류:", error);
                          setImageGenerationError(
                            "이미지 생성 중 오류가 발생했습니다."
                          );
                          toast.error("이미지 생성 중 오류가 발생했습니다.");
                        } finally {
                          setGeneratingImage(false);
                        }
                      }}
                      disabled={generatingImage || !aiPrompt.trim()}
                      className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {generatingImage ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          이미지 생성 중...
                        </>
                      ) : (
                        <>
                          <LuSparkles className="mr-2" size={16} />
                          이미지 생성
                        </>
                      )}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          if (
                            generatedImageUrl &&
                            generatedImageUrl.startsWith("blob:")
                          ) {
                            URL.revokeObjectURL(generatedImageUrl);
                          }
                          setGeneratedImageUrl(null);
                          setImageGenerationError(null);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        다시 생성
                      </button>
                      <button
                        onClick={() => {
                          setNewBadge({
                            ...newBadge,
                            icon: generatedImageUrl,
                          });
                          setShowAiModal(false);
                          setImageGenerationError(null);
                          toast.success("이미지가 적용되었습니다.");
                        }}
                        className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                      >
                        사용하기
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setShowAiModal(false);
                      setAiPrompt("");
                      setImageGenerationError(null);
                      if (
                        generatedImageUrl &&
                        generatedImageUrl.startsWith("blob:")
                      ) {
                        URL.revokeObjectURL(generatedImageUrl);
                      }
                      setGeneratedImageUrl(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BadgeSettingsPage;
