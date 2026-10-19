import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useLayout } from "../../contexts/LayoutContext";
import { isMenuActive, studentMenuItems, teacherMenuItems } from "./appMenu";

const AppNav: React.FC = () => {
  const location = useLocation();
  const { isTeacher } = useAuth();
  const { layout } = useLayout();
  const items = isTeacher ? teacherMenuItems : studentMenuItems;

  const barStyle =
    layout === "hero"
      ? {
          backgroundColor: "var(--color-primary-dark)",
          color: "#fff",
        }
      : layout === "poster"
        ? {
            backgroundColor: "var(--color-bg-card)",
            color: "var(--color-text-primary)",
            borderBottom: "4px solid var(--color-text-primary)",
          }
        : {
            backgroundColor: "var(--color-bg-card)",
            color: "var(--color-text-primary)",
            borderBottom: "1px solid var(--color-border-light)",
          };

  return (
    <header
      className="flex items-center justify-between gap-4 px-6 py-3"
      style={barStyle}
    >
      <strong className="text-lg tracking-tight">오늘의 미션</strong>
      <nav className="flex flex-wrap gap-2">
        {items.map((item) => {
          const active = isMenuActive(location.pathname, item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className="rounded-full px-3 py-1.5 text-sm font-semibold"
              style={{
                backgroundColor: active ? "var(--color-primary-medium)" : "transparent",
                color: active ? "#fff" : "inherit",
              }}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>
    </header>
  );
};

export default AppNav;
