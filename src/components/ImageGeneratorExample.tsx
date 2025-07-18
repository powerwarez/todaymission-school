import React, { useState } from "react";
import { useImageGeneration } from "../hooks/useImageGeneration";
import { LuLoader, LuImage, LuX } from "react-icons/lu";

export const ImageGeneratorExample: React.FC = () => {
  const [prompt, setPrompt] = useState("");
  const {
    generateImageFromPrompt,
    isGenerating,
    imageUrl,
    error,
    clearImage,
  } = useImageGeneration();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await generateImageFromPrompt(prompt);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <LuImage className="mr-2" />
        OpenAI 이미지 생성
      </h2>

      {/* 프롬프트 입력 폼 */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex flex-col gap-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="생성하고 싶은 이미지를 설명해주세요..."
            className="w-full p-3 border rounded-lg resize-none"
            rows={4}
            disabled={isGenerating}
          />
          <button
            type="submit"
            disabled={isGenerating || !prompt.trim()}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              isGenerating || !prompt.trim()
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}>
            {isGenerating ? (
              <span className="flex items-center justify-center">
                <LuLoader className="animate-spin mr-2" />
                이미지 생성 중...
              </span>
            ) : (
              "이미지 생성"
            )}
          </button>
        </div>
      </form>

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {/* 생성된 이미지 */}
      {imageUrl && (
        <div className="relative bg-gray-100 rounded-lg overflow-hidden">
          <button
            onClick={clearImage}
            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors">
            <LuX size={20} />
          </button>
          <img
            src={imageUrl}
            alt="Generated"
            className="w-full h-auto"
          />
        </div>
      )}
    </div>
  );
};
