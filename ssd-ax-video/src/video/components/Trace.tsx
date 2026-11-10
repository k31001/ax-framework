import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, clamp01, ease, progress as progressOf } from "../anim";
import type { EasingFn } from "../anim";
import { color, stroke } from "../theme";

// 회로 trace 같은 직각 연결선. <svg> 안에서 쓴다.
// 꺾이는 자리는 45도로 살짝 깎는다. 시작점에서 끝점으로 그려지며 나타난다.
//
// 그려지는 정도는 둘 중 하나로 정한다.
//   progress={0~1}          직접 계산한 진행값
//   at={프레임} duration=…   그 프레임부터 스스로 그려진다
// 둘 다 없으면 다 그려진 상태다.

export type Pt = readonly [number, number];

/** 꺾이는 자리를 깎은 꼭짓점 목록 */
export const chamfered = (pts: readonly Pt[], chamfer = 8): Pt[] => {
  if (pts.length < 3) return pts.slice();
  const out: Pt[] = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i - 1];
    const [cx, cy] = pts[i];
    const [nx, ny] = pts[i + 1];
    const inLen = Math.hypot(cx - px, cy - py);
    const outLen = Math.hypot(nx - cx, ny - cy);
    if (inLen === 0 || outLen === 0) continue;
    const c = Math.min(chamfer, inLen / 2, outLen / 2);
    out.push([cx - ((cx - px) / inLen) * c, cy - ((cy - py) / inLen) * c]);
    out.push([cx + ((nx - cx) / outLen) * c, cy + ((ny - cy) / outLen) * c]);
  }
  out.push(pts[pts.length - 1]);
  return out;
};

const toPath = (pts: readonly Pt[]): string =>
  pts.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ");

export const tracePath = (pts: readonly Pt[], chamfer = 8): string => toPath(chamfered(pts, chamfer));

const lengthOf = (pts: readonly Pt[]): number => {
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  }
  return total;
};

/** trace 의 길이(px) */
export const traceLength = (pts: readonly Pt[], chamfer = 8): number => lengthOf(chamfered(pts, chamfer));

/** 시작점에서 dist 만큼 간 자리와 그 자리의 진행 방향. 노드가 trace 를 따라 움직일 때 쓴다. */
export const pointOnTrace = (
  pts: readonly Pt[],
  dist: number,
  chamfer = 8,
): { x: number; y: number; ux: number; uy: number } => {
  const line = chamfered(pts, chamfer);
  let left = Math.max(0, dist);
  for (let i = 1; i < line.length; i++) {
    const [ax, ay] = line[i - 1];
    const [bx, by] = line[i];
    const seg = Math.hypot(bx - ax, by - ay);
    if (seg === 0) continue;
    if (left <= seg || i === line.length - 1) {
      const t = Math.min(1, left / seg);
      return { x: ax + (bx - ax) * t, y: ay + (by - ay) * t, ux: (bx - ax) / seg, uy: (by - ay) / seg };
    }
    left -= seg;
  }
  const [x, y] = line[line.length - 1];
  return { x, y, ux: 1, uy: 0 };
};

/** 꼭짓점 목록에서 앞쪽 dist 만큼만 남긴다. */
const head = (line: readonly Pt[], dist: number): Pt[] => {
  const out: Pt[] = [line[0]];
  let left = dist;
  for (let i = 1; i < line.length; i++) {
    const [ax, ay] = line[i - 1];
    const [bx, by] = line[i];
    const seg = Math.hypot(bx - ax, by - ay);
    if (left >= seg) {
      out.push(line[i]);
      left -= seg;
    } else {
      if (seg > 0 && left > 0) out.push([ax + ((bx - ax) * left) / seg, ay + ((by - ay) * left) / seg]);
      break;
    }
  }
  return out;
};

export type TraceProps = {
  pts: readonly Pt[];
  stroke?: string;
  width?: number;
  /** 점선 무늬. 예: "10 8" */
  dash?: string;
  /** 끝점에 화살촉을 단다. 화살촉은 그려지는 선의 머리를 따라간다. */
  arrow?: boolean;
  chamfer?: number;
  opacity?: number;
  /** 그려진 정도 0~1 */
  progress?: number;
  /** 이 프레임부터 그려진다 (progress 가 없을 때) */
  at?: number;
  duration?: number;
  easing?: EasingFn;
};

export const Trace: React.FC<TraceProps> = ({
  pts,
  stroke: strokeColor = color.inkSoft,
  width = stroke.trace,
  dash,
  arrow,
  chamfer = 8,
  opacity,
  progress,
  at,
  duration = DUR.draw,
  easing = ease.out,
}) => {
  const frame = useCurrentFrame();
  const p = clamp01(progress ?? (at === undefined ? 1 : progressOf(frame, at, duration, easing)));
  if (p <= 0 || pts.length < 2) return null;

  const line = chamfered(pts, chamfer);
  const total = lengthOf(line);
  const shown = total * p;
  const headLen = 5 + width * 3.5; // 화살촉 길이
  const half = headLen * 0.42;

  // 화살촉이 있으면 선은 화살촉 밑동에서 끝난다.
  const bodyLen = arrow ? Math.max(0, shown - headLen + 1) : shown;
  const body = p >= 1 && !arrow ? line : head(line, bodyLen);
  const tip = arrow ? pointOnTrace(pts, shown, chamfer) : null;

  return (
    <g opacity={opacity}>
      {/* 선을 그려진 길이에서 잘라 그린다. 점선 무늬는 시작점에 고정된 채 드러난다. */}
      {body.length >= 2 ? (
        <path
          d={toPath(body)}
          fill="none"
          stroke={strokeColor}
          strokeWidth={width}
          strokeDasharray={dash}
          strokeLinejoin="round"
        />
      ) : null}
      {tip ? (
        <polygon
          points={`${tip.x},${tip.y} ${tip.x - tip.ux * headLen - tip.uy * half},${
            tip.y - tip.uy * headLen + tip.ux * half
          } ${tip.x - tip.ux * headLen + tip.uy * half},${tip.y - tip.uy * headLen - tip.ux * half}`}
          fill={strokeColor}
          opacity={clamp01(shown / headLen)}
        />
      ) : null}
    </g>
  );
};

/** trace 가 꺾이거나 갈라지는 자리의 작은 고리(via). p 로 나타나는 정도를 정한다. */
export const Via: React.FC<{ x: number; y: number; stroke?: string; r?: number; p?: number }> = ({
  x,
  y,
  stroke: strokeColor = color.inkSoft,
  r = 5,
  p = 1,
}) =>
  p <= 0 ? null : (
    <circle
      cx={x}
      cy={y}
      r={r * (0.4 + 0.6 * p)}
      fill={color.bg}
      stroke={strokeColor}
      strokeWidth={stroke.trace}
      opacity={p}
    />
  );

/** trace 의 끝 단자: 작은 채운 사각형. */
export const Pad: React.FC<{ x: number; y: number; fill?: string; s?: number; p?: number }> = ({
  x,
  y,
  fill = color.inkSoft,
  s = 10,
  p = 1,
}) => {
  if (p <= 0) return null;
  const side = s * (0.4 + 0.6 * p);
  return <rect x={x - side / 2} y={y - side / 2} width={side} height={side} fill={fill} opacity={p} />;
};

/** 치수선: 양 끝의 짧은 눈금과 그 사이의 가는 선. 가운데에서 양쪽으로 펴진다. */
export const DimLine: React.FC<{
  from: Pt;
  to: Pt;
  stroke?: string;
  tick?: number;
  p?: number;
}> = ({ from, to, stroke: strokeColor = color.lineStrong, tick = 9, p = 1 }) => {
  if (p <= 0) return null;
  const horizontal = from[1] === to[1];
  const mx = (from[0] + to[0]) / 2;
  const my = (from[1] + to[1]) / 2;
  const a: Pt = [mx + (from[0] - mx) * p, my + (from[1] - my) * p];
  const b: Pt = [mx + (to[0] - mx) * p, my + (to[1] - my) * p];
  return (
    <g stroke={strokeColor} strokeWidth={stroke.hair} fill="none" opacity={Math.min(1, p * 2)}>
      <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />
      {[a, b].map(([x, y], i) =>
        horizontal ? (
          <line key={i} x1={x} x2={x} y1={y - tick} y2={y + tick} />
        ) : (
          <line key={i} x1={x - tick} x2={x + tick} y1={y} y2={y} />
        ),
      )}
    </g>
  );
};
