// C안 "작업 화면(Workbench)" 디자인 체계.
// 세 장면이 같은 색, 글자 크기 단계, 모서리, 그림자, 간격을 쓴다.

import type { CSSProperties } from "react";
import { MONO, SANS } from "../../fonts";
import type { StepKind } from "../shared/content";

export const FRAME = { w: 1920, h: 1080 } as const;

/** 중요한 요소가 들어가야 하는 안쪽 여백. */
export const SAFE = { x: 96, y: 72 } as const;

export const C = {
  // 바탕과 면
  bg: "#F3F5F9",
  sunken: "#E7EBF2", // 눌린 면: "현재" 슬랩, 빈 트랙
  lane: "#F6F7FB", // 스윔레인 바닥
  panel: "#FFFFFF",
  line: "#DAE0EA",
  lineSoft: "#E9EDF3",
  // 글자 (짙은 남회색 계열)
  ink: "#17203A",
  ink2: "#46516A",
  ink3: "#77829A",
  ink4: "#B4BCCB",
  // 역할 색: 좁은 면적(뱃지, 왼쪽 띠, 아바타)에만 쓴다
  agent: "#5546E0",
  agentSoft: "#ECEAFD",
  agentInk: "#3A2EB4",
  human: "#E9740D",
  humanSoft: "#FFEFDD",
  humanInk: "#A84C06",
  problem: "#D93B3B",
  problemSoft: "#FDECEC",
  problemInk: "#A42222",
  resolved: "#12995C",
  resolvedSoft: "#E1F6EB",
  resolvedInk: "#0B6E41",
} as const;

export type Tone = StepKind | "neutral" | "dark";

export const ROLE: Record<StepKind, { main: string; soft: string; ink: string }> = {
  agent: { main: C.agent, soft: C.agentSoft, ink: C.agentInk },
  human: { main: C.human, soft: C.humanSoft, ink: C.humanInk },
  problem: { main: C.problem, soft: C.problemSoft, ink: C.problemInk },
  resolved: { main: C.resolved, soft: C.resolvedSoft, ink: C.resolvedInk },
};

/** 글자 크기 단계(px). 읽어야 하는 글자는 label(30) 이상, 흐름도 항목은 flow(36) 이상. */
export const T = {
  hero: 232, // S3 핵심 문구
  title: 112, // 씬 제목
  strong: 56, // 강조 결과, 큰 수치
  lead: 48, // 도입 문구, 계단 항목
  item: 40, // 목록 항목
  flow: 36, // 흐름도 항목
  sub: 34, // 카드 제목, 현재 단계
  label: 30, // 읽는 글자의 최소 크기
  prop: 22, // 소품 속 장식 글자
  propSm: 20,
} as const;

export const R = { sm: 8, md: 12, lg: 16 } as const;

export const SHADOW = {
  card: "0 1px 2px rgba(23,32,58,0.06), 0 6px 18px rgba(23,32,58,0.07)",
  panel: "0 1px 2px rgba(23,32,58,0.05), 0 14px 36px rgba(23,32,58,0.09)",
  raised: "0 2px 4px rgba(23,32,58,0.06), 0 22px 48px rgba(23,32,58,0.16)",
  inset: "inset 0 2px 4px rgba(23,32,58,0.07)",
} as const;

export const FONT = {
  sans: SANS,
  mono: `"${MONO}", "${SANS}"`,
} as const;

/** 8px 간격 단위. */
export const sp = (n: number) => n * 8;

/** 한국어 문구 기본 스타일: 단어 중간에서 줄이 끊기지 않게 한다. */
export const KR: CSSProperties = {
  fontFamily: FONT.sans,
  wordBreak: "keep-all",
  letterSpacing: "-0.01em",
  fontFeatureSettings: '"tnum" 1',
};

export const MONO_TXT: CSSProperties = {
  fontFamily: FONT.mono,
  letterSpacing: "0",
  fontFeatureSettings: '"zero" 0',
};
