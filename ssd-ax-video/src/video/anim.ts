// 애니메이션 도구. 모든 움직임은 useCurrentFrame() 의 프레임 값에서 계산한다.
// CSS transition / animation 은 렌더되지 않으므로 쓰지 않는다.
//
// 움직임의 성격: 도면이 그려지는 느낌. 선은 그려지며 나타나고, 항목은 짧게 미끄러져 자리 잡는다.
// 튀거나 흔들리지 않는다(spring 을 쓰지 않는다).

import type { CSSProperties } from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import type { SceneId } from "./timeline";
import { FPS, sceneFrames } from "./timeline";

export type EasingFn = (t: number) => number;

// ── easing ─────────────────────────────────────────────────────────────
export const ease = {
  /** 기본. 튀지 않는 감속: 등장, 선 그리기 */
  out: Easing.bezier(0.16, 1, 0.3, 1) as EasingFn,
  /** 자리에서 자리로 옮겨 갈 때 (카드, 진행 표시의 노드) */
  inOut: Easing.bezier(0.65, 0, 0.35, 1) as EasingFn,
  /** 나갈 때 */
  in: Easing.bezier(0.5, 0, 0.75, 0) as EasingFn,
  linear: Easing.linear as EasingFn,
} as const;

// ── 길이 (프레임) ──────────────────────────────────────────────────────
export const DUR = {
  enter: 14, // 글자·블록 등장
  exit: 8, // 퇴장
  draw: 16, // 선이 그려지는 시간
  move: 24, // 자리에서 자리로
  stagger: 3, // 여러 요소의 시차
  sceneIn: 10, // 씬 내용물이 들어오는 시간
  sceneOut: 8, // 씬 내용물이 나가는 시간
} as const;

// ── 기본 계산 ──────────────────────────────────────────────────────────
/** 초 → 프레임. content.ts 의 `at` 값을 프레임으로 바꿀 때 쓴다. */
export const f = (seconds: number): number => Math.round(seconds * FPS);

export const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

export const lerp = (from: number, to: number, p: number): number => from + (to - from) * p;

/**
 * [start, start + duration] 구간의 진행값 0~1. 구간 밖에서는 0 또는 1 로 고정된다.
 * @example const p = progress(frame, f(beat.at));          // 14프레임, 감속
 * @example const p = progress(frame, 30, DUR.move, ease.inOut);
 */
export const progress = (
  frame: number,
  start: number,
  duration: number = DUR.enter,
  easing: EasingFn = ease.out,
): number =>
  interpolate(frame, [start, start + Math.max(1, duration)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

/** 여러 요소의 시차 등장: index 번째 요소의 시작 프레임 */
export const stagger = (start: number, index: number, step: number = DUR.stagger): number =>
  start + index * step;

/** 진행값 p(0~1)의 일부 구간 [a, b] 만 떼어 다시 0~1 로 편다. 한 진행값으로 여러 부분을 순서대로 움직일 때 쓴다. */
export const sub = (p: number, a: number, b: number): number => clamp01((p - a) / (b - a));

// ── 등장 · 퇴장 ────────────────────────────────────────────────────────
export type EnterOptions = {
  duration?: number;
  /** 이동 거리(px). 8~16 이 알맞다. 0 이면 투명도만 바뀐다. */
  distance?: number;
  /** 들어오는 방향. "up" 은 아래에서 위로 올라오며 자리 잡는다. */
  from?: "up" | "down" | "left" | "right";
  easing?: EasingFn;
};

const offset = (from: EnterOptions["from"], d: number): string => {
  switch (from) {
    case "down":
      return `0px ${-d}px`;
    case "left":
      return `${d}px 0px`;
    case "right":
      return `${-d}px 0px`;
    default:
      return `0px ${d}px`;
  }
};

/**
 * 글자·블록의 등장: 투명도 + 짧은 이동. style 에 펼쳐 넣는다.
 * @example <div style={{ ...sans(size.head), ...enter(frame, f(caption.at)) }}>
 */
export const enter = (frame: number, start: number, options: EnterOptions = {}): CSSProperties => {
  const { duration = DUR.enter, distance = 12, from = "up", easing = ease.out } = options;
  const p = progress(frame, start, duration, easing);
  return { opacity: p, translate: offset(from, (1 - p) * distance) };
};

/** 퇴장: 투명도(+ 선택적 이동). start 프레임부터 사라진다. */
export const exit = (frame: number, start: number, options: EnterOptions = {}): CSSProperties => {
  const { duration = DUR.exit, distance = 0, from = "down", easing = ease.in } = options;
  const p = progress(frame, start, duration, easing);
  return { opacity: 1 - p, translate: offset(from, p * distance) };
};

/**
 * 등장했다가 퇴장한다. out 을 생략하면 계속 남는다.
 * @example <div style={enterExit(frame, f(a.at), f(b.at) - DUR.exit)}>
 */
export const enterExit = (
  frame: number,
  start: number,
  out?: number,
  options: EnterOptions = {},
): CSSProperties => {
  if (out === undefined || frame < out) return enter(frame, start, options);
  return exit(frame, out, { duration: DUR.exit });
};

/** <svg> 안의 <g> 에 쓰는 등장. opacity 와 transform 속성을 돌려준다. */
export const enterSvg = (
  frame: number,
  start: number,
  options: EnterOptions = {},
): { opacity: number; transform: string } => {
  const { duration = DUR.enter, distance = 12, from = "up", easing = ease.out } = options;
  const p = progress(frame, start, duration, easing);
  const d = (1 - p) * distance;
  const [x, y] =
    from === "down" ? [0, -d] : from === "left" ? [d, 0] : from === "right" ? [-d, 0] : [0, d];
  return { opacity: p, transform: `translate(${x} ${y})` };
};

// ── 선 그리기 ──────────────────────────────────────────────────────────
/**
 * 선이 그려지는 효과. 길이를 아는 path·line 에 펼쳐 넣는다.
 * 길이를 모르면 pathLength={1} 을 주고 draw(p) 로 쓴다.
 * @example <path d={d} pathLength={1} {...draw(progress(frame, 20, DUR.draw))} />
 */
export const draw = (
  p: number,
  length = 1,
): { strokeDasharray: string; strokeDashoffset: number } => ({
  strokeDasharray: `${length} ${length}`,
  strokeDashoffset: length * (1 - clamp01(p)),
});

/**
 * 점선이 그려지는 효과. 그려진 길이까지만 점선 무늬를 놓는 strokeDasharray 값을 만든다.
 * @param pattern 예: [10, 8]
 */
export const drawDashed = (pattern: readonly number[], p: number, length: number): string => {
  const shown = length * clamp01(p);
  const parts: number[] = [];
  let used = 0;
  let i = 0;
  while (used < shown && parts.length < 4000) {
    const seg = pattern[i % pattern.length];
    const isDash = i % 2 === 0;
    const take = Math.min(seg, shown - used);
    parts.push(isDash ? take : seg);
    used += seg;
    i++;
  }
  if (parts.length % 2 === 1) parts.push(length + 10);
  else parts.push(0, length + 10);
  return parts.join(" ");
};

// ── 그 밖 ──────────────────────────────────────────────────────────────
/** 수치가 올라가는 효과. 정수로 돌려준다. */
export const countUp = (p: number, from: number, to: number): number => Math.round(lerp(from, to, p));

/**
 * 되풀이되는 잔잔한 맥박. start 부터 period 프레임마다 0→1 로 차오르는 값을 돌려준다(start 전에는 0).
 * 문제 표식의 고리처럼 "아직 진행 중"임을 알릴 때만 쓴다.
 */
export const pulse = (frame: number, start: number, period = 45): number => {
  if (frame < start) return 0;
  return ((frame - start) % period) / period;
};

// ── 씬 전체의 들어옴 / 나감 ────────────────────────────────────────────
// 씬 사이에 바탕과 도면 테두리(Sheet)는 그대로 있고, 내용물만 첫 10프레임에 나타나고 마지막 8프레임에 사라진다.
// 보통은 <Sheet id="S3"> 가 알아서 해 준다. 직접 다뤄야 할 때만 아래를 쓴다.
export type SceneFadeOptions = { in?: boolean; out?: boolean };

export const sceneFade = (
  frame: number,
  durationInFrames: number,
  options: SceneFadeOptions = {},
): number => {
  const fadeIn = options.in === false ? 1 : progress(frame, 0, DUR.sceneIn, ease.linear);
  const fadeOut =
    options.out === false
      ? 1
      : 1 - progress(frame, durationInFrames - DUR.sceneOut, DUR.sceneOut - 1, ease.linear);
  return Math.min(fadeIn, fadeOut);
};

/** 현재 씬 내용물의 투명도(0~1). */
export const useSceneFade = (id: SceneId, options: SceneFadeOptions = {}): number => {
  const frame = useCurrentFrame();
  return sceneFade(frame, sceneFrames(id), options);
};
