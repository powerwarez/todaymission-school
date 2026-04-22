import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase, waitForSession } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import LoadingWithRefresh from "../components/LoadingWithRefresh";
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
import { Input } from "../components/ui/input";
import {
  TrendingUp,
  Users,
  Award,
  Target,
  AlertCircle,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarDays,
} from "lucide-react";
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

interface MissionCompletionDetail {
  student_id: string;
  student_name: string;
  completed: boolean;
  completed_at: string | null;
}

interface StudentMissionDetail {
  mission_id: string;
  mission_title: string;
  completed: boolean;
  completed_at: string | null;
}

const TeacherStatisticsPage: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  const [customStartDate, setCustomStartDate] = useState(
    DateTime.now().toFormat("yyyy-MM-dd")
  );
  const [customEndDate, setCustomEndDate] = useState(
    DateTime.now().toFormat("yyyy-MM-dd")
  );
  const [studentStats, setStudentStats] = useState<StudentStats[]>([]);
  const [missionStats, setMissionStats] = useState<MissionStats[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalStudents: 0,
    averageCompletionRate: 0,
    totalMissionsCompleted: 0,
    totalBadgesEarned: 0,
  });
  const [showNoMissionDialog, setShowNoMissionDialog] = useState(false);
  const [studentsCache, setStudentsCache] = useState<
    { id: string; name: string }[]
  >([]);
  const [selectedMission, setSelectedMission] = useState<MissionStats | null>(
    null
  );
  const [missionCompletionDetails, setMissionCompletionDetails] = useState<
    MissionCompletionDetail[]
  >([]);
  const [loadingMissionDetail, setLoadingMissionDetail] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentStats | null>(
    null
  );
  const [studentMissionDetails, setStudentMissionDetails] = useState<
    StudentMissionDetail[]
  >([]);
  const [loadingStudentDetail, setLoadingStudentDetail] = useState(false);

  // 배지 상세 다이얼로그 상태
  const [showBadgeDetail, setShowBadgeDetail] = useState(false);
  const [badgeDetails, setBadgeDetails] = useState<
    {
      student_name: string;
      badge_name: string;
      badge_icon: string;
      earned_date: string;
      badge_type: "system" | "custom";
    }[]
  >([]);
  const [loadingBadgeDetail, setLoadingBadgeDetail] = useState(false);

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
    if (userProfile?.id) {
      if (selectedPeriod === "custom" && (!customStartDate || !customEndDate)) {
        return;
      }
      fetchStatistics();
    } else {
      setLoading(false);
    }
  }, [userProfile, selectedPeriod, customStartDate, customEndDate]);

  // 탭 복귀 시 세션 갱신 완료를 기다린 후 통계 데이터 새로고침
  useEffect(() => {
    let cancelled = false;

    const handleVisibilityChange = async () => {
      if (document.hidden || !userProfile?.id) return;

      await waitForSession();

      if (!cancelled) {
        fetchStatistics();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [userProfile, selectedPeriod]);

  // 선택된 기간을 DateTime 범위로 변환
  const getPeriodRange = (): {
    startDate: DateTime;
    endDate: DateTime;
    hasExplicitEndDate: boolean;
    isValid: boolean;
  } => {
    const now = DateTime.now();
    let startDate: DateTime;
    let endDate: DateTime = now;
    let hasExplicitEndDate = false;

    switch (selectedPeriod) {
      case "today":
        startDate = now.startOf("day");
        break;
      case "yesterday":
        startDate = now.minus({ days: 1 }).startOf("day");
        endDate = now.minus({ days: 1 }).endOf("day");
        hasExplicitEndDate = true;
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
      case "custom":
        startDate = DateTime.fromISO(customStartDate).startOf("day");
        endDate = DateTime.fromISO(customEndDate).endOf("day");
        hasExplicitEndDate = true;
        if (!startDate.isValid || !endDate.isValid) {
          return { startDate, endDate, hasExplicitEndDate, isValid: false };
        }
        break;
      default:
        startDate = now.minus({ days: 7 });
    }

    return { startDate, endDate, hasExplicitEndDate, isValid: true };
  };

  // 선택된 기간의 사용자 친화적 라벨
  const getPeriodLabel = (): string => {
    switch (selectedPeriod) {
      case "today":
        return "오늘";
      case "yesterday":
        return "어제";
      case "week":
        return "이번 주";
      case "month":
        return "이번 달";
      case "year":
        return "올해";
      case "custom": {
        const s = DateTime.fromISO(customStartDate);
        const e = DateTime.fromISO(customEndDate);
        if (!s.isValid || !e.isValid) return "선택 기간";
        return `${s.toFormat("yyyy-MM-dd")} ~ ${e.toFormat("yyyy-MM-dd")}`;
      }
      default:
        return "선택 기간";
    }
  };

  const fetchStatistics = async () => {
    if (!userProfile?.id || !userProfile?.school_id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { startDate, endDate, isValid } = getPeriodRange();
      if (!isValid) {
        setLoading(false);
        return;
      }

      // Fetch students
      const { data: students } = await supabase
        .from("users")
        .select("id, name")
        .eq("teacher_id", userProfile.id)
        .eq("role", "student");

      if (!students || students.length === 0) {
        setStudentsCache([]);
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

      setStudentsCache(students);

      // Fetch missions
      const { data: missions } = await supabase
        .from("missions")
        .select("id, title")
        .eq("school_id", userProfile.school_id)
        .eq("is_active", true);

      const studentIds = students.map((s) => s.id);
      const { hasExplicitEndDate } = getPeriodRange();

      let missionLogsQuery = supabase
        .from("mission_logs")
        .select("student_id, mission_id, completed_at")
        .in("student_id", studentIds)
        .gte("completed_at", startDate.toISO());
      if (hasExplicitEndDate) {
        missionLogsQuery = missionLogsQuery.lte("completed_at", endDate.toISO());
      }
      const { data: missionLogs } = await missionLogsQuery;

      let systemBadgesQuery = supabase
        .from("student_system_badges")
        .select("student_id")
        .in("student_id", studentIds)
        .gte("earned_date", startDate.toFormat("yyyy-MM-dd"));
      if (hasExplicitEndDate) {
        systemBadgesQuery = systemBadgesQuery.lte("earned_date", endDate.toFormat("yyyy-MM-dd"));
      }
      const { data: systemBadges } = await systemBadgesQuery;

      let customBadgesQuery = supabase
        .from("student_custom_badges")
        .select("student_id")
        .in("student_id", studentIds)
        .gte("earned_date", startDate.toFormat("yyyy-MM-dd"));
      if (hasExplicitEndDate) {
        customBadgesQuery = customBadgesQuery.lte("earned_date", endDate.toFormat("yyyy-MM-dd"));
      }
      const { data: customBadges } = await customBadgesQuery;

      // Combine both badge types
      const earnedBadges = [...(systemBadges || []), ...(customBadges || [])];

      // Calculate student statistics
      const studentStatsMap = new Map<string, StudentStats>();

      const periodDays = Math.max(1, Math.ceil(endDate.diff(startDate, "days").days));

      students.forEach((student) => {
        studentStatsMap.set(student.id, {
          student_id: student.id,
          student_name: student.name,
          total_missions: (missions?.length || 0) * periodDays,
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
        const maxAttempts = students.length * periodDays;
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

  const handleMissionClick = async (mission: MissionStats) => {
    setSelectedMission(mission);
    setLoadingMissionDetail(true);
    setMissionCompletionDetails([]);

    try {
      const { startDate, endDate, hasExplicitEndDate, isValid } =
        getPeriodRange();
      if (!isValid) {
        setLoadingMissionDetail(false);
        return;
      }

      const studentIds = studentsCache.map((s) => s.id);

      if (studentIds.length === 0) {
        setMissionCompletionDetails([]);
        setLoadingMissionDetail(false);
        return;
      }

      let logsQuery = supabase
        .from("mission_logs")
        .select("student_id, completed_at")
        .eq("mission_id", mission.mission_id)
        .in("student_id", studentIds)
        .gte("completed_at", startDate.toISO());
      if (hasExplicitEndDate) {
        logsQuery = logsQuery.lte("completed_at", endDate.toISO());
      }
      const { data: logs } = await logsQuery;

      // 기간 내 한 번이라도 완료했으면 completed, completed_at은 가장 최근 시각으로
      const completedMap = new Map<string, string>();
      logs?.forEach((log) => {
        const prev = completedMap.get(log.student_id);
        if (!prev || log.completed_at > prev) {
          completedMap.set(log.student_id, log.completed_at);
        }
      });

      const details: MissionCompletionDetail[] = studentsCache.map(
        (student) => ({
          student_id: student.id,
          student_name: student.name,
          completed: completedMap.has(student.id),
          completed_at: completedMap.get(student.id) || null,
        })
      );

      details.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? -1 : 1;
        if (a.completed && b.completed && a.completed_at && b.completed_at) {
          return a.completed_at.localeCompare(b.completed_at);
        }
        return a.student_name.localeCompare(b.student_name, "ko");
      });

      setMissionCompletionDetails(details);
    } catch (error) {
      console.error("Error fetching mission completion details:", error);
    } finally {
      setLoadingMissionDetail(false);
    }
  };

  const handleStudentClick = async (student: StudentStats) => {
    setSelectedStudent(student);
    setLoadingStudentDetail(true);
    setStudentMissionDetails([]);

    try {
      const { startDate, endDate, hasExplicitEndDate, isValid } =
        getPeriodRange();
      if (!isValid) {
        setLoadingStudentDetail(false);
        return;
      }

      const { data: missions } = await supabase
        .from("missions")
        .select("id, title")
        .eq("school_id", userProfile!.school_id)
        .eq("is_active", true)
        .order("order_index", { ascending: true });

      if (!missions || missions.length === 0) {
        setStudentMissionDetails([]);
        setLoadingStudentDetail(false);
        return;
      }

      let logsQuery = supabase
        .from("mission_logs")
        .select("mission_id, completed_at")
        .eq("student_id", student.student_id)
        .gte("completed_at", startDate.toISO());
      if (hasExplicitEndDate) {
        logsQuery = logsQuery.lte("completed_at", endDate.toISO());
      }
      const { data: logs } = await logsQuery;

      // 기간 내 한 번이라도 완료했으면 completed, completed_at은 가장 최근 시각으로
      const logMap = new Map<string, string>();
      logs?.forEach((log) => {
        const prev = logMap.get(log.mission_id);
        if (!prev || log.completed_at > prev) {
          logMap.set(log.mission_id, log.completed_at);
        }
      });

      const details: StudentMissionDetail[] = missions.map((mission) => ({
        mission_id: mission.id,
        mission_title: mission.title,
        completed: logMap.has(mission.id),
        completed_at: logMap.get(mission.id) || null,
      }));

      setStudentMissionDetails(details);
    } catch (error) {
      console.error("Error fetching student mission details:", error);
    } finally {
      setLoadingStudentDetail(false);
    }
  };

  const handleBadgeCardClick = async () => {
    if (overallStats.totalBadgesEarned === 0) return;

    setShowBadgeDetail(true);
    setLoadingBadgeDetail(true);
    setBadgeDetails([]);

    try {
      const studentIds = studentsCache.map((s) => s.id);
      if (studentIds.length === 0) {
        setLoadingBadgeDetail(false);
        return;
      }

      const { startDate, endDate, hasExplicitEndDate, isValid } =
        getPeriodRange();
      if (!isValid) {
        setLoadingBadgeDetail(false);
        return;
      }

      const startDateStr = startDate.toFormat("yyyy-MM-dd");
      const endDateStr = endDate.toFormat("yyyy-MM-dd");

      const studentMap = new Map(studentsCache.map((s) => [s.id, s.name]));

      // 시스템 배지 조회
      let sysQuery = supabase
        .from("student_system_badges")
        .select("student_id, system_badge_id, earned_date")
        .in("student_id", studentIds)
        .gte("earned_date", startDateStr);
      if (hasExplicitEndDate) {
        sysQuery = sysQuery.lte("earned_date", endDateStr);
      }
      const { data: sysBadges } = await sysQuery;

      // 커스텀 배지 조회 (배지 정보 포함)
      let customQuery = supabase
        .from("student_custom_badges")
        .select("student_id, badge_id, earned_date, badges(name, icon)")
        .in("student_id", studentIds)
        .gte("earned_date", startDateStr);
      if (hasExplicitEndDate) {
        customQuery = customQuery.lte("earned_date", endDateStr);
      }
      const { data: custBadges } = await customQuery;

      const details: typeof badgeDetails = [];

      // 시스템 배지 처리
      const systemBadgeNames: Record<string, { name: string; icon: string }> = {
        daily_mission_complete: { name: "오늘의 미션 달성", icon: "✅" },
        weekly_mission_complete: { name: "주간 미션 달성", icon: "🌟" },
        daily_hero: { name: "오늘의 영웅", icon: "🦸" },
      };

      sysBadges?.forEach((b) => {
        const info = systemBadgeNames[b.system_badge_id] || {
          name: b.system_badge_id,
          icon: "🏅",
        };
        details.push({
          student_name: studentMap.get(b.student_id) || "알 수 없음",
          badge_name: info.name,
          badge_icon: info.icon,
          earned_date: b.earned_date,
          badge_type: "system",
        });
      });

      // 커스텀 배지 처리
      custBadges?.forEach((b: any) => {
        const badge = b.badges;
        details.push({
          student_name: studentMap.get(b.student_id) || "알 수 없음",
          badge_name: badge?.name || "알 수 없음",
          badge_icon: badge?.icon || "🏅",
          earned_date: b.earned_date,
          badge_type: "custom",
        });
      });

      details.sort(
        (a, b) => b.earned_date.localeCompare(a.earned_date) ||
          a.student_name.localeCompare(b.student_name, "ko")
      );

      setBadgeDetails(details);
    } catch (error) {
      console.error("Error fetching badge details:", error);
    } finally {
      setLoadingBadgeDetail(false);
    }
  };

  if (loading) {
    return <LoadingWithRefresh />;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold">통계</h1>
            <p className="text-gray-600 mt-1">
              학생들의 미션 수행 현황을 확인합니다.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-40 bg-white border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-300">
                <SelectItem value="today">오늘</SelectItem>
                <SelectItem value="yesterday">어제</SelectItem>
                <SelectItem value="week">이번 주</SelectItem>
                <SelectItem value="month">이번 달</SelectItem>
                <SelectItem value="year">올해</SelectItem>
                <SelectItem value="custom">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    기간 지정
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            {selectedPeriod === "custom" && (
              <div className="flex items-center gap-1.5">
                <Input
                  type="date"
                  value={customStartDate}
                  max={customEndDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-[140px] bg-white border-gray-300 text-sm"
                />
                <span className="text-gray-400 text-sm">~</span>
                <Input
                  type="date"
                  value={customEndDate}
                  min={customStartDate}
                  max={DateTime.now().toFormat("yyyy-MM-dd")}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-[140px] bg-white border-gray-300 text-sm"
                />
              </div>
            )}
          </div>
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

          <Card
            className={`${
              overallStats.totalBadgesEarned > 0
                ? "cursor-pointer hover:shadow-md hover:border-yellow-300 transition-all"
                : ""
            }`}
            onClick={handleBadgeCardClick}
          >
            <CardHeader className="pb-3">
              <Award className="h-8 w-8 text-yellow-600 mb-2" />
              <CardTitle className="text-lg flex items-center gap-1">
                획득한 배지
                {overallStats.totalBadgesEarned > 0 && (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
              </CardTitle>
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
            <CardDescription>
              기간 내 미션 달성률 순위
              {studentStats.length > 0 && (
                <span className="ml-2 text-gray-400">
                  ({studentStats.length}명)
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {studentStats.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                아직 데이터가 없습니다.
              </p>
            ) : (
              <div className="max-h-[480px] overflow-y-auto pr-1 space-y-3">
                {studentStats
                  .sort((a, b) => b.completion_rate - a.completion_rate)
                  .map((student, index) => {
                    const rate = student.completion_rate;
                    const barColor =
                      rate >= 80
                        ? "bg-emerald-500"
                        : rate >= 50
                          ? "bg-amber-400"
                          : "bg-rose-400";

                    return (
                      <div
                        key={student.student_id}
                        className="flex items-center gap-3"
                      >
                        <span className="text-sm font-bold text-gray-400 w-6 text-right shrink-0">
                          {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleStudentClick(student)}
                          className="font-medium w-20 truncate shrink-0 text-left hover:text-blue-600 hover:underline cursor-pointer transition-colors"
                        >
                          {student.student_name}
                        </button>
                        <div className="flex-1 flex items-center gap-3 min-w-0">
                          <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                              style={{ width: `${Math.max(rate, 2)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 shrink-0 w-16 text-right">
                            {student.completed_missions}/
                            {student.total_missions} 완료
                          </span>
                          <Badge
                            className="shrink-0 w-14 justify-center"
                            variant={rate >= 80 ? "default" : "secondary"}
                          >
                            {rate}%
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mission Stats */}
        <Card>
          <CardHeader>
            <CardTitle>미션별 통계</CardTitle>
            <CardDescription>
              각 미션의 수행 현황 (클릭하면 {getPeriodLabel()} 달성 현황을 확인할 수 있습니다)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {missionStats.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                아직 설정된 미션이 없습니다.
              </p>
            ) : (
              <div className="space-y-2">
                {missionStats.map((mission) => (
                  <button
                    key={mission.mission_id}
                    type="button"
                    onClick={() => handleMissionClick(mission)}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium truncate">
                        {mission.mission_title}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
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
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 미션 달성 현황 다이얼로그 */}
      <Dialog
        open={!!selectedMission}
        onOpenChange={(open) => {
          if (!open) setSelectedMission(null);
        }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              {selectedMission?.mission_title}
            </DialogTitle>
            <DialogDescription>
              {getPeriodLabel()} 달성 현황
            </DialogDescription>
          </DialogHeader>

          {loadingMissionDetail ? (
            <div className="flex justify-center py-8">
              <div
                className="animate-spin rounded-full h-8 w-8 border-b-2"
                style={{ borderColor: "var(--color-primary-medium)" }}
              />
            </div>
          ) : missionCompletionDetails.length === 0 ? (
            <p className="text-center text-gray-500 py-6">
              등록된 학생이 없습니다.
            </p>
          ) : (
            <>
              <div className="flex items-center gap-4 px-1 mb-1">
                <div className="flex items-center gap-1.5 text-sm text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium">
                    달성{" "}
                    {
                      missionCompletionDetails.filter((d) => d.completed).length
                    }
                    명
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-400">
                  <XCircle className="h-4 w-4" />
                  <span className="font-medium">
                    미달성{" "}
                    {
                      missionCompletionDetails.filter((d) => !d.completed)
                        .length
                    }
                    명
                  </span>
                </div>
              </div>

              <div className="max-h-[360px] overflow-y-auto space-y-1">
                {(() => {
                  let completedRank = 0;
                  return missionCompletionDetails.map((detail) => {
                    if (detail.completed) completedRank++;
                    const rank = detail.completed ? completedRank : null;

                    return (
                      <div
                        key={detail.student_id}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${
                          detail.completed ? "bg-emerald-50" : "bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {detail.completed ? (
                            <span className="text-xs font-bold text-emerald-600 w-5 text-center shrink-0">
                              {rank}
                            </span>
                          ) : (
                            <XCircle className="h-5 w-5 text-gray-300 shrink-0" />
                          )}
                          <span
                            className={`font-medium ${detail.completed ? "text-gray-900" : "text-gray-400"}`}
                          >
                            {detail.student_name}
                          </span>
                        </div>
                        {detail.completed && detail.completed_at && (
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="h-3 w-3" />
                            {DateTime.fromISO(detail.completed_at).toFormat(
                              "HH:mm"
                            )}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedMission(null)}
            >
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 학생 미션 달성 현황 다이얼로그 */}
      <Dialog
        open={!!selectedStudent}
        onOpenChange={(open) => {
          if (!open) setSelectedStudent(null);
        }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              {selectedStudent?.student_name}
            </DialogTitle>
            <DialogDescription>
              {getPeriodLabel()} 미션 달성 현황
            </DialogDescription>
          </DialogHeader>

          {loadingStudentDetail ? (
            <div className="flex justify-center py-8">
              <div
                className="animate-spin rounded-full h-8 w-8 border-b-2"
                style={{ borderColor: "var(--color-primary-medium)" }}
              />
            </div>
          ) : studentMissionDetails.length === 0 ? (
            <p className="text-center text-gray-500 py-6">
              설정된 미션이 없습니다.
            </p>
          ) : (
            <>
              <div className="flex items-center gap-4 px-1 mb-1">
                <div className="flex items-center gap-1.5 text-sm text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium">
                    달성{" "}
                    {studentMissionDetails.filter((d) => d.completed).length}/
                    {studentMissionDetails.length}
                  </span>
                </div>
              </div>

              <div className="max-h-[360px] overflow-y-auto space-y-1">
                {studentMissionDetails.map((detail) => (
                  <div
                    key={detail.mission_id}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${
                      detail.completed ? "bg-emerald-50" : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {detail.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-300 shrink-0" />
                      )}
                      <span
                        className={`font-medium ${detail.completed ? "text-gray-900" : "text-gray-400"}`}
                      >
                        {detail.mission_title}
                      </span>
                    </div>
                    {detail.completed && detail.completed_at && (
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="h-3 w-3" />
                        {DateTime.fromISO(detail.completed_at).toFormat(
                          "HH:mm"
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedStudent(null)}
            >
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 배지 상세 다이얼로그 */}
      <Dialog
        open={showBadgeDetail}
        onOpenChange={(open) => {
          if (!open) setShowBadgeDetail(false);
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-600" />
              획득한 도전과제 상세
            </DialogTitle>
            <DialogDescription>
              {badgeDetails.length > 0
                ? `총 ${badgeDetails.length}개의 도전과제가 달성되었습니다.`
                : "달성된 도전과제가 없습니다."}
            </DialogDescription>
          </DialogHeader>

          {loadingBadgeDetail ? (
            <div className="flex justify-center py-8">
              <div
                className="animate-spin rounded-full h-8 w-8 border-b-2"
                style={{ borderColor: "var(--color-primary-medium)" }}
              />
            </div>
          ) : badgeDetails.length === 0 ? (
            <p className="text-center text-gray-500 py-6">
              해당 기간에 획득한 도전과제가 없습니다.
            </p>
          ) : (
            <div className="max-h-[400px] overflow-y-auto space-y-1.5">
              {badgeDetails.map((detail, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-yellow-50"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {detail.badge_icon &&
                    detail.badge_icon.startsWith("http") ? (
                      <img
                        src={detail.badge_icon}
                        alt={detail.badge_name}
                        className="w-7 h-7 object-contain shrink-0"
                      />
                    ) : (
                      <span className="text-lg shrink-0">
                        {detail.badge_icon || "🏅"}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">
                        {detail.student_name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {detail.badge_name}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0 ml-2">
                    {DateTime.fromISO(detail.earned_date).toFormat("M/d")}
                  </span>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBadgeDetail(false)}
            >
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
