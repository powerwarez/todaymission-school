/// <reference types="vite/client" />
import { GoogleGenAI, Modality } from "@google/genai";

// Gemini API 키 가져오기
const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;

/**
 * Gemini 2.0 Flash를 사용하여 이미지를 생성합니다.
 * @param prompt 이미지 생성 프롬프트
 * @returns 생성된 이미지 데이터 또는 에러
 */
export async function generateImage(prompt: string): Promise<{
  url: string | null;
  error?: string;
}> {
  // API 키가 없으면 에러 반환
  if (!apiKey) {
    console.error("Gemini API 키가 설정되지 않았습니다.");
    return { url: null, error: "Gemini API 키가 설정되지 않았습니다." };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // 이미지 생성 요청
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: prompt,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    // 응답에서 이미지 데이터 추출
    if (response.candidates && response.candidates[0]) {
      const candidate = response.candidates[0];
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          // 텍스트 응답 처리
          if (part.text) {
            console.log("Gemini 응답:", part.text);
          }
          // 인라인 이미지 데이터가 있는 경우
          if (part.inlineData && part.inlineData.data) {
            const imageData = part.inlineData.data;
            const mimeType = part.inlineData.mimeType || "image/png";

            // base64 데이터 URL 형식으로 반환
            const dataUrl = `data:${mimeType};base64,${imageData}`;
            return { url: dataUrl };
          }
        }
      }
    }

    // 이미지를 찾을 수 없는 경우
    return { url: null, error: "생성된 이미지를 찾을 수 없습니다." };
  } catch (error) {
    console.error("Gemini 이미지 생성 오류:", error);

    // 에러 메시지 처리
    let errorMessage = "이미지 생성 중 오류가 발생했습니다.";
    if (error instanceof Error) {
      if (error.message.includes("404")) {
        errorMessage =
          "이미지 생성 모델을 찾을 수 없습니다. 모델명을 확인해주세요.";
      } else if (error.message.includes("quota")) {
        errorMessage = "API 할당량을 초과했습니다. 나중에 다시 시도해주세요.";
      } else if (error.message.includes("not available")) {
        errorMessage = "이 지역에서는 이미지 생성을 사용할 수 없습니다.";
      } else if (error.message.includes("billing")) {
        errorMessage = "이미지 생성은 유료 API 키가 필요합니다.";
      } else {
        errorMessage = error.message;
      }
    }

    return { url: null, error: errorMessage };
  }
}
