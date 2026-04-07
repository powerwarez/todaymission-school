export type BadgeConditionType =
  | "daily_any"
  | "specific_mission"
  | "weekly_complete";

export interface BadgeCriteria {
  condition_type?: BadgeConditionType;
  mission_id?: string;
  target_count?: number;
}

export interface BadgeType {
  id: string;
  name: string;
  description: string;
  icon: string;
  teacher_id: string;
  school_id: string;
  mission_id: string | null;
  target_count: number;
  is_active: boolean;
  criteria?: BadgeCriteria;
  created_at?: string;
}

export interface DisplayBadge extends BadgeType {
  count: number;
}

export interface Mission {
  id: string;
  content: string;
  created_at: string;
}

export interface StudentBadgeRow {
  student_id: string;
  badge_id: string;
  earned_date: string;
  users?: {
    name: string;
  };
}

export interface StudentListItem {
  student_id: string;
  student_name: string;
  earned_date: string;
}
