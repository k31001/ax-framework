import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, ease, enterExit, progress } from "../../../video/anim";
import { color, mono, sans, stroke, withAlpha } from "../../../video/theme";
import { useScene } from "../../lib";

// 구조 설계 편 s13~s17 이 같이 쓰는 부품: 시간 도우미, 글자·상자·표, 작은 그림(분포 곡선, 막대, 산점도, 모래시계).

/** cue/end 에 더해, 문장 안의 한 지점(0~1)의 프레임을 준다. */
export const useCues = () => {
  const s = useScene();
  const within = (id: string, t: number): number => Math.round(s.cue(id) + (s.end(id) - s.cue(id)) * t);
  return { ...s, within };
};

/** at 에 나타나고 out 에 사라지는 정도 0~1 */
export const vis = (frame: number, at: number, out?: number, d: number = DUR.enter): number =>
  progress(frame, at, d) * (out === undefined ? 1 : 1 - progress(frame, out, DUR.exit, ease.in));

const SPAN = 1800;

/** 자리를 정해 놓는 글자 한 줄. align 은 x 가 글자의 어느 쪽 끝인지다. */
export const T: React.FC<{
  x: number;
  y: number;
  px?: number;
  weight?: number;
  c?: string;
  at: number;
  out?: number;
  align?: "left" | "center" | "right";
  /** monospace 로 쓴다 (ID, 수치) */
  code?: boolean;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ x, y, px = 30, weight = 500, c = color.ink, at, out, align = "left", code, style, children }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const base = code ? mono(px, weight) : sans(px, weight);
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: align === "left" ? x : align === "center" ? x - SPAN / 2 : x - SPAN,
        width: SPAN,
        textAlign: align,
        ...base,
        color: c,
        whiteSpace: "nowrap",
        ...enterExit(frame, at, out, { distance: 8 }),
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** 테두리 상자. 안의 내용은 가운데에 놓인다. */
export const Box: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  c?: string;
  at: number;
  out?: number;
  dashed?: boolean;
  fill?: string;
  bw?: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ x, y, w, h, c = color.lineStrong, at, out, dashed, fill = withAlpha(color.panel, 0.92), bw = stroke.thin, style, children }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        boxSizing: "border-box",
        border: `${bw}px ${dashed ? "dashed" : "solid"} ${c}`,
        backgroundColor: fill,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        ...enterExit(frame, at, out, { distance: 8 }),
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export type Cell = string | { text: string; c?: string; weight?: number; code?: boolean };

/** 글자만 놓는 표. 첫 줄은 머리줄(흐린 색)이다. 테두리는 Box 로 따로 두른다. */
export const Grid: React.FC<{
  x: number;
  y: number;
  /** 열의 폭 */
  cols: readonly number[];
  rows: readonly (readonly Cell[])[];
  rowH?: number;
  px?: number;
  at: number;
  out?: number;
  /** 줄마다의 등장 프레임 */
  rowAt?: (row: number) => number;
  /** 머리줄 없이 쓴다 */
  noHead?: boolean;
}> = ({ x, y, cols, rows, rowH = 52, px = 30, at, out, rowAt, noHead }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const total = cols.reduce((a, b) => a + b, 0);
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: out === undefined ? 1 : 1 - progress(frame, out, DUR.exit, ease.in) }}>
      {rows.map((row, r) => {
        const start = rowAt ? rowAt(r) : at + r * 4;
        const head = !noHead && r === 0;
        let left = 0;
        return (
          <div key={r} style={{ position: "absolute", left: 0, top: r * rowH, width: total, height: rowH, ...enterExit(frame, start, undefined, { distance: 6 }) }}>
            {head ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 2, borderBottom: `${stroke.hair}px solid ${color.line}` }} /> : null}
            {row.map((raw, i) => {
              const cell = typeof raw === "string" ? { text: raw } : raw;
              const l = left;
              left += cols[i];
              const base = cell.code ? mono(px, cell.weight ?? 500) : sans(px, cell.weight ?? (head ? 500 : 600));
              return (
                <div key={i} style={{ position: "absolute", left: l, top: 0, height: rowH, display: "flex", alignItems: "center", ...base, color: cell.c ?? (head ? color.inkDim : color.ink), whiteSpace: "nowrap" }}>
                  {cell.text}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

// ── 작은 그림 ───────────────────────────────────────────────────────────

/** 꼬리가 긴 분포 곡선의 path. (x, y) 는 왼쪽 아래, 봉우리는 m(0~1) 자리. */
export const tailCurve = (x: number, y: number, w: number, h: number, m = 0.28, a = 2.6): string => {
  const pts: string[] = [];
  for (let i = 0; i <= 48; i++) {
    const t = i / 48;
    const r = t / m;
    const f = t === 0 ? 0 : Math.pow(r, a) * Math.exp(a * (1 - r));
    pts.push(`${i === 0 ? "M" : "L"} ${(x + t * w).toFixed(1)} ${(y - f * h).toFixed(1)}`);
  }
  return pts.join(" ");
};

/** 겹친 분포 곡선 둘 (실측: 흰 실선, 모델: 청록 점선). gap 은 두 곡선의 어긋남(px). */
export const CurvePair: React.FC<{ x: number; y: number; w: number; h: number; gap?: number; p?: number }> = ({ x, y, w, h, gap = 0, p = 1 }) =>
  p <= 0 ? null : (
    <g opacity={p}>
      <line x1={x} x2={x + w} y1={y} y2={y} stroke={color.lineStrong} strokeWidth={stroke.hair} />
      <path d={tailCurve(x, y, w, h)} fill="none" stroke={color.ink} strokeWidth={stroke.trace} />
      <path d={tailCurve(x + gap, y, w, h * 0.96)} fill="none" stroke={color.agent} strokeWidth={stroke.trace} strokeDasharray="7 5" />
    </g>
  );

/** 예산선과 막대 셋 */
export const BarsMark: React.FC<{ x: number; y: number; s?: number; p?: number }> = ({ x, y, s = 1, p = 1 }) =>
  p <= 0 ? null : (
    <g opacity={p}>
      {[0.62, 0.86, 0.5].map((v, i) => (
        <rect key={i} x={x + i * 20 * s} y={y - v * 44 * s} width={14 * s} height={v * 44 * s} fill={withAlpha(color.agent, 0.35)} stroke={color.agent} strokeWidth={stroke.hair} />
      ))}
      <line x1={x - 6 * s} x2={x + 60 * s} y1={y - 44 * s} y2={y - 44 * s} stroke={color.human} strokeWidth={stroke.thin} strokeDasharray="6 4" />
    </g>
  );

const DOTS: readonly (readonly [number, number, number])[] = [
  [0.1, 0.2, 0], [0.16, 0.3, 0], [0.22, 0.16, 0], [0.3, 0.36, 0], [0.36, 0.5, 0], [0.3, 0.52, 0],
  [0.5, 0.74, 1], [0.56, 0.66, 1], [0.6, 0.8, 1], [0.66, 0.72, 1], [0.84, 0.86, 0], [0.9, 0.78, 0], [0.8, 0.92, 0],
];

/** 산점도 (제약 안쪽 무리만 밝다) */
export const ScatterMark: React.FC<{ x: number; y: number; s?: number; p?: number }> = ({ x, y, s = 100, p = 1 }) =>
  p <= 0 ? null : (
    <g opacity={p}>
      <path d={`M ${x} ${y} V ${y + s} H ${x + s * 1.3}`} fill="none" stroke={color.lineStrong} strokeWidth={stroke.hair} />
      <line x1={x} x2={x + s * 1.3} y1={y + s * 0.56} y2={y + s * 0.56} stroke={color.human} strokeWidth={stroke.hair} strokeDasharray="6 4" />
      {DOTS.map(([u, v, on], i) => (
        <circle key={i} cx={x + u * s * 1.3} cy={y + v * s} r={on ? 5 : 4} fill={on ? color.agent : withAlpha(color.agent, 0.3)} />
      ))}
    </g>
  );

/** 모래시계 */
export const Hourglass: React.FC<{ x: number; y: number; s?: number; p?: number; c?: string }> = ({ x, y, s = 60, p = 1, c = color.human }) =>
  p <= 0 ? null : (
    <g opacity={p} fill="none" stroke={c} strokeWidth={stroke.trace}>
      <path d={`M ${x} ${y} H ${x + s * 0.7} M ${x} ${y + s} H ${x + s * 0.7}`} />
      <path d={`M ${x + s * 0.08} ${y} L ${x + s * 0.35} ${y + s * 0.5} L ${x + s * 0.08} ${y + s} M ${x + s * 0.62} ${y} L ${x + s * 0.35} ${y + s * 0.5} L ${x + s * 0.62} ${y + s}`} />
      <path d={`M ${x + s * 0.2} ${y + s * 0.92} L ${x + s * 0.35} ${y + s * 0.68} L ${x + s * 0.5} ${y + s * 0.92} Z`} fill={c} stroke="none" />
    </g>
  );
