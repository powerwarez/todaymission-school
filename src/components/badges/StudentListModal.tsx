import React from "react";
import { LuX } from "react-icons/lu";
import { DisplayBadge, StudentListItem } from "./types";
import { DateTime } from "luxon";

interface StudentListModalProps {
  badge: DisplayBadge;
  studentList: StudentListItem[];
  isLoading: boolean;
  onClose: () => void;
}

export const StudentListModal: React.FC<
  StudentListModalProps
> = ({ badge, studentList, isLoading, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full m-4 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            "{badge.name}" 달성 학생 목록
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700">
            <LuX className="h-6 w-6" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          </div>
        ) : studentList.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            아직 이 배지를 달성한 학생이 없습니다.
          </div>
        ) : (
          <div className="overflow-auto flex-1">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    학생 이름
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    획득 날짜
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {studentList.map((student) => (
                  <tr
                    key={student.student_id}
                    className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {student.student_name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                      {DateTime.fromISO(student.earned_date)
                        .setZone("Asia/Seoul")
                        .toLocaleString({
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-600 text-center">
            총 {studentList.length}명의 학생이 달성했습니다.
          </p>
        </div>
      </div>
    </div>
  );
};
