import React, { useEffect, useRef, useState } from "react";
import {
  Html5QrcodeScanner,
  Html5QrcodeScanType,
} from "html5-qrcode";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Camera, X } from "lucide-react";

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({
  onScanSuccess,
  onClose,
}) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(
    null
  );
  const [isInitialized, setIsInitialized] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    console.log("QRScanner mounted");
    // 컴포넌트가 마운트될 때 실행 플래그 설정
    isMountedRef.current = true;

    // 이미 초기화되었으면 재초기화하지 않음
    if (isInitialized || !isMountedRef.current) return;

    // DOM이 완전히 준비될 때까지 기다림
    const timeoutId = setTimeout(() => {
      if (!isMountedRef.current) return;

      console.log("Initializing QR Scanner");
      // 이전 스캐너가 있으면 정리
      const qrReaderElement =
        document.getElementById("qr-reader");
      if (qrReaderElement) {
        qrReaderElement.innerHTML = "";
      }

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
        supportedScanTypes: [
          Html5QrcodeScanType.SCAN_TYPE_CAMERA,
        ],
      };

      try {
        const scanner = new Html5QrcodeScanner(
          "qr-reader",
          config,
          false
        );

        scanner.render(
          (decodedText) => {
            console.log("QR decoded:", decodedText);
            if (isMountedRef.current) {
              scanner.clear();
              onScanSuccess(decodedText);
            }
          },
          () => {
            // 에러는 무시 (너무 많이 발생함)
          }
        );

        scannerRef.current = scanner;
        setIsInitialized(true);
        console.log("QR Scanner initialized");
      } catch (error) {
        console.error(
          "QR Scanner initialization error:",
          error
        );
      }
    }, 100);

    return () => {
      console.log("QRScanner unmounting");
      isMountedRef.current = false;
      clearTimeout(timeoutId);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, []); // 의존성 배열을 비워서 한 번만 실행되도록 함

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
    }
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    // 카드 외부 영역 클릭 시에만 닫기
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // 카드 내부 클릭 시 이벤트 버블링 방지
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center p-4 z-50"
      onClick={handleOverlayClick}>
      <Card
        className="w-full max-w-md shadow-2xl"
        onClick={handleCardClick}>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Camera className="mr-2 h-5 w-5" />
              QR 코드 스캔
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="rounded-full">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 text-center mb-4">
              선생님이 나눠준 QR 코드를 카메라에 보여주세요
            </p>

            <div id="qr-reader" className="mx-auto"></div>
          </div>

          <div className="mt-6 text-center">
            <Button
              variant="outline"
              onClick={handleClose}
              className="w-full">
              취소
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QRScanner;
