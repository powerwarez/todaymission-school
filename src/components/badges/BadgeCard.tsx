import React from "react";
import { LuTrophy, LuTrash2 } from "react-icons/lu";
import { DisplayBadge } from "./types";

interface BadgeCardProps {
  badge: DisplayBadge;
  onBadgeClick: (badge: DisplayBadge) => void;
  onDeleteClick: (badge: DisplayBadge) => void;
  isDeletingBadge: boolean;
}

export const BadgeCard: React.FC<BadgeCardProps> = ({
  badge,
  onBadgeClick,
  onDeleteClick,
  isDeletingBadge,
}) => {
  return (
    <li className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm hover:bg-gray-50 transition-colors">
      <div
        className="flex items-center space-x-4 flex-grow cursor-pointer"
        onClick={() => onBadgeClick(badge)}>
        {/* 배지 아이콘 표시 */}
        {badge.icon && badge.icon.startsWith("http") ? (
          <img
            src={badge.icon}
            alt={badge.name}
            className="w-12 h-12 object-contain"
          />
        ) : (
          <div className="w-12 h-12 flex items-center justify-center text-2xl bg-gray-100 rounded-lg">
            {badge.icon || (
              <LuTrophy className="text-gray-400" />
            )}
          </div>
        )}

        {/* 배지 정보 */}
        <div className="flex-grow">
          <h3 className="font-semibold text-lg">{badge.name}</h3>
          <p
            className="text-sm"
            style={{ color: "var(--color-text-muted)" }}>
            {badge.description}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            목표: {badge.target_count}회 달성
          </p>
        </div>

        {/* 달성 횟수 표시 */}
        {badge.count > 0 && (
          <span
            className="text-lg font-bold"
            style={{
              color: "var(--color-primary-medium)",
            }}>
            {badge.count}회 달성
          </span>
        )}
        
        {/* 삭제 버튼 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteClick(badge);
          }}
          disabled={isDeletingBadge}
          className="ml-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
          title="배지 삭제">
          {isDeletingBadge ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-500" />
          ) : (
            <LuTrash2 size={20} />
          )}
        </button>
      </div>
    </li>
  );
};
