# 데이터베이스 함수 및 트리거 정리

> 프로젝트: **todaymission** (Supabase `qrjuekntkvkhmixtcrmo`)
> 마지막 업데이트: 2026-05-19

---

## 목차

1. [함수 (Functions)](#함수-functions)
   - [award_custom_badges_on_mission_log](#1-award_custom_badges_on_mission_log)
   - [create_batch_students](#2-create_batch_students)
   - [date_from_timestamp](#3-date_from_timestamp)
   - [debug_auth_info](#4-debug_auth_info)
   - [delete_custom_badge](#5-delete_custom_badge)
   - [delete_student](#6-delete_student)
   - [get_kst_date](#7-get_kst_date)
   - [update_updated_at_column](#8-update_updated_at_column)
2. [트리거 (Triggers)](#트리거-triggers)

---

## 함수 (Functions)

### 1. `award_custom_badges_on_mission_log`

| 항목 | 내용 |
|------|------|
| 언어 | PL/pgSQL |
| 반환 타입 | `TRIGGER` |
| 파라미터 | 없음 (트리거 함수) |

**역할**

`mission_logs`에 새 행이 INSERT될 때 자동 실행되는 트리거 함수. 삽입된 미션 로그의 학생이 속한 학교의 커스텀 배지 조건을 검사하여, 조건 충족 시 `student_custom_badges`에 배지를 자동 부여한다.

**지원하는 배지 조건 유형 (`criteria.condition_type`)**

| condition_type | 동작 |
|---|---|
| `daily_any` | 학생의 **전체 미션 누적 달성 횟수** ≥ `target_count` 이면 배지 부여 |
| `null` + `mission_id = 'system_daily_complete'` | `daily_any`와 동일하게 처리 (레거시 형식 호환) |
| `specific_mission` | **특정 미션**(`mission_id`) 달성 횟수 ≥ `target_count` 이면 배지 부여 |
| `null` + 특정 `mission_id` | `specific_mission`과 동일하게 처리 (레거시 형식 호환) |
| `weekly_complete` | 이 함수에서는 처리하지 않음 (별도 로직) |

**핵심 로직**

```sql
-- mission_logs INSERT 후 실행
-- 1. 해당 학생 학교의 활성 배지 목록 조회
-- 2. 각 배지의 조건 유형에 따라 달성 횟수 집계
-- 3. 달성 횟수 >= target_count 이고 아직 미획득이면 INSERT
INSERT INTO student_custom_badges (student_id, badge_id, earned_date)
VALUES (NEW.student_id, badge_rec.id, CURRENT_DATE)
ON CONFLICT DO NOTHING;
```

**주의사항**

- `SECURITY DEFINER`로 실행되므로 RLS 정책과 관계없이 배지를 삽입할 수 있음
- 학생 앱(`todaymission.vercel.app`)과 교사 앱 어느 쪽에서 미션을 완료해도 동작함

---

### 2. `create_batch_students`

| 항목 | 내용 |
|------|------|
| 언어 | PL/pgSQL |
| 반환 타입 | `jsonb` |
| 파라미터 | `p_teacher_id uuid`, `p_school_id uuid`, `p_students jsonb` |

**역할**

여러 학생을 한 번에 생성하는 배치 함수. JSON 배열로 학생 목록을 받아 `users` 테이블과 `student_qr_codes` 테이블에 일괄 삽입한다.

**파라미터 상세**

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `p_teacher_id` | `uuid` | 담당 교사 ID |
| `p_school_id` | `uuid` | 학교 ID |
| `p_students` | `jsonb` | `[{"name": "학생명", "qr_token": "토큰값"}, ...]` 형식의 배열 |

**반환값**

생성된 학생 정보 배열: `[{"student_id": "...", "student_name": "...", "qr_token": "..."}, ...]`

**사용 위치**

`src/pages/TeacherStudentsPage.tsx` — 학생 일괄 등록 시 `supabase.rpc('create_batch_students', {...})` 호출

---

### 3. `date_from_timestamp`

| 항목 | 내용 |
|------|------|
| 언어 | PL/pgSQL |
| 반환 타입 | `date` |
| 파라미터 | `ts timestamp with time zone` |

**역할**

`timestamptz` 값에서 날짜 부분만 추출하여 반환하는 단순 유틸리티 함수.

```sql
SELECT date_from_timestamp('2026-05-19 03:00:00+00');
-- 결과: 2026-05-19
```

---

### 4. `debug_auth_info`

| 항목 | 내용 |
|------|------|
| 언어 | PL/pgSQL |
| 반환 타입 | `record` (current_auth_uid, user_exists, user_count) |
| 파라미터 | 없음 |

**역할**

현재 인증된 사용자의 `auth.uid()`와 `users` 테이블 매칭 여부를 반환하는 디버깅용 함수.

**반환 컬럼**

| 컬럼 | 설명 |
|---|---|
| `current_auth_uid` | `auth.uid()` 값 |
| `user_exists` | `users` 테이블에 해당 `auth_uid`가 있는지 여부 |
| `user_count` | 매칭되는 users 레코드 수 |

---

### 5. `delete_custom_badge`

| 항목 | 내용 |
|------|------|
| 언어 | PL/pgSQL |
| 반환 타입 | `void` |
| 파라미터 | `badge_db_id uuid` |

**역할**

`custom_badges` 테이블에서 특정 배지를 삭제한다. (레거시 테이블 대상. 현재 운영 배지는 `badges` 테이블 사용)

---

### 6. `delete_student`

| 항목 | 내용 |
|------|------|
| 언어 | PL/pgSQL |
| 반환 타입 | `void` |
| 파라미터 | `p_student_id uuid` |

**역할**

학생 1명과 관련된 모든 데이터를 순서대로 삭제하는 연쇄 삭제 함수. 외래키 제약 충돌 없이 안전하게 삭제한다.

**삭제 순서**

1. `feedback`
2. `student_custom_badges`
3. `student_system_badges`
4. `earned_badges`
5. `monthly_snapshots`
6. `daily_snapshots`
7. `mission_logs`
8. `student_qr_codes`
9. `users` (최종)

**사용 위치**

`src/pages/TeacherStudentsPage.tsx` — 학생 삭제 시 `supabase.rpc('delete_student', { p_student_id: ... })` 호출

---

### 7. `get_kst_date`

| 항목 | 내용 |
|------|------|
| 언어 | PL/pgSQL |
| 반환 타입 | `date` |
| 파라미터 | `timestamptz` (이름 없음) |
| 설명 | UTC 시간을 한국 시간으로 변환하여 날짜만 반환 |

**역할**

UTC `timestamptz`를 한국 시간(`Asia/Seoul`, UTC+9)으로 변환한 뒤 날짜만 반환하는 유틸리티 함수.

```sql
SELECT get_kst_date('2026-05-18 15:30:00+00');
-- 결과: 2026-05-19  (한국 시간 자정이 넘었으므로 다음날)
```

---

### 8. `update_updated_at_column`

| 항목 | 내용 |
|------|------|
| 언어 | PL/pgSQL |
| 반환 타입 | `TRIGGER` |
| 파라미터 | 없음 (트리거 함수) |

**역할**

행이 UPDATE될 때 `updated_at` 컬럼을 현재 시각(`NOW()`)으로 자동 갱신하는 범용 트리거 함수. 여러 테이블에서 공통으로 사용한다.

---

## 트리거 (Triggers)

### 커스텀 트리거 (비즈니스 로직)

| 트리거명 | 테이블 | 타이밍 | 이벤트 | 호출 함수 |
|---|---|---|---|---|
| `trg_award_custom_badges` | `mission_logs` | AFTER | INSERT | `award_custom_badges_on_mission_log` |

#### `trg_award_custom_badges`

미션 로그가 삽입된 **이후** 실행하여 커스텀 배지 조건을 검사하고 자동 부여한다.
어떤 앱(교사 앱 / 학생 앱)에서 미션을 완료해도 서버 측에서 항상 동작한다.

---

### `updated_at` 자동 갱신 트리거

| 트리거명 | 테이블 | 타이밍 | 이벤트 |
|---|---|---|---|
| `update_badges_updated_at` | `badges` | BEFORE | UPDATE |
| `update_daily_snapshots_updated_at` | `daily_snapshots` | BEFORE | UPDATE |
| `update_feedback_updated_at` | `feedback` | BEFORE | UPDATE |
| `update_missions_updated_at` | `missions` | BEFORE | UPDATE |
| `update_monthly_snapshots_updated_at` | `monthly_snapshots` | BEFORE | UPDATE |
| `update_schools_updated_at` | `schools` | BEFORE | UPDATE |
| `update_users_updated_at` | `users` | BEFORE | UPDATE |

모두 `update_updated_at_column` 함수를 호출하여 `updated_at = NOW()`로 설정한다.

---

### Supabase 내부 트리거 (수정 불가)

| 트리거명 | 테이블 | 설명 |
|---|---|---|
| `enforce_bucket_name_length_trigger` | `storage.buckets` | 버킷 이름 길이 제한 |
| `protect_buckets_delete` | `storage.buckets` | 버킷 삭제 보호 |
| `protect_objects_delete` | `storage.objects` | 오브젝트 삭제 보호 |
| `update_objects_updated_at` | `storage.objects` | Storage 오브젝트 updated_at 갱신 |
| `tr_check_filters` | `realtime.subscription` | Realtime 구독 필터 검증 |

---

## 참고: 배지 criteria 형식

`badges.criteria` 컬럼(jsonb)에서 사용하는 필드 구조:

```jsonc
{
  "condition_type": "daily_any" | "specific_mission" | "weekly_complete",
  "mission_id": "UUID" | "system_daily_complete",  // specific_mission 또는 레거시에서 사용
  "target_count": 10  // 달성 기준 횟수
}
```

| condition_type | mission_id 필요 여부 | 설명 |
|---|---|---|
| `daily_any` | 불필요 | 어떤 미션이든 누적 N회 달성 |
| `specific_mission` | 필요 (실제 UUID) | 특정 미션을 N회 달성 |
| `weekly_complete` | 불필요 | 주간 미션 완료 (별도 로직 처리) |
| (없음) + `system_daily_complete` | — | `daily_any`와 동일 (레거시) |
| (없음) + 실제 UUID | — | `specific_mission`과 동일 (레거시) |
