import React, { useEffect, useState } from "react";
import QRScanner from "./QRScanner";

interface QRScannerWrapperProps {
  isOpen: boolean;
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

const QRScannerWrapper: React.FC<QRScannerWrapperProps> = ({
  isOpen,
  onScanSuccess,
  onClose,
}) => {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // 상태 변경을 지연시켜 React 렌더링 사이클 문제 방지
    if (isOpen) {
      const timer = setTimeout(() => {
        setShouldRender(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setShouldRender(false);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <QRScanner
      onScanSuccess={onScanSuccess}
      onClose={onClose}
    />
  );
};

export default QRScannerWrapper;
