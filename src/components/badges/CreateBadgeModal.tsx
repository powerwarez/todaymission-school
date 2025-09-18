import React, { useState } from "react";
import { LuX, LuUpload, LuSparkles } from "react-icons/lu";
import { toast } from "sonner";
import { Mission } from "./types";
import { generateImagePrompt } from "../../utils/geminiPromptGenerator";
import { AIImageGenerationModal } from "./AIImageGenerationModal";
import { generateImage } from "../../utils/geminiImageGenerator";

interface NewBadgeData {
  name: string;
  description: string;
  icon: string;
  mission_id: string;
  targetCount: number;
  iconType: "emoji" | "upload" | "ai";
}

interface CreateBadgeModalProps {
  isOpen: boolean;
  missions: Mission[];
  creating: boolean;
  onClose: () => void;
  onCreate: (badge: NewBadgeData) => Promise<void>;
}

export const CreateBadgeModal: React.FC<
  CreateBadgeModalProps
> = ({ isOpen, missions, creating, onClose, onCreate }) => {
  const [newBadge, setNewBadge] = useState<NewBadgeData>({
    name: "",
    description: "",
    icon: "",
    mission_id: "",
    targetCount: 1,
    iconType: "emoji",
  });

  // AI 이미지 생성 관련 상태
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [generatingImage, setGeneratingImage] =
    useState(false);
  const [generatingPrompt, setGeneratingPrompt] =
    useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] =
    useState<string | null>(null);
  const [imageGenerationError, setImageGenerationError] =
    useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newBadge.name || newBadge.name.trim() === "") {
      toast.error("배지 이름을 입력해주세요.");
      return;
    }

    if (
      !newBadge.description ||
      newBadge.description.trim() === ""
    ) {
      toast.error("배지 설명을 입력해주세요.");
      return;
    }

    if (!newBadge.mission_id) {
      toast.error("미션을 선택해주세요.");
      return;
    }

    if (!newBadge.icon || newBadge.icon.trim() === "") {
      toast.error("배지 아이콘을 선택해주세요.");
      return;
    }

    await onCreate(newBadge);
  };

  const handleFileUpload = async (file: File) => {
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
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setNewBadge({
          ...newBadge,
          icon: dataUrl,
          iconType: "upload",
        });
        toast.success("이미지가 업로드되었습니다.");
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("파일 읽기 오류:", error);
      toast.error("파일을 읽는 중 오류가 발생했습니다.");
    }
  };

  const handleGeneratePrompt = async () => {
    if (!newBadge.name || !newBadge.description) {
      toast.error("배지 이름과 설명을 먼저 입력해주세요.");
      return;
    }

    try {
      setGeneratingPrompt(true);
      const generatedPrompt = await generateImagePrompt(
        newBadge.name,
        newBadge.description
      );

      if (generatedPrompt !== null) {
        setAiPrompt(generatedPrompt);
        setShowAiModal(true);
      } else {
        toast.error("프롬프트 생성에 실패했습니다.");
      }
    } catch (error) {
      console.error("프롬프트 생성 오류:", error);
      toast.error("프롬프트 생성 중 오류가 발생했습니다.");
    } finally {
      setGeneratingPrompt(false);
    }
  };

  const handleGenerateImage = async () => {
    try {
      setGeneratingImage(true);
      setImageGenerationError(null);

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
  };

  const handleRegeneratePrompt = async () => {
    try {
      setGeneratingPrompt(true);
      toast.loading("새로운 프롬프트를 생성하는 중...", {
        id: "regenerate-prompt",
      });

      const generatedPrompt = await generateImagePrompt(
        newBadge.name,
        newBadge.description
      );

      toast.dismiss("regenerate-prompt");

      if (generatedPrompt !== null) {
        setAiPrompt(generatedPrompt);
        toast.success("새로운 프롬프트가 생성되었습니다!");
      } else {
        toast.error("프롬프트 재생성에 실패했습니다.");
      }
    } catch (error) {
      console.error("프롬프트 재생성 오류:", error);
      toast.dismiss("regenerate-prompt");
      toast.error(
        "프롬프트 재생성 중 오류가 발생했습니다."
      );
    } finally {
      setGeneratingPrompt(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div
          className="absolute inset-0"
          onClick={() => {
            onClose();
            // blob URL 정리
            if (
              newBadge.icon &&
              newBadge.icon.startsWith("blob:")
            ) {
              URL.revokeObjectURL(newBadge.icon);
            }
          }}
        />
        <div className="relative bg-white rounded-lg p-6 max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
          <button
            onClick={() => {
              onClose();
              // blob URL 정리
              if (
                newBadge.icon &&
                newBadge.icon.startsWith("blob:")
              ) {
                URL.revokeObjectURL(newBadge.icon);
              }
            }}
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

          <form onSubmit={handleSubmit}>
            {/* 미션 선택 */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                미션 선택 *
              </label>
              <select
                value={newBadge.mission_id}
                onChange={(e) =>
                  setNewBadge({
                    ...newBadge,
                    mission_id: e.target.value,
                  })
                }
                className="w-full p-2 border rounded-lg"
                required>
                <option value="">미션을 선택하세요</option>
                <optgroup label="시스템 배지">
                  <option value="weekly_streak_1">
                    이번 주 미션 마스터
                  </option>
                </optgroup>
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
                placeholder="예: 수학의 신"
                value={newBadge.name}
                onChange={(e) =>
                  setNewBadge({
                    ...newBadge,
                    name: e.target.value,
                  })
                }
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>

            {/* 배지 설명 */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                배지 설명 *
              </label>
              <textarea
                placeholder="예: 수학 문제를 10문제 이상 풀었을 때 획득"
                value={newBadge.description}
                onChange={(e) =>
                  setNewBadge({
                    ...newBadge,
                    description: e.target.value,
                  })
                }
                className="w-full p-2 border rounded-lg"
                rows={3}
                required
              />
            </div>

            {/* 목표 달성 횟수 */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                목표 달성 횟수
              </label>
              <input
                type="number"
                min="1"
                value={newBadge.targetCount}
                onChange={(e) =>
                  setNewBadge({
                    ...newBadge,
                    targetCount:
                      parseInt(e.target.value) || 1,
                  })
                }
                className="w-full p-2 border rounded-lg"
              />
            </div>

            {/* 아이콘 선택 */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                배지 아이콘 *
              </label>

              {/* 아이콘 유형 선택 버튼 */}
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() =>
                    setNewBadge({
                      ...newBadge,
                      iconType: "emoji",
                    })
                  }
                  className={`px-3 py-1 rounded-lg ${
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
                  className={`px-3 py-1 rounded-lg ${
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
                  className={`px-3 py-1 rounded-lg ${
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

              {/* 아이콘 입력 영역 */}
              {newBadge.iconType === "emoji" && (
                <input
                  type="text"
                  placeholder="이모지를 입력하세요 (예: 🏆)"
                  value={newBadge.icon}
                  onChange={(e) =>
                    setNewBadge({
                      ...newBadge,
                      icon: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded-lg text-2xl text-center"
                  maxLength={2}
                />
              )}

              {newBadge.iconType === "upload" && (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(file);
                      }
                    }}
                    className="w-full p-2 border rounded-lg"
                  />
                  {newBadge.icon &&
                    newBadge.iconType === "upload" && (
                      <div className="mt-2 relative inline-block">
                        <img
                          src={newBadge.icon}
                          alt="Preview"
                          className="w-20 h-20 object-contain border rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setNewBadge({
                              ...newBadge,
                              icon: "",
                            });
                          }}
                          className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                          <LuX size={16} />
                        </button>
                      </div>
                    )}
                </div>
              )}

              {newBadge.iconType === "ai" && (
                <div>
                  <button
                    type="button"
                    onClick={handleGeneratePrompt}
                    disabled={generatingPrompt}
                    className="w-full px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                    {generatingPrompt ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        프롬프트 생성 중...
                      </>
                    ) : (
                      <>
                        <LuSparkles
                          className="mr-2"
                          size={16}
                        />
                        AI로 이미지 생성하기
                      </>
                    )}
                  </button>
                  {newBadge.icon &&
                    newBadge.iconType === "ai" && (
                      <div className="mt-2 relative inline-block">
                        <img
                          src={newBadge.icon}
                          alt="AI Generated"
                          className="w-20 h-20 object-contain border rounded-lg"
                        />
                      </div>
                    )}
                </div>
              )}
            </div>

            {/* 버튼들 */}
            <div className="flex justify-end space-x-2 mt-6">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  // blob URL 정리
                  if (
                    newBadge.icon &&
                    newBadge.icon.startsWith("blob:")
                  ) {
                    URL.revokeObjectURL(newBadge.icon);
                  }
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                취소
              </button>
              <button
                type="submit"
                disabled={
                  creating ||
                  !newBadge.icon ||
                  newBadge.icon.trim() === ""
                }
                className="px-4 py-2 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor:
                    "var(--color-primary-medium)",
                }}
                title={
                  !newBadge.icon
                    ? "배지 아이콘을 선택해주세요"
                    : ""
                }>
                {creating ? "생성 중..." : "배지 생성"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* AI Image Generation Modal */}
      <AIImageGenerationModal
        isOpen={showAiModal}
        aiPrompt={aiPrompt}
        setAiPrompt={setAiPrompt}
        generatingImage={generatingImage}
        generatingPrompt={generatingPrompt}
        generatedImageUrl={generatedImageUrl}
        imageGenerationError={imageGenerationError}
        onGenerateImage={handleGenerateImage}
        onRegeneratePrompt={handleRegeneratePrompt}
        onUseImage={() => {
          setNewBadge({
            ...newBadge,
            icon: generatedImageUrl || "",
            iconType: "ai",
          });
          setGeneratedImageUrl(null);
          setShowAiModal(false);
          setImageGenerationError(null);
          toast.success("이미지가 적용되었습니다.");
        }}
        onClose={() => {
          setShowAiModal(false);
          if (
            generatedImageUrl &&
            generatedImageUrl.startsWith("blob:")
          ) {
            URL.revokeObjectURL(generatedImageUrl);
          }
          setGeneratedImageUrl(null);
          setImageGenerationError(null);
        }}
      />
    </>
  );
};
