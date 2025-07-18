import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LuLayoutDashboard,
  LuAward,
  LuSettings,
  LuChevronsLeft,
  LuChevronsRight,
  LuLogOut,
  LuBadge,
  LuUsers,
  LuTrendingUp,
} from "react-icons/lu";
import { useAuth } from "../contexts/AuthContext";

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { logout, isTeacher, isStudent, userProfile } =
    useAuth();
  const [isMinimized, setIsMinimized] = useState(false);

  // 디버깅용 로그
  if (isStudent && userProfile) {
    console.log("학생 프로필 전체:", userProfile);
    console.log(
      "teacher 타입:",
      typeof userProfile.teacher
    );
    console.log("teacher 값:", userProfile.teacher);
    if (Array.isArray(userProfile.teacher)) {
      console.log(
        "teacher는 배열입니다. 길이:",
        userProfile.teacher.length
      );
      if (userProfile.teacher.length > 0) {
        console.log(
          "첫 번째 teacher:",
          userProfile.teacher[0]
        );
      }
    }
  }

  // 교사용 메뉴
  const teacherMenuItems = [
    {
      path: "/teacher/dashboard",
      name: "통계",
      icon: LuTrendingUp,
    },
    {
      path: "/teacher/hall-of-fame",
      name: "명예의 전당",
      icon: LuAward,
    },
    {
      path: "/teacher/mission-settings",
      name: "오늘의 미션 설정",
      icon: LuSettings,
    },
    {
      path: "/teacher/badge-settings",
      name: "도전과제 설정",
      icon: LuBadge,
    },
    {
      path: "/teacher/students",
      name: "학생 관리",
      icon: LuUsers,
    },
  ];

  // 학생용 메뉴
  const studentMenuItems = [
    {
      path: "/student/dashboard",
      name: "오늘의 미션",
      icon: LuLayoutDashboard,
    },
    {
      path: "/student/hall-of-fame",
      name: "명예의 전당",
      icon: LuAward,
    },
  ];

  // 현재 사용자 역할에 따른 메뉴 선택
  const menuItems = isTeacher
    ? teacherMenuItems
    : studentMenuItems;

  const handleLogout = async () => {
    try {
      await logout();
      // 로그아웃 후 적절한 페이지로 리다이렉트
      if (isTeacher) {
        window.location.href = "/teacher/login";
      } else if (isStudent) {
        window.location.href = "/student/login";
      } else {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const toggleSidebar = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <aside
      className={`fixed top-0 left-0 h-full p-4 flex flex-col justify-between transition-width duration-300 ease-in-out z-10 ${
        isMinimized ? "w-16" : "w-64"
      }`}
      style={{
        backgroundColor: isTeacher
          ? "var(--color-primary-light)"
          : "var(--color-secondary-light)",
        color: "var(--color-text-primary)",
      }}>
      <div>
        {/* Header with user info */}
        <div className="mb-8">
          {!isMinimized && (
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">
                오늘의 미션
              </h1>
              {userProfile && (
                <div className="text-sm opacity-80">
                  <p>{userProfile.name}</p>
                  {isTeacher && userProfile.school && (
                    <p>{userProfile.school.name}</p>
                  )}
                  {isStudent && (
                    <p
                      className="text-sm font-medium"
                      style={{
                        color:
                          "var(--color-primary-medium)",
                      }}>
                      {(() => {
                        // teacher가 배열인 경우 첫 번째 요소 사용
                        const teacher = Array.isArray(
                          userProfile.teacher
                        )
                          ? userProfile.teacher[0]
                          : userProfile.teacher;

                        if (teacher?.name) {
                          return (
                            <>
                              <span className="font-bold">
                                {teacher.name}
                              </span>{" "}
                              선생님 반
                            </>
                          );
                        } else {
                          return (
                            <span className="text-gray-400">
                              반 정보 없음
                            </span>
                          );
                        }
                      })()}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <nav>
          <ul>
            {menuItems.map((item) => (
              <li key={item.path} className="mb-4">
                <Link
                  to={item.path}
                  className={`flex items-center p-2 rounded-lg transition-colors ${
                    // 현재 경로가 /settings 또는 /mission-settings일 때 활성화 (기존 경로 호환)
                    location.pathname === item.path ||
                    (item.path === "/mission-settings" &&
                      location.pathname === "/settings")
                      ? "text-white"
                      : ""
                  } ${isMinimized ? "justify-center" : ""}`}
                  style={{
                    backgroundColor:
                      location.pathname === item.path ||
                      (item.path === "/mission-settings" &&
                        location.pathname === "/settings")
                        ? "var(--color-primary-medium)"
                        : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (
                      !(
                        location.pathname === item.path ||
                        (item.path ===
                          "/mission-settings" &&
                          location.pathname === "/settings")
                      )
                    ) {
                      e.currentTarget.style.backgroundColor =
                        "var(--color-bg-hover)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (
                      !(
                        location.pathname === item.path ||
                        (item.path ===
                          "/mission-settings" &&
                          location.pathname === "/settings")
                      )
                    ) {
                      e.currentTarget.style.backgroundColor =
                        "transparent";
                    }
                  }}>
                  <item.icon
                    className={`text-xl ${
                      !isMinimized ? "mr-3" : ""
                    }`}
                  />
                  {!isMinimized && <span>{item.name}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="flex flex-col items-center space-y-2">
        <button
          onClick={handleLogout}
          className={`flex items-center w-full p-2 rounded-lg transition-colors ${
            isMinimized ? "justify-center" : ""
          }`}
          style={{ backgroundColor: "transparent" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor =
              "var(--color-bg-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor =
              "transparent";
          }}
          aria-label="Logout">
          <LuLogOut
            className={`text-xl ${
              !isMinimized ? "mr-3" : ""
            }`}
          />
          {!isMinimized && <span>로그아웃</span>}
        </button>
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg self-center transition-colors"
          style={{ backgroundColor: "transparent" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor =
              "var(--color-bg-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor =
              "transparent";
          }}
          aria-label={
            isMinimized
              ? "Expand sidebar"
              : "Collapse sidebar"
          }>
          {isMinimized ? (
            <LuChevronsRight className="text-xl" />
          ) : (
            <LuChevronsLeft className="text-xl" />
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
