import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import {
  Alert,
  AlertDescription,
} from "../components/ui/alert";
import { UserPlus, Loader2 } from "lucide-react";
import { StudentCreationResult } from "../types/index";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface CreateStudentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherId: string;
  schoolId: string;
  onSuccess?: (students: StudentCreationResult[]) => void;
}

const generateQrToken = () =>
  `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`;

const CreateStudentsModal: React.FC<
  CreateStudentsModalProps
> = ({
  open,
  onOpenChange,
  teacherId,
  schoolId,
  onSuccess,
}) => {
  const [studentNames, setStudentNames] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!teacherId || !schoolId) {
      setError(
        "선생님 ID 또는 학교 ID가 없습니다. 페이지를 새로고침해주세요."
      );
      return;
    }

    const names = studentNames
      .split("\n")
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    if (names.length === 0) {
      setError("학생 이름을 입력해주세요.");
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(
      `${names.length}명의 학생 계정을 생성하고 있습니다...`
    );

    try {
      const studentsData = names.map((name) => ({
        name,
        qr_token: generateQrToken(),
      }));

      const session = await supabase.auth.getSession();
      const accessToken =
        session.data.session?.access_token || SUPABASE_ANON_KEY;

      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/rpc/create_batch_students`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            p_teacher_id: teacherId,
            p_school_id: schoolId,
            p_students: studentsData,
          }),
        }
      );

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(
          "RPC fetch error:",
          response.status,
          errorBody
        );
        throw new Error(
          `학생 계정 생성 실패 (${response.status}): ${errorBody}`
        );
      }

      const data = await response.json();

      const results: StudentCreationResult[] = (
        data as Array<{
          student_id: string;
          student_name: string;
          qr_token: string;
        }>
      ).map((item) => ({
        student_id: item.student_id,
        student_name: item.student_name,
        qr_token: item.qr_token,
      }));

      if (results.length === 0) {
        throw new Error(
          "학생 계정이 생성되지 않았습니다."
        );
      }

      setProgress("");

      if (onSuccess) {
        onSuccess(results);
      }

      setStudentNames("");
      onOpenChange(false);
    } catch (err) {
      console.error("Error creating students:", err);
      setError(
        err instanceof Error
          ? err.message
          : "학생 계정 생성 중 오류가 발생했습니다."
      );
      setProgress("");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setStudentNames("");
      setError(null);
      setProgress("");
      onOpenChange(false);
    }
  };

  const studentCount = studentNames
    .split("\n")
    .map((name) => name.trim())
    .filter((name) => name.length > 0).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>학생 계정 일괄 생성</DialogTitle>
          <DialogDescription>
            학생들의 이름을 한 줄에 하나씩 입력해주세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="studentNames">
              학생 이름 목록
              {studentCount > 0 && (
                <span className="ml-2 text-xs font-normal text-gray-500">
                  ({studentCount}명)
                </span>
              )}
            </Label>
            <Textarea
              id="studentNames"
              value={studentNames}
              onChange={(e) =>
                setStudentNames(e.target.value)
              }
              placeholder="김민수&#10;이지은&#10;박서준&#10;..."
              rows={10}
              className="mt-2"
              disabled={loading}
            />
            <p className="text-sm text-gray-500 mt-2">
              각 줄에 학생 이름 하나씩 입력하세요.
            </p>
          </div>

          {progress && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <p className="text-sm text-blue-700">
                  {progress}
                </p>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                <div className="whitespace-pre-wrap">
                  {error}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}>
            취소
          </Button>
          <Button
            onClick={handleCreate}
            disabled={loading || !studentNames.trim()}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                계정 생성
                {studentCount > 0 && ` (${studentCount}명)`}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateStudentsModal;
