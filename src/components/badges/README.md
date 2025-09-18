# 배지(Badge) 시스템 컴포넌트 구조

## 📁 디렉토리 구조

```
src/
├── components/
│   └── badges/                        # 배지 관련 컴포넌트 모음
│       ├── types.ts                   # 타입 정의
│       ├── BadgeCard.tsx              # 배지 카드 컴포넌트
│       ├── CreateBadgeModal.tsx       # 배지 생성 모달
│       ├── DeleteBadgeModal.tsx       # 배지 삭제 확인 모달
│       ├── StudentListModal.tsx       # 학생 목록 모달
│       └── AIImageGenerationModal.tsx # AI 이미지 생성 모달
└── pages/
    └── BadgeSettingsPage.tsx          # 배지 설정 메인 페이지
```

## 🧩 컴포넌트 상세

### 1. **types.ts**

배지 시스템 전체에서 사용되는 타입 정의

#### 주요 타입:

- `BadgeType`: 기본 배지 정보
- `DisplayBadge`: 화면 표시용 배지 (count 포함)
- `Mission`: 미션 정보
- `StudentBadgeRow`: 학생 배지 획득 데이터
- `StudentListItem`: 학생 목록 아이템

---

### 2. **BadgeCard.tsx**

개별 배지를 표시하는 카드 컴포넌트

#### Props:

```typescript
interface BadgeCardProps {
  badge: DisplayBadge;
  onBadgeClick: (badge: DisplayBadge) => void;
  onDeleteClick: (badge: DisplayBadge) => void;
  isDeletingBadge: boolean;
}
```

#### 기능:

- 배지 아이콘 표시 (이미지/이모지)
- 배지 이름, 설명, 목표 횟수 표시
- 달성 횟수 표시
- 삭제 버튼
- 클릭 시 학생 목록 표시

---

### 3. **CreateBadgeModal.tsx**

새 배지를 생성하는 모달 컴포넌트

#### Props:

```typescript
interface CreateBadgeModalProps {
  isOpen: boolean;
  missions: Mission[];
  creating: boolean;
  onClose: () => void;
  onCreate: (badge: NewBadgeData) => Promise<void>;
}
```

#### 기능:

- 미션 선택
- 배지 이름/설명 입력
- 목표 달성 횟수 설정
- 아이콘 설정 (3가지 방식):
  - 이모지 직접 입력
  - 이미지 파일 업로드
  - AI 이미지 생성
- 유효성 검사
- Supabase Storage 업로드

---

### 4. **DeleteBadgeModal.tsx**

배지 삭제 확인 모달 컴포넌트

#### Props:

```typescript
interface DeleteBadgeModalProps {
  badge: DisplayBadge;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
```

#### 기능:

- 삭제 확인 메시지 표시
- 학생이 획득한 배지인 경우 경고 표시
- 삭제/비활성화 처리 분기

---

### 5. **StudentListModal.tsx**

배지를 획득한 학생 목록 표시 모달

#### Props:

```typescript
interface StudentListModalProps {
  badge: DisplayBadge;
  studentList: StudentListItem[];
  isLoading: boolean;
  onClose: () => void;
}
```

#### 기능:

- 학생 이름과 획득 날짜 테이블 표시
- 총 획득 학생 수 표시
- 로딩 상태 처리
- Luxon을 사용한 날짜 포맷팅

---

### 6. **AIImageGenerationModal.tsx**

AI를 통한 배지 이미지 생성 모달

#### Props:

```typescript
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
```

#### 기능:

- AI 프롬프트 편집
- 프롬프트 재생성
- 이미지 생성 요청
- 생성된 이미지 미리보기
- 에러 처리
- Blob URL 정리

---

### 7. **BadgeSettingsPage.tsx**

배지 시스템의 메인 페이지 컴포넌트

#### 주요 기능:

- 모든 배지 컴포넌트 통합 관리
- Supabase 연동 (CRUD 작업)
- 상태 관리
- 에러 처리
- 로딩 상태 관리

#### 주요 상태:

```typescript
- badges: DisplayBadge[]              // 배지 목록
- missions: Mission[]                 // 미션 목록
- showCreateModal: boolean            // 생성 모달 표시
- showDeleteConfirm: boolean          // 삭제 확인 모달
- showStudentList: boolean            // 학생 목록 모달
- selectedBadgeForList: DisplayBadge  // 선택된 배지
- studentList: StudentListItem[]      // 학생 목록
```

---

## 🔄 데이터 흐름

### 1. 배지 생성 흐름

```
사용자 입력 → CreateBadgeModal → 이미지 처리 →
Supabase Storage 업로드 → badges 테이블 저장 →
목록 업데이트 → 모달 닫기
```

### 2. 배지 삭제 흐름

```
삭제 버튼 클릭 → DeleteBadgeModal 표시 →
학생 획득 여부 확인 →
  - 획득한 학생 있음: is_active = false
  - 획득한 학생 없음: 완전 삭제
→ 목록 업데이트
```

### 3. AI 이미지 생성 흐름

```
AI 버튼 클릭 → 프롬프트 생성 (Gemini) →
AIImageGenerationModal 표시 → 프롬프트 편집 →
이미지 생성 요청 → Blob URL 생성 →
사용하기 클릭 → CreateBadgeModal로 전달
```

---

## 🗄️ 데이터베이스 구조

### badges 테이블

```sql
- id: string (UUID)
- name: string
- description: string
- icon: string (URL or emoji)
- teacher_id: string (FK)
- school_id: string (FK)
- mission_id: string (FK, nullable)
- target_count: number
- is_active: boolean
- created_at: timestamp
```

### student_custom_badges 테이블

```sql
- id: string (UUID)
- student_id: string (FK)
- badge_id: string (FK)
- earned_date: timestamp
```

---

## 🎨 스타일링 특징

- CSS 변수를 활용한 테마 시스템
- Tailwind CSS 유틸리티 클래스
- 반응형 디자인
- 호버 효과 및 트랜지션
- 로딩 상태 애니메이션

---

## 🔌 외부 의존성

- **Supabase**: 데이터베이스 및 스토리지
- **React Icons (lucide)**: 아이콘
- **Sonner**: 토스트 알림
- **Luxon**: 날짜 처리
- **Gemini API**: AI 이미지 생성

---

## 📝 사용 예시

```typescript
// 페이지에서 배지 시스템 사용
import BadgeSettingsPage from "./pages/BadgeSettingsPage";

// 라우팅 설정
<Route
  path="/teacher/badges"
  element={<BadgeSettingsPage />}
/>;
```

---

## 🚀 향후 개선 사항

1. **성능 최적화**

   - 이미지 lazy loading
   - 무한 스크롤 구현 (많은 배지 목록)
   - 메모이제이션 적용

2. **기능 추가**

   - 배지 카테고리 분류
   - 배지 검색 기능
   - 배지 통계 대시보드
   - 배지 획득 알림

3. **UX 개선**

   - 드래그 앤 드롭으로 배지 순서 변경
   - 배지 미리보기 기능
   - 일괄 삭제 기능

4. **코드 품질**
   - 단위 테스트 추가
   - Storybook 컴포넌트 문서화
   - 에러 바운더리 구현
