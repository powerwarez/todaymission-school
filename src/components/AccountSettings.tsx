import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import {
  LuUser,
  LuKey,
  LuSave,
  LuTriangle,
  LuEye,
  LuEyeOff,
  LuSchool,
  LuUsers,
} from "react-icons/lu";
import { toast } from "react-hot-toast";

const AccountSettings: React.FC = () => {
  const { userProfile } = useAuth();
  const [childName, setChildName] = useState<string>("");
  const [schoolName, setSchoolName] = useState<string>("");
  const [className, setClassName] = useState<string>("");
  const [pinCode, setPinCode] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDefaultPin, setIsDefaultPin] = useState<boolean>(false);
  const [showPin, setShowPin] = useState<boolean>(false);

  useEffect(() => {
    if (userProfile) {
      setChildName(userProfile.name);
      setPinCode(userProfile.pin_code || "0000");
      setIsDefaultPin(!userProfile.pin_code || userProfile.pin_code === "0000");
      if (userProfile.school) {
        setSchoolName(userProfile.school.name || "");
        setClassName(userProfile.school.class_name || "");
      }
    }
  }, [userProfile]);

  const handleChildNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChildName(e.target.value);
    setError(null);
  };

  const handlePinCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    if (childName.trim() === "") {
      setError("이름을 입력해주세요.");
      return;
    }

    if (schoolName.trim() === "") {
      setError("학교 이름을 입력해주세요.");
      return;
    }

    if (pinCode.length !== 4) {
      setError("PIN은 4자리 숫자여야 합니다.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from("users")
        .update({
          name: childName.trim(),
          pin_code: pinCode,
        })
        .eq("id", userProfile.id);

      if (updateError) throw updateError;

      if (userProfile.school_id) {
        const { error: schoolError } = await supabase
          .from("schools")
          .update({
            name: schoolName.trim(),
            class_name: className.trim() || null,
          })
          .eq("id", userProfile.school_id);

        if (schoolError) throw schoolError;
      }

      toast.success("설정이 저장되었습니다.");
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
    return (
      childName !== userProfile.name ||
      pinCode !== (userProfile.pin_code || "0000") ||
      schoolName !== (userProfile.school?.name || "") ||
      className !== (userProfile.school?.class_name || "")
    );
  };

  return (
    <div
      className="bg-white rounded-lg shadow-md p-6"
      style={{
        borderColor: "var(--color-border-default)",
      }}
    >
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
                  현재 기본 PIN 코드(0000)를 사용하고 있습니다. 보안을 위해
                  PIN을 변경하시기 바랍니다.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* 학교 이름 설정 */}
            <div>
              <label
                htmlFor="schoolName"
                className="block text-sm font-medium mb-2 flex items-center"
                style={{
                  color: "var(--color-text-secondary)",
                }}
              >
                <LuSchool className="mr-2" /> 학교 이름
              </label>
              <input
                type="text"
                id="schoolName"
                value={schoolName}
                onChange={(e) => {
                  setSchoolName(e.target.value);
                  setError(null);
                }}
                className="w-full px-3 py-2 border rounded-md focus:outline-none"
                style={{
                  borderColor: "var(--color-border-default)",
                }}
                placeholder="학교 이름을 입력하세요"
              />
            </div>

            {/* 반 이름 설정 */}
            <div>
              <label
                htmlFor="className"
                className="block text-sm font-medium mb-2 flex items-center"
                style={{
                  color: "var(--color-text-secondary)",
                }}
              >
                <LuUsers className="mr-2" /> 반 이름
              </label>
              <p className="text-xs text-gray-500 mb-2">
                로그인 안내장에 학교 이름과 함께 표시됩니다. (예: 6학년 5반, 용용반, 6학년 가람반)
              </p>
              <input
                type="text"
                id="className"
                value={className}
                onChange={(e) => {
                  setClassName(e.target.value);
                  setError(null);
                }}
                className="w-full px-3 py-2 border rounded-md focus:outline-none"
                style={{
                  borderColor: "var(--color-border-default)",
                }}
                placeholder="반 이름을 입력하세요 (선택)"
              />
            </div>

            {/* 이름 설정 */}
            <div>
              <label
                htmlFor="childName"
                className="block text-sm font-medium mb-2 flex items-center"
                style={{
                  color: "var(--color-text-secondary)",
                }}
              >
                <LuUser className="mr-2" /> 이름
              </label>
              <input
                type="text"
                id="childName"
                value={childName}
                onChange={handleChildNameChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none"
                style={{
                  borderColor: "var(--color-border-default)",
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
                }}
              >
                <LuKey className="mr-2" /> PIN 코드 (4자리)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                오늘의 미션 설정 페이지에 접근할 때 필요한 PIN 코드입니다.
              </p>
              <div className="relative">
                <input
                  type={showPin ? "text" : "password"}
                  id="pinCode"
                  value={pinCode}
                  onChange={handlePinCodeChange}
                  className="w-full px-3 py-2 pr-10 border rounded-md focus:outline-none"
                  style={{
                    borderColor: "var(--color-border-default)",
                  }}
                  placeholder="4자리 숫자"
                  maxLength={4}
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
                  title={showPin ? "PIN 숨기기" : "PIN 보기"}
                >
                  {showPin ? <LuEye size={20} /> : <LuEyeOff size={20} />}
                </button>
              </div>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div
                className="p-3 rounded"
                style={{
                  backgroundColor: "var(--color-bg-error)",
                  color: "var(--color-text-error)",
                }}
              >
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
              }}
            >
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
