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

interface CreateStudentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherId: string;
  schoolId: string;
  onSuccess?: (students: StudentCreationResult[]) => void;
}

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
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    // 디버깅: props 값 확인
    console.log("CreateStudentsModal - Props:", {
      teacherId,
      schoolId,
    });

    // 필수 값 검증
    if (!teacherId || !schoolId) {
      setError(
        "선생님 ID 또는 학교 ID가 없습니다. 페이지를 새로고침해주세요."
      );
      console.error("Missing required IDs:", {
        teacherId,
        schoolId,
      });
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

    try {
      const createdStudents: StudentCreationResult[] = [];
      const errors: string[] = [];

      // 각 학생별로 계정 생성
      for (const studentName of names) {
        try {
          // QR 토큰 생성 (UUID 대체 방법)
          const qrToken = `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 15)}-${Math.random()
            .toString(36)
            .substring(2, 15)}`;

          // 학생 계정 생성
          const { data: studentData, error: studentError } =
            await supabase
              .from("users")
              .insert({
                name: studentName,
                role: "student",
                school_id: schoolId,
                teacher_id: teacherId,
                auth_provider: "qr",
                qr_token: qrToken,
              })
              .select()
              .single();

          if (studentError) {
            console.error(
              `Error creating student ${studentName}:`,
              studentError
            );
            errors.push(
              `${studentName}: ${studentError.message}`
            );
            continue; // 하나 실패해도 나머지는 계속 생성
          }

          if (!studentData) {
            errors.push(`${studentName}: 데이터 생성 실패`);
            continue;
          }

          // QR 코드 데이터 생성
          const qrData = JSON.stringify({
            token: qrToken,
            student_name: studentName,
            school_id: schoolId,
          });

          const { error: qrError } = await supabase
            .from("student_qr_codes")
            .insert({
              student_id: studentData.id,
              qr_data: qrData,
            });

          if (qrError) {
            console.error(
              `Error creating QR code for ${studentName}:`,
              qrError
            );
            errors.push(
              `${studentName} QR 코드: ${qrError.message}`
            );
          }

          createdStudents.push({
            student_id: studentData.id,
            student_name: studentName,
            qr_token: qrToken,
          });
        } catch (err) {
          console.error(
            `Unexpected error for ${studentName}:`,
            err
          );
          errors.push(
            `${studentName}: 예상치 못한 오류 발생`
          );
        }
      }

      if (errors.length > 0) {
        setError(
          `일부 학생 계정 생성 실패:\n${errors.join("\n")}`
        );
      }

      if (createdStudents.length === 0) {
        throw new Error("학생 계정을 생성하지 못했습니다.");
      }

      // Success
      if (onSuccess) {
        onSuccess(createdStudents);
      }

      // Reset form only if some students were created successfully
      if (createdStudents.length > 0) {
        setStudentNames("");
        if (errors.length === 0) {
          onOpenChange(false);
        }
      }
    } catch (err) {
      console.error("Error creating students:", err);
      setError(
        `학생 계정 생성 중 오류가 발생했습니다: ${
          err instanceof Error
            ? err.message
            : "알 수 없는 오류"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setStudentNames("");
      setError(null);
      onOpenChange(false);
    }
  };

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
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateStudentsModal;
