import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import {
  LuUser,
  LuKey,
  LuSave,
  LuTriangle,
} from "react-icons/lu";
import { toast } from "react-hot-toast";

const AccountSettings: React.FC = () => {
  const { userProfile } = useAuth();
  const [childName, setChildName] = useState<string>("");
  const [pinCode, setPinCode] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDefaultPin, setIsDefaultPin] =
    useState<boolean>(false);

  useEffect(() => {
    if (userProfile) {
      setChildName(userProfile.name);
      // 데이터베이스의 PIN을 4자리 문자열로 변환
      const dbPin =
        userProfile.pin_code?.toString().padStart(4, "0") ||
        "0000";
      setPinCode(dbPin);
      // PIN이 0000인지 확인
      setIsDefaultPin(
        userProfile.pin_code === 0 || !userProfile.pin_code
      );
    }
  }, [userProfile]);

  const handleChildNameChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setChildName(e.target.value);
    setError(null);
  };

  const handlePinCodeChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 4) {
      setPinCode(value);
      setError(null);
    }
  };

  const handleSave = async () => {
    if (!userProfile) {
      setError("사용자 정보를 찾을 수 없습니다.");
      return;
    }

    // 유효성 검사
    if (childName.trim() === "") {
      setError("이름을 입력해주세요.");
      return;
    }

    if (pinCode.length !== 4) {
      setError("PIN은 4자리 숫자여야 합니다.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 사용자 정보 업데이트
      const { error: updateError } = await supabase
        .from("users")
        .update({
          name: childName.trim(),
          pin_code: parseInt(pinCode), // 문자열을 숫자로 변환
        })
        .eq("id", userProfile.id);

      if (updateError) throw updateError;

      toast.success("설정이 저장되었습니다.");
      // PIN이 변경되었는지 확인
      if (pinCode !== "0000") {
        setIsDefaultPin(false);
      }
    } catch (err: unknown) {
      console.error("설정 저장 중 오류 발생:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("설정 저장 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  const isFormChanged = () => {
    if (!userProfile) return false;
    const dbPin =
      userProfile.pin_code?.toString().padStart(4, "0") ||
      "0000";
    return (
      childName !== userProfile.name || pinCode !== dbPin
    );
  };

  return (
    <div
      className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto"
      style={{
        borderColor: "var(--color-border-default)",
      }}>
      <h2
        className="text-2xl font-bold mb-6 flex items-center"
        style={{ color: "var(--color-text-primary)" }}>
        <LuUser className="mr-2" /> 계정 설정
      </h2>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
        </div>
      ) : (
        <>
          {isDefaultPin && (
            <div className="mb-6 p-3 bg-yellow-50 border border-yellow-300 rounded-lg flex items-start">
              <LuTriangle
                className="text-yellow-600 mr-2 mt-0.5 flex-shrink-0"
                size={20}
              />
              <div className="text-sm">
                <p className="font-semibold text-yellow-800 mb-1">
                  기본 PIN 코드 사용 중
                </p>
                <p className="text-yellow-700">
                  현재 기본 PIN 코드(0000)를 사용하고
                  있습니다. 보안을 위해 PIN을 변경하시기
                  바랍니다.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* 이름 설정 */}
            <div>
              <label
                htmlFor="childName"
                className="block text-sm font-medium mb-2 flex items-center"
                style={{
                  color: "var(--color-text-secondary)",
                }}>
                <LuUser className="mr-2" /> 이름
              </label>
              <input
                type="text"
                id="childName"
                value={childName}
                onChange={handleChildNameChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none"
                style={{
                  borderColor:
                    "var(--color-border-default)",
                }}
                placeholder="이름을 입력하세요"
              />
            </div>

            {/* PIN 코드 설정 */}
            <div>
              <label
                htmlFor="pinCode"
                className="block text-sm font-medium mb-2 flex items-center"
                style={{
                  color: "var(--color-text-secondary)",
                }}>
                <LuKey className="mr-2" /> PIN 코드 (4자리)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                오늘의 미션 설정 페이지에 접근할 때 필요한
                PIN 코드입니다.
              </p>
              <input
                type="password"
                id="pinCode"
                value={pinCode}
                onChange={handlePinCodeChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none"
                style={{
                  borderColor:
                    "var(--color-border-default)",
                }}
                placeholder="4자리 숫자"
                maxLength={4}
              />
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div
                className="p-3 rounded"
                style={{
                  backgroundColor: "var(--color-bg-error)",
                  color: "var(--color-text-error)",
                }}>
                {error}
              </div>
            )}

            {/* 저장 버튼 */}
            <button
              onClick={handleSave}
              disabled={loading || !isFormChanged()}
              className={`w-full py-2 rounded font-medium flex items-center justify-center ${
                isFormChanged()
                  ? "text-white"
                  : "text-gray-400 bg-gray-200 cursor-not-allowed"
              }`}
              style={{
                backgroundColor: isFormChanged()
                  ? "var(--color-primary-medium)"
                  : undefined,
              }}>
              {loading ? (
                <span className="mr-2 animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              ) : (
                <LuSave className="mr-2" />
              )}
              {loading ? "저장 중..." : "저장"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AccountSettings;
