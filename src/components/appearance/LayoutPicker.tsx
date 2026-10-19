import React from "react";
import { useLayout } from "../../contexts/LayoutContext";
import { layoutOptions, APP_LAYOUTS } from "../../theme/layouts";

const LayoutPicker: React.FC = () => {
  const { layout, isSaving, selectLayout } = useLayout();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
        고른 레이아웃은 이 브라우저와 학생 화면에 함께 적용됩니다. 색은 아래 테마
        설정에서 바꿉니다.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {APP_LAYOUTS.map((key) => {
          const option = layoutOptions[key];
          const selected = layout === key;
          return (
            <button
              key={key}
              type="button"
              disabled={isSaving}
              onClick={() => selectLayout(key)}
              className="text-left p-4 rounded-lg border-2 disabled:opacity-50"
              style={{
                borderColor: selected
                  ? "var(--color-border-focus)"
                  : "var(--color-border-light)",
                backgroundColor: selected
                  ? "var(--color-bg-hover)"
                  : "var(--color-bg-card)",
              }}
            >
              <span
                className="block font-semibold"
                style={{ color: "var(--color-text-primary)" }}
              >
                {option.displayName}
              </span>
              <span
                className="block text-sm mt-1"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {option.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LayoutPicker;
