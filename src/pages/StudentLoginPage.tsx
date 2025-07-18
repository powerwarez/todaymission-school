import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { QrCode, Camera } from "lucide-react";
import QRScannerWrapper from "../components/QRScannerWrapper";

const StudentLoginPage: React.FC = () => {
  const [qrToken, setQrToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState(false);
  const { loginWithQR } = useAuth();

  // 디버깅용 로그
  useEffect(() => {
    console.log("scanMode changed:", scanMode);
  }, [scanMode]);

  const handleQRLogin = async () => {
    if (!qrToken.trim()) {
      setError("QR 코드를 입력해주세요.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await loginWithQR(qrToken);

      if (result.success) {
        // Redirect to student dashboard
        window.location.href = "/student/dashboard";
      } else {
        setError(result.error || "로그인에 실패했습니다.");
      }
    } catch (err) {
      console.error("QR Login error:", err);
      setError("로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleScanSuccess = useCallback(
    async (decodedText: string) => {
      console.log("QR Scan Success:", decodedText);
      // 즉시 스캔 모드 종료하여 중복 방지
      setScanMode(false);

      try {
        const qrData = JSON.parse(decodedText);
        if (qrData.token) {
          setQrToken(qrData.token);

          // Auto-login after successful scan
          setLoading(true);
          const result = await loginWithQR(qrData.token);
          if (result.success) {
            window.location.href = "/student/dashboard";
          } else {
            setError(result.error || "로그인에 실패했습니다.");
            setLoading(false);
          }
        }
      } catch {
        setError("올바른 QR 코드가 아닙니다.");
      }
    },
    [loginWithQR]
  );

  const handleCloseScanner = useCallback(() => {
    console.log("Closing scanner");
    setScanMode(false);
  }, []);

  const handleOpenScanner = () => {
    console.log("Opening scanner");
    if (!scanMode) {
      setScanMode(true);
    }
  };

  useEffect(() => {
    // Check if already logged in
    const checkAuth = () => {
      const cookies = document.cookie.split(";");
      const qrTokenCookie = cookies.find((cookie) =>
        cookie.trim().startsWith("student_qr_token=")
      );

      if (qrTokenCookie) {
        window.location.href = "/student/dashboard";
      }
    };

    checkAuth();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">오늘의 미션</h1>
          <p className="text-lg text-gray-600">학생 로그인</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <Label
              htmlFor="qrToken"
              className={`transition-colors duration-300 ${
                qrToken.trim()
                  ? "text-green-600 font-semibold"
                  : "text-gray-700"
              }`}
            >
              QR 코드 입력
            </Label>
            <div className="mt-2 flex space-x-2">
              <Input
                id="qrToken"
                type="text"
                value={qrToken}
                onChange={(e) => setQrToken(e.target.value)}
                placeholder="QR 코드를 입력하세요"
                className={`flex-1 transition-all duration-300 ${
                  qrToken.trim()
                    ? "border-green-500 focus:border-green-600 focus:ring-2 focus:ring-green-500/20"
                    : "border-gray-300"
                }`}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && qrToken.trim()) {
                    handleQRLogin();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleOpenScanner}
                disabled={scanMode}
                className={`transition-all duration-300 ${
                  scanMode
                    ? "opacity-50"
                    : "hover:bg-green-50 hover:border-green-500 hover:text-green-600"
                }`}
                title="QR 코드 스캔"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            {qrToken.trim() && (
              <p className="mt-2 text-sm text-green-600 animate-fade-in">
                ✓ QR 코드가 입력되었습니다. 로그인 버튼을 눌러주세요!
              </p>
            )}
          </div>

          <Button
            onClick={handleQRLogin}
            disabled={loading || !qrToken.trim()}
            className={`w-full transition-all duration-300 transform ${
              qrToken.trim() && !loading
                ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl hover:scale-105 font-bold text-lg"
                : "bg-gray-200 text-gray-400 cursor-not-allowed opacity-50"
            }`}
            size="lg"
          >
            <QrCode
              className={`mr-2 h-5 w-5 ${
                qrToken.trim() && !loading ? "animate-bounce" : ""
              }`}
            />
            {loading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                로그인 중...
              </span>
            ) : qrToken.trim() ? (
              <span className="animate-pulse">로그인하기! 🚀</span>
            ) : (
              "QR 코드를 입력하세요"
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">또는</span>
            </div>
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              선생님이 나눠준 QR 코드 종이를 스캔하거나
              <br />
              QR 코드 번호를 직접 입력하세요.
            </p>
          </div>
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QRScannerWrapper
        isOpen={scanMode}
        onScanSuccess={handleScanSuccess}
        onClose={handleCloseScanner}
      />
    </div>
  );
};

export default StudentLoginPage;
