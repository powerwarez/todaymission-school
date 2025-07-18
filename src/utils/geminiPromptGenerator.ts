import { GoogleGenerativeAI } from "@google/generative-ai";

// Gemini API 키 가져오기
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

/**
 * 배지 정보를 바탕으로 이미지 생성 프롬프트를 생성합니다.
 * @param badgeName 배지 이름
 * @param badgeDescription 배지 설명
 * @returns 생성된 프롬프트 텍스트 (한국어) 또는 null (실패 시)
 */
export async function generateImagePrompt(
  badgeName: string,
  badgeDescription: string
): Promise<string | null> {
  // API 키가 없으면 null 반환
  if (!apiKey) {
    console.error("Gemini API 키가 설정되지 않았습니다.");
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
배지 이름: ${badgeName}
배지 설명: ${badgeDescription}

위 정보를 바탕으로 이미지 생성 AI에서 사용할 수 있는 상세한 프롬프트를 한국어로 만들어주세요.

요구사항:
- 원형 배지 디자인
- 초등학생이 좋아할 만한 귀엽고 친근한 스타일
- 밝고 선명한 색상
- 배지의 목적을 잘 나타내는 중앙 아이콘
- 교육적이고 동기부여가 되는 느낌
- 배지 이미지 안에 글씨 없이
- 배지 이미지 안에 배지 이름 없이
- 픽셀 아트 같은 느낌으로
- 상세한 이미지 묘사

프롬프트만 출력하고 다른 설명은 하지 마세요.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text.trim();
  } catch (error) {
    console.error("Gemini 프롬프트 생성 오류:", error);
    return null;
  }
}
