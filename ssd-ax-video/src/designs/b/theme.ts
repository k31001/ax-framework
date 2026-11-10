// B안 "지면(Editorial)" 디자인 체계.
// 색, 글자 크기 단계, 괘선 굵기, 12단 격자를 한곳에 모은다. 씬과 컴포넌트는 이 값만 쓴다.
import type { CSSProperties } from "react";
import { MONO, SANS } from "../../fonts";

export const CANVAS = { width: 1920, height: 1080, fps: 30 } as const;

// 색: 미색 바탕 + 먹색 + 주홍(문제·핵심 강조) + 청록(에이전트). 그 밖의 색은 쓰지 않는다.
export const COLOR = {
  paper: "#F4F1EA",
  ink: "#16150F",
  inkSoft: "#6A655A", // 보조 글자
  inkFaint: "#9A9484", // 흐려진 글자(전환 전, 아직 오지 않은 단계)
  vermilion: "#E03C14",
  teal: "#0F5257",
} as const;

// 글자 크기 단계(px). 읽는 글자는 note(30) 이상, 흐름도 항목은 body(36) 이상.
export const SIZE = {
  label: 22, // 장식 라벨(mono)
  note: 30,
  body: 36,
  lead: 48,
  title: 72,
  stat: 176,
  numeral: 200,
  hero: 321,
  giant: 600,
} as const;

// 굵기: 200~300과 800~900의 대비를 크게 쓴다.
export const WEIGHT = {
  thin: 200,
  light: 300,
  regular: 400,
  medium: 500,
  bold: 700,
  heavy: 800,
  black: 900,
} as const;

// 괘선 굵기 3단.
export const RULE = { heavy: 10, mid: 4, hair: 2 } as const;

// 12단 격자. 좌우 여백 96, 상하 여백 72, 단 122, 단 사이 24.
export const GRID = {
  left: 96,
  right: 1824,
  top: 72,
  bottom: 1008,
  width: 1728,
  height: 936,
  cols: 12,
  col: 122,
  gutter: 24,
} as const;

/** i번째 단(0~11)의 왼쪽 x */
export const colX = (i: number): number =>
  GRID.left + i * (GRID.col + GRID.gutter);
/** n개 단을 합친 너비 */
export const colSpan = (n: number): number =>
  n * GRID.col + (n - 1) * GRID.gutter;
/** i번째 단의 오른쪽 x */
export const colEnd = (i: number): number => colX(i) + GRID.col;

// Pretendard를 lineHeight 1로 놓았을 때의 세로 위치(글자 크기 대비 비율).
// 큰 글자와 숫자를 괘선에 정확히 맞출 때 쓴다.
export const METRIC = { baseline: 0.8555, cap: 0.7275 } as const;
/** 기준선을 baselineY에 두려면 글상자의 top을 어디에 둬야 하는가 */
export const topForBaseline = (baselineY: number, fontSize: number): number =>
  baselineY - METRIC.baseline * fontSize;

const tracking = (size: number): string => {
  if (size >= 160) return "-0.045em";
  if (size >= 64) return "-0.035em";
  if (size >= 36) return "-0.02em";
  return "-0.01em";
};

/** Pretendard 글자 스타일. 크기에 따라 자간을 좁힌다. */
export const sans = (
  size: number,
  weight: number,
  extra?: CSSProperties,
): CSSProperties => ({
  fontFamily: SANS,
  fontSize: size,
  fontWeight: weight,
  lineHeight: 1.2,
  letterSpacing: tracking(size),
  wordBreak: "keep-all",
  ...extra,
});

/** JetBrains Mono 주석 스타일. 한글이 섞이면 Pretendard로 넘어간다. */
export const mono = (
  size: number,
  weight: 400 | 500 | 700 = 500,
  extra?: CSSProperties,
): CSSProperties => ({
  fontFamily: `"${MONO}", "${SANS}"`,
  fontSize: size,
  fontWeight: weight,
  lineHeight: 1.2,
  letterSpacing: "0",
  wordBreak: "keep-all",
  ...extra,
});

/** 1 → "01" */
export const pad2 = (n: number): string => (n < 10 ? "0" : "") + n;
