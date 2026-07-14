import React, { useEffect, useState } from "react";
import { LuX, LuCheck } from "react-icons/lu";
import { toast } from "sonner";
import { DisplayBadge, StudentListItem } from "./types";
import { DateTime } from "luxon";
import {
  fetchCandyGivenStudents,
  markCandyGiven,
} from "../../utils/candyGivenStorage";

interface StudentListModalProps {
  badge: DisplayBadge;
  studentList: StudentListItem[];
  isLoading: boolean;
  teacherId: string;
  onClose: () => void;
}

const RECENT_DAYS = 7;

function isRecent(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const earned = DateTime.fromISO(dateStr);
  const diff = DateTime.now().diff(earned, "days").days;
  return diff <= RECENT_DAYS;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "–";
  return DateTime.fromISO(dateStr)
    .setZone("Asia/Seoul")
    .toLocaleString({ year: "numeric", month: "long", day: "numeric" });
}

interface ProgressBarProps {
  current: number;
  target: number;
  earned: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  target,
  earned,
}) => {
  const pct = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
  const barColor = earned
    ? "bg-emerald-500"
    : pct >= 70
    ? "bg-blue-400"
    : pct >= 30
    ? "bg-yellow-400"
    : "bg-gray-300";

  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-[60px]">
        <div
          className={`${barColor} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 w-9 text-right shrink-0">
        {pct}%
      </span>
    </div>
  );
};

function isFullyAchieved(student: StudentListItem): boolean {
  if (student.target_count <= 0) return student.earned_date !== null;
  return student.current_count >= student.target_count;
}

const CandyIcon: React.FC = () => (
  <svg
    viewBox="0 0 24 24"
    className="h-4 w-4 shrink-0"
    aria-hidden="true">
    <ellipse cx="7" cy="12" rx="5" ry="7" fill="#f472b6" />
    <ellipse cx="17" cy="12" rx="5" ry="7" fill="#f472b6" />
    <rect x="7" y="9" width="10" height="6" rx="1" fill="#ec4899" />
    <path
      d="M2 12 Q4 9 7 12 Q4 15 2 12"
      fill="#fda4af"
      stroke="#fb7185"
      strokeWidth="0.5"
    />
    <path
      d="M22 12 Q20 9 17 12 Q20 15 22 12"
      fill="#fda4af"
      stroke="#fb7185"
      strokeWidth="0.5"
    />
  </svg>
);

export const StudentListModal: React.FC<StudentListModalProps> = ({
  badge,
  studentList,
  isLoading,
  teacherId,
  onClose,
}) => {
  const [candyGiven, setCandyGiven] = useState<Set<string>>(new Set());
  const [loadingCandy, setLoadingCandy] = useState(true);
  const [markingCandyId, setMarkingCandyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadCandyGiven = async () => {
      setLoadingCandy(true);
      try {
        const given = await fetchCandyGivenStudents(badge.id);
        if (!cancelled) setCandyGiven(given);
      } catch (err) {
        console.error("사탕 지급 기록 로드 오류:", err);
        if (!cancelled) {
          toast.error("사탕 지급 기록을 불러오지 못했습니다.");
        }
      } finally {
        if (!cancelled) setLoadingCandy(false);
      }
    };

    loadCandyGiven();
    return () => {
      cancelled = true;
    };
  }, [badge.id]);

  const handleCandyClick = async (studentId: string) => {
    if (markingCandyId) return;

    setMarkingCandyId(studentId);
    setCandyGiven((prev) => new Set([...prev, studentId]));

    try {
      await markCandyGiven(badge.id, studentId, teacherId);
    } catch (err) {
      console.error("사탕 지급 기록 저장 오류:", err);
      setCandyGiven((prev) => {
        const next = new Set(prev);
        next.delete(studentId);
        return next;
      });
      toast.error("사탕 지급 완료 표시에 실패했습니다.");
    } finally {
      setMarkingCandyId(null);
    }
  };

  const earnedCount = studentList.filter((s) => s.earned_date !== null).length;
  const totalCount = studentList.length;
  const pendingCandyCount = studentList.filter(
    (s) => isFullyAchieved(s) && !candyGiven.has(s.student_id)
  ).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full m-4 max-h-[80vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold">
              "{badge.name}" 달성 학생 목록
            </h3>
            {badge.criteria?.target_count && (
              <p className="text-xs text-gray-400 mt-0.5">
                목표: {badge.criteria.target_count.toLocaleString()}회 달성
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 ml-4 shrink-0">
            <LuX className="h-6 w-6" />
          </button>
        </div>

        {/* 본문 */}
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          </div>
        ) : studentList.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            등록된 학생이 없습니다.
          </div>
        ) : (
          <div className="overflow-auto flex-1">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                    학생 이름
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                    획득 날짜
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    달성률
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {studentList.map((student) => {
                  const earned = student.earned_date !== null;
                  const recent = isRecent(student.earned_date);
                  const fullyAchieved = isFullyAchieved(student);
                  const showCandy =
                    fullyAchieved &&
                    !candyGiven.has(student.student_id) &&
                    !loadingCandy;
                  return (
                    <tr
                      key={student.student_id}
                      className={`hover:bg-gray-50 transition-colors ${
                        earned ? "" : "opacity-60"
                      }`}>
                      {/* 학생 이름 */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {earned && (
                            <LuCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          )}
                          <span
                            className={
                              earned ? "font-medium" : "text-gray-500"
                            }>
                            {student.student_name}
                          </span>
                          {recent && (
                            <span className="text-[10px] font-bold px-1 py-0.5 rounded bg-orange-100 text-orange-600 leading-none shrink-0">
                              NEW
                            </span>
                          )}
                          {showCandy && (
                            <button
                              type="button"
                              onClick={() =>
                                handleCandyClick(student.student_id)
                              }
                              disabled={markingCandyId === student.student_id}
                              title="클릭하면 사탕 지급 완료로 표시됩니다"
                              className="ml-0.5 p-0.5 rounded hover:bg-pink-50 transition-colors shrink-0 disabled:opacity-50"
                              aria-label={`${student.student_name} 사탕 지급 완료 표시`}>
                              <CandyIcon />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* 획득 날짜 */}
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500 text-xs">
                        {formatDate(student.earned_date)}
                      </td>

                      {/* 달성률 프로그레스바 */}
                      <td className="px-4 py-3">
                        <ProgressBar
                          current={student.current_count}
                          target={student.target_count}
                          earned={earned}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 푸터 요약 */}
        <div className="mt-4 pt-4 border-t flex flex-col items-center gap-2 text-sm text-gray-600">
          <div className="flex items-center justify-center gap-3">
            <span>
              총{" "}
              <strong className="text-gray-800">{totalCount}</strong>명 중{" "}
              <strong className="text-emerald-600">{earnedCount}</strong>명 달성
            </span>
            {totalCount > 0 && (
              <span className="text-gray-400">
                ({Math.round((earnedCount / totalCount) * 100)}%)
              </span>
            )}
          </div>
          {pendingCandyCount > 0 && !loadingCandy && (
            <p className="flex items-center gap-1.5 text-xs text-pink-600">
              <CandyIcon />
              <span>
                사탕 미지급{" "}
                <strong>{pendingCandyCount}</strong>명 — 아이콘을 클릭하면
                지급 완료로 표시됩니다
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
