import { DateTime } from "luxon";
import { supabase } from "../lib/supabaseClient";

export const DAILY_MISSION_BADGE_ID = "daily_mission_complete";

export interface MissionLogRef {
  student_id: string;
  mission_id: string;
  completed_at: string;
}

export interface SystemBadgeRef {
  student_id: string;
  system_badge_id: string;
  earned_date: string;
}

export interface MissingDailyBadge {
  student_id: string;
  earned_date: string;
}

export function kstDateFromTimestamp(iso: string): string {
  return DateTime.fromISO(iso).setZone("Asia/Seoul").toFormat("yyyy-MM-dd");
}

/**
 * 활성 미션을 한국 날짜 기준으로 모두 완료했는데
 * 해당 날짜의 "오늘의 미션 달성" 배지가 없는 학생을 찾는다.
 */
export function findMissingDailyMissionBadges(
  activeMissionIds: string[],
  logs: MissionLogRef[],
  existing: SystemBadgeRef[]
): MissingDailyBadge[] {
  if (activeMissionIds.length === 0) return [];

  const active = new Set(activeMissionIds);
  const progress = new Map<string, Set<string>>();

  for (const log of logs) {
    if (!active.has(log.mission_id)) continue;
    const day = kstDateFromTimestamp(log.completed_at);
    const key = `${log.student_id}|${day}`;
    let done = progress.get(key);
    if (!done) {
      done = new Set();
      progress.set(key, done);
    }
    done.add(log.mission_id);
  }

  const earned = new Set(
    existing
      .filter((badge) => badge.system_badge_id === DAILY_MISSION_BADGE_ID)
      .map(
        (badge) =>
          `${badge.student_id}|${String(badge.earned_date).slice(0, 10)}`
      )
  );

  const missing: MissingDailyBadge[] = [];
  for (const [key, done] of progress) {
    if (done.size < active.size || earned.has(key)) continue;
    const sep = key.indexOf("|");
    missing.push({
      student_id: key.slice(0, sep),
      earned_date: key.slice(sep + 1),
    });
  }
  return missing;
}

export async function persistMissingDailyMissionBadges(
  missing: MissingDailyBadge[]
): Promise<void> {
  if (missing.length === 0) return;

  const rows = missing.map((item) => ({
    student_id: item.student_id,
    system_badge_id: DAILY_MISSION_BADGE_ID,
    earned_date: item.earned_date,
  }));

  const { error } = await supabase.from("student_system_badges").insert(rows);
  if (!error) return;

  for (const row of rows) {
    const { error: oneError } = await supabase
      .from("student_system_badges")
      .insert(row);
    if (oneError && oneError.code !== "23505") {
      console.error("오늘의 미션 달성 배지 저장 실패:", oneError);
    }
  }
}
