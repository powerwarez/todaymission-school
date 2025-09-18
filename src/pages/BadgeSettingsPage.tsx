import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { LuTriangle, LuPlus } from "react-icons/lu";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import LoadingWithRefresh from "../components/LoadingWithRefresh";

// Badge 컴포넌트들 임포트
import { BadgeCard } from "../components/badges/BadgeCard";
import { CreateBadgeModal } from "../components/badges/CreateBadgeModal";
import { DeleteBadgeModal } from "../components/badges/DeleteBadgeModal";
import { StudentListModal } from "../components/badges/StudentListModal";
import {
  BadgeType,
  DisplayBadge,
  Mission,
  StudentBadgeRow,
  StudentListItem,
} from "../components/badges/types";

function BadgeSettingsPage() {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 데이터 상태
  const [badges, setBadges] = useState<DisplayBadge[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);

  // 배지 생성 모달 상태
  const [showCreateModal, setShowCreateModal] =
    useState(false);
  const [creating, setCreating] = useState(false);

  // 삭제 관련 상태
  const [deletingBadgeId, setDeletingBadgeId] = useState<
    string | null
  >(null);
  const [showDeleteConfirm, setShowDeleteConfirm] =
    useState(false);
  const [badgeToDelete, setBadgeToDelete] =
    useState<DisplayBadge | null>(null);

  // 학생 목록 표시 관련 상태
  const [showStudentList, setShowStudentList] =
    useState(false);
  const [selectedBadgeForList, setSelectedBadgeForList] =
    useState<DisplayBadge | null>(null);
  const [studentList, setStudentList] = useState<
    StudentListItem[]
  >([]);
  const [loadingStudentList, setLoadingStudentList] =
    useState(false);

  // 데이터 가져오기
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

        // 2. 교사의 배지 목록 가져오기
        console.log(
          "배지 조회 시작, teacher_id:",
          userProfile.id
        );

        const { data: allBadges, error: badgesError } =
          await supabase
            .from("badges")
            .select("*")
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

        // earned_badges는 아직 사용하지 않으므로 빈 배열로 설정
        const earnedBadgesData: any[] = [];

        // 4. 배지별 획득 횟수 계산
        const badgeCounts: { [key: string]: number } = {};

        if (earnedBadgesData) {
          earnedBadgesData.forEach(
            (record: { badge_id: string }) => {
              badgeCounts[record.badge_id] =
                (badgeCounts[record.badge_id] || 0) + 1;
            }
          );
        }

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
        console.log("최종 배지 목록:", displayData);

        // 6. 미션 목록 가져오기
        const { data: missionData, error: missionError } =
          await supabase
            .from("missions")
            .select("*")
            .eq("teacher_id", userProfile.id)
            .eq("is_active", true)
            .order("created_at", { ascending: false });

        if (!missionError && missionData) {
          setMissions(missionData as Mission[]);
        }
      } catch (err: unknown) {
        console.error("데이터 로드 중 오류:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "데이터를 불러오는 중 오류가 발생했습니다.";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchBadgeData();
  }, [userProfile]);

  // 배지 생성 핸들러
  const handleCreateBadge = async (newBadge: any) => {
    if (!userProfile) {
      toast.error("사용자 정보를 찾을 수 없습니다.");
      return;
    }

    if (!userProfile.school_id) {
      setError(
        "학교 정보가 없습니다. 관리자에게 문의하세요."
      );
      return;
    }

    setCreating(true);

    try {
      let finalImagePath = newBadge.icon;

      // 이미지가 blob URL이나 data URL인 경우 Supabase Storage에 업로드
      if (
        newBadge.icon &&
        (newBadge.icon.startsWith("blob:") ||
          newBadge.icon.startsWith("data:"))
      ) {
        try {
          let blob: Blob;

          if (newBadge.icon.startsWith("blob:")) {
            const response = await fetch(newBadge.icon);
            blob = await response.blob();
          } else {
            const base64Data = newBadge.icon.split(",")[1];
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(
              byteCharacters.length
            );
            for (
              let i = 0;
              i < byteCharacters.length;
              i++
            ) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const mimeType = newBadge.icon
              .split(":")[1]
              .split(";")[0];
            blob = new Blob([byteArray], {
              type: mimeType,
            });
          }

          const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
          if (blob.size > MAX_FILE_SIZE) {
            toast.error(
              "이미지 크기가 5MB를 초과합니다. 다시 생성해주세요."
            );
            return;
          }

          const timestamp = new Date().getTime();
          const randomString = Math.random()
            .toString(36)
            .substring(7);
          const fileName = `badge_${timestamp}_${randomString}.png`;
          const filePath = `${userProfile.id}/${fileName}`;

          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from("badge-image")
              .upload(filePath, blob, {
                contentType: blob.type || "image/png",
                cacheControl: "3600",
                upsert: true,
              });

          if (uploadError) {
            console.error(
              "Supabase 업로드 에러:",
              uploadError
            );
            throw uploadError;
          }

          console.log("업로드 성공:", uploadData);

          const {
            data: { publicUrl },
          } = supabase.storage
            .from("badge-image")
            .getPublicUrl(filePath);

          finalImagePath = publicUrl;
          console.log("Public URL:", finalImagePath);
        } catch (uploadError) {
          console.error(
            "이미지 업로드 중 오류:",
            uploadError
          );
          throw new Error("이미지 업로드에 실패했습니다.");
        }
      }

      // 배지 생성
      const { data, error: insertError } = await supabase
        .from("badges")
        .insert([
          {
            name: newBadge.name,
            description: newBadge.description,
            icon: finalImagePath,
            teacher_id: userProfile.id,
            school_id: userProfile.school_id,
            mission_id:
              newBadge.mission_id === "weekly_streak_1"
                ? null
                : newBadge.mission_id,
            target_count: newBadge.targetCount,
            is_active: true,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      // 성공 시 목록 업데이트
      const newDisplayBadge: DisplayBadge = {
        ...(data as BadgeType),
        count: 0,
      };
      setBadges([...badges, newDisplayBadge]);

      toast.success("배지가 성공적으로 생성되었습니다!");
      setShowCreateModal(false);

      // blob URL 정리
      if (
        newBadge.icon &&
        newBadge.icon.startsWith("blob:")
      ) {
        URL.revokeObjectURL(newBadge.icon);
      }
    } catch (err: unknown) {
      console.error("배지 생성 중 오류:", err);
      if (err instanceof Error) {
        setError(
          err.message || "배지 생성 중 오류가 발생했습니다."
        );
      } else {
        setError("배지 생성 중 오류가 발생했습니다.");
      }
      toast.error("배지 생성에 실패했습니다.");
    } finally {
      setCreating(false);
    }
  };

  // 배지 삭제 핸들러
  const handleDeleteClick = (badge: DisplayBadge) => {
    setBadgeToDelete(badge);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!badgeToDelete) return;

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
        // 학생이 획득한 배지는 비활성화만 진행
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
      toast.error("배지 삭제에 실패했습니다.");
    } finally {
      setDeletingBadgeId(null);
      setShowDeleteConfirm(false);
      setBadgeToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setBadgeToDelete(null);
    setDeletingBadgeId(null);
  };

  // 배지 클릭 핸들러 (학생 목록 표시)
  const handleBadgeClick = async (badge: DisplayBadge) => {
    setSelectedBadgeForList(badge);
    setShowStudentList(true);
    setLoadingStudentList(true);

    try {
      const { data, error } = await supabase
        .from("student_custom_badges")
        .select(
          `
          student_id,
          earned_date,
          users!student_custom_badges_student_id_fkey(name)
        `
        )
        .eq("badge_id", badge.id)
        .order("earned_date", { ascending: false });

      if (error) throw error;

      const formattedData =
        (data as unknown as StudentBadgeRow[])?.map(
          (item) => ({
            student_id: item.student_id,
            student_name: item.users?.name || "알 수 없음",
            earned_date: item.earned_date,
          })
        ) || [];

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

  const handleCloseStudentList = () => {
    setShowStudentList(false);
    setSelectedBadgeForList(null);
    setStudentList([]);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex flex-col">
        <h1
          className="text-3xl font-bold text-center mb-6"
          style={{ color: "var(--color-text-primary)" }}>
          도전과제 설정
        </h1>

        {/* 새 배지 만들기 버튼 */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 rounded-lg text-white transition-colors"
            style={{
              backgroundColor:
                "var(--color-primary-medium)",
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

        {/* 로딩 상태 */}
        {loading && (
          <LoadingWithRefresh message="배지 데이터를 불러오는 중입니다..." />
        )}

        {/* 에러 표시 */}
        {error && !loading && (
          <div
            className="p-4 mb-4 rounded-lg"
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

        {/* 배지 목록 */}
        {!loading && !error && (
          <div className="space-y-4">
            <h2
              className="text-2xl font-semibold mb-6 text-center"
              style={{
                color: "var(--color-text-primary)",
              }}>
              달성 가능한 배지 목록
            </h2>

            {badges.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                아직 생성된 배지가 없습니다. "새 배지
                만들기" 버튼을 눌러 첫 번째 배지를
                만들어보세요!
              </div>
            ) : (
              <ul className="space-y-3">
                {badges.map((badge) => (
                  <BadgeCard
                    key={badge.id}
                    badge={badge}
                    onBadgeClick={handleBadgeClick}
                    onDeleteClick={handleDeleteClick}
                    isDeletingBadge={
                      deletingBadgeId === badge.id
                    }
                  />
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* 배지 생성 모달 */}
      <CreateBadgeModal
        isOpen={showCreateModal}
        missions={missions}
        creating={creating}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateBadge}
      />

      {/* 배지 삭제 확인 모달 */}
      {showDeleteConfirm && badgeToDelete && (
        <DeleteBadgeModal
          badge={badgeToDelete}
          isDeleting={deletingBadgeId === badgeToDelete.id}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}

      {/* 학생 목록 모달 */}
      {showStudentList && selectedBadgeForList && (
        <StudentListModal
          badge={selectedBadgeForList}
          studentList={studentList}
          isLoading={loadingStudentList}
          onClose={handleCloseStudentList}
        />
      )}
    </div>
  );
}

export default BadgeSettingsPage;
