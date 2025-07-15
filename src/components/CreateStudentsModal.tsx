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

      // 각 학생별로 계정 생성
      for (const studentName of names) {
        // QR 토큰 생성 (UUID)
        const qrToken = crypto.randomUUID();

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
          continue; // 하나 실패해도 나머지는 계속 생성
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
        }

        createdStudents.push({
          student_id: studentData.id,
          student_name: studentName,
          qr_token: qrToken,
        });
      }

      if (createdStudents.length === 0) {
        throw new Error("학생 계정을 생성하지 못했습니다.");
      }

      // Success
      if (onSuccess) {
        onSuccess(createdStudents);
      }

      // Reset form
      setStudentNames("");
      onOpenChange(false);
    } catch (err) {
      console.error("Error creating students:", err);
      setError("학생 계정 생성 중 오류가 발생했습니다.");
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
              <AlertDescription>{error}</AlertDescription>
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
