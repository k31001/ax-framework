import React from "react";
import { color, stroke } from "../theme";

// 회로 trace 같은 직각 연결선. <svg> 안에서 쓴다.
// 꺾이는 자리는 45도로 살짝 깎는다. 영상에서는 pathLength로 그려지며 나타난다.

export type Pt = readonly [number, number];

export const tracePath = (pts: readonly Pt[], chamfer = 8): string => {
  if (pts.length < 2) return "";
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i - 1];
    const [cx, cy] = pts[i];
    const [nx, ny] = pts[i + 1];
    const inLen = Math.hypot(cx - px, cy - py);
    const outLen = Math.hypot(nx - cx, ny - cy);
    const c = Math.min(chamfer, inLen / 2, outLen / 2);
    const ax = cx - ((cx - px) / inLen) * c;
    const ay = cy - ((cy - py) / inLen) * c;
    const bx = cx + ((nx - cx) / outLen) * c;
    const by = cy + ((ny - cy) / outLen) * c;
    d += ` L ${ax} ${ay} L ${bx} ${by}`;
  }
  const last = pts[pts.length - 1];
  d += ` L ${last[0]} ${last[1]}`;
  return d;
};

export const Trace: React.FC<{
  pts: readonly Pt[];
  stroke?: string;
  width?: number;
  dash?: string;
  /** 끝점에 화살촉을 단다. */
  arrow?: boolean;
  chamfer?: number;
  opacity?: number;
}> = ({
  pts,
  stroke: strokeColor = color.inkSoft,
  width = stroke.trace,
  dash,
  arrow,
  chamfer,
  opacity,
}) => {
  const n = pts.length;
  const [ex, ey] = pts[n - 1];
  const [bx, by] = pts[n - 2];
  const len = Math.hypot(ex - bx, ey - by) || 1;
  const ux = (ex - bx) / len;
  const uy = (ey - by) / len;
  const head = 5 + width * 3.5; // 화살촉 길이
  const half = head * 0.42;
  const linePts = arrow
    ? [...pts.slice(0, n - 1), [ex - ux * (head - 1), ey - uy * (head - 1)] as Pt]
    : pts;

  return (
    <g opacity={opacity}>
      <path
        d={tracePath(linePts, chamfer)}
        fill="none"
        stroke={strokeColor}
        strokeWidth={width}
        strokeDasharray={dash}
        strokeLinejoin="round"
      />
      {arrow ? (
        <polygon
          points={`${ex},${ey} ${ex - ux * head - uy * half},${ey - uy * head + ux * half} ${
            ex - ux * head + uy * half
          },${ey - uy * head - ux * half}`}
          fill={strokeColor}
        />
      ) : null}
    </g>
  );
};

/** trace가 꺾이거나 갈라지는 자리의 작은 고리(via). */
export const Via: React.FC<{ x: number; y: number; stroke?: string; r?: number }> = ({
  x,
  y,
  stroke: strokeColor = color.inkSoft,
  r = 5,
}) => (
  <circle cx={x} cy={y} r={r} fill={color.bg} stroke={strokeColor} strokeWidth={stroke.trace} />
);

/** trace의 끝 단자: 작은 채운 사각형. */
export const Pad: React.FC<{ x: number; y: number; fill?: string; s?: number }> = ({
  x,
  y,
  fill = color.inkSoft,
  s = 10,
}) => <rect x={x - s / 2} y={y - s / 2} width={s} height={s} fill={fill} />;

/** 치수선: 양 끝의 짧은 눈금과 그 사이의 가는 선. */
export const DimLine: React.FC<{
  from: Pt;
  to: Pt;
  stroke?: string;
  tick?: number;
}> = ({ from, to, stroke: strokeColor = color.lineStrong, tick = 9 }) => {
  const horizontal = from[1] === to[1];
  return (
    <g stroke={strokeColor} strokeWidth={stroke.hair} fill="none">
      <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} />
      {[from, to].map(([x, y], i) =>
        horizontal ? (
          <line key={i} x1={x} x2={x} y1={y - tick} y2={y + tick} />
        ) : (
          <line key={i} x1={x - tick} x2={x + tick} y1={y} y2={y} />
        ),
      )}
    </g>
  );
};
