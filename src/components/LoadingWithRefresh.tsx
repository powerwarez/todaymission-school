import React, { useState, useEffect } from "react";
import { LuLoader, LuRefreshCw } from "react-icons/lu";

interface LoadingWithRefreshProps {
  message?: string;
  onRefresh?: () => void;
  className?: string;
}

const LoadingWithRefresh: React.FC<
  LoadingWithRefreshProps
> = ({
  message = "데이터를 불러오는 중...",
  onRefresh,
  className = "",
}) => {
  const [showRefreshButton, setShowRefreshButton] =
    useState(false);

  useEffect(() => {
    // 3초 후에 새로고침 버튼 표시
    const timer = setTimeout(() => {
      setShowRefreshButton(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (onRefresh) {
      onRefresh();
    } else {
      // 기본 동작: 강제 페이지 새로고침 (캐시 무시)
      try {
        window.location.reload();
      } catch (error) {
        // fallback: replace를 사용한 새로고침
        window.location.replace(window.location.href);
      }
    }
  };

  return (
    <div
      className={`flex flex-col items-center justify-center py-8 ${className}`}>
      <div className="text-center">
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto"
          style={{
            borderColor: "var(--color-primary-medium)",
          }}>
          <LuLoader className="h-12 w-12 text-transparent" />
        </div>
        <p className="mt-4 text-gray-600">{message}</p>

        {showRefreshButton && (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-gray-500">
              로딩이 오래 걸리고 있습니다.
            </p>
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer relative z-10"
              style={{ zIndex: 9999 }}>
              <LuRefreshCw className="mr-2 h-4 w-4" />
              새로고침
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingWithRefresh;
