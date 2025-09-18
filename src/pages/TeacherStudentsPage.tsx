import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabaseClient";
import {
  UserProfile,
  StudentCreationResult,
} from "../types/index";
import CreateStudentsModal from "../components/CreateStudentsModal";
import StudentQRCodesPDF from "../components/StudentQRCodesPDF";
import LoadingWithRefresh from "../components/LoadingWithRefresh";
import { downloadPrivacyConsentPDF } from "../components/PrivacyConsentPDF";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  UserPlus,
  Search,
  Download,
  QrCode,
  Trash2,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "../components/ui/checkbox";
import QRCode from "qrcode";
import { pdf } from "@react-pdf/renderer";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

const TeacherStudentsPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [students, setStudents] = useState<UserProfile[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] =
    useState(false);
  const [schoolName, setSchoolName] = useState<string>("");
  const [selectedStudent, setSelectedStudent] =
    useState<UserProfile | null>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [showDeleteDialog, setShowDeleteDialog] =
    useState(false);
  const [studentToDelete, setStudentToDelete] =
    useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [consentChecked, setConsentChecked] = useState(
    () => {
      return (
        localStorage.getItem("privacyConsentChecked") ===
        "true"
      );
    }
  );

  useEffect(() => {
    if (userProfile?.id) {
      fetchStudents();
      if (userProfile.school_id) {
        fetchSchoolName();
      }
    }
  }, [userProfile]);

  const fetchSchoolName = async () => {
    if (!userProfile?.school_id) return;

    try {
      const { data, error } = await supabase
        .from("schools")
        .select("name")
        .eq("id", userProfile.school_id)
        .single();

      if (data && !error) {
        setSchoolName(data.name);
      }
    } catch (err) {
      console.error("Error fetching school:", err);
    }
  };

  const fetchStudents = async () => {
    if (!userProfile?.id) return;

    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("teacher_id", userProfile.id)
        .eq("role", "student")
        .order("name");

      if (error) throw error;

      setStudents(data || []);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("학생 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleStudentCreated = (
    createdStudents: StudentCreationResult[]
  ) => {
    fetchStudents();
    toast.success(
      `${createdStudents.length}명의 학생 계정이 생성되었습니다.`
    );
  };

  // QR 코드 표시
  const handleShowQR = async (student: UserProfile) => {
    if (!student.qr_token) {
      toast.error("QR 토큰이 없습니다.");
      return;
    }

    try {
      const qrData = JSON.stringify({
        token: student.qr_token,
        student_name: student.name,
        school_id: userProfile?.school_id,
      });

      const url = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      setQrCodeUrl(url);
      setSelectedStudent(student);
      setShowQRDialog(true);
    } catch (error) {
      console.error("QR 코드 생성 오류:", error);
      toast.error("QR 코드 생성에 실패했습니다.");
    }
  };

  // 단일 학생 PDF 다운로드
  const handleDownloadSinglePDF = async (
    student: UserProfile
  ) => {
    if (!student.qr_token) {
      toast.error("QR 토큰이 없습니다.");
      return;
    }

    try {
      // 한글 폰트 등록
      Font.register({
        family: "NotoSansKR",
        fonts: [
          {
            src: "https://fonts.gstatic.com/ea/notosanskr/v2/NotoSansKR-Regular.woff2",
            fontWeight: 400,
          },
          {
            src: "https://fonts.gstatic.com/ea/notosanskr/v2/NotoSansKR-Bold.woff2",
            fontWeight: 700,
          },
        ],
      });

      // QR 코드 생성
      const qrData = JSON.stringify({
        token: student.qr_token,
        student_name: student.name,
        school_id: userProfile?.school_id,
      });

      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });

      // PDF 스타일
      const styles = StyleSheet.create({
        page: {
          flexDirection: "column",
          backgroundColor: "#ffffff",
          padding: 40,
          fontFamily: "NotoSansKR",
        },
        container: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        },
        schoolName: {
          fontSize: 24,
          fontWeight: 700,
          marginBottom: 40,
          color: "#1f2937",
          textAlign: "center",
        },
        studentName: {
          fontSize: 32,
          fontWeight: 700,
          marginBottom: 20,
          color: "#1f2937",
          textAlign: "center",
        },
        qrCode: {
          width: 200,
          height: 200,
          marginBottom: 30,
        },
        instruction: {
          fontSize: 16,
          color: "#6b7280",
          textAlign: "center",
          marginTop: 20,
        },
      });

      // PDF 문서 생성
      const MyDocument = () => (
        <Document>
          <Page size="A4" style={styles.page}>
            <View style={styles.container}>
              <Text style={styles.schoolName}>
                {schoolName}
              </Text>
              <Text style={styles.studentName}>
                {student.name}
              </Text>
              <Image
                style={styles.qrCode}
                src={qrCodeDataURL}
              />
              <Text style={styles.instruction}>
                태블릿으로 위의 QR 코드를 스캔하세요.
              </Text>
            </View>
          </Page>
        </Document>
      );

      // PDF 생성 및 다운로드
      const blob = await pdf(<MyDocument />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${student.name}_QR코드.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("PDF 다운로드가 완료되었습니다.");
    } catch (error) {
      console.error("PDF 생성 오류:", error);
      toast.error("PDF 생성에 실패했습니다.");
    }
  };

  // 학생 삭제
  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;

    setIsDeleting(true);
    try {
      // 학생 관련 모든 데이터 삭제 (CASCADE로 자동 삭제되지만 명시적으로 처리)
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", studentToDelete.id);

      if (error) throw error;

      toast.success(
        `${studentToDelete.name} 학생의 계정이 삭제되었습니다.`
      );
      fetchStudents();
      setShowDeleteDialog(false);
      setStudentToDelete(null);
    } catch (error) {
      console.error("학생 삭제 오류:", error);
      toast.error("학생 삭제에 실패했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredStudents = students.filter((student) =>
    student.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingWithRefresh />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">학생 관리</h1>
          <p className="text-gray-600 mt-1">
            학생 계정을 생성하고 관리합니다.
          </p>
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700 mb-2">
              개인정보 제공 동의서를 다운받아서 오프라인으로
              받으셨다면 아래를 체크해주세요.
              <br />
              학생 로그인 안내장을 다운받을 수 있습니다.
            </p>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="privacy-consent-main"
                checked={consentChecked}
                onCheckedChange={(checked) => {
                  const isChecked = checked === true;
                  setConsentChecked(isChecked);
                  localStorage.setItem(
                    "privacyConsentChecked",
                    isChecked.toString()
                  );
                }}
              />
              <label
                htmlFor="privacy-consent-main"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                개인정보 이용 동의서를 모두 받았습니다
              </label>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              const success =
                await downloadPrivacyConsentPDF(
                  schoolName || "학교",
                  userProfile?.name
                    ? `${userProfile.name} 선생님 반`
                    : "학급"
                );
              if (success) {
                toast.success(
                  "개인정보 이용 동의서가 다운로드되었습니다."
                );
              } else {
                toast.error("다운로드에 실패했습니다.");
              }
            }}>
            <FileText className="mr-2 h-4 w-4" />
            개인정보 동의서 다운로드
          </Button>
          {students.length > 0 && schoolName && (
            <StudentQRCodesPDF
              students={students
                .filter((student) => student.qr_token)
                .map((student) => ({
                  student_id: student.id,
                  student_name: student.name,
                  qr_token: student.qr_token!,
                }))}
              schoolName={schoolName}
              className={
                userProfile?.name
                  ? `${userProfile.name} 선생님 반`
                  : "학급"
              }
              consentChecked={consentChecked}
            />
          )}
          <Button onClick={() => setShowCreateModal(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            학생 추가
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="학생 이름으로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Students Grid */}
      {filteredStudents.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">
              {searchTerm
                ? "검색 결과가 없습니다."
                : "아직 등록된 학생이 없습니다."}
            </p>
            {!searchTerm && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowCreateModal(true)}>
                <UserPlus className="mr-2 h-4 w-4" />첫 학생
                추가하기
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStudents.map((student) => (
            <Card
              key={student.id}
              className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {student.name}
                    </CardTitle>
                    <CardDescription className="text-sm mt-1">
                      학생 ID: {student.id}
                    </CardDescription>
                  </div>
                  <Badge
                    variant="secondary"
                    className="cursor-pointer hover:bg-gray-200"
                    onClick={() => handleShowQR(student)}>
                    <QrCode className="h-3 w-3 mr-1" />
                    QR
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    가입일:{" "}
                    {new Date(
                      student.created_at
                    ).toLocaleDateString()}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        handleDownloadSinglePDF(student)
                      }
                      title="PDF 다운로드">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        setStudentToDelete(student);
                        setShowDeleteDialog(true);
                      }}
                      title="학생 삭제">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Students Modal */}
      {userProfile && userProfile.school_id && (
        <CreateStudentsModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          teacherId={userProfile.id}
          schoolId={userProfile.school_id}
          onSuccess={handleStudentCreated}
        />
      )}
      {showCreateModal && !userProfile?.school_id && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          학교 정보가 없습니다. 먼저 학교를 설정해주세요.
        </div>
      )}

      {/* QR 코드 표시 다이얼로그 */}
      <Dialog
        open={showQRDialog}
        onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              {selectedStudent?.name} 학생 QR 코드
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              이 QR 코드를 스캔하여 학생이 로그인할 수
              있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg">
            {qrCodeUrl && (
              <img
                src={qrCodeUrl}
                alt="QR Code"
                className="max-w-full"
              />
            )}
          </div>
          <DialogFooter className="bg-white">
            <Button
              variant="outline"
              onClick={() => {
                if (selectedStudent) {
                  handleDownloadSinglePDF(selectedStudent);
                }
              }}>
              <Download className="mr-2 h-4 w-4" />
              PDF 다운로드
            </Button>
            <Button onClick={() => setShowQRDialog(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 학생 삭제 확인 다이얼로그 */}
      <Dialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">
              학생 계정 삭제
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <p className="font-semibold text-black">
                정말로 {studentToDelete?.name} 학생의 계정을
                삭제하시겠습니까?
              </p>
              <p>
                이 작업은 되돌릴 수 없으며, 다음 데이터가
                모두 삭제됩니다:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                <li>학생의 모든 미션 완료 기록</li>
                <li>획득한 배지 기록</li>
                <li>일일 및 월간 스냅샷 데이터</li>
                <li>QR 코드 및 로그인 정보</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setStudentToDelete(null);
              }}
              disabled={isDeleting}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteStudent}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700">
              {isDeleting ? "삭제 중..." : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherStudentsPage;
