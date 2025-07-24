import { useEffect, useState, useRef } from "react";

export const usePageVisibility = () => {
  const [isVisible, setIsVisible] = useState(!document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return isVisible;
};

// 페이지가 다시 보일 때 콜백을 실행하는 훅 (디바운싱 포함)
export const useOnPageVisible = (
  callback: () => void,
  deps: React.DependencyList = []
) => {
  const isVisible = usePageVisibility();
  const lastVisibleTime = useRef<number>(0);
  const debounceTime = 1000; // 1초 디바운스

  useEffect(() => {
    if (isVisible) {
      const now = Date.now();
      // 마지막 실행으로부터 최소 1초가 지났을 때만 실행
      if (now - lastVisibleTime.current > debounceTime) {
        callback();
        lastVisibleTime.current = now;
      }
    }
  }, [isVisible, ...deps]);
};
