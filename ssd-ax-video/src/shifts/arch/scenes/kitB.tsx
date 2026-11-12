import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, clamp01, ease, enterExit, progress } from "../../../video/anim";
import { hash } from "../../../video/scenes/s5_4/field";
import { color, mono, sans, stroke, withAlpha } from "../../../video/theme";
import { useScene } from "../../lib";

// 구조 설계 편 s7~s12 가 같이 쓰는 부품: 시간 도우미, 상자, 글자, 표, 문서 창, 산점도.

/** cue/end 에 더해, 문장 안의 한 지점(0~1)의 프레임을 준다. */
export const useCues = () => {
  const s = useScene();
  const within = (id: string, t: number): number => Math.round(s.cue(id) + (s.end(id) - s.cue(id)) * t);
  return { ...s, within };
};

export const blend = (a: string, b: string, t: number): string => {
  const x = parseInt(a.slice(1), 16);
  const y = parseInt(b.slice(1), 16);
  const k = clamp01(t);
  const ch = (s: number): number => {
    const u = (x >> s) & 255;
    const v = (y >> s) & 255;
    return Math.round(u + (v - u) * k);
  };
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`;
};

/** monospace 한 글자의 폭 */
export const cw = (px: number): number => px * 0.6;

// ── 상자 ────────────────────────────────────────────────────────────────
export const Box: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  c?: string;
  fill?: string;
  /** 나타난 정도 */
  p?: number;
  dash?: boolean;
  bw?: number;
  center?: boolean;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ x, y, w, h, c = color.inkSoft, fill = withAlpha(color.panel, 0.92), p = 1, dash, bw = stroke.thin, center = true, style, children }) =>
  p <= 0 ? null : (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        boxSizing: "border-box",
        border: `${bw}px ${dash ? "dashed" : "solid"} ${c}`,
        backgroundColor: fill,
        display: "flex",
        alignItems: "center",
        justifyContent: center ? "center" : "flex-start",
        opacity: p,
        translate: `0px ${(1 - p) * 10}px`,
        ...style,
      }}
    >
      {children}
    </div>
  );

// ── 글자 ────────────────────────────────────────────────────────────────
/** 절대 위치의 글자 한 줄. align 은 x 가 왼쪽 끝/가운데/오른쪽 끝 중 어디인지다. */
export const T: React.FC<{
  x: number;
  y: number;
  text: React.ReactNode;
  px?: number;
  weight?: number;
  c?: string;
  at?: number;
  out?: number;
  code?: boolean;
  align?: "left" | "center" | "right";
  opacity?: number;
  strike?: number;
}> = ({ x, y, text, px = 30, weight = 600, c = color.ink, at, out, code, align = "left", opacity = 1, strike }) => {
  const frame = useCurrentFrame();
  if (at !== undefined && frame < at) return null;
  const anim = at === undefined ? {} : enterExit(frame, at, out);
  const o = (anim.opacity === undefined ? 1 : Number(anim.opacity)) * opacity;
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        ...(align === "left" ? { left: x } : align === "center" ? { left: x - 1200, width: 2400, textAlign: "center" } : { left: x - 2400, width: 2400, textAlign: "right" }),
        ...(code ? mono(px, weight) : sans(px, weight)),
        letterSpacing: code && px > 22 ? "0" : undefined,
        whiteSpace: "nowrap",
        color: c,
        ...anim,
        opacity: o,
      }}
    >
      <span style={{ position: "relative", display: "inline-block" }}>
        {text}
        {strike !== undefined && strike > 0 ? <span style={{ position: "absolute", left: -6, top: "52%", height: 3, width: `calc(${strike * 100}% + ${12 * strike}px)`, backgroundColor: color.problem }} /> : null}
      </span>
    </div>
  );
};

/** 테두리 위에 얹는 꼬리표 */
export const EdgeTag: React.FC<{ x: number; y: number; text: string; c?: string; p?: number; px?: number }> = ({ x, y, text, c = color.inkSoft, p = 1, px = 22 }) =>
  p <= 0 ? null : (
    <div style={{ position: "absolute", left: x, top: y - Math.round(px * 0.7), padding: "0 10px", backgroundColor: color.bg, ...(px <= 22 ? mono(px, 700) : sans(px, 700)), color: c, opacity: p, whiteSpace: "nowrap" }}>{text}</div>
  );

// ── 창의 틀 (CodePanel 과 같은 모습) ────────────────────────────────────
type Owner = "agent" | "human" | "none" | "problem";
const edgeOf = (owner: Owner): string => (owner === "agent" ? color.agent : owner === "human" ? color.human : owner === "problem" ? color.problem : color.lineStrong);

export const Frame: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  /** 제목에 한글이 있으면 30px 로 쓴다 */
  titlePx?: number;
  at: number;
  out?: number;
  owner?: Owner;
  ownerColor?: string;
  dim?: number;
  headRight?: React.ReactNode;
  children?: React.ReactNode;
}> = ({ x, y, w, h, title, titlePx = 22, at, out, owner = "none", ownerColor, dim = 0, headRight, children }) => {
  const frame = useCurrentFrame();
  const open = progress(frame, at, DUR.draw, ease.out);
  if (open <= 0) return null;
  const gone = out === undefined ? 0 : progress(frame, out, DUR.exit, ease.in);
  if (gone >= 1) return null;
  const headH = titlePx > 22 ? 54 : 44;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, opacity: (1 - gone) * (1 - 0.65 * dim) }}>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
        <rect x={1} y={1} width={w - 2} height={h - 2} fill={withAlpha(color.panel, 0.92 * open)} stroke={color.line} strokeWidth={stroke.thin} opacity={open} />
        <line x1={1} y1={headH} x2={1 + (w - 2) * open} y2={headH} stroke={color.line} strokeWidth={stroke.hair} />
        <rect x={0} y={0} width={5} height={h * open} fill={ownerColor ?? edgeOf(owner)} />
      </svg>
      <div style={{ position: "absolute", left: 24, right: 20, top: 0, height: headH, display: "flex", alignItems: "center", justifyContent: "space-between", opacity: open }}>
        <div style={{ ...(titlePx > 22 ? sans(titlePx, 700) : mono(titlePx, 700)), color: titlePx > 22 ? color.ink : color.inkSoft, whiteSpace: "nowrap" }}>{title}</div>
        {headRight}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: headH }}>{children}</div>
    </div>
  );
};
export const frameHead = (titlePx = 22): number => (titlePx > 22 ? 54 : 44);

// ── 표 ──────────────────────────────────────────────────────────────────
export type Cell = string | { t: string; c?: string; code?: boolean; weight?: number };
export type Row = { cells: Cell[]; at: number; c?: string; mark?: number; unmark?: number; markC?: string; dim?: boolean };
export type Col = { w: number; align?: "left" | "right" | "center"; code?: boolean };

export const tableHeight = (rows: number, head: boolean, rowH = 46, titlePx = 30): number => frameHead(titlePx) + 8 + (head ? rowH - 6 : 0) + rows * rowH + 10;

export const Table: React.FC<{
  x: number;
  y: number;
  w: number;
  title: string;
  titlePx?: number;
  cols: Col[];
  head?: string[];
  rows: Row[];
  at: number;
  out?: number;
  px?: number;
  rowH?: number;
  owner?: Owner;
  dim?: number;
}> = ({ x, y, w, title, titlePx = 30, cols, head, rows, at, out, px = 30, rowH = 46, owner = "none", dim }) => {
  const frame = useCurrentFrame();
  const h = tableHeight(rows.length, !!head, rowH, titlePx);
  const cell = (raw: Cell, col: Col, base: string, key: number): React.ReactNode => {
    const c = typeof raw === "string" ? { t: raw } : raw;
    const code = c.code ?? col.code;
    return (
      <div key={key} style={{ width: col.w, flex: "none", textAlign: col.align ?? "left", ...(code ? mono(px - 2, c.weight ?? 500) : sans(px, c.weight ?? 500)), letterSpacing: "0", whiteSpace: "nowrap", color: c.c ?? base }}>
        {c.t}
      </div>
    );
  };
  return (
    <Frame x={x} y={y} w={w} h={h} title={title} titlePx={titlePx} at={at} out={out} owner={owner} dim={dim}>
      <div style={{ paddingTop: 8 }}>
        {head ? (
          <div style={{ height: rowH - 6, display: "flex", alignItems: "center", paddingLeft: 24, opacity: progress(frame, at + 6, 10) }}>
            {head.map((t, i) => cell(t, { ...cols[i], code: false }, color.inkDim, i))}
          </div>
        ) : null}
        {rows.map((row, r) => {
          const p = progress(frame, row.at, 10, ease.out);
          const on = row.mark === undefined ? 0 : progress(frame, row.mark, 10) * (row.unmark === undefined ? 1 : 1 - progress(frame, row.unmark, 10, ease.in));
          const mc = row.markC ?? color.agent;
          return (
            <div key={r} style={{ position: "relative", height: rowH, display: "flex", alignItems: "center", paddingLeft: 24, opacity: p * (row.dim ? 0.55 : 1) }}>
              {on > 0 ? <div style={{ position: "absolute", left: 6, right: 2, top: 2, bottom: 2, backgroundColor: withAlpha(mc, 0.16 * on), borderLeft: `3px solid ${withAlpha(mc, on)}` }} /> : null}
              {row.cells.map((c, i) => (
                <div key={i} style={{ position: "relative" }}>
                  {cell(c, cols[i], row.c ?? color.ink, i)}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </Frame>
  );
};

// ── 문서 창: 이름표 열 + 본문 (ADR, Jira 카드) ──────────────────────────
export type DocRow = {
  label?: string;
  text: React.ReactNode;
  at: number;
  /** 이 프레임에 흐린 글자가 또렷해진다. 없으면 처음부터 또렷하다 */
  lit?: number;
  c?: string;
  mark?: number;
  unmark?: number;
  markC?: string;
  right?: React.ReactNode;
};

export const docHeight = (rows: number, px = 26, titlePx = 22): number => frameHead(titlePx) + 16 + rows * Math.round(px * 1.5) + 14;

export const DocPanel: React.FC<{
  x: number;
  y: number;
  w: number;
  title: string;
  rows: DocRow[];
  at: number;
  out?: number;
  px?: number;
  labelW?: number;
  owner?: Owner;
  headRight?: React.ReactNode;
}> = ({ x, y, w, title, rows, at, out, px = 26, labelW = 0, owner = "none", headRight }) => {
  const frame = useCurrentFrame();
  const lineH = Math.round(px * 1.5);
  return (
    <Frame x={x} y={y} w={w} h={docHeight(rows.length, px)} title={title} at={at} out={out} owner={owner} headRight={headRight}>
      <div style={{ paddingTop: 16 }}>
        {rows.map((row, i) => {
          const p = progress(frame, row.at, 10, ease.out);
          const lit = row.lit === undefined ? 1 : progress(frame, row.lit, 12);
          const on = row.mark === undefined ? 0 : progress(frame, row.mark, 10) * (row.unmark === undefined ? 1 : 1 - progress(frame, row.unmark, 10, ease.in));
          const mc = row.markC ?? color.agent;
          const ink = blend(color.lineStrong, row.c ?? color.ink, lit);
          return (
            <div key={i} style={{ position: "relative", height: lineH, display: "flex", alignItems: "center", paddingLeft: 24, opacity: p }}>
              {on > 0 ? <div style={{ position: "absolute", left: 6, right: 2, top: 1, bottom: 1, backgroundColor: withAlpha(mc, 0.16 * on), borderLeft: `3px solid ${withAlpha(mc, on)}` }} /> : null}
              {labelW > 0 ? <div style={{ position: "relative", width: labelW, flex: "none", ...mono(px, 700), letterSpacing: "0", color: blend(color.lineStrong, color.inkSoft, lit) }}>{row.label ?? ""}</div> : null}
              <div style={{ position: "relative", ...mono(px, 500), letterSpacing: "0", whiteSpace: "pre", fontVariantLigatures: "none", color: ink }}>{row.text}</div>
              {row.right ? <div style={{ position: "relative", marginLeft: 22 }}>{row.right}</div> : null}
            </div>
          );
        })}
      </div>
    </Frame>
  );
};

// ── 216 구성의 산점도 (s10, s12) ────────────────────────────────────────
export type Cfg = { a: number; p: number; g: 0 | 1 | 2 | 3; pass?: boolean; front?: boolean };

/** 제약: P99.99 ≤ 1.78 ms, 면적 ≤ +15% */
export const LIMIT = { p: 1.78, a: 15 } as const;

export const CFG: Cfg[] = (() => {
  const out: Cfg[] = [];
  // A: RTL 변경 없음. 면적 +0%, 최선 3.41 ms
  out.push({ a: 0.3, p: 3.41, g: 0 });
  for (let i = 1; i < 54; i++) out.push({ a: 0.1 + hash(i * 3 + 1) * 1.3, p: 3.46 + Math.pow(hash(i * 3 + 2), 1.4) * 0.85, g: 0 });
  // B: 면적 +3%, 최선 2.27 ms
  out.push({ a: 3, p: 2.27, g: 1 });
  for (let i = 1; i < 54; i++) out.push({ a: 2.7 + hash(i * 5 + 11) * 2.1, p: 2.31 + Math.pow(hash(i * 5 + 12), 1.3) * 0.72, g: 1 });
  // C: 제약을 통과하는 9개(그 가운데 5개가 왼쪽 아래 경계)와 나머지 45개
  const front: [number, number][] = [[9.5, 1.77], [10.6, 1.71], [11.8, 1.65], [12.9, 1.58], [14.0, 1.52]];
  const inside: [number, number][] = [[11.4, 1.755], [12.6, 1.7], [13.7, 1.645], [14.6, 1.6]];
  front.forEach(([a, p]) => out.push({ a, p, g: 2, pass: true, front: true }));
  inside.forEach(([a, p]) => out.push({ a, p, g: 2, pass: true }));
  let n = 0;
  let made = 0;
  while (made < 45 && n < 2000) {
    n++;
    const a = 8.2 + hash(n * 7 + 21) * 14;
    const p = 2.2 - (a - 8.2) * 0.05 + (hash(n * 7 + 22) - 0.5) * 0.42;
    if ((a <= LIMIT.a + 0.5 && p <= LIMIT.p + 0.05) || p < 1.45) continue;
    out.push({ a, p, g: 2 });
    made++;
  }
  // D: 면적 +38%, 최선 1.38 ms
  out.push({ a: 38, p: 1.38, g: 3 });
  for (let i = 1; i < 54; i++) out.push({ a: 35.6 + hash(i * 9 + 31) * 6, p: 1.4 + Math.pow(hash(i * 9 + 32), 1.3) * 0.26, g: 3 });
  return out;
})();

export type PlotRect = { x: number; y: number; w: number; h: number };
const A_MAX = 44;
const P_MIN = 1.25;
const P_MAX = 4.6;
/** 면적 증가(%) → 화면 x */
export const sx = (r: PlotRect, a: number): number => r.x + (a / A_MAX) * r.w;
/** P99.99(ms) → 화면 y. 세로축은 로그 눈금이다 */
export const sy = (r: PlotRect, p: number): number => r.y + r.h - ((Math.log(p) - Math.log(P_MIN)) / (Math.log(P_MAX) - Math.log(P_MIN))) * r.h;

export const GROUPS = ["A", "B", "C", "D"] as const;
const labelAt: [number, number][] = [[3.4, 4.3], [6.8, 2.95], [19, 2.32], [38.6, 1.95]];

/**
 * 산점도의 svg 부분. 화면 전체를 덮는 <svg> 안에 놓는다.
 *   shown(i)   i 번째 점이 나타난 정도
 *   hLine/vLine/shade  제약선과 바깥 영역
 *   outAB/outD 탈락(붉은색)
 *   focus      통과한 9개만 남긴다
 *   pareto     왼쪽 아래 경계선
 *   ring       고른 점의 호박색 고리
 */
export const ScatterMarks: React.FC<{
  r: PlotRect;
  axes?: number;
  shown: (i: number, g: number) => number;
  hLine?: number;
  vLine?: number;
  shade?: number;
  outAB?: number;
  outD?: number;
  focus?: number;
  pareto?: number;
  ring?: number;
  dot?: number;
}> = ({ r, axes = 1, shown, hLine = 0, vLine = 0, shade = 0, outAB = 0, outD = 0, focus = 0, pareto = 0, ring = 0, dot = 4.2 }) => {
  const ly = sy(r, LIMIT.p);
  const lx = sx(r, LIMIT.a);
  const frontPts = CFG.filter((c) => c.front);
  const pd = frontPts.map((c, i) => `${i === 0 ? "M" : "L"} ${sx(r, c.a)} ${sy(r, c.p)}`).join(" ");
  const pick = frontPts[frontPts.length - 1];
  return (
    <g>
      {/* 축 */}
      <path d={`M ${r.x} ${r.y} V ${r.y + r.h} H ${r.x + r.w}`} fill="none" stroke={color.lineStrong} strokeWidth={stroke.thin} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - axes} />
      {[0, 10, 20, 30, 40].map((a) => (
        <line key={a} x1={sx(r, a)} x2={sx(r, a)} y1={r.y + r.h} y2={r.y + r.h + 8} stroke={color.lineStrong} strokeWidth={stroke.hair} opacity={axes} />
      ))}
      {[1.5, 2, 3, 4].map((p) => (
        <line key={p} x1={r.x - 8} x2={r.x} y1={sy(r, p)} y2={sy(r, p)} stroke={color.lineStrong} strokeWidth={stroke.hair} opacity={axes} />
      ))}
      {/* 제약 바깥 */}
      {shade > 0 ? (
        <g opacity={shade}>
          <rect x={r.x + 1} y={r.y} width={r.w} height={ly - r.y} fill={withAlpha(color.bg, 0.62)} />
          <rect x={lx} y={ly} width={r.x + r.w - lx} height={r.y + r.h - ly - 1} fill={withAlpha(color.bg, 0.62)} />
        </g>
      ) : null}
      {/* 점 */}
      {CFG.map((c, i) => {
        const p = shown(i, c.g);
        if (p <= 0) return null;
        const red = c.g === 3 ? outD : c.g < 2 ? outAB : 0;
        const keep = c.pass ? 1 : 1 - 0.7 * focus;
        const fill = c.pass ? blend(color.agent, color.ink, focus * 0.25) : blend(color.agent, color.problem, red);
        return <circle key={i} cx={sx(r, c.a)} cy={sy(r, c.p)} r={(c.pass ? dot + 1.6 * focus : dot) * (0.5 + 0.5 * p)} fill={fill} opacity={p * keep * (c.pass ? 1 : 0.8 - 0.25 * red)} />;
      })}
      {/* 제약선 */}
      {hLine > 0 ? <line x1={r.x} x2={r.x + r.w * hLine} y1={ly} y2={ly} stroke={color.human} strokeWidth={stroke.thin} strokeDasharray="10 8" /> : null}
      {vLine > 0 ? <line x1={lx} x2={lx} y1={r.y + r.h} y2={r.y + r.h - r.h * vLine} stroke={color.human} strokeWidth={stroke.thin} strokeDasharray="10 8" /> : null}
      {pareto > 0 ? <path d={pd} fill="none" stroke={color.ink} strokeWidth={stroke.thin} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - pareto} /> : null}
      {ring > 0 ? <circle cx={sx(r, pick.a)} cy={sy(r, pick.p)} r={10 + 8 * (1 - ring) + dot} fill="none" stroke={color.human} strokeWidth={stroke.bold} opacity={ring} /> : null}
    </g>
  );
};

/** 고른 점(C 최선)의 화면 좌표 */
export const pickPoint = (r: PlotRect): [number, number] => {
  const c = CFG.filter((k) => k.front).pop() as Cfg;
  return [sx(r, c.a), sy(r, c.p)];
};

/** 무리 이름 A~D 의 자리 */
export const groupLabel = (r: PlotRect, g: number): [number, number] => [sx(r, labelAt[g][0]), sy(r, labelAt[g][1])];
