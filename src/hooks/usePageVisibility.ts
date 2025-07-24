import { useEffect, useState } from "react";

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

// 페이지가 다시 보일 때 콜백을 실행하는 훅
export const useOnPageVisible = (
  callback: () => void,
  deps: React.DependencyList = []
) => {
  const isVisible = usePageVisibility();

  useEffect(() => {
    if (isVisible) {
      callback();
    }
  }, [isVisible, ...deps]);
};
