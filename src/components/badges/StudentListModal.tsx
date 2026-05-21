import React from "react";
import { LuX, LuCheck } from "react-icons/lu";
import { DisplayBadge, StudentListItem } from "./types";
import { DateTime } from "luxon";

interface StudentListModalProps {
  badge: DisplayBadge;
  studentList: StudentListItem[];
  isLoading: boolean;
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

export const StudentListModal: React.FC<StudentListModalProps> = ({
  badge,
  studentList,
  isLoading,
  onClose,
}) => {
  const earnedCount = studentList.filter((s) => s.earned_date !== null).length;
  const totalCount = studentList.length;

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
        <div className="mt-4 pt-4 border-t flex items-center justify-center gap-3 text-sm text-gray-600">
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
      </div>
    </div>
  );
};
