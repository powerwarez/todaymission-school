import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import AppNav from "../components/navigation/AppNav";
import { useAuth } from "../contexts/AuthContext";
import { useLayout } from "../contexts/LayoutContext";
import { layoutUsesTopNav } from "../theme/layouts";

const MainLayout: React.FC = () => {
  const { isTeacher, isStudent } = useAuth();
  const { layout } = useLayout();
  const topNav = layoutUsesTopNav(layout);
  const mainOffset = topNav
    ? "ml-0"
    : layout === "rail"
      ? "ml-20"
      : layout === "split"
        ? "ml-56"
        : "ml-64";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg-main)" }}>
      {topNav ? <AppNav /> : <Sidebar />}
      <main className={`min-h-screen p-6 transition-all duration-300 ease-in-out ${mainOffset}`}>
        <div className="max-w-7xl mx-auto">
          {/* Role-based header */}
          <div className="mb-6">
            {isTeacher && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-lg inline-block">
                교사 모드
              </div>
            )}
            {isStudent && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg inline-block">
                학생 모드
              </div>
            )}
          </div>
          <Outlet /> {/* Child routes will render here */}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
