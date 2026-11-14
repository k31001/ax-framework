import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, clamp01, ease, enterExit, lerp, progress } from "../../../video/anim";
import { color, mono, sans, stroke, withAlpha } from "../../../video/theme";
import { useScene } from "../../lib";

// 추적성 편 s13~s17(병)이 같이 쓰는 부품: 시간 도우미, 글자·상자·표, 노드 모양, 작은 그래프.

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
  radius?: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ x, y, w, h, c = color.lineStrong, at, out, dashed, fill = withAlpha(color.panel, 0.92), bw = stroke.thin, radius = 0, style, children }) => {
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
        borderRadius: radius,
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

/** 글자만 놓는 표. 첫 줄은 머리줄(흐린 색)이다. */
export const Grid: React.FC<{
  x: number;
  y: number;
  cols: readonly number[];
  rows: readonly (readonly Cell[])[];
  rowH?: number;
  px?: number;
  at: number;
  out?: number;
  rowAt?: (row: number) => number;
  noHead?: boolean;
  /** 모든 칸을 monospace 로 */
  code?: boolean;
  /** 줄 뒤의 강조 띠: 줄 번호 → {켜지는 프레임, 색} */
  marks?: Record<number, { at: number; c: string }>;
}> = ({ x, y, cols, rows, rowH = 52, px = 30, at, out, rowAt, noHead, code, marks }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const total = cols.reduce((a, b) => a + b, 0);
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: out === undefined ? 1 : 1 - progress(frame, out, DUR.exit, ease.in) }}>
      {rows.map((row, r) => {
        const start = rowAt ? rowAt(r) : at + r * 4;
        const head = !noHead && r === 0;
        const mark = marks?.[r];
        const on = mark ? progress(frame, mark.at, 10) : 0;
        let left = 0;
        return (
          <div key={r} style={{ position: "absolute", left: 0, top: r * rowH, width: total, height: rowH, ...enterExit(frame, start, undefined, { distance: 6 }) }}>
            {head ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 2, borderBottom: `${stroke.hair}px solid ${color.line}` }} /> : null}
            {mark && on > 0 ? (
              <div style={{ position: "absolute", left: -14, right: -6, top: 3, bottom: 3, backgroundColor: withAlpha(mark.c, 0.16 * on), borderLeft: `3px solid ${withAlpha(mark.c, on)}` }} />
            ) : null}
            {row.map((raw, i) => {
              const cell = typeof raw === "string" ? { text: raw } : raw;
              const l = left;
              left += cols[i];
              const base = code || cell.code ? mono(px, cell.weight ?? 500) : sans(px, cell.weight ?? (head ? 500 : 600));
              const c = cell.c ?? (head ? color.inkDim : mark && on > 0.5 ? mark.c : color.ink);
              return (
                <div key={i} style={{ position: "absolute", left: l, top: 0, height: rowH, display: "flex", alignItems: "center", ...base, letterSpacing: "0", color: c, whiteSpace: "pre" }}>
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

// ── 노드 모양 (svg 안에서 쓴다. (cx, cy) 가 가운데) ─────────────────────────
// 조항 = 모서리가 접힌 문서, Jira 이슈 = 둥근 칩, field = 칸이 나뉜 사각, module·assertion = 각진 사각,
// 함수 = 중괄호가 달린 사각, 테스트·실행 결과 = 원.

export type Shape = "doc" | "chip" | "field" | "box" | "assert" | "func" | "circle";

export const NodeShape: React.FC<{
  shape: Shape;
  cx: number;
  cy: number;
  w: number;
  h: number;
  c: string;
  p?: number;
  fill?: string;
  dashed?: boolean;
  bw?: number;
}> = ({ shape, cx, cy, w, h, c, p = 1, fill = color.bg, dashed, bw = stroke.thin }) => {
  if (p <= 0) return null;
  const x = cx - w / 2;
  const y = cy - h / 2;
  const common = { fill, stroke: c, strokeWidth: bw, strokeDasharray: dashed ? "6 5" : undefined } as const;
  const k = Math.min(h * 0.38, 12);
  return (
    <g opacity={p}>
      {shape === "doc" ? (
        <>
          <path d={`M ${x} ${y} H ${x + w - k} L ${x + w} ${y + k} V ${y + h} H ${x} Z`} {...common} />
          <path d={`M ${x + w - k} ${y} V ${y + k} H ${x + w}`} fill="none" stroke={c} strokeWidth={bw * 0.8} />
        </>
      ) : shape === "chip" ? (
        <rect x={x} y={y} width={w} height={h} rx={h / 2} {...common} />
      ) : shape === "circle" ? (
        <ellipse cx={cx} cy={cy} rx={w / 2} ry={h / 2} {...common} />
      ) : (
        <rect x={x} y={y} width={w} height={h} {...common} />
      )}
      {shape === "field" ? (
        <path d={`M ${x + w * 0.2} ${y} V ${y + h} M ${x + w * 0.8} ${y} V ${y + h}`} stroke={c} strokeWidth={bw * 0.7} opacity={0.7} />
      ) : null}
      {shape === "assert" ? <path d={`M ${x + w - k * 1.5} ${y + k * 0.75} l ${k * 0.35} ${k * 0.35} l ${k * 0.6} ${-k * 0.7}`} fill="none" stroke={c} strokeWidth={bw * 0.8} /> : null}
      {shape === "func" ? (
        <path d={`M ${x + k * 0.9} ${y + h * 0.2} q ${-k * 0.45} 0 ${-k * 0.45} ${h * 0.15} t ${-k * 0.3} ${h * 0.15} q ${k * 0.3} 0 ${k * 0.3} ${h * 0.15} t ${k * 0.45} ${h * 0.15}`} fill="none" stroke={c} strokeWidth={bw * 0.8} />
      ) : null}
    </g>
  );
};

/** 그려지는 직선 (svg) */
export const Seg: React.FC<{ a: readonly [number, number]; b: readonly [number, number]; c: string; w?: number; p?: number; dash?: string; opacity?: number }> = ({ a, b, c, w = stroke.thin, p = 1, dash, opacity }) =>
  p <= 0 ? null : <line x1={a[0]} y1={a[1]} x2={lerp(a[0], b[0], clamp01(p))} y2={lerp(a[1], b[1], clamp01(p))} stroke={c} strokeWidth={w} strokeDasharray={dash} opacity={opacity} />;

// ── 작은 그래프 ─────────────────────────────────────────────────────────
// 전 씬 공통 배치를 줄인 그림(240×160 좌표계). 글자는 없다. 단계가 오를수록 엣지가 채워진다.

type MN = { id: string; shape: Shape; x: number; y: number; w: number; h: number; who: "human" | "agent" | "jira" };
const MINI_NODES: readonly MN[] = [
  { id: "j1", shape: "chip", x: 20, y: 18, w: 30, h: 12, who: "jira" },
  { id: "j2", shape: "chip", x: 20, y: 54, w: 30, h: 12, who: "jira" },
  { id: "j3", shape: "chip", x: 20, y: 96, w: 30, h: 12, who: "jira" },
  { id: "req", shape: "doc", x: 124, y: 18, w: 34, h: 18, who: "human" },
  { id: "order", shape: "doc", x: 124, y: 54, w: 44, h: 22, who: "human" },
  { id: "field", shape: "field", x: 124, y: 92, w: 40, h: 16, who: "agent" },
  { id: "mod", shape: "box", x: 70, y: 100, w: 26, h: 14, who: "agent" },
  { id: "a1", shape: "assert", x: 58, y: 124, w: 26, h: 14, who: "agent" },
  { id: "a2", shape: "assert", x: 92, y: 132, w: 26, h: 14, who: "agent" },
  { id: "f1", shape: "func", x: 180, y: 96, w: 28, h: 14, who: "agent" },
  { id: "f2", shape: "func", x: 204, y: 116, w: 28, h: 14, who: "agent" },
  { id: "f3", shape: "func", x: 170, y: 126, w: 28, h: 14, who: "agent" },
  { id: "t1", shape: "circle", x: 124, y: 148, w: 16, h: 16, who: "agent" },
];
const MINI_AT = (id: string): MN => MINI_NODES.find((n) => n.id === id) as MN;
type ME = readonly [string, string];
const MINI_EXTRACT: readonly ME[] = [["j2", "j1"], ["j3", "j2"], ["j1", "req"], ["j2", "order"], ["mod", "field"], ["f1", "field"], ["f2", "field"], ["f3", "field"], ["t1", "a2"]];
const MINI_TAG: readonly ME[] = [["order", "req"], ["field", "order"], ["mod", "order"], ["a1", "order"], ["a2", "order"]];
const MINI_PROP: readonly ME[] = [["f2", "order"], ["f3", "order"]];

export const MINI = { w: 240, h: 160 } as const;

export const MiniGraph: React.FC<{
  x: number;
  y: number;
  s?: number;
  /** 노드가 놓인 정도 */
  nodes?: number;
  /** 도구 추출 엣지 (청록 가는 실선) */
  extract?: number;
  /** 태그 엣지 (호박색 굵은 실선) */
  tag?: number;
  /** 제안 엣지 (청록 점선) */
  prop?: number;
  /** 제안 가운데 첫째가 확정(호박색 실선)으로 바뀐 정도 */
  confirm?: number;
  opacity?: number;
  /** 색을 빼고 흐린 선으로만 */
  mute?: boolean;
}> = ({ x, y, s = 1, nodes = 1, extract = 0, tag = 0, prop = 0, confirm = 0, opacity = 1, mute }) => {
  if (opacity <= 0 || nodes <= 0) return null;
  const tone = (who: MN["who"]): string => (mute ? color.lineStrong : who === "human" ? color.human : who === "agent" ? color.agent : color.ink);
  const pt = (id: string): [number, number] => [MINI_AT(id).x, MINI_AT(id).y];
  const sw = 1.6 / s;
  return (
    <svg width={MINI.w * s} height={MINI.h * s} viewBox={`0 0 ${MINI.w} ${MINI.h}`} style={{ position: "absolute", left: x, top: y, overflow: "visible", opacity }}>
      {MINI_EXTRACT.map(([a, b], i) => (
        <Seg key={`e${i}`} a={pt(a)} b={pt(b)} c={mute ? color.lineStrong : color.agent} w={sw} p={clamp01(extract * 1.6 - i * 0.07)} />
      ))}
      {MINI_TAG.map(([a, b], i) => (
        <Seg key={`t${i}`} a={pt(a)} b={pt(b)} c={mute ? color.lineStrong : color.human} w={sw * 2} p={clamp01(tag * 1.6 - i * 0.1)} />
      ))}
      {MINI_PROP.map(([a, b], i) => {
        const done = i === 0 ? confirm : 0;
        return (
          <g key={`p${i}`}>
            <Seg a={pt(a)} b={pt(b)} c={color.agent} w={sw} p={clamp01(prop * 1.5 - i * 0.3)} dash={`${4 / s} ${3.5 / s}`} opacity={1 - done} />
            <Seg a={pt(a)} b={pt(b)} c={color.human} w={sw * 2} p={done} />
          </g>
        );
      })}
      {MINI_NODES.map((n, i) => (
        <NodeShape key={n.id} shape={n.shape} cx={n.x} cy={n.y} w={n.w} h={n.h} c={tone(n.who)} bw={sw} p={clamp01(nodes * 1.8 - i * 0.06)} />
      ))}
    </svg>
  );
};

/** 이름이 적힌 노드. (cx, cy) 가 가운데. hot(0~1)이면 안이 노드 색으로 밝아진다. */
export const GNode: React.FC<{
  shape: Shape;
  cx: number;
  cy: number;
  w: number;
  h: number;
  c: string;
  label?: string;
  px?: number;
  at: number;
  out?: number;
  hot?: number;
  dashed?: boolean;
  /** 글자색. 기본은 밝은 흰색 */
  ink?: string;
  /** 안을 이 색으로 채운다(문제 노드) */
  solid?: number;
  opacity?: number;
  sans?: boolean;
}> = ({ shape, cx, cy, w, h, c, label, px = 26, at, out, hot = 0, dashed, ink = color.ink, solid = 0, opacity = 1, sans: useSans }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const fill = solid > 0 ? withAlpha(c, 0.12 + 0.5 * solid) : hot > 0 ? withAlpha(c, 0.26 * hot) : color.bg;
  return (
    <div style={{ position: "absolute", left: cx - w / 2, top: cy - h / 2, width: w, height: h, ...enterExit(frame, at, out, { distance: 8 }) }}>
      <div style={{ position: "absolute", inset: 0, opacity }}>
        <svg width={w} height={h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <rect x={0} y={0} width={w} height={h} fill={color.bg} rx={shape === "chip" || shape === "circle" ? h / 2 : 0} />
          <NodeShape shape={shape} cx={w / 2} cy={h / 2} w={w} h={h} c={c} fill={fill} dashed={dashed} bw={hot > 0.5 || solid > 0 ? stroke.trace : stroke.thin} />
        </svg>
        {label ? (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", ...(useSans ? sans(px, 700) : mono(px, 700)), letterSpacing: "0", color: ink, whiteSpace: "nowrap", paddingLeft: shape === "func" ? 10 : 0 }}>
            {label}
          </div>
        ) : null}
      </div>
    </div>
  );
};
