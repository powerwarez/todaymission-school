import React from "react";
import {
  LuX,
  LuSparkles,
  LuRefreshCw,
} from "react-icons/lu";
import { toast } from "sonner";

interface AIImageGenerationModalProps {
  isOpen: boolean;
  aiPrompt: string;
  setAiPrompt: (prompt: string) => void;
  generatingImage: boolean;
  generatingPrompt: boolean;
  generatedImageUrl: string | null;
  imageGenerationError: string | null;
  onGenerateImage: () => Promise<void>;
  onRegeneratePrompt: () => Promise<void>;
  onUseImage: () => void;
  onClose: () => void;
}

export const AIImageGenerationModal: React.FC<
  AIImageGenerationModalProps
> = ({
  isOpen,
  aiPrompt,
  setAiPrompt,
  generatingImage,
  generatingPrompt,
  generatedImageUrl,
  imageGenerationError,
  onGenerateImage,
  onRegeneratePrompt,
  onUseImage,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            AI 배지 이미지 생성
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700">
            <LuX className="h-6 w-6" />
          </button>
        </div>

        {!generatedImageUrl ? (
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이미지 생성 프롬프트
              </label>
              <textarea
                value={aiPrompt}
                onChange={(e) =>
                  setAiPrompt(e.target.value)
                }
                className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                rows={3}
                placeholder="예: 귀여운 3D 스타일의 수학 트로피..."
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500">
                  AI가 생성한 프롬프트를 수정할 수 있습니다.
                  이 프롬프트로 배지 아이콘이 생성됩니다.
                </p>
                <button
                  onClick={onRegeneratePrompt}
                  disabled={generatingPrompt}
                  className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1 disabled:opacity-50">
                  <LuRefreshCw
                    className={`h-4 w-4 ${
                      generatingPrompt ? "animate-spin" : ""
                    }`}
                  />
                  다시 생성
                </button>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-3">
                프롬프트를 수정하거나 이미지를 생성할 수
                있습니다.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={onGenerateImage}
                  disabled={
                    generatingImage || !aiPrompt.trim()
                  }
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                  {generatingImage ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      생성 중...
                    </>
                  ) : (
                    <>
                      <LuSparkles
                        className="mr-2"
                        size={16}
                      />
                      이미지 생성
                    </>
                  )}
                </button>
              </div>
            </div>

            {imageGenerationError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {imageGenerationError}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                생성된 이미지
              </p>
              <div className="border rounded-lg p-4 bg-gray-50 flex justify-center">
                <img
                  src={generatedImageUrl}
                  alt="Generated badge"
                  className="max-w-full h-auto max-h-64 object-contain"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (
                    generatedImageUrl &&
                    generatedImageUrl.startsWith("blob:")
                  ) {
                    URL.revokeObjectURL(generatedImageUrl);
                  }
                  // Reset for regeneration
                  window.location.reload(); // Simplified approach - reload to reset state
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                다시 생성
              </button>
              <button
                onClick={onUseImage}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                사용하기
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
