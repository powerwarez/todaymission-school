import React from "react";
import { DisplayBadge } from "./types";

interface DeleteBadgeModalProps {
  badge: DisplayBadge;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteBadgeModal: React.FC<
  DeleteBadgeModalProps
> = ({ badge, isDeleting, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full m-4">
        <h3 className="text-lg font-semibold mb-4">
          배지 삭제 확인
        </h3>
        <p className="text-gray-600 mb-6">
          정말로{" "}
          <span className="font-semibold">
            {badge.name}
          </span>{" "}
          배지를 삭제하시겠습니까?
          {badge.count > 0 && (
            <span className="block mt-2 text-sm text-amber-600">
              이 배지를 획득한 학생이 있는 경우 비활성화만
              됩니다.
            </span>
          )}
        </p>
        <div className="flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50">
            {isDeleting ? "삭제 중..." : "삭제"}
          </button>
        </div>
      </div>
    </div>
  );
};
