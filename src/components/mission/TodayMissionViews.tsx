import React, { useState } from "react";
import { LuGift } from "react-icons/lu";
import WeeklyStatusDisplay from "../WeeklyStatusDisplay";
import { WeekdayStatus } from "../../hooks/useWeeklyCompletionStatus";
import { AppLayout } from "../../theme/layouts";

export interface MissionStatusItem {
  id: string;
  content: string;
  is_completed_today: boolean;
}

interface TodayMissionViewsProps {
  layout: AppLayout | null;
  studentName: string;
  dateLabel: string;
  weekdayLabel: string;
  showWeeklyReward: boolean;
  weeklyRewardGoal: string;
  missions: MissionStatusItem[];
  weekStatus: WeekdayStatus[];
  weekLoading: boolean;
  weekError: string | null;
  onToggle: (mission: MissionStatusItem) => void;
}

const Reward: React.FC<{ goal: string }> = ({ goal }) => (
  <div
    className="mb-6 rounded-lg p-3"
    style={{ backgroundColor: "var(--color-bg-hover)" }}
  >
    <div className="flex items-center">
      <LuGift className="mr-2" size={28} style={{ color: "var(--color-primary-medium)" }} />
      <p className="text-2xl font-semibold" style={{ color: "var(--color-text-primary)" }}>
        이번주 보상
      </p>
    </div>
    <p className="mt-2 text-2xl" style={{ color: "var(--color-text-secondary)" }}>
      {goal}
    </p>
  </div>
);

const TodayMissionViews: React.FC<TodayMissionViewsProps> = (props) => {
  if (props.layout === "bento") return <BentoView {...props} />;
  if (props.layout === "split") return <SplitView {...props} />;
  if (props.layout === "hero") return <HeroView {...props} />;
  if (props.layout === "poster") return <PosterView {...props} />;
  if (props.layout === "rail") return <RailView {...props} />;
  return <ClassicView {...props} />;
};

const ClassicView: React.FC<TodayMissionViewsProps> = ({
  studentName,
  dateLabel,
  weekdayLabel,
  showWeeklyReward,
  weeklyRewardGoal,
  missions,
  weekStatus,
  weekLoading,
  weekError,
  onToggle,
}) => (
  <div>
    <div className="mb-2 flex items-center justify-between">
      <h1 className="text-3xl font-bold" style={{ color: "var(--color-text-primary)" }}>
        {studentName}
      </h1>
      <div className="text-right">
        <p className="text-lg font-semibold" style={{ color: "var(--color-text-secondary)" }}>
          {dateLabel}
        </p>
        <p style={{ color: "var(--color-text-muted)" }}>{weekdayLabel}</p>
      </div>
    </div>
    {showWeeklyReward && <Reward goal={weeklyRewardGoal} />}
    <div className="flex flex-col gap-6 md:flex-row">
      <MissionCards missions={missions} onToggle={onToggle} />
      <WeeklyStatusDisplay weekStatus={weekStatus} loading={weekLoading} error={weekError} />
    </div>
  </div>
);

const RailView: React.FC<TodayMissionViewsProps> = (props) => {
  const done = props.missions.filter((mission) => mission.is_completed_today).length;
  return (
    <div>
      <p className="text-xs tracking-widest" style={{ color: "var(--color-text-muted)" }}>
        {props.dateLabel} · {props.weekdayLabel}
      </p>
      <h1 className="mt-1 text-3xl font-bold" style={{ color: "var(--color-text-primary)" }}>
        {props.studentName}
      </h1>
      {props.showWeeklyReward && (
        <p className="mt-2 mb-4" style={{ color: "var(--color-text-secondary)" }}>
          {props.weeklyRewardGoal}
        </p>
      )}
      <p className="mb-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
        {done}/{props.missions.length} 완료
      </p>
      <div>
        {props.missions.map((mission) => (
          <button
            key={mission.id}
            type="button"
            onClick={() => props.onToggle(mission)}
            className="grid w-full grid-cols-[20px_1fr_auto] items-center gap-3 border-t py-3 text-left"
            style={{ borderColor: "var(--color-border-light)" }}
          >
            <span
              className="h-4 w-4 rounded-sm border"
              style={{
                borderColor: "var(--color-text-primary)",
                backgroundColor: mission.is_completed_today
                  ? "var(--color-primary-dark)"
                  : "transparent",
              }}
            />
            <span
              className={mission.is_completed_today ? "line-through" : "font-medium"}
              style={{ color: "var(--color-text-primary)" }}
            >
              {mission.content}
            </span>
            <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              {mission.is_completed_today ? "완료" : "남음"}
            </span>
          </button>
        ))}
      </div>
      <div className="mt-5">
        <WeeklyStatusDisplay
          weekStatus={props.weekStatus}
          loading={props.weekLoading}
          error={props.weekError}
          direction="row"
        />
      </div>
    </div>
  );
};

const BentoView: React.FC<TodayMissionViewsProps> = (props) => {
  const remaining = props.missions.filter((mission) => !mission.is_completed_today).length;
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
        {props.studentName} · 오늘의 미션
      </h1>
      <div className="grid gap-3 md:grid-cols-3">
        <div
          className="rounded-2xl p-5 md:row-span-2"
          style={{ backgroundColor: "var(--color-primary-dark)", color: "#fff" }}
        >
          <p className="text-sm opacity-80">오늘 남음</p>
          <p className="mt-6 text-6xl font-extrabold tracking-tight">{remaining}</p>
          <p className="mt-4 text-sm opacity-80">
            {props.missions.length}개 중 {props.missions.length - remaining}개 완료
          </p>
        </div>
        {props.missions.map((mission) => (
          <button
            key={mission.id}
            type="button"
            onClick={() => props.onToggle(mission)}
            className="rounded-2xl p-4 text-left"
            style={{ backgroundColor: "var(--color-bg-card)" }}
          >
            <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              {mission.is_completed_today ? "완료" : "남음"}
            </span>
            <b className="mt-6 block" style={{ color: "var(--color-text-primary)" }}>
              {mission.content}
            </b>
          </button>
        ))}
        {props.showWeeklyReward && (
          <div
            className="rounded-2xl p-4 md:col-span-2"
            style={{ backgroundColor: "var(--color-bg-hover)" }}
          >
            <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              이번주 보상
            </span>
            <b className="mt-3 block" style={{ color: "var(--color-text-primary)" }}>
              {props.weeklyRewardGoal}
            </b>
          </div>
        )}
      </div>
    </div>
  );
};

const SplitView: React.FC<TodayMissionViewsProps> = (props) => {
  const initial = props.missions.find((mission) => !mission.is_completed_today)?.id
    ?? props.missions[0]?.id
    ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(initial);
  const selected = props.missions.find((mission) => mission.id === selectedId) ?? props.missions[0];

  return (
    <div className="grid gap-4 md:grid-cols-[260px_1fr]">
      <aside className="rounded-xl p-3" style={{ backgroundColor: "var(--color-bg-card)" }}>
        <p className="px-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
          오늘의 미션
        </p>
        <div className="mt-2 space-y-1">
          {props.missions.map((mission) => (
            <button
              key={mission.id}
              type="button"
              onClick={() => setSelectedId(mission.id)}
              className="flex w-full justify-between rounded-lg px-3 py-2 text-left text-sm"
              style={{
                backgroundColor:
                  selected?.id === mission.id
                    ? "var(--color-primary-dark)"
                    : "transparent",
                color: selected?.id === mission.id ? "#fff" : "var(--color-text-primary)",
              }}
            >
              <span>{mission.content}</span>
              {mission.is_completed_today && <span>완료</span>}
            </button>
          ))}
        </div>
      </aside>
      {selected && (
        <section className="p-2">
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            {props.studentName} · {props.dateLabel} {props.weekdayLabel}
          </p>
          <h1 className="mt-2 text-3xl font-bold" style={{ color: "var(--color-text-primary)" }}>
            {selected.content}
          </h1>
          <p className="mt-3" style={{ color: "var(--color-text-secondary)" }}>
            {selected.is_completed_today
              ? "오늘 완료했습니다. 다시 누르면 완료가 취소됩니다."
              : "아직 완료하지 않았습니다. 누르면 오늘 미션에 기록됩니다."}
          </p>
          {props.showWeeklyReward && (
            <p className="mt-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
              이번주 보상: {props.weeklyRewardGoal}
            </p>
          )}
          <button
            type="button"
            onClick={() => props.onToggle(selected)}
            className="mt-5 rounded-xl px-4 py-3 font-semibold text-white"
            style={{ backgroundColor: "var(--color-primary-dark)" }}
          >
            {selected.is_completed_today ? "완료 취소" : "오늘 완료로 표시"}
          </button>
          <div className="mt-8">
            <WeeklyStatusDisplay
              weekStatus={props.weekStatus}
              loading={props.weekLoading}
              error={props.weekError}
              direction="row"
            />
          </div>
        </section>
      )}
    </div>
  );
};

const HeroView: React.FC<TodayMissionViewsProps> = (props) => {
  const done = props.missions.filter((mission) => mission.is_completed_today).length;
  const remaining = props.missions.length - done;
  return (
    <div className="overflow-hidden rounded-2xl" style={{ backgroundColor: "var(--color-bg-card)" }}>
      <div className="px-6 py-7 text-white" style={{ backgroundColor: "var(--color-primary-dark)" }}>
        <p className="text-sm opacity-80">
          {props.studentName} · {props.dateLabel} {props.weekdayLabel}
        </p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight">
          오늘 미션 {remaining}개 남음
        </h1>
        {props.showWeeklyReward && (
          <p className="mt-3 text-sm opacity-80">{props.weeklyRewardGoal}</p>
        )}
        <div className="mt-5 flex gap-8">
          <div><b className="block text-3xl">{done}</b><span className="text-xs opacity-80">완료</span></div>
          <div><b className="block text-3xl">{remaining}</b><span className="text-xs opacity-80">남음</span></div>
        </div>
      </div>
      <div className="p-3">
        {props.missions.map((mission) => (
          <button
            key={mission.id}
            type="button"
            onClick={() => props.onToggle(mission)}
            className="grid w-full grid-cols-[72px_1fr] items-center gap-3 rounded-xl px-3 py-3 text-left"
          >
            <span className="font-bold" style={{ color: "var(--color-primary-dark)" }}>
              {mission.is_completed_today ? "완료" : "남음"}
            </span>
            <span
              className={mission.is_completed_today ? "line-through" : ""}
              style={{ color: "var(--color-text-primary)" }}
            >
              {mission.content}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

const PosterView: React.FC<TodayMissionViewsProps> = (props) => (
  <div>
    <div className="mb-3 flex items-end justify-between">
      <h1 className="text-3xl font-extrabold" style={{ color: "var(--color-text-primary)" }}>
        오늘의 미션
      </h1>
      <span
        className="rounded-full border-2 px-3 py-1 text-sm font-bold"
        style={{ borderColor: "var(--color-text-primary)", color: "var(--color-text-primary)" }}
      >
        {props.studentName} · {props.weekdayLabel}
      </span>
    </div>
    <div className="space-y-2">
      {props.missions.map((mission, index) => (
        <button
          key={mission.id}
          type="button"
          onClick={() => props.onToggle(mission)}
          className="grid w-full grid-cols-[64px_1fr_92px] items-center gap-2 rounded-2xl border-2 px-3 py-3 text-left"
          style={{
            borderColor: "var(--color-text-primary)",
            backgroundColor: "var(--color-bg-card)",
          }}
        >
          <span className="text-2xl font-extrabold" style={{ color: "var(--color-text-primary)" }}>
            {String(index + 1).padStart(2, "0")}
          </span>
          <b style={{ color: "var(--color-text-primary)" }}>{mission.content}</b>
          <span
            className="grid h-14 place-items-center rounded-xl text-sm font-extrabold"
            style={{
              backgroundColor: mission.is_completed_today
                ? "var(--color-primary-dark)"
                : "transparent",
              color: mission.is_completed_today ? "#fff" : "var(--color-text-primary)",
              border: mission.is_completed_today
                ? "none"
                : "2px solid var(--color-text-primary)",
            }}
          >
            {mission.is_completed_today ? "완료" : "남음"}
          </span>
        </button>
      ))}
    </div>
  </div>
);

const MissionCards: React.FC<{
  missions: MissionStatusItem[];
  onToggle: (mission: MissionStatusItem) => void;
}> = ({ missions, onToggle }) => (
  <div className="flex-1 space-y-4">
    {missions.length === 0 && (
      <p className="rounded-lg bg-white p-6 text-center text-gray-500 shadow">
        아직 설정된 미션이 없어요.
      </p>
    )}
    {missions.map((mission) => (
      <button
        key={mission.id}
        type="button"
        onClick={() => onToggle(mission)}
        className="flex w-full items-center rounded-lg p-4 text-left shadow"
        style={
          mission.is_completed_today
            ? {
                backgroundColor: "var(--color-primary-light)",
                borderLeft: "4px solid var(--color-primary-medium)",
                color: "var(--color-text-primary)",
              }
            : { backgroundColor: "var(--color-bg-card)", color: "var(--color-text-secondary)" }
        }
      >
        <span className={`text-lg font-medium ${mission.is_completed_today ? "line-through" : ""}`}>
          {mission.content}
        </span>
      </button>
    ))}
  </div>
);

export default TodayMissionViews;
