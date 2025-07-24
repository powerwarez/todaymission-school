import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { LuX, LuKey, LuTriangle } from "react-icons/lu";

interface PinAuthModalProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const PinAuthModal: React.FC<PinAuthModalProps> = ({ onSuccess, onCancel }) => {
  const { userProfile } = useAuth();
  const [pin, setPin] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDefaultPin, setIsDefaultPin] = useState<boolean>(false);

  useEffect(() => {
    if (userProfile) {
      // PIN이 "0000"인지 확인
      setIsDefaultPin(!userProfile.pin_code || userProfile.pin_code === "0000");
      setLoading(false);
    }
  }, [userProfile]);

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 숫자만 입력 가능하도록 제한
    if (/^\d*$/.test(value) && value.length <= 4) {
      setPin(value);
      setError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (pin.length !== 4) {
      setError("PIN은 4자리 숫자여야 합니다.");
      return;
    }

    // 데이터베이스의 PIN과 비교 (text 타입이므로 직접 비교)
    const dbPin = userProfile?.pin_code || "0000";

    if (pin === dbPin) {
      onSuccess();
    } else {
      setError("올바르지 않은 PIN입니다.");
      setPin("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            PIN 확인
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <LuX size={20} />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-4">
              <div
                className="animate-spin rounded-full h-8 w-8 border-b-2"
                style={{
                  borderColor: "var(--color-primary-medium)",
                }}
              ></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {isDefaultPin && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg flex items-start">
                  <LuTriangle
                    className="text-yellow-600 mr-2 mt-0.5 flex-shrink-0"
                    size={20}
                  />
                  <div className="text-sm">
                    <p className="font-semibold text-yellow-800 mb-1">
                      기본 PIN 코드 사용 중
                    </p>
                    <p className="text-yellow-700">
                      현재 기본 PIN 코드(0000)를 사용하고 있습니다. 보안을 위해
                      계정 설정에서 PIN을 변경하시기 바랍니다.
                    </p>
                  </div>
                </div>
              )}

              <p className="text-gray-600 mb-4">
                {userProfile?.name || "아이"} 설정 페이지에 접근하기 위해 PIN을
                입력해주세요.
              </p>

              <div className="mb-4">
                <label
                  htmlFor="pin"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  PIN 코드 (4자리)
                </label>
                <input
                  type="password"
                  id="pin"
                  value={pin}
                  onChange={handlePinChange}
                  className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 rounded-md focus:outline-none"
                  style={{
                    borderColor: "var(--color-border-default)",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--color-border-focus)";
                    e.target.style.boxShadow = `0 0 0 2px var(--color-border-focus)`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--color-border-default)";
                    e.target.style.boxShadow = "none";
                  }}
                  placeholder="****"
                  maxLength={4}
                  autoFocus
                />
              </div>

              {error && (
                <div
                  className="mb-4 p-2 rounded"
                  style={{
                    backgroundColor: "var(--color-bg-error)",
                    color: "var(--color-text-error)",
                  }}
                >
                  {error}
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white rounded flex items-center"
                  style={{
                    backgroundColor: "var(--color-primary-medium)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--color-primary-dark)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--color-primary-medium)";
                  }}
                >
                  <LuKey className="mr-2" />
                  확인
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PinAuthModal;
