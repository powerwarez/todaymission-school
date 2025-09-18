import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Provider } from "@supabase/supabase-js";
import { FaComment } from "react-icons/fa";
import {
  LuCheck,
  LuUsers,
  LuTrophy,
  LuTrendingUp,
  LuSettings,
  LuInfo,
} from "react-icons/lu";

const TeacherLoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (provider: Provider) => {
    setLoading(true);
    setError(null);
    try {
      const { error: signInError } =
        await supabase.auth.signInWithOAuth({
          provider: provider,
          options: {
            redirectTo: `${window.location.origin}/teacher/onboarding`,
          },
        });
      if (signInError) throw signInError;
    } catch (err: unknown) {
      console.error("Login Error:", err);
      let errorMessage = "로그인 중 오류가 발생했습니다.";
      if (typeof err === "object" && err !== null) {
        const supabaseError = err as {
          error_description?: string;
          message?: string;
        };
        errorMessage =
          supabaseError.error_description ||
          supabaseError.message ||
          errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            오늘의 미션
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            교사용 로그인
          </p>
          <p className="text-sm text-gray-500">
            학생들의 일일 미션을 관리하고 성장을 지원하는
            학습 관리 시스템
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* 로그인 버튼 */}
        <button
          onClick={() => handleLogin("kakao")}
          disabled={loading}
          className="w-full bg-[#FEE500] text-[#3C1E1E] font-semibold py-4 px-6 rounded-xl flex items-center justify-center hover:bg-[#FDD500] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl mb-8">
          <FaComment className="mr-3 text-xl" />
          {loading ? "로그인 중..." : "카카오로 시작하기"}
        </button>

        {/* 주요 기능 안내 */}
        <div className="border-t pt-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            주요 기능
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-start space-x-2">
              <LuCheck className="text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-600">
                일일 미션 설정 및 관리
              </span>
            </div>
            <div className="flex items-start space-x-2">
              <LuUsers className="text-blue-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-600">
                학생 계정 생성 및 QR 로그인
              </span>
            </div>
            <div className="flex items-start space-x-2">
              <LuTrophy className="text-yellow-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-600">
                도전과제 및 배지 시스템
              </span>
            </div>
            <div className="flex items-start space-x-2">
              <LuTrendingUp className="text-purple-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-600">
                일일 미션 통계 및 진도 확인
              </span>
            </div>
            <div className="flex items-start space-x-2">
              <LuTrendingUp className="text-purple-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-600">
                학생 스스로 미션 수행을 확인하고 진도를
                체크할 수 있어요
              </span>
            </div>
          </div>
        </div>

        {/* 사용 안내 */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-2">
            <LuInfo className="text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-blue-900 mb-1">
                처음 사용하시나요?
              </p>
              <p className="text-gray-600 font-medium mb-1">
                명렬표에서 이름을 복사해서 붙여 넣으면
                간편하게 학생 계정이 만들어져요!
              </p>
              <p className="text-gray-600 font-medium mb-1">
                선생님께서 학생 계정만 생성하면 개인정보이용
                동의서 양식과 학생 로그인 안내장이 자동으로
                생성돼요!
              </p>
              <ol className="text-blue-700 space-y-1">
                <li>1. 카카오 계정으로 간편 로그인</li>
                <li>2. 학교 정보 등록</li>
                <li>
                  3. 학생 계정 생성 후 개인정보이용 동의서
                  다운로드 후 배포
                </li>
                <li>4. 학생 로그인 안내장 배포</li>
                <li>
                  5. 일일 미션 설정하고 학생 활동 시작!
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* 공지사항 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <LuSettings className="text-gray-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-gray-800 mb-1">
                공지사항
              </p>
              <ul className="text-gray-600 space-y-1">
                <li>
                  • 학생들에게 이 로그인 페이지가 노출되지
                  않도록 주의해주세요
                </li>
                <li>
                  • 개인정보 동의서를 먼저 받으신 후 학생
                  계정을 생성해주세요
                </li>
                <li>
                  • 학생용 페이지는{" "}
                  <a
                    href="https://todaymission.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer">
                    https://todaymission.vercel.app/
                  </a>{" "}
                  입니다.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherLoginPage;
