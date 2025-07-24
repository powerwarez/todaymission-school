import { User } from "@supabase/supabase-js";

// Database table types (adjust based on your actual Supabase schema)
export interface Mission {
  id: string; // uuid
  teacher_id: string; // uuid ref users
  school_id: string; // uuid ref schools
  title: string; // content를 위한 별칭
  content?: string; // UI 호환성을 위해 옵셔널로 유지
  description?: string;
  is_active?: boolean;
  order_index: number; // order를 위한 별칭
  order?: number; // UI 호환성을 위해 옵셔널로 유지
  created_at: string; // timestampz
  updated_at?: string;
}

export interface MissionLog {
  id: string; // uuid
  user_id: string; // uuid ref auth.users
  mission_id: string; // uuid ref missions
  completed_at: string; // date
  // Add weekday or other relevant info if needed
}

export interface Challenge {
  id: string; // uuid
  name: string;
  description: string;
  // Define condition fields, e.g., required_completions, mission_id_target, etc.
  badge_id: string; // uuid ref badges
  created_at: string; // timestampz
}

export interface Badge {
  id: string; // uuid
  name: string;
  image_path: string; // path in Supabase Storage
  description?: string;
  created_at: string; // timestampz
  badge_type?: "mission" | "weekly"; // 배지 유형 (미션 배지 또는 주간 배지)
  teacher_id?: string; // 교사 ID (badges 테이블에서 사용)
  icon?: string; // 아이콘 (이모지 또는 URL)
  type?: string; // 배지 타입 (special 등)
  criteria?: {
    mission_id?: string;
    target_count?: number;
  }; // 배지 획득 조건
  is_active?: boolean; // 활성화 여부
}

export interface UserBadge {
  id: string; // uuid
  user_id: string; // uuid ref auth.users
  badge_id: string; // uuid ref badges
  earned_at: string; // timestampz
  badge_type?: "mission" | "weekly"; // 배지 유형 (미션 배지 또는 주간 배지)
}

// Extended types for UI
export interface MissionWithLogs extends Mission {
  logs: MissionLog[]; // Or just today's completion status
  is_completed_today?: boolean; // Helper flag for UI
  log_id?: string; // ID of the completed log for today (if exists)
}

export interface EarnedBadge extends UserBadge {
  badge: Badge;
}

// Auth User type from Supabase
export type AuthUser = User;

export interface School {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email?: string;
  name: string;
  role: "teacher" | "student";
  school_id?: string; // 학교 ID 추가
  teacher_id?: string; // 교사 ID 추가 (학생인 경우)
  weekly_reward?: string; // 주간 보상 설정
  show_weekly_reward?: boolean; // 주간 보상 표시 여부
  pin_code?: string; // PIN 코드 추가 (text 타입으로 변경)
  auth_provider?: "kakao" | "qr";
  auth_uid?: string;
  qr_token?: string;
  created_at: string;
  updated_at: string;
  school?: School;
  teacher?: UserProfile;
}

export interface StudentQRCode {
  id: string;
  student_id: string;
  qr_data: string;
  created_at: string;
}

export interface StudentCreationResult {
  student_id: string;
  student_name: string;
  qr_token: string;
}
