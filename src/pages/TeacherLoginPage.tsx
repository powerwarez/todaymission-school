import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { Provider } from "@supabase/supabase-js";
import { FaComment } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";

const TeacherLoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSchoolModal, setShowSchoolModal] =
    useState(false);
  const [schoolName, setSchoolName] = useState("");
  const [savingSchool, setSavingSchool] = useState(false);
  const { user, userProfile, updateUserProfile } =
    useAuth();

  useEffect(() => {
    // Check if user just signed up and needs to set school
    const checkNewTeacher = async () => {
      if (
        user &&
        userProfile?.role === "teacher" &&
        !userProfile.school_id
      ) {
        setShowSchoolModal(true);
      }
    };

    checkNewTeacher();
  }, [user, userProfile]);

  const handleLogin = async (provider: Provider) => {
    setLoading(true);
    setError(null);
    try {
      const { error: signInError } =
        await supabase.auth.signInWithOAuth({
          provider: provider,
          options: {
            redirectTo: `${window.location.origin}/teacher/dashboard`,
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

  const handleSchoolSubmit = async () => {
    if (!schoolName.trim() || !userProfile) return;

    setSavingSchool(true);
    try {
      // Create school
      const { data: schoolData, error: schoolError } =
        await supabase
          .from("schools")
          .insert({ name: schoolName })
          .select()
          .single();

      if (schoolError) throw schoolError;

      // Update user with school_id
      await updateUserProfile({ school_id: schoolData.id });

      setShowSchoolModal(false);
      // Redirect to teacher dashboard
      window.location.href = "/teacher/dashboard";
    } catch (err) {
      console.error("Error creating school:", err);
      setError("학교 등록 중 오류가 발생했습니다.");
    } finally {
      setSavingSchool(false);
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

      {/* School Registration Modal */}
      <Dialog
        open={showSchoolModal}
        onOpenChange={setShowSchoolModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>학교 정보 등록</DialogTitle>
            <DialogDescription>
              처음 가입하시는 선생님은 학교 정보를
              등록해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="schoolName">학교 이름</Label>
              <Input
                id="schoolName"
                type="text"
                value={schoolName}
                onChange={(e) =>
                  setSchoolName(e.target.value)
                }
                placeholder="예: 서울초등학교"
                className="mt-1"
              />
            </div>
            <Button
              onClick={handleSchoolSubmit}
              disabled={!schoolName.trim() || savingSchool}
              className="w-full">
              {savingSchool ? "등록 중..." : "등록하기"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherLoginPage;
