import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Provider } from "@supabase/supabase-js";
import { FaComment } from "react-icons/fa";

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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            오늘의 미션
          </h1>
          <p className="text-lg text-gray-600">
            교사용 로그인
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <button
          onClick={() => handleLogin("kakao")}
          disabled={loading}
          className="w-full bg-[#FEE500] text-[#3C1E1E] font-semibold py-4 px-6 rounded-xl flex items-center justify-center hover:bg-[#FDD500] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl">
          <FaComment className="mr-3 text-xl" />
          {loading ? "로그인 중..." : "카카오로 시작하기"}
        </button>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            학생이신가요?{" "}
            <a
              href="/student/login"
              className="text-blue-600 hover:text-blue-700 font-medium">
              학생 로그인
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TeacherLoginPage;
