import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, clamp01, draw, ease, enterExit, progress, pulse } from "../../../video/anim";
import { color, fullSvg, mono, sans, size, stroke, withAlpha } from "../../../video/theme";
import { useScene } from "../../lib";

// shift2(프로세스) 씬들이 함께 쓰는 부품.
//   T          자리(x, y)에 놓는 글자 한 줄
//   Header     씬 머리(영문 장식 라벨 + 씬 이름)
//   Layer      화면 전체를 덮는 <svg>
//   Gate       호박색 마름모 gate (<svg> 안)
//   LoopRing   청록색 원형 루프 (<svg> 안)
//   Glyph      이 편에서만 쓰는 선 아이콘
//   DayAxis    예제 씬(s4~s6)을 관통하는 하루 시간축
//   MiniLoop   예제 씬 위쪽 구석의 작은 루프(현재 단계 점등)
//   KVPanel    항목–값 두 칸으로 줄을 맞춘 창(MR 댓글, 티켓)
//   TestGrid   테스트 1,280개의 점 격자 (<svg> 안)

export type Tone = "plain" | "dim" | "agent" | "human" | "problem";
export const toneColor: Record<Tone, string> = {
  plain: color.ink,
  dim: color.inkDim,
  agent: color.agent,
  human: color.human,
  problem: color.problem,
};

/** 나타났다가(at) 사라지는(out) 정도 0~1 */
export const fade = (frame: number, at: number, out?: number, dur: number = DUR.enter): number =>
  progress(frame, at, dur) * (out === undefined ? 1 : 1 - progress(frame, out, DUR.exit, ease.in));

export const T: React.FC<{
  x: number;
  y: number;
  at?: number;
  out?: number;
  px?: number;
  weight?: number;
  color?: string;
  align?: "left" | "center" | "right";
  code?: boolean;
  opacity?: number;
  children: React.ReactNode;
}> = ({ x, y, at = 0, out, px = size.small, weight = 500, color: c = color.ink, align = "left", code, opacity = 1, children }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const st = enterExit(frame, at, out, { distance: 8 });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 0,
        display: "flex",
        justifyContent: align === "left" ? "flex-start" : align === "center" ? "center" : "flex-end",
      }}
    >
      <div
        style={{
          ...(code ? mono(px, weight) : sans(px, weight)),
          letterSpacing: code ? "0" : undefined,
          color: c,
          whiteSpace: "nowrap",
          flex: "none",
          ...st,
          opacity: (st.opacity as number) * opacity,
        }}
      >
        {children}
      </div>
    </div>
  );
};

/** 씬 머리: 영문 장식 라벨과 씬 이름 */
export const Header: React.FC<{ label: string; at?: number }> = ({ label, at = 4 }) => {
  const { scene } = useScene();
  return (
    <>
      <T x={96} y={76} at={at} px={size.label} weight={700} color={color.agent} code>
        <span style={{ letterSpacing: "0.08em" }}>{label}</span>
      </T>
      <T x={96} y={106} at={at + 3} px={size.sub} weight={800}>
        {scene.name}
      </T>
    </>
  );
};

export const Layer: React.FC<{ children: React.ReactNode; opacity?: number }> = ({ children, opacity }) => (
  <svg {...fullSvg} opacity={opacity}>
    {children}
  </svg>
);

/** 호박색 마름모 gate. p: 그려진 정도, lit: 켜진 정도 */
export const Gate: React.FC<{ x: number; y: number; r?: number; p?: number; lit?: number }> = ({ x, y, r = 34, p = 1, lit = 0 }) => {
  if (p <= 0) return null;
  const pts = `${x},${y - r} ${x + r},${y} ${x},${y + r} ${x - r},${y}`;
  return (
    <g opacity={Math.min(1, p * 2)}>
      {lit > 0 ? (
        <polygon
          points={`${x},${y - r - 12} ${x + r + 12},${y} ${x},${y + r + 12} ${x - r - 12},${y}`}
          fill="none"
          stroke={color.human}
          strokeWidth={stroke.hair}
          opacity={0.7 * lit}
        />
      ) : null}
      <polygon points={pts} fill={color.bg} />
      <polygon
        points={pts}
        fill={withAlpha(color.human, 0.14 + 0.5 * lit)}
        stroke={color.human}
        strokeWidth={stroke.bold}
        pathLength={1}
        {...draw(p)}
      />
    </g>
  );
};

const onRing = (cx: number, cy: number, r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return { x: cx + r * Math.sin(a), y: cy - r * Math.cos(a), ux: Math.cos(a), uy: Math.sin(a) };
};
export const ringPoint = onRing;

/**
 * 청록색 원형 루프. 각도는 12시에서 시계 방향(도).
 * p 만큼 start 에서 시계 방향으로 그려진다. nodes 는 고리 위의 노드(on: 켜진 정도 0~1).
 */
export const LoopRing: React.FC<{
  cx: number;
  cy: number;
  r: number;
  p?: number;
  start?: number;
  nodes?: { deg: number; on: number }[];
  /** 고리를 따라 도는 점의 각도 */
  dot?: number;
  arrows?: number[];
  width?: number;
  nodeR?: number;
  opacity?: number;
}> = ({ cx, cy, r, p = 1, start = 270, nodes = [], dot, arrows = [], width = stroke.bold, nodeR = 11, opacity = 1 }) => {
  if (p <= 0) return null;
  return (
    <g opacity={opacity}>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color.agent}
        strokeWidth={width}
        transform={`rotate(${start - 90} ${cx} ${cy})`}
        pathLength={1}
        {...draw(p)}
      />
      {arrows.map((deg, i) => {
        const shown = clamp01((p * 360 - ((deg - start + 360) % 360)) / 20);
        if (shown <= 0) return null;
        const t = onRing(cx, cy, r, deg);
        const L = 16;
        const H = 8;
        return (
          <polygon
            key={i}
            opacity={shown}
            fill={color.agent}
            points={`${t.x + t.ux * L * 0.5},${t.y + t.uy * L * 0.5} ${t.x - t.ux * L * 0.5 - t.uy * H},${t.y - t.uy * L * 0.5 + t.ux * H} ${
              t.x - t.ux * L * 0.5 + t.uy * H
            },${t.y - t.uy * L * 0.5 - t.ux * H}`}
          />
        );
      })}
      {nodes.map((n, i) => {
        const t = onRing(cx, cy, r, n.deg);
        const shown = clamp01((p * 360 - ((n.deg - start + 360) % 360)) / 10 + 0.01);
        if (shown <= 0) return null;
        return (
          <g key={i} opacity={shown}>
            {n.on > 0 ? <circle cx={t.x} cy={t.y} r={nodeR + 9} fill="none" stroke={color.agent} strokeWidth={stroke.hair} opacity={0.6 * n.on} /> : null}
            <circle cx={t.x} cy={t.y} r={nodeR} fill={color.bg} />
            <circle cx={t.x} cy={t.y} r={nodeR} fill={withAlpha(color.agent, n.on)} stroke={n.on > 0 ? color.agent : color.lineStrong} strokeWidth={stroke.trace} />
          </g>
        );
      })}
      {dot === undefined ? null : (
        <circle cx={onRing(cx, cy, r, dot).x} cy={onRing(cx, cy, r, dot).y} r={6} fill={color.ink} />
      )}
    </g>
  );
};

export type GlyphKind = "emu" | "doc" | "wave" | "lock" | "db";

/** 선 아이콘 (24×24 좌표계) */
export const Glyph: React.FC<{ kind: GlyphKind; size?: number; color?: string }> = ({ kind, size: s = 32, color: c = color.ink }) => (
  <svg
    width={s}
    height={s}
    viewBox="0 0 24 24"
    fill="none"
    stroke={c}
    strokeWidth={(stroke.trace * 24) / s}
    strokeLinecap="square"
    strokeLinejoin="miter"
    style={{ display: "block", flex: "none" }}
  >
    {kind === "emu" ? (
      <>
        <rect x={3} y={3} width={18} height={18} />
        <path d="M3 9h18M3 15h18M6.5 6h3M6.5 12h3M6.5 18h3M16.5 6h1M16.5 12h1M16.5 18h1" />
      </>
    ) : kind === "doc" ? (
      <>
        <path d="M5 2.5h9.5L19 7v14.5H5Z" />
        <path d="M14.5 2.5V7H19M8.5 11.5h7M8.5 15h7M8.5 18.5h4" />
      </>
    ) : kind === "wave" ? (
      <path d="M2 16h4V8h5v8h4V8h4v8h3" />
    ) : kind === "lock" ? (
      <>
        <rect x={5} y={11} width={14} height={10} />
        <path d="M8 11V7.5a4 4 0 0 1 8 0V11M12 15v2.5" />
      </>
    ) : (
      <>
        <ellipse cx={12} cy={5.5} rx={8} ry={3} />
        <path d="M4 5.5v13c0 1.7 3.6 3 8 3s8-1.3 8-3v-13M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
      </>
    )}
  </svg>
);

/** 아이콘 등을 (x, y)를 중심으로 놓는다 */
export const At: React.FC<{ x: number; y: number; opacity?: number; children: React.ReactNode }> = ({ x, y, opacity = 1, children }) =>
  opacity <= 0 ? null : (
    <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity }}>
      <div style={{ flex: "none" }}>{children}</div>
    </div>
  );

// ── 하루 시간축 (s4 ~ s6) ───────────────────────────────────────────────
export const AXIS_X = 236;
export const AXIS_TOP = 250;
export const AXIS_BOTTOM = 884;
export const TICK = {
  "10:12": 300,
  "10:16": 372,
  "10:20": 444,
  "11:20": 526,
  "11:45": 598,
  "13:30": 680,
  "16:10": 762,
  night: 840,
} as const;

export type AxisMark = {
  label: string;
  y: number;
  tone: Tone;
  /** 켜지는 프레임. 없으면 앞 씬에서 이미 지나간 눈금 */
  at?: number;
  /** 글자가 한글이면 true */
  sans?: boolean;
};

export const DayAxis: React.FC<{
  marks: AxisMark[];
  note: string;
  /** 시간축을 위로 민 거리(px) */
  scroll?: number;
  /** 굵게 표시할 구간 */
  span?: { y0: number; y1: number; at: number };
}> = ({ marks, note, scroll = 0, span }) => {
  const frame = useCurrentFrame();
  const open = progress(frame, 2, DUR.draw);
  let current = -1;
  marks.forEach((m, i) => {
    if (m.at !== undefined && m.at <= frame) current = i;
  });
  return (
    <>
      <T x={96} y={190} at={2} color={color.inkDim}>
        {note}
      </T>
      <T x={AXIS_X - 24} y={AXIS_TOP - 17} at={2} px={26} align="right" color={color.inkDim} code opacity={clamp01(1 - scroll / 60)}>
        10:00
      </T>
      <Layer>
        {span ? (
          <line
            x1={AXIS_X}
            y1={span.y0}
            x2={AXIS_X}
            y2={span.y0 + (span.y1 - span.y0) * progress(frame, span.at, 20)}
            stroke={color.agent}
            strokeWidth={7}
            opacity={progress(frame, span.at, 6)}
          />
        ) : null}
        <line x1={AXIS_X} y1={AXIS_TOP} x2={AXIS_X} y2={AXIS_TOP + (AXIS_BOTTOM - AXIS_TOP) * open} stroke={color.lineStrong} strokeWidth={stroke.thin} />
        <line x1={AXIS_X - 9} y1={AXIS_TOP} x2={AXIS_X + 9} y2={AXIS_TOP} stroke={color.lineStrong} strokeWidth={stroke.thin} opacity={open} />
        {marks.map((m, i) => {
          const y = m.y - scroll;
          const vis = clamp01((y - AXIS_TOP - 14) / 24) * clamp01((AXIS_BOTTOM + 20 - y) / 24);
          const p = m.at === undefined ? open : progress(frame, m.at, DUR.enter);
          if (p <= 0 || vis <= 0) return null;
          const c = toneColor[m.tone];
          const now = i === current && m.at !== undefined;
          const ring = now ? pulse(frame, m.at as number, 50) : 0;
          return (
            <g key={i} opacity={p * vis}>
              <line x1={AXIS_X - 12} y1={y} x2={AXIS_X} y2={y} stroke={color.lineStrong} strokeWidth={stroke.thin} />
              {now ? <circle cx={AXIS_X} cy={y} r={11 + 12 * ring} fill="none" stroke={c} strokeWidth={stroke.hair} opacity={0.8 * (1 - ring)} /> : null}
              <circle cx={AXIS_X} cy={y} r={now ? 11 : 8} fill={now ? c : color.bg} stroke={c} strokeWidth={stroke.trace} />
            </g>
          );
        })}
      </Layer>
      {marks.map((m, i) => {
        const y = m.y - scroll;
        const vis = clamp01((y - AXIS_TOP - 14) / 24) * clamp01((AXIS_BOTTOM + 20 - y) / 24);
        const p = m.at === undefined ? open : progress(frame, m.at, DUR.enter);
        if (p <= 0 || vis <= 0) return null;
        const now = i === current && m.at !== undefined;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 0,
              top: y - 20,
              width: AXIS_X - 24,
              textAlign: "right",
              ...(m.sans ? sans(size.small, now ? 800 : 500) : mono(size.small, now ? 700 : 500)),
              letterSpacing: "0",
              lineHeight: "40px",
              whiteSpace: "nowrap",
              color: now ? color.ink : color.inkDim,
              opacity: p * vis,
            }}
          >
            {m.label}
          </div>
        );
      })}
    </>
  );
};

// ── 위쪽 구석의 작은 루프 ───────────────────────────────────────────────
const ML_X = [1262, 1422, 1582, 1742];
const ML_Y = 98;

export const MiniLoop: React.FC<{
  names: readonly string[];
  /** 단계마다 켜지는 프레임. 0 이하면 처음부터 켜져 있다(지나간 단계). undefined 면 아직 */
  lit: (number | undefined)[];
}> = ({ names, lit }) => {
  const frame = useCurrentFrame();
  const open = progress(frame, 4, DUR.draw);
  let current = -1;
  lit.forEach((at, i) => {
    if (at !== undefined && at <= frame) current = i;
  });
  const back = `M ${ML_X[3]} ${ML_Y} H ${ML_X[3] + 82} V ${ML_Y + 84} H ${ML_X[0] - 84} V ${ML_Y} H ${ML_X[0] - 20}`;
  return (
    <>
      <Layer opacity={open}>
        <path d={`M ${ML_X[0]} ${ML_Y} H ${ML_X[3]}`} stroke={color.agent} strokeWidth={stroke.thin} fill="none" opacity={0.7} />
        <path d={back} stroke={color.agent} strokeWidth={stroke.thin} fill="none" opacity={0.7} />
        <polygon points={`${ML_X[0] - 14},${ML_Y} ${ML_X[0] - 26},${ML_Y - 7} ${ML_X[0] - 26},${ML_Y + 7}`} fill={color.agent} />
        {ML_X.map((x, i) => {
          const at = lit[i];
          const on = at === undefined ? 0 : progress(frame, at, DUR.enter);
          const now = i === current;
          const ring = now ? pulse(frame, at as number, 50) : 0;
          return (
            <g key={i}>
              {now && (at as number) > 0 ? <circle cx={x} cy={ML_Y} r={10 + 12 * ring} fill="none" stroke={color.agent} strokeWidth={stroke.hair} opacity={0.8 * (1 - ring)} /> : null}
              <circle cx={x} cy={ML_Y} r={10} fill={color.bg} />
              <circle
                cx={x}
                cy={ML_Y}
                r={10}
                fill={withAlpha(color.agent, on * (now ? 1 : 0.35))}
                stroke={on > 0 ? color.agent : color.lineStrong}
                strokeWidth={stroke.trace}
              />
            </g>
          );
        })}
      </Layer>
      {ML_X.map((x, i) => {
        const now = i === current;
        return (
          <T key={i} x={x} y={ML_Y + 20} at={4 + i * 2} align="center" weight={now ? 800 : 500} color={now ? color.ink : color.inkDim}>
            {names[i]}
          </T>
        );
      })}
    </>
  );
};

// ── 항목–값 창 ──────────────────────────────────────────────────────────
export type KVRow = {
  k?: string;
  v: string;
  /** 값 칸 오른쪽 끝에 붙는 글자 */
  right?: string;
  tone?: Tone;
  kTone?: Tone;
  rightTone?: Tone;
  bold?: boolean;
  at?: number;
  mark?: number;
  unmark?: number;
  markTone?: Tone;
};

export const kvHeight = (rows: number, px = 28): number => 44 + 18 + rows * Math.round(px * 1.55) + 16;

export const KVPanel: React.FC<{
  x: number;
  y: number;
  w: number;
  title: string;
  rows: KVRow[];
  at: number;
  out?: number;
  dimAt?: number;
  px?: number;
  keyW?: number;
  owner?: "agent" | "human" | "none";
  step?: number;
}> = ({ x, y, w, title, rows, at, out, dimAt, px = 28, keyW = 150, owner = "none", step = 3 }) => {
  const frame = useCurrentFrame();
  const open = progress(frame, at, DUR.draw);
  if (open <= 0) return null;
  const gone = out === undefined ? 0 : progress(frame, out, DUR.exit, ease.in);
  if (gone >= 1) return null;
  const dim = dimAt === undefined ? 0 : progress(frame, dimAt, 14, ease.inOut);
  const edge = owner === "agent" ? color.agent : owner === "human" ? color.human : color.lineStrong;
  const lineH = Math.round(px * 1.55);
  const h = kvHeight(rows.length, px);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, opacity: (1 - gone) * (1 - 0.6 * dim) }}>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
        <rect x={1} y={1} width={w - 2} height={h - 2} fill={withAlpha(color.panel, 0.92 * open)} stroke={color.line} strokeWidth={stroke.thin} opacity={open} />
        <line x1={1} y1={44} x2={1 + (w - 2) * open} y2={44} stroke={color.line} strokeWidth={stroke.hair} />
        <rect x={0} y={0} width={5} height={h * open} fill={edge} />
      </svg>
      <div style={{ position: "absolute", left: 24, top: 0, height: 44, display: "flex", alignItems: "center", ...mono(size.label, 700), color: color.inkSoft, opacity: open }}>
        {title}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 44 + 18 }}>
        {rows.map((row, i) => {
          const start = row.at ?? at + 8 + i * step;
          const p = progress(frame, start, 10);
          const on = row.mark === undefined ? 0 : progress(frame, row.mark, 10) * (row.unmark === undefined ? 1 : 1 - progress(frame, row.unmark, 10, ease.in));
          const markColor = toneColor[row.markTone ?? "agent"];
          const text: React.CSSProperties = { ...mono(px, row.bold ? 700 : 500), letterSpacing: "0", lineHeight: `${lineH}px`, whiteSpace: "pre" };
          return (
            <div key={i} style={{ position: "relative", height: lineH }}>
              {on > 0 ? (
                <div style={{ position: "absolute", left: 6, right: 2, top: 1, bottom: 1, backgroundColor: withAlpha(markColor, 0.16 * on), borderLeft: `3px solid ${withAlpha(markColor, on)}` }} />
              ) : null}
              <div style={{ position: "absolute", left: 24, right: 24, top: 0, display: "flex", opacity: p }}>
                {row.k === undefined ? null : <div style={{ ...text, width: keyW, flex: "none", color: toneColor[row.kTone ?? "dim"] }}>{row.k}</div>}
                <div style={{ ...text, flex: "1 1 auto", color: toneColor[row.tone ?? "plain"] }}>{row.v}</div>
                {row.right ? <div style={{ ...text, flex: "none", color: toneColor[row.rightTone ?? "agent"] }}>{row.right}</div> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── 테스트 1,280개의 격자 ───────────────────────────────────────────────
export const GRID_COLS = 40;
export const GRID_ROWS = 32;
const hash = (n: number): number => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
// 영향받는 41개: 두 덩어리(같은 블록의 테스트는 모여 있다). 무작위 20개: 흩어진 자리.
const SELECTED: number[] = [];
for (let r = 5; r <= 7; r++) for (let c = 6; c <= 14; c++) SELECTED.push(r * GRID_COLS + c);
for (let r = 20; r <= 21; r++) for (let c = 24; c <= 30; c++) SELECTED.push(r * GRID_COLS + c);
const selectedSet = new Set(SELECTED);
const RANDOM: number[] = Array.from({ length: GRID_COLS * GRID_ROWS }, (_, i) => i)
  .filter((i) => !selectedSet.has(i))
  .sort((a, b) => hash(a) - hash(b))
  .slice(0, 20);
const randomSet = new Set(RANDOM);
export const SELECTED_COUNT = SELECTED.length;
export const RANDOM_COUNT = RANDOM.length;

export const TestGrid: React.FC<{
  x: number;
  y: number;
  pitch: number;
  /** 격자가 나타나는 정도 */
  p: number;
  /** 영향받는 테스트가 켜진 정도 */
  sel?: number;
  /** 무작위 표본이 켜진 정도 */
  rnd?: number;
  /** 전부 켜진 정도 (전체 regression) */
  all?: number;
}> = ({ x, y, pitch, p, sel = 0, rnd = 0, all = 0 }) => {
  if (p <= 0) return null;
  const dots: React.ReactNode[] = [];
  for (let i = 0; i < GRID_COLS * GRID_ROWS; i++) {
    const c = i % GRID_COLS;
    const r = Math.floor(i / GRID_COLS);
    const cx = x + c * pitch + pitch / 2;
    const cy = y + r * pitch + pitch / 2;
    const shown = clamp01(p * 1.6 - (r / GRID_ROWS) * 0.6);
    if (shown <= 0) continue;
    const isSel = selectedSet.has(i);
    const isRnd = randomSet.has(i);
    const order = (c + r) / (GRID_COLS + GRID_ROWS);
    const onSel = isSel ? clamp01(sel * 1.5 - hash(i + 7) * 0.5) : 0;
    const onRnd = isRnd ? clamp01(rnd * 1.5 - hash(i + 3) * 0.5) : 0;
    const onAll = clamp01(all * 1.8 - order * 0.8);
    const on = Math.max(onSel, onRnd, onAll);
    const fill = onSel > 0 ? color.agent : onRnd > 0 ? color.ink : onAll > 0 ? color.agent : color.lineStrong;
    const big = Math.max(onSel, onRnd);
    dots.push(<circle key={i} cx={cx} cy={cy} r={2.4 + 2.4 * big + 0.8 * onAll} fill={fill} opacity={shown * (0.55 + 0.45 * on)} />);
  }
  return <g>{dots}</g>;
};

/** 테두리 있는 작은 표지. T 안에 넣어 쓴다. */
export const Boxed: React.FC<{ tone?: Tone; fill?: boolean; children: React.ReactNode }> = ({ tone = "dim", fill, children }) => (
  <span
    style={{
      display: "inline-block",
      padding: "2px 12px",
      border: `${stroke.thin}px solid ${toneColor[tone]}`,
      backgroundColor: fill ? withAlpha(toneColor[tone], 0.14) : undefined,
      color: toneColor[tone],
    }}
  >
    {children}
  </span>
);
