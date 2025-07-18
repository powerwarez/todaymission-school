# OpenAI 이미지 생성 API 사용 가이드

## 설정 방법

### 1. 환경 변수 설정

`.env` 파일에 OpenAI API 키를 추가하세요:

```env
VITE_OPENAI_API_KEY=your-openai-api-key-here
```

### 2. API 키 발급 방법

1. [OpenAI 플랫폼](https://platform.openai.com/)에 접속
2. 계정 생성 또는 로그인
3. API Keys 섹션에서 새 API 키 생성
4. 생성된 키를 `.env` 파일에 추가

## 사용 방법

### 기본 사용법 (훅 사용)

```typescript
import { useImageGeneration } from "../hooks/useImageGeneration";

function MyComponent() {
  const {
    generateImageFromPrompt,
    isGenerating,
    imageUrl,
    error,
    clearImage,
  } = useImageGeneration();

  const handleGenerate = async () => {
    await generateImageFromPrompt(
      "beautiful sunset over mountains"
    );
  };

  return (
    <div>
      <button
        onClick={handleGenerate}
        disabled={isGenerating}>
        이미지 생성
      </button>
      {imageUrl && <img src={imageUrl} alt="Generated" />}
    </div>
  );
}
```

### 직접 함수 호출

```typescript
import { generateImage } from "../utils/openaiImageGenerator";

async function createImage() {
  try {
    const result = await generateImage(
      "cute cat wearing a hat",
      {
        model: "dall-e-3",
        quality: "hd",
        size: "1024x1024",
        style: "vivid",
      }
    );

    console.log("생성된 이미지 URL:", result.url);
    console.log("수정된 프롬프트:", result.revised_prompt);
  } catch (error) {
    console.error("이미지 생성 실패:", error);
  }
}
```

## 옵션 설명

### 모델 (model)

- `dall-e-2`: 이전 버전, 더 빠르고 저렴
- `dall-e-3`: 최신 버전, 더 높은 품질 (기본값)

### 크기 (size)

- DALL-E 2: `256x256`, `512x512`, `1024x1024`
- DALL-E 3: `1024x1024`, `1792x1024`, `1024x1792`

### 품질 (quality) - DALL-E 3 전용

- `standard`: 표준 품질 (기본값)
- `hd`: 고품질, 더 세밀한 디테일

### 스타일 (style) - DALL-E 3 전용

- `vivid`: 생생하고 화려한 스타일 (기본값)
- `natural`: 자연스럽고 사실적인 스타일

### 응답 형식 (response_format)

- `url`: 이미지 URL 반환 (기본값)
- `b64_json`: Base64 인코딩된 이미지 데이터 반환

## 프롬프트 작성 팁

1. **구체적으로 작성**: "고양이" 보다는 "파란 눈을 가진 흰색 페르시안 고양이"
2. **스타일 명시**: "포토리얼리스틱", "수채화 스타일", "픽셀 아트" 등
3. **구도 설명**: "클로즈업", "전신 샷", "조감도" 등
4. **조명 조건**: "황금빛 시간", "스튜디오 조명", "네온 조명" 등
5. **분위기**: "평화로운", "드라마틱한", "신비로운" 등

## 주의사항

1. **API 키 보안**: API 키를 절대 공개 저장소에 커밋하지 마세요
2. **사용량 제한**: OpenAI는 분당 요청 수와 일일 사용량에 제한이 있습니다
3. **콘텐츠 정책**: OpenAI의 콘텐츠 정책을 준수해야 합니다
4. **비용**: API 사용은 유료이며, 모델과 옵션에 따라 비용이 다릅니다

## 에러 처리

```typescript
try {
  const result = await generateImage(prompt);
} catch (error) {
  if (error.message.includes("API key")) {
    console.error("API 키가 올바르지 않습니다");
  } else if (error.message.includes("rate limit")) {
    console.error("요청 한도를 초과했습니다");
  } else if (error.message.includes("content policy")) {
    console.error("콘텐츠 정책 위반");
  } else {
    console.error("알 수 없는 오류:", error);
  }
}
```

## 예시 프롬프트

- "A serene Japanese garden with cherry blossoms, koi pond, and traditional wooden bridge, photorealistic style"
- "Cute cartoon robot learning to paint, colorful and whimsical style"
- "Abstract representation of artificial intelligence, neon colors, futuristic design"
- "Cozy coffee shop interior, warm lighting, rustic wooden furniture, watercolor painting style"
