import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { TrendingUp, Users, Award, Target, AlertCircle } from "lucide-react";
import { DateTime } from "luxon";

interface StudentStats {
  student_id: string;
  student_name: string;
  total_missions: number;
  completed_missions: number;
  completion_rate: number;
  badges_earned: number;
}

interface MissionStats {
  mission_id: string;
  mission_title: string;
  total_attempts: number;
  completion_rate: number;
}

const TeacherStatisticsPage: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  const [studentStats, setStudentStats] = useState<StudentStats[]>([]);
  const [missionStats, setMissionStats] = useState<MissionStats[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalStudents: 0,
    averageCompletionRate: 0,
    totalMissionsCompleted: 0,
    totalBadgesEarned: 0,
  });
  const [showNoMissionDialog, setShowNoMissionDialog] = useState(false);

  // 미션이 있는지 체크
  useEffect(() => {
    const checkMissions = async () => {
      if (!userProfile?.school_id) return;

      try {
        const { data: missions, error } = await supabase
          .from("missions")
          .select("id")
          .eq("school_id", userProfile.school_id)
          .limit(1);

        if (error) {
          console.error("미션 체크 오류:", error);
          return;
        }

        const hasAnyMissions = missions && missions.length > 0;

        // 미션이 없고 처음 로그인한 교사인 경우 다이얼로그 표시
        if (!hasAnyMissions && userProfile.role === "teacher") {
          setShowNoMissionDialog(true);
        }
      } catch (error) {
        console.error("미션 체크 중 오류:", error);
      }
    };

    checkMissions();
  }, [userProfile]);

  useEffect(() => {
    console.log("TeacherStatisticsPage - userProfile:", userProfile);
    console.log("TeacherStatisticsPage - selectedPeriod:", selectedPeriod);

    if (userProfile?.id) {
      fetchStatistics();
    } else {
      setLoading(false);
    }
  }, [userProfile, selectedPeriod]);

  const fetchStatistics = async () => {
    console.log("fetchStatistics - Starting with:", {
      userId: userProfile?.id,
      schoolId: userProfile?.school_id,
    });

    if (!userProfile?.id || !userProfile?.school_id) {
      console.log("fetchStatistics - Missing required data, stopping");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch period boundaries
      const now = DateTime.now();
      let startDate: DateTime;

      switch (selectedPeriod) {
        case "today":
          startDate = now.startOf("day");
          break;
        case "week":
          startDate = now.startOf("week");
          break;
        case "month":
          startDate = now.startOf("month");
          break;
        case "year":
          startDate = now.startOf("year");
          break;
        default:
          startDate = now.minus({ days: 7 });
      }

      // Fetch students
      const { data: students } = await supabase
        .from("users")
        .select("id, name")
        .eq("teacher_id", userProfile.id)
        .eq("role", "student");

      if (!students || students.length === 0) {
        setOverallStats({
          totalStudents: 0,
          averageCompletionRate: 0,
          totalMissionsCompleted: 0,
          totalBadgesEarned: 0,
        });
        setStudentStats([]);
        setMissionStats([]);
        setLoading(false);
        return;
      }

      // Fetch missions
      const { data: missions } = await supabase
        .from("missions")
        .select("id, title")
        .eq("school_id", userProfile.school_id)
        .eq("is_active", true);

      // Fetch mission logs for the period
      const studentIds = students.map((s) => s.id);
      const { data: missionLogs } = await supabase
        .from("mission_logs")
        .select("student_id, mission_id, completed_at")
        .in("student_id", studentIds)
        .gte("completed_at", startDate.toISO());

      // Fetch badges earned - both system and custom badges
      const { data: systemBadges } = await supabase
        .from("student_system_badges")
        .select("student_id")
        .in("student_id", studentIds)
        .gte("earned_date", startDate.toFormat("yyyy-MM-dd"));

      const { data: customBadges } = await supabase
        .from("student_custom_badges")
        .select("student_id")
        .in("student_id", studentIds)
        .gte("earned_date", startDate.toFormat("yyyy-MM-dd"));

      // Combine both badge types
      const earnedBadges = [...(systemBadges || []), ...(customBadges || [])];

      console.log("Badge counts:", {
        systemBadges: systemBadges?.length || 0,
        customBadges: customBadges?.length || 0,
        totalBadges: earnedBadges.length,
        studentIds,
        startDate: startDate.toFormat("yyyy-MM-dd"),
        periodType: selectedPeriod,
      });

      // Calculate student statistics
      const studentStatsMap = new Map<string, StudentStats>();

      students.forEach((student) => {
        studentStatsMap.set(student.id, {
          student_id: student.id,
          student_name: student.name,
          total_missions:
            (missions?.length || 0) *
            Math.ceil(now.diff(startDate, "days").days),
          completed_missions: 0,
          completion_rate: 0,
          badges_earned: 0,
        });
      });

      // Count completed missions
      missionLogs?.forEach((log) => {
        const stats = studentStatsMap.get(log.student_id);
        if (stats) {
          stats.completed_missions += 1;
        }
      });

      // Count badges
      earnedBadges?.forEach((badge) => {
        const stats = studentStatsMap.get(badge.student_id);
        if (stats) {
          stats.badges_earned += 1;
        }
      });

      // Calculate completion rates
      studentStatsMap.forEach((stats) => {
        if (stats.total_missions > 0) {
          stats.completion_rate = Math.round(
            (stats.completed_missions / stats.total_missions) * 100
          );
        }
      });

      const studentStatsArray = Array.from(studentStatsMap.values());
      setStudentStats(studentStatsArray);

      // Calculate mission statistics
      const missionStatsMap = new Map<string, MissionStats>();

      missions?.forEach((mission) => {
        missionStatsMap.set(mission.id, {
          mission_id: mission.id,
          mission_title: mission.title,
          total_attempts: 0,
          completion_rate: 0,
        });
      });

      missionLogs?.forEach((log) => {
        const stats = missionStatsMap.get(log.mission_id);
        if (stats) {
          stats.total_attempts += 1;
        }
      });

      missionStatsMap.forEach((stats) => {
        const maxAttempts =
          students.length * Math.ceil(now.diff(startDate, "days").days);
        if (maxAttempts > 0) {
          stats.completion_rate = Math.round(
            (stats.total_attempts / maxAttempts) * 100
          );
        }
      });

      const missionStatsArray = Array.from(missionStatsMap.values());
      setMissionStats(missionStatsArray);

      // Calculate overall statistics
      const totalCompleted = studentStatsArray.reduce(
        (sum, s) => sum + s.completed_missions,
        0
      );
      const totalBadges = studentStatsArray.reduce(
        (sum, s) => sum + s.badges_earned,
        0
      );
      const avgCompletionRate =
        studentStatsArray.length > 0
          ? Math.round(
              studentStatsArray.reduce((sum, s) => sum + s.completion_rate, 0) /
                studentStatsArray.length
            )
          : 0;

      setOverallStats({
        totalStudents: students.length,
        averageCompletionRate: avgCompletionRate,
        totalMissionsCompleted: totalCompleted,
        totalBadgesEarned: totalBadges,
      });
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">통계 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">통계</h1>
            <p className="text-gray-600 mt-1">
              학생들의 미션 수행 현황을 확인합니다.
            </p>
          </div>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40 bg-white border-gray-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-300">
              <SelectItem value="today">오늘</SelectItem>
              <SelectItem value="week">이번 주</SelectItem>
              <SelectItem value="month">이번 달</SelectItem>
              <SelectItem value="year">올해</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <Users className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle className="text-lg">전체 학생</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {overallStats.totalStudents}명
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <TrendingUp className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle className="text-lg">평균 달성률</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {overallStats.averageCompletionRate}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <Target className="h-8 w-8 text-purple-600 mb-2" />
              <CardTitle className="text-lg">완료된 미션</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {overallStats.totalMissionsCompleted}개
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <Award className="h-8 w-8 text-yellow-600 mb-2" />
              <CardTitle className="text-lg">획득한 배지</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {overallStats.totalBadgesEarned}개
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Student Rankings */}
        <Card>
          <CardHeader>
            <CardTitle>학생별 달성률</CardTitle>
            <CardDescription>기간 내 미션 달성률 순위</CardDescription>
          </CardHeader>
          <CardContent>
            {studentStats.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                아직 데이터가 없습니다.
              </p>
            ) : (
              <div className="space-y-4">
                {studentStats
                  .sort((a, b) => b.completion_rate - a.completion_rate)
                  .slice(0, 10)
                  .map((student, index) => (
                    <div
                      key={student.student_id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-lg font-bold text-gray-400 w-8">
                          {index + 1}
                        </span>
                        <span className="font-medium">
                          {student.student_name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">
                          {student.completed_missions}/{student.total_missions}{" "}
                          완료
                        </span>
                        <Badge
                          variant={
                            student.completion_rate >= 80
                              ? "default"
                              : "secondary"
                          }
                        >
                          {student.completion_rate}%
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mission Stats */}
        <Card>
          <CardHeader>
            <CardTitle>미션별 통계</CardTitle>
            <CardDescription>각 미션의 수행 현황</CardDescription>
          </CardHeader>
          <CardContent>
            {missionStats.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                아직 설정된 미션이 없습니다.
              </p>
            ) : (
              <div className="space-y-4">
                {missionStats.map((mission) => (
                  <div
                    key={mission.mission_id}
                    className="flex items-center justify-between"
                  >
                    <span className="font-medium">{mission.mission_title}</span>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-500">
                        {mission.total_attempts}회 수행
                      </span>
                      <Badge
                        variant={
                          mission.completion_rate >= 70
                            ? "default"
                            : "secondary"
                        }
                      >
                        {mission.completion_rate}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 미션이 없을 때 표시되는 다이얼로그 */}
      <Dialog open={showNoMissionDialog} onOpenChange={setShowNoMissionDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              오늘의 미션 설정이 필요합니다
            </DialogTitle>
            <DialogDescription className="pt-3 space-y-2">
              <p>환영합니다, 선생님!</p>
              <p>
                학생들이 수행할 '오늘의 미션'이 아직 설정되지 않았습니다. 미션을
                설정하면 학생들이 매일 체크할 수 있는 과제가 생성됩니다.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowNoMissionDialog(false)}
            >
              나중에 하기
            </Button>
            <Button
              onClick={() => {
                setShowNoMissionDialog(false);
                navigate("/teacher/mission-settings");
              }}
            >
              미션 설정하러 가기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TeacherStatisticsPage;
