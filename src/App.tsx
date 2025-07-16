import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import {
  AuthProvider,
  useAuth,
} from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { useNotificationState } from "./hooks/useNotificationState";
import { useTheme } from "./hooks/useTheme";
import MainLayout from "./layouts/MainLayout";
import TeacherLoginPage from "./pages/TeacherLoginPage";
import StudentLoginPage from "./pages/StudentLoginPage";
import TodayMissionPage from "./pages/TodayMissionPage";
import HallOfFamePage from "./pages/HallOfFamePage";
import MissionSettingsPage from "./pages/MissionSettingsPage";
import BadgeSettingsPage from "./pages/BadgeSettingsPage";
import TeacherStudentsPage from "./pages/TeacherStudentsPage";
import TeacherStatisticsPage from "./pages/TeacherStatisticsPage";
import TeacherOnboardingPage from "./pages/TeacherOnboardingPage";
import BadgeNotificationModal from "./components/BadgeNotificationModal";
import { BadgeSelectionModal } from "./components/BadgeSelectionModal";
import { Toaster } from "react-hot-toast";
import { Toaster as Sonner } from "./components/ui/sonner";

// PrivateRoute 컴포넌트: 역할별 접근 제어
interface PrivateRouteProps {
  children: React.ReactElement;
  requiredRole?: "teacher" | "student";
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { session, userProfile, loading } = useAuth();

  // 로딩 중일 때
  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-black">
            로딩 중...
          </h1>
          <p className="mt-2 text-gray-600">
            잠시만 기다려주세요.
          </p>
        </div>
      </div>
    );
  }

  // 인증되지 않은 경우
  if (!session && !userProfile) {
    return <Navigate to="/" replace />;
  }

  // 교사로 로그인했지만 아직 학교가 설정되지 않은 경우에만 온보딩으로
  if (
    requiredRole === "teacher" &&
    session &&
    window.location.pathname !== "/teacher/onboarding"
  ) {
    // userProfile이 로드되었는데 school_id가 없는 경우에만 온보딩으로
    if (
      userProfile &&
      userProfile.role === "teacher" &&
      !userProfile.school_id
    ) {
      return <Navigate to="/teacher/onboarding" replace />;
    }
    // userProfile이 아직 로드되지 않았고 세션만 있는 경우 (새 교사일 가능성)
    // 이 경우는 잠시 기다려봐야 함
    if (!userProfile && session) {
      // AuthContext에서 fetchUserProfile이 실행될 때까지 기다림
      return (
        <div className="w-full h-screen flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h1 className="text-2xl font-bold text-black">
              프로필 확인 중...
            </h1>
            <p className="mt-2 text-gray-600">
              잠시만 기다려주세요.
            </p>
          </div>
        </div>
      );
    }
  }

  // 역할 확인
  if (requiredRole && userProfile?.role !== requiredRole) {
    // 잘못된 역할로 접근한 경우 적절한 대시보드로 리다이렉트
    if (userProfile?.role === "teacher") {
      return <Navigate to="/teacher/dashboard" replace />;
    } else if (userProfile?.role === "student") {
      return <Navigate to="/student/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

// PublicRoute 컴포넌트: 인증되지 않은 사용자만 접근 가능
const PublicRoute: React.FC<{
  children: React.ReactElement;
}> = ({ children }) => {
  const { session, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-black">
            로딩 중...
          </h1>
          <p className="mt-2 text-gray-600">
            잠시만 기다려주세요.
          </p>
        </div>
      </div>
    );
  }

  // 이미 로그인한 경우 적절한 대시보드로 리다이렉트
  if (session || userProfile) {
    if (userProfile?.role === "teacher") {
      return <Navigate to="/teacher/dashboard" replace />;
    } else if (userProfile?.role === "student") {
      return <Navigate to="/student/dashboard" replace />;
    }
  }

  return children;
};

// OnboardingRoute 컴포넌트 추가 (PrivateRoute 아래에)
const OnboardingRoute: React.FC<{
  children: React.ReactElement;
}> = ({ children }) => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-black">
            로딩 중...
          </h1>
          <p className="mt-2 text-gray-600">
            잠시만 기다려주세요.
          </p>
        </div>
      </div>
    );
  }

  // 세션이 없으면 로그인 페이지로
  if (!session) {
    return <Navigate to="/teacher/login" replace />;
  }

  return children;
};

// 실제 App 컨텐츠 컴포넌트
const AppContent: React.FC = () => {
  return (
    <Routes>
      {/* 루트 페이지 - 선택 화면 */}
      <Route
        path="/"
        element={
          <PublicRoute>
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
              <div className="bg-white p-12 rounded-3xl shadow-2xl max-w-md w-full">
                <h1 className="text-4xl font-bold text-center mb-2">
                  오늘의 미션
                </h1>
                <p className="text-gray-600 text-center mb-8">
                  환영합니다!
                </p>
                <div className="space-y-4">
                  <a
                    href="/teacher/login"
                    className="block w-full bg-blue-600 text-white text-center py-4 px-6 rounded-xl hover:bg-blue-700 transition-colors font-medium">
                    교사로 시작하기
                  </a>
                  <a
                    href="/student/login"
                    className="block w-full bg-green-600 text-white text-center py-4 px-6 rounded-xl hover:bg-green-700 transition-colors font-medium">
                    학생으로 시작하기
                  </a>
                </div>
              </div>
            </div>
          </PublicRoute>
        }
      />

      {/* 교사 라우트 */}
      <Route
        path="/teacher/login"
        element={
          <PublicRoute>
            <TeacherLoginPage />
          </PublicRoute>
        }
      />

      <Route
        path="/teacher/onboarding"
        element={
          <OnboardingRoute>
            <TeacherOnboardingPage />
          </OnboardingRoute>
        }
      />

      <Route
        path="/teacher/*"
        element={
          <PrivateRoute requiredRole="teacher">
            <MainLayout />
          </PrivateRoute>
        }>
        <Route
          path="dashboard"
          element={<TeacherStatisticsPage />}
        />
        <Route
          path="hall-of-fame"
          element={<HallOfFamePage />}
        />
        <Route
          path="mission-settings"
          element={<MissionSettingsPage />}
        />
        <Route
          path="badge-settings"
          element={<BadgeSettingsPage />}
        />
        <Route
          path="students"
          element={<TeacherStudentsPage />}
        />
        <Route
          path="statistics"
          element={<TeacherStatisticsPage />}
        />
      </Route>

      {/* 학생 라우트 */}
      <Route
        path="/student/login"
        element={
          <PublicRoute>
            <StudentLoginPage />
          </PublicRoute>
        }
      />

      <Route
        path="/student/*"
        element={
          <PrivateRoute requiredRole="student">
            <MainLayout />
          </PrivateRoute>
        }>
        <Route
          path="dashboard"
          element={<TodayMissionPage />}
        />
        <Route
          path="hall-of-fame"
          element={<HallOfFamePage />}
        />
      </Route>

      {/* 기존 로그인 페이지는 교사 로그인으로 리다이렉트 */}
      <Route
        path="/login"
        element={<Navigate to="/teacher/login" replace />}
      />

      {/* 정의되지 않은 모든 경로는 루트로 리다이렉트 */}
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
};

// 테마 초기화 컴포넌트
const ThemeInitializer: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { isInitialized } = useTheme();

  if (!isInitialized) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-black">
            테마 로딩 중...
          </h1>
          <p className="mt-2 text-gray-600">
            잠시만 기다려주세요.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// 최상위 App 컴포넌트
const App: React.FC = () => {
  const {
    displayedBadges,
    handleCloseNotification,
    showBadgeNotification,
    isLoadingBadge,
    notificationQueue,
    showBadgeSelectionModal,
    handleCloseBadgeSelectionModal,
    handleBadgeSelect,
    weeklyStreakAchieved,
    weeklyRewardGoal,
  } = useNotificationState();

  return (
    <AuthProvider>
      <NotificationProvider
        value={{ showBadgeNotification }}>
        <ThemeInitializer>
          <AppContent />
        </ThemeInitializer>

        {/* Toasters */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 2000,
            style: {
              background: "#fff",
              color: "#333",
            },
          }}
        />
        <Sonner />

        {/* Badge Notifications */}
        {displayedBadges.map((badge, index) => (
          <BadgeNotificationModal
            key={badge.id}
            badge={badge}
            onClose={() =>
              handleCloseNotification(badge.id)
            }
            style={{
              transform: `translateY(-${index * 110}%)`,
              zIndex: 9999 - index,
            }}
          />
        ))}

        {/* Loading Indicator */}
        {isLoadingBadge && notificationQueue.length > 0 && (
          <div className="fixed bottom-5 right-5 z-[9998] p-2 bg-gray-700 text-white text-xs rounded shadow-lg">
            새로운 배지 로딩 중...
          </div>
        )}

        {/* Badge Selection Modal */}
        {showBadgeSelectionModal &&
          weeklyStreakAchieved && (
            <BadgeSelectionModal
              showModal={showBadgeSelectionModal}
              onClose={handleCloseBadgeSelectionModal}
              onBadgeSelect={handleBadgeSelect}
              weeklyRewardGoal={weeklyRewardGoal}
            />
          )}
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
