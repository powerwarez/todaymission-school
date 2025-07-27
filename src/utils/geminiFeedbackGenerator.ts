import { GoogleGenerativeAI } from "@google/generative-ai";
import { Mission } from "../types";

// Gemini API 키 가져오기
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

export interface MissionLogWithDetails {
  mission_id: string;
  completed_at: string;
  mission: Mission;
}

export interface GeneratedFeedback {
  date: string;
  completedMissions: string[];
  incompleteMissions: string[];
  feedback: string;
  encouragement: string;
  completionRate: number;
}

/**
 * 학생의 미션 수행 결과에 대한 AI 피드백을 생성합니다.
 * @param studentName 학생 이름
 * @param missionLogs 완료된 미션 로그
 * @param allMissions 전체 미션 목록
 * @param targetDate 피드백 대상 날짜
 * @returns 생성된 피드백 또는 null (실패 시)
 */
export async function generateMissionFeedback(
  studentName: string,
  missionLogs: MissionLogWithDetails[],
  allMissions: Mission[],
  targetDate: string
): Promise<GeneratedFeedback | null> {
  // API 키가 없으면 null 반환
  if (!apiKey) {
    console.error("Gemini API 키가 설정되지 않았습니다.");
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    // 완료된 미션과 미완료 미션 분류
    const completedMissionIds = new Set(
      missionLogs.map((log) => log.mission_id)
    );
    const completedMissions = allMissions
      .filter((m) => completedMissionIds.has(m.id))
      .map((m) => m.content);
    const incompleteMissions = allMissions
      .filter((m) => !completedMissionIds.has(m.id))
      .map((m) => m.content);

    const completionRate =
      allMissions.length > 0
        ? Math.round((completedMissions.length / allMissions.length) * 100)
        : 0;

    const prompt = `
${studentName} 학생의 ${targetDate} 미션 수행 결과입니다.

전체 미션 ${allMissions.length}개 중 ${
      completedMissions.length
    }개 완료 (${completionRate}%)

완료한 미션:
${
  completedMissions.length > 0
    ? completedMissions.map((m, i) => `${i + 1}. ${m}`).join("\n")
    : "없음"
}

완료하지 못한 미션:
${
  incompleteMissions.length > 0
    ? incompleteMissions.map((m, i) => `${i + 1}. ${m}`).join("\n")
    : "없음"
}

위 정보를 바탕으로 초등학생에게 전달할 따뜻하고 격려하는 피드백을 작성해주세요.

요구사항:
- 초등학생이 이해하기 쉬운 친근한 언어 사용
- 완료한 미션에 대한 구체적인 칭찬
- 미완료 미션에 대한 긍정적인 격려
- 다음 날 더 잘할 수 있도록 동기부여
- 학생의 이름을 포함하여 개인화된 메시지
- 이모지를 적절히 사용하여 친근감 표현

JSON 형식으로만 응답하세요:
{
  "feedback": "전체적인 피드백 메시지 (2-3문장)",
  "encouragement": "격려와 동기부여 메시지 (1-2문장)"
}

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
      const parsed = JSON.parse(jsonText);

      return {
        date: targetDate,
        completedMissions,
        incompleteMissions,
        feedback: parsed.feedback || "",
        encouragement: parsed.encouragement || "",
        completionRate,
      };
    } catch (parseError) {
      console.error("JSON 파싱 오류:", parseError);
      console.error("원본 응답:", text);
    }

    return null;
  } catch (error) {
    console.error("Gemini 피드백 생성 오류:", error);
    return null;
  }
}
