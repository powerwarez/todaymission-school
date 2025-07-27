import { GoogleGenerativeAI } from "@google/generative-ai";

// Gemini API 키 가져오기
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

export interface RecommendedMission {
  content: string;
  description?: string;
}

/**
 * 기존 미션들을 참고하여 새로운 미션 5개를 추천합니다.
 * @param existingMissions 기존 미션 목록
 * @returns 추천된 미션 5개 배열 또는 null (실패 시)
 */
export async function recommendMissions(
  existingMissions: string[]
): Promise<RecommendedMission[] | null> {
  // API 키가 없으면 null 반환
  if (!apiKey) {
    console.error("Gemini API 키가 설정되지 않았습니다.");
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const existingMissionsText =
      existingMissions.length > 0
        ? `현재 설정된 미션들:\n${existingMissions
            .map((m, i) => `${i + 1}. ${m}`)
            .join("\n")}`
        : "현재 설정된 미션이 없습니다.";

    const prompt = `
${existingMissionsText}

위 정보를 참고하여 초등학생들이 매일 수행할 수 있는 교육적이고 건전한 "오늘의 미션" 5개를 추천해주세요.

요구사항:
- 초등학생이 이해하고 실천할 수 있는 수준
- 교육적이고 긍정적인 습관 형성에 도움이 되는 내용
- 매일 반복 가능한 미션
- 구체적이고 명확한 행동 지침
- 다양한 영역(학습, 생활, 운동, 예절 등) 포함
- 기존 미션과 중복되지 않도록 주의

JSON 배열 형식으로만 응답하세요:
[
  {"content": "미션 내용", "description": "선택적 설명"},
  ...
]

다른 설명이나 주석은 포함하지 마세요.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // JSON 파싱 시도
    try {
      // 코드 블록 제거
      const jsonText = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      const missions = JSON.parse(jsonText);

      // 유효성 검사
      if (Array.isArray(missions) && missions.length > 0) {
        return missions
          .slice(0, 5)
          .map((mission) => ({
            content: mission.content || "",
            description: mission.description,
          }))
          .filter((m) => m.content.trim() !== "");
      }
    } catch (parseError) {
      console.error("JSON 파싱 오류:", parseError);
      console.error("원본 응답:", text);
    }

    return null;
  } catch (error) {
    console.error("Gemini 미션 추천 오류:", error);
    return null;
  }
}
