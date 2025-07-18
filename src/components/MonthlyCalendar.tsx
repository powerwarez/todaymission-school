import React from "react";
import { DailyMissionSnapshot } from "../types"; // MissionLog 대신 Snapshot 타입 사용
import { DateTime } from "luxon"; // Luxon DateTime import

// 시간대 정의
const timeZone = "Asia/Seoul";

interface MonthlyCalendarProps {
  year: number;
  month: number;
  snapshots: DailyMissionSnapshot[]; // 로그 대신 스냅샷 배열 받기
}

// 날짜별 스냅샷 데이터를 빠르게 찾기 위한 맵 생성
const processSnapshots = (
  snapshots: DailyMissionSnapshot[]
): Map<string, DailyMissionSnapshot> => {
  console.log(
    "[MonthlyCalendar] 받은 스냅샷 데이터:",
    snapshots
  );
  const snapshotsByDate = new Map<
    string,
    DailyMissionSnapshot
  >();
  snapshots.forEach((snapshot) => {
    console.log(
      `[MonthlyCalendar] 처리 중: ${snapshot.date}, 총 미션: ${snapshot.total_missions_count}, 완료: ${snapshot.completed_missions_count}`
    );
    snapshotsByDate.set(snapshot.date, snapshot); // date는 이미 YYYY-MM-DD 형식
  });
  console.log(
    "[MonthlyCalendar] 처리된 날짜별 맵:",
    Array.from(snapshotsByDate.entries())
  );
  return snapshotsByDate;
};

const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({
  year,
  month,
  snapshots,
}) => {
  console.log(
    `[MonthlyCalendar] 렌더링 - ${year}년 ${month}월, 스냅샷 개수: ${snapshots.length}`
  );
  const snapshotsByDate = processSnapshots(snapshots);
  // Luxon을 사용하여 월의 일수와 첫날 요일 계산
  const monthDateTime = DateTime.fromObject(
    { year, month, day: 1 },
    { zone: timeZone }
  );
  const daysInMonth = monthDateTime.daysInMonth || 0;
  const firstDayOfMonth = monthDateTime.weekday % 7; // Luxon은 월요일이 1, 일요일이 7이므로 변환 필요

  const days = Array.from(
    { length: daysInMonth },
    (_, i) => i + 1
  );
  const leadingEmptyDays = Array.from({
    length: firstDayOfMonth,
  });

  const getDayStyle = (day: number) => {
    // 해당 날짜 칸의 KST 기준 날짜 문자열 생성
    // Luxon을 사용하여 명확하게 KST 기준으로 날짜 생성
    const dateTime = DateTime.fromObject(
      { year, month, day },
      { zone: timeZone }
    );
    const dateStr = dateTime.toFormat("yyyy-MM-dd");
    const snapshot = snapshotsByDate.get(dateStr);

    if (day === 18) {
      console.log(`[MonthlyCalendar] 18일 스타일 확인:`, {
        dateStr,
        snapshot,
        hasSnapshot: !!snapshot,
        totalMissions: snapshot?.total_missions_count,
        completedMissions:
          snapshot?.completed_missions_count,
      });
    }

    if (!snapshot || snapshot.total_missions_count === 0) {
      return {
        className: "bg-gray-100 text-gray-400",
        style: {},
      }; // 스냅샷 없거나 총 미션 0개 (흐리게)
    }

    const {
      completed_missions_count,
      total_missions_count,
    } = snapshot;

    if (completed_missions_count === 0) {
      return {
        className: "bg-gray-200 text-gray-600",
        style: {},
      }; // 완료 0개 (조금 더 진하게)
    }

    const completionRate =
      (completed_missions_count / total_missions_count) *
      100;
    const completionStyle =
      getCompletionStyle(completionRate);

    return {
      className: "",
      style: completionStyle,
    };
  };

  const renderDay = (day: number) => {
    // 해당 날짜 칸의 KST 기준 날짜 문자열 생성
    const dateTime = DateTime.fromObject(
      { year, month, day },
      { zone: timeZone }
    );
    const dateStr = dateTime.toFormat("yyyy-MM-dd");
    const snapshot = snapshotsByDate.get(dateStr);

    // 오늘 날짜 비교도 KST 기준으로
    const todayStr = DateTime.now()
      .setZone(timeZone)
      .toFormat("yyyy-MM-dd");
    const isToday = dateStr === todayStr;

    const completedCount =
      snapshot?.completed_missions_count ?? 0;
    const totalCount = snapshot?.total_missions_count;

    const dayStyle = getDayStyle(day);

    return (
      <div
        key={day}
        className={`h-16 flex flex-col items-center justify-center rounded-md transition-colors duration-200 ${
          dayStyle.className
        } ${isToday ? "ring-2 ring-offset-1" : ""}`}
        style={{
          ...dayStyle.style,
          ...(isToday
            ? {
                boxShadow: `0 0 0 2px var(--color-primary-medium)`,
              }
            : {}),
        }}>
        <span className="text-sm font-medium">{day}</span>
        {/* 스냅샷이 있고 총 미션 수가 0보다 클 때만 카운트 표시 */}
        {snapshot &&
          totalCount !== undefined &&
          totalCount > 0 && (
            <span className="text-xs mt-1">{`${completedCount}/${totalCount}`}</span>
          )}
        {/* 스냅샷은 없지만 날짜는 있는 경우 (미래 날짜 등) 빈 칸 유지 */}
      </div>
    );
  };

  // 완료율에 따른 스타일 결정
  const getCompletionStyle = (completionRate: number) => {
    if (completionRate >= 100) {
      return {
        backgroundColor: "var(--color-success)",
        color: "white",
        fontWeight: "bold",
      }; // 100% 완료
    } else if (completionRate >= 60) {
      return {
        backgroundColor: "var(--color-success-light)",
        color: "var(--color-success-dark)",
      }; // 60% 이상
    } else if (completionRate >= 30) {
      return {
        backgroundColor: "var(--color-warning-light)",
        color: "var(--color-warning-dark)",
      }; // 30% 이상
    } else {
      return {
        backgroundColor: "var(--color-error-light)",
        color: "var(--color-error-dark)",
      }; // 30% 미만
    }
  };

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-600 mb-2">
        <div>일</div>
        <div>월</div>
        <div>화</div>
        <div>수</div>
        <div>목</div>
        <div>금</div>
        <div>토</div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {leadingEmptyDays.map((_, index) => (
          <div
            key={`empty-${index}`}
            className="h-16"></div>
        ))}
        {days.map((day) => renderDay(day))}
      </div>
    </div>
  );
};

export default MonthlyCalendar;
