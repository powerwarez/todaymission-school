import { useState } from "react";
import {
  generateImage,
  base64ToBlob,
  downloadImageAsBlob,
  GeneratedImage,
} from "../utils/openaiImageGenerator";

interface UseImageGenerationReturn {
  generateImageFromPrompt: (
    prompt: string
  ) => Promise<void>;
  isGenerating: boolean;
  generatedImage: GeneratedImage | null;
  imageUrl: string | null;
  error: string | null;
  clearImage: () => void;
}

export function useImageGeneration(): UseImageGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] =
    useState<GeneratedImage | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const generateImageFromPrompt = async (
    prompt: string
  ) => {
    if (!prompt.trim()) {
      setError("프롬프트를 입력해주세요.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // API 키가 설정되어 있는지 확인
      if (!import.meta.env.VITE_OPENAI_API_KEY) {
        throw new Error(
          "OpenAI API 키가 설정되지 않았습니다. 환경변수를 확인해주세요."
        );
      }

      // 이미지 생성
      const result = await generateImage(prompt, {
        model: "dall-e-3",
        quality: "standard",
        size: "1024x1024",
        style: "vivid",
        response_format: "url",
      });

      setGeneratedImage(result);

      // URL 또는 base64 처리
      if (result.url) {
        // URL을 로컬 Blob URL로 변환하여 CORS 문제 방지
        const blobUrl = await downloadImageAsBlob(
          result.url
        );
        setImageUrl(blobUrl);
      } else if (result.b64_json) {
        // Base64를 Blob URL로 변환
        const blobUrl = base64ToBlob(result.b64_json);
        setImageUrl(blobUrl);
      }
    } catch (err) {
      console.error("이미지 생성 중 오류 발생:", err);
      setError(
        err instanceof Error
          ? err.message
          : "이미지 생성 중 오류가 발생했습니다."
      );
      setGeneratedImage(null);
      setImageUrl(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const clearImage = () => {
    // Blob URL 정리
    if (imageUrl && imageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imageUrl);
    }
    setGeneratedImage(null);
    setImageUrl(null);
    setError(null);
  };

  return {
    generateImageFromPrompt,
    isGenerating,
    generatedImage,
    imageUrl,
    error,
    clearImage,
  };
}
