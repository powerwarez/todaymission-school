/// <reference types="vite/client" />

import OpenAI from "openai";

// 환경변수 타입 확장
declare module "vite/client" {
  interface ImportMetaEnv {
    readonly VITE_OPENAI_API_KEY: string;
  }
}

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // 브라우저에서 사용하기 위해 필요 (프로덕션에서는 백엔드 사용 권장)
});

interface ImageGenerationOptions {
  model?: "dall-e-2" | "dall-e-3";
  quality?: "standard" | "hd";
  size?:
    | "1024x1024"
    | "1792x1024"
    | "1024x1792"
    | "256x256"
    | "512x512";
  style?: "vivid" | "natural";
  n?: number;
  response_format?: "url" | "b64_json";
}

export interface GeneratedImage {
  url?: string;
  b64_json?: string;
  revised_prompt?: string;
}

/**
 * OpenAI API를 사용하여 이미지를 생성합니다.
 * @param prompt - 이미지 생성을 위한 텍스트 프롬프트
 * @param options - 이미지 생성 옵션
 * @returns 생성된 이미지 정보
 */
export async function generateImage(
  prompt: string,
  options: ImageGenerationOptions = {}
): Promise<GeneratedImage> {
  try {
    const {
      model = "dall-e-3",
      quality = "standard",
      size = "1024x1024",
      style = "vivid",
      n = 1,
      response_format = "url",
    } = options;

    // DALL-E 3는 한 번에 1개만 생성 가능
    const adjustedN = model === "dall-e-3" ? 1 : n;

    // 타입 안정성을 위한 개별 호출
    const response =
      model === "dall-e-3"
        ? await openai.images.generate({
            model,
            prompt,
            n: adjustedN,
            size,
            response_format,
            quality,
            style,
          })
        : await openai.images.generate({
            model,
            prompt,
            n: adjustedN,
            size,
            response_format,
          });

    if (!response.data || response.data.length === 0) {
      throw new Error("이미지 생성 결과가 없습니다.");
    }

    const imageData = response.data[0];

    return {
      url: imageData.url,
      b64_json: imageData.b64_json,
      revised_prompt: imageData.revised_prompt,
    };
  } catch (error) {
    console.error("이미지 생성 중 오류 발생:", error);
    throw error;
  }
}

/**
 * Base64 이미지 데이터를 Blob URL로 변환합니다.
 * @param base64Data - Base64 인코딩된 이미지 데이터
 * @returns Blob URL
 */
export function base64ToBlob(base64Data: string): string {
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: "image/png" });

  return URL.createObjectURL(blob);
}

/**
 * 이미지 URL을 다운로드하고 로컬 Blob URL로 변환합니다.
 * @param imageUrl - 이미지 URL
 * @returns 로컬 Blob URL
 */
export async function downloadImageAsBlob(
  imageUrl: string
): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("이미지 다운로드 중 오류 발생:", error);
    throw error;
  }
}
