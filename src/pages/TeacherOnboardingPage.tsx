import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { School } from "lucide-react";

const TeacherOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [schoolName, setSchoolName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 이미 학교가 설정된 경우 대시보드로 이동
    if (userProfile?.school_id) {
      navigate("/teacher/dashboard");
    }
  }, [userProfile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!schoolName.trim() || !user) {
      setError("학교 이름을 입력해주세요.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. 학교 생성
      const { data: schoolData, error: schoolError } =
        await supabase
          .from("schools")
          .insert({ name: schoolName })
          .select()
          .single();

      if (schoolError) throw schoolError;

      // 2. 교사 프로필이 없으면 생성
      const { data: existingProfile } = await supabase
        .from("users")
        .select("id")
        .eq("auth_uid", user.id)
        .single();

      if (!existingProfile) {
        // 새 교사 프로필 생성
        const { error: profileError } = await supabase
          .from("users")
          .insert({
            auth_uid: user.id,
            email: user.email,
            name:
              user.user_metadata?.name ||
              user.email?.split("@")[0] ||
              "선생님",
            role: "teacher",
            school_id: schoolData.id,
            auth_provider: "kakao",
          });

        if (profileError) throw profileError;
      } else {
        // 기존 프로필 업데이트
        const { error: updateError } = await supabase
          .from("users")
          .update({ school_id: schoolData.id })
          .eq("auth_uid", user.id);

        if (updateError) throw updateError;
      }

      // 성공 시 대시보드로 이동
      navigate("/teacher/dashboard");
    } catch (err) {
      console.error("Error creating school:", err);
      setError("학교 등록 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto bg-blue-100 rounded-full p-4 w-fit mb-4">
            <School className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">
            학교 정보 등록
          </CardTitle>
          <CardDescription>
            처음 가입하시는 선생님은 학교 정보를
            등록해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="space-y-4">
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
                disabled={loading}
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !schoolName.trim()}
              className="w-full">
              {loading ? "등록 중..." : "등록하기"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherOnboardingPage;
