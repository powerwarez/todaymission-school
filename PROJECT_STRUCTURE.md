# 오늘의 미션 - 프로젝트 구조

## 🏗️ 전체 아키텍처

### 기술 스택

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS + CSS Variables
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Build Tool**: Vite
- **Date/Time**: Luxon
- **Icons**: Lucide React (react-icons/lu)
- **Notifications**: Sonner
- **AI Integration**: Google Gemini API

---

## 📂 프로젝트 구조

```
todaymission-school/
├── src/
│   ├── components/           # 재사용 가능한 컴포넌트
│   │   ├── badges/          # 배지 시스템 컴포넌트
│   │   ├── magicui/         # UI 효과 컴포넌트
│   │   ├── ui/              # 기본 UI 컴포넌트
│   │   └── *.tsx            # 기타 컴포넌트
│   ├── contexts/            # React Context
│   │   ├── AuthContext.tsx
│   │   └── NotificationContext.tsx
│   ├── hooks/               # 커스텀 훅
│   ├── layouts/             # 레이아웃 컴포넌트
│   ├── lib/                 # 라이브러리 설정
│   ├── pages/               # 페이지 컴포넌트
│   ├── styles/              # 스타일 파일
│   ├── theme/               # 테마 설정
│   ├── types/               # 타입 정의
│   ├── utils/               # 유틸리티 함수
│   ├── App.tsx              # 메인 앱 컴포넌트
│   ├── main.tsx             # 엔트리 포인트
│   └── index.css            # 글로벌 스타일
├── sql/                     # 데이터베이스 스키마
├── supabase/               # Supabase 설정
├── public/                 # 정적 파일
└── dist/                   # 빌드 결과물
```

---

## 🎯 주요 기능별 구조

### 1. 인증 시스템

```
- contexts/AuthContext.tsx      # 인증 상태 관리
- pages/TeacherLoginPage.tsx    # 교사 로그인
- pages/LoginPage.tsx            # 학생 로그인
- lib/supabaseClient.ts          # Supabase 클라이언트
```

### 2. 교사 기능

```
pages/
├── TeacherStudentsPage.tsx     # 학생 관리
├── TeacherStatisticsPage.tsx   # 통계
├── TeacherOnboardingPage.tsx   # 온보딩
├── TeacherGuidePage.tsx         # 사용 안내
├── MissionSettingsPage.tsx     # 미션 설정
└── BadgeSettingsPage.tsx       # 배지 설정
```

### 3. 학생 기능

```
pages/
├── TodayMissionPage.tsx        # 오늘의 미션
└── HallOfFamePage.tsx          # 명예의 전당
```

### 4. 배지 시스템

```
components/badges/
├── types.ts                    # 타입 정의
├── BadgeCard.tsx               # 배지 카드
├── CreateBadgeModal.tsx        # 배지 생성
├── DeleteBadgeModal.tsx        # 배지 삭제
├── StudentListModal.tsx        # 학생 목록
└── AIImageGenerationModal.tsx  # AI 이미지 생성
```

### 5. UI 컴포넌트

```
components/ui/
├── button.tsx                  # 버튼
├── card.tsx                    # 카드
├── dialog.tsx                  # 다이얼로그
├── input.tsx                   # 입력 필드
├── select.tsx                  # 선택 박스
├── textarea.tsx                # 텍스트 영역
├── badge.tsx                   # 배지 UI
├── alert.tsx                   # 알림
├── form.tsx                    # 폼
└── sonner.tsx                  # 토스트 알림
```

---

## 🔄 데이터 흐름

### 인증 플로우

```
1. 로그인 페이지 → Supabase Auth → AuthContext 업데이트
2. AuthContext → Protected Routes → 권한별 페이지 접근
3. 로그아웃 → Supabase Sign Out → 로그인 페이지 리다이렉트
```

### 데이터 관리

```
1. 페이지 컴포넌트 → Custom Hooks → Supabase 쿼리
2. Supabase Response → 상태 업데이트 → UI 렌더링
3. 사용자 액션 → API 호출 → 데이터베이스 업데이트 → UI 갱신
```

---

## 🎨 스타일링 시스템

### CSS 변수 기반 테마

```css
:root {
  --color-primary: ...
  --color-secondary: ...
  --color-bg-primary: ...
  --color-text-primary: ...
}
```

### Tailwind CSS 활용

- 유틸리티 클래스 기반 스타일링
- 반응형 디자인
- 커스텀 컴포넌트 클래스

---

## 📦 주요 커스텀 훅

### 데이터 관련

- `useMissions()` - 미션 데이터 관리
- `useMissionLogs()` - 미션 로그 조회
- `useFeedback()` - 피드백 관리
- `useEarnedBadges()` - 획득 배지 관리
- `useWeeklyCompletionStatus()` - 주간 완료 상태

### UI 관련

- `useTheme()` - 테마 관리
- `usePageVisibility()` - 페이지 가시성
- `useNotificationState()` - 알림 상태

---

## 🗄️ 데이터베이스 스키마

### 주요 테이블

- `users` - 사용자 정보
- `schools` - 학교 정보
- `missions` - 미션 정보
- `mission_logs` - 미션 완료 기록
- `badges` - 배지 정보
- `student_custom_badges` - 학생 배지 획득
- `feedback` - 피드백
- `weekly_badge_settings` - 주간 배지 설정

---

## 🚀 빌드 & 배포

### 개발 환경

```bash
npm run dev              # 개발 서버 실행
```

### 프로덕션 빌드

```bash
npm run build           # 프로덕션 빌드
npm run preview         # 빌드 결과 미리보기
```

### 배포

- Vercel 자동 배포 설정
- 환경변수 관리 (.env)

---

## 📝 환경변수

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GEMINI_API_KEY=
```

---

## 🔒 보안 고려사항

1. **Row Level Security (RLS)**

   - 모든 테이블에 RLS 정책 적용
   - 사용자별 데이터 접근 제한

2. **인증 & 인가**

   - Supabase Auth 사용
   - 역할 기반 접근 제어 (교사/학생)

3. **API 키 관리**
   - 환경변수로 관리
   - 클라이언트 측 노출 최소화

---

## 📚 참고 문서

- [React 공식 문서](https://react.dev/)
- [Supabase 문서](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Luxon 문서](https://moment.github.io/luxon/)

---

## 👥 기여 가이드

1. 컴포넌트는 기능별로 분리
2. 타입 정의 필수
3. 커스텀 훅으로 로직 분리
4. CSS 변수 활용한 테마 일관성
5. 에러 처리 및 로딩 상태 구현
