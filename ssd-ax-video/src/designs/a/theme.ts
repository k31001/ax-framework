// A안 "설계도(Blueprint)" 디자인 체계.
// 색, 글자 크기 단계, 선 굵기, 간격을 여기에만 둔다. 씬과 컴포넌트는 이 값만 쓴다.

import type { CSSProperties } from "react";
import { MONO, SANS } from "../../fonts";
import type { StepKind } from "../shared/content";

export const FRAME = { w: 1920, h: 1080 } as const;

// ── 색 ────────────────────────────────────────────────────────────────
// 바탕은 깊은 남색, 글자는 푸른 기가 도는 흰색. 채도 높은 세 가지 색(청록·호박·붉은색)은
// 선, 작은 표식, 핵심 낱말에만 쓴다.
export const color = {
  bg: "#0B1220",
  panel: "#0F192B", // 카드처럼 바탕에서 한 단 올라온 면
  gridMinor: "rgba(126, 160, 220, 0.05)",
  gridMajor: "rgba(126, 160, 220, 0.10)",
  line: "#273A5A", // 테두리, 구분선
  lineStrong: "#4B6590", // 치수선, 흐린 trace
  ink: "#E6EEFB", // 본문
  inkSoft: "#A9BAD6", // 보조 글자, 기본 trace
  inkDim: "#7186AB", // 흐린 글자("현재" 쪽)
  agent: "#3FD2C7", // 에이전트
  human: "#F2B44C", // 사람
  problem: "#FF6B5E", // 문제
  resolved: "#E6EEFB", // 해결: 붉은색이 빠지고 선의 색으로 돌아온다
} as const;

export const kindColor: Record<StepKind, string> = {
  agent: color.agent,
  human: color.human,
  problem: color.problem,
  resolved: color.resolved,
};

export const withAlpha = (hex: string, alpha: number): string => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

// ── 글자 크기 단계 (px) ────────────────────────────────────────────────
export const size = {
  label: 22, // 영문 monospace 장식 라벨 전용
  small: 30, // 읽어야 하는 글자의 최소
  body: 36, // 흐름도 항목
  sub: 44, // 소제목, 원칙 이름
  head: 56, // 장면 안의 큰 항목
  title: 72, // 단계 제목
  display: 104, // 씬 제목
  hero: 272, // S3 핵심 문구
} as const;

// ── 선 굵기 (px) ───────────────────────────────────────────────────────
export const stroke = {
  hair: 1, // 격자, 구분선
  thin: 1.5, // 테두리, 치수선
  trace: 2, // 연결선
  bold: 3, // 강조 trace
} as const;

// ── 간격 ───────────────────────────────────────────────────────────────
export const space = {
  unit: 8,
  grid: 40, // 옅은 격자 한 칸
  gridMajor: 200, // 굵은 격자 한 칸
  frame: 40, // 도면 테두리 inset
} as const;

// 중요한 요소가 들어가는 영역
export const safe = { left: 96, right: 1824, top: 72, bottom: 1008 } as const;

// ── 글자 스타일 ────────────────────────────────────────────────────────
export const sans = (px: number, weight = 500): CSSProperties => ({
  fontFamily: SANS,
  fontSize: px,
  fontWeight: weight,
  lineHeight: 1.25,
  letterSpacing: px >= size.head ? "-0.03em" : "-0.012em",
  wordBreak: "keep-all",
  color: color.ink,
});

// ID, 수치, 영문 장식 라벨. 한글이 섞이면 Pretendard로 넘어간다.
export const mono = (px: number = size.label, weight = 500): CSSProperties => ({
  fontFamily: `"${MONO}", "${SANS}"`,
  fontSize: px,
  fontWeight: weight,
  lineHeight: 1.2,
  letterSpacing: px <= size.label ? "0.08em" : "0",
  whiteSpace: "nowrap",
  color: color.inkSoft,
});

export const pad2 = (n: number): string => (n < 10 ? `0${n}` : `${n}`);
