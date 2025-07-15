import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabaseClient";
import {
  UserProfile,
  StudentCreationResult,
} from "../types/index";
import CreateStudentsModal from "../components/CreateStudentsModal";
import StudentQRCodesPDF from "../components/StudentQRCodesPDF";
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
  UserPlus,
  Search,
  Download,
  QrCode,
} from "lucide-react";
import { toast } from "sonner";

const TeacherStudentsPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [students, setStudents] = useState<UserProfile[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] =
    useState(false);
  const [newStudents, setNewStudents] = useState<
    StudentCreationResult[]
  >([]);

  useEffect(() => {
    if (userProfile?.id) {
      fetchStudents();
    }
  }, [userProfile]);

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
    setNewStudents(createdStudents);
    fetchStudents();
    toast.success(
      `${createdStudents.length}명의 학생 계정이 생성되었습니다.`
    );
  };

  const filteredStudents = students.filter((student) =>
    student.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            학생 목록 불러오는 중...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">학생 관리</h1>
          <p className="text-gray-600 mt-1">
            학생 계정을 생성하고 관리합니다.
          </p>
        </div>
        <div className="flex gap-2">
          {newStudents.length > 0 &&
            userProfile?.school && (
              <StudentQRCodesPDF
                students={newStudents}
                schoolName={userProfile.school.name}
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
                      학생 ID: {student.id.substring(0, 8)}
                      ...
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">
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
                  <Button size="sm" variant="ghost">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Students Modal */}
      {userProfile && (
        <CreateStudentsModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          teacherId={userProfile.id}
          schoolId={userProfile.school_id!}
          onSuccess={handleStudentCreated}
        />
      )}
    </div>
  );
};

export default TeacherStudentsPage;
