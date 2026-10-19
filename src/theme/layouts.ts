export type AppLayout = "rail" | "bento" | "split" | "hero" | "poster";

export const APP_LAYOUTS: AppLayout[] = [
  "rail",
  "bento",
  "split",
  "hero",
  "poster",
];

export const layoutOptions: Record<
  AppLayout,
  { displayName: string; description: string }
> = {
  rail: {
    displayName: "좁은 레일",
    description: "메뉴는 아이콘만 두고, 미션은 줄로 읽습니다.",
  },
  bento: {
    displayName: "벤토 보드",
    description: "오늘 남은 개수를 큰 칸에 두고 미션을 칸으로 나눕니다.",
  },
  split: {
    displayName: "목록과 상세",
    description: "왼쪽에서 미션을 고르고 오른쪽에서 완료합니다.",
  },
  hero: {
    displayName: "오늘 요약",
    description: "위쪽에 남은 개수를 크게 두고 아래는 목록입니다.",
  },
  poster: {
    displayName: "교실 포스터",
    description: "번호를 크게 매기고 완료와 남음을 칸으로 나눕니다.",
  },
};

export function isAppLayout(value: string | null | undefined): value is AppLayout {
  return !!value && APP_LAYOUTS.includes(value as AppLayout);
}

export function layoutUsesTopNav(layout: AppLayout | null): boolean {
  return layout === "bento" || layout === "hero" || layout === "poster";
}
