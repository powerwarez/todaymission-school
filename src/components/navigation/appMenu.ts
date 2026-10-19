import type { ComponentType } from "react";
import { LuLayoutDashboard, LuAward, LuSettings, LuBadge, LuUsers, LuTrendingUp, LuBookOpen } from "react-icons/lu";

export interface AppMenuItem {
  path: string;
  name: string;
  short: string;
  icon: ComponentType<{ className?: string }>;
}

export const teacherMenuItems: AppMenuItem[] = [
  { path: "/teacher/dashboard", name: "통계", short: "통", icon: LuTrendingUp },
  { path: "/teacher/mission-settings", name: "오늘의 미션 설정", short: "미", icon: LuSettings },
  { path: "/teacher/badge-settings", name: "도전과제 설정", short: "도", icon: LuBadge },
  { path: "/teacher/students", name: "학생 관리", short: "학", icon: LuUsers },
  { path: "/teacher/guide", name: "사용 안내", short: "안", icon: LuBookOpen },
];

export const studentMenuItems: AppMenuItem[] = [
  { path: "/student/dashboard", name: "오늘의 미션", short: "미", icon: LuLayoutDashboard },
  { path: "/student/hall-of-fame", name: "명예의 전당", short: "명", icon: LuAward },
];

export function isMenuActive(pathname: string, path: string): boolean {
  return (
    pathname === path ||
    (path === "/mission-settings" && pathname === "/settings")
  );
}
