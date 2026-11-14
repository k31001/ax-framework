import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, clamp01, ease, enterExit, progress } from "../../../video/anim";
import { color, mono, sans, stroke, withAlpha } from "../../../video/theme";
import { useScene } from "../../lib";

// 추적성 편 s7~s12 가 같이 쓰는 부품: 시간 도우미, 상자, 글자, 표, 문서 창, 네 단계 띠, 그래프 도우미.

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
export type Cell = string | { t: string; c?: string; code?: boolean; weight?: number; /** 점선 밑줄의 색 */ u?: string };
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
        {c.u ? <span style={{ borderBottom: `${stroke.trace}px dashed ${c.u}`, paddingBottom: 1 }}>{c.t}</span> : c.t}
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
  /** 이름표 열 없이 왼쪽 끝부터 쓴다 */
  full?: boolean;
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
              {labelW > 0 && !row.full ? <div style={{ position: "relative", width: labelW, flex: "none", ...mono(px, 700), letterSpacing: "0", color: blend(color.lineStrong, color.inkSoft, lit) }}>{row.label ?? ""}</div> : null}
              <div style={{ position: "relative", ...mono(px, 500), letterSpacing: "0", whiteSpace: "pre", fontVariantLigatures: "none", color: ink }}>{row.text}</div>
              {row.right ? <div style={{ position: "relative", marginLeft: 14 }}>{row.right}</div> : null}
            </div>
          );
        })}
      </div>
    </Frame>
  );
};


// ── 원통(DB) ────────────────────────────────────────────────────────────
/** <svg> 안에서 쓴다. (cx, top) 은 윗면 타원의 가운데. */
export const Cyl: React.FC<{ cx: number; top: number; w: number; h: number; c?: string; p?: number; fill?: string; bw?: number; dash?: string }> = ({ cx, top, w, h, c = color.agent, p = 1, fill = withAlpha(color.panel, 0.92), bw = stroke.thin, dash }) => {
  if (p <= 0) return null;
  const rx = w / 2;
  const ry = Math.max(6, w * 0.11);
  return (
    <g opacity={p} fill="none" stroke={c} strokeWidth={bw} strokeDasharray={dash}>
      <path d={`M ${cx - rx} ${top} V ${top + h} A ${rx} ${ry} 0 0 0 ${cx + rx} ${top + h} V ${top} Z`} fill={fill} />
      <ellipse cx={cx} cy={top} rx={rx} ry={ry} fill={fill} />
    </g>
  );
};

// ── 네 단계 띠 (s7~s9) ──────────────────────────────────────────────────
export const STEPS = ["① 도구 추출", "② 추적 태그", "③ 에이전트 제안 · 사람 승인", "④ commit마다 갱신"] as const;
const STEP_W = [250, 250, 470, 330];
export const STRIP = { x: 96, y: 76, h: 52, gap: 34 } as const;

/** 화면 위의 네 단계 띠. active(0~3) 번째만 켜진다. */
export const StepStrip: React.FC<{ active: number; c: string; at?: number }> = ({ active, c, at = 4 }) => {
  const frame = useCurrentFrame();
  let x: number = STRIP.x;
  const on = progress(frame, at + 10, 14);
  return (
    <>
      {STEPS.map((name, i) => {
        const x0 = x;
        x += STEP_W[i] + STRIP.gap;
        const lit = i === active ? on : 0;
        const edge = blend(color.line, c, lit);
        return (
          <React.Fragment key={i}>
            <div
              style={{
                position: "absolute",
                left: x0,
                top: STRIP.y,
                width: STEP_W[i],
                height: STRIP.h,
                boxSizing: "border-box",
                border: `${stroke.thin}px solid ${edge}`,
                backgroundColor: withAlpha(c, 0.12 * lit),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...sans(30, i === active ? 700 : 500),
                whiteSpace: "nowrap",
                color: blend(i < active ? color.inkDim : color.lineStrong, c, lit),
                opacity: progress(frame, at + i * 3, 12),
              }}
            >
              {name}
            </div>
            {i < 3 ? (
              <svg width={STRIP.gap} height={STRIP.h} style={{ position: "absolute", left: x0 + STEP_W[i], top: STRIP.y, opacity: progress(frame, at + i * 3 + 4, 12) }}>
                <path d={`M 4 ${STRIP.h / 2} H ${STRIP.gap - 12} M ${STRIP.gap - 16} ${STRIP.h / 2 - 7} L ${STRIP.gap - 6} ${STRIP.h / 2} L ${STRIP.gap - 16} ${STRIP.h / 2 + 7}`} fill="none" stroke={color.lineStrong} strokeWidth={stroke.thin} />
              </svg>
            ) : null}
          </React.Fragment>
        );
      })}
    </>
  );
};

/** 깜박임: at 에서 한 번 켜졌다 꺼진다. */
export const flash = (frame: number, at: number, hold = 9): number => {
  const d = frame - at;
  if (d < 0) return 0;
  return d < 3 ? d / 3 : clamp01(1 - (d - 3) / hold);
};

// ── 꼬리표 ──────────────────────────────────────────────────────────────
/** 화면 좌표에 놓는 한 줄 꼬리표. align="right" 면 x 가 오른쪽 끝이다. */
export const Note: React.FC<{
  x: number;
  y: number;
  text: React.ReactNode;
  c?: string;
  p?: number;
  px?: number;
  align?: "left" | "right" | "center";
  code?: boolean;
  border?: boolean;
  dash?: boolean;
  weight?: number;
  h?: number;
}> = ({ x, y, text, c = color.ink, p = 1, px = 30, align = "left", code, border = true, dash, weight = 600, h }) =>
  p <= 0 ? null : (
    <div
      style={{
        position: "absolute",
        top: y,
        ...(align === "left" ? { left: x } : align === "right" ? { right: 1920 - x } : { left: x - 1000, width: 2000, display: "flex", justifyContent: "center" }),
        opacity: p,
        translate: `0px ${(1 - p) * 8}px`,
      }}
    >
      <div
        style={{
          boxSizing: "border-box",
          height: h ?? Math.round(px * 1.5),
          padding: "0 12px",
          display: "flex",
          alignItems: "center",
          border: border ? `${stroke.thin}px ${dash ? "dashed" : "solid"} ${c}` : undefined,
          backgroundColor: withAlpha(color.bg, 0.94),
          ...(code ? mono(px, weight) : sans(px, weight)),
          letterSpacing: code && px > 22 ? "0" : undefined,
          whiteSpace: "nowrap",
          color: c,
        }}
      >
        {text}
      </div>
    </div>
  );

// ── 레인 (AGENT / HUMAN) ────────────────────────────────────────────────
/** 왼쪽에 색 띠가 선 레인. 내용물은 x + 28 부터 놓는다. */
export const Lane: React.FC<{ x: number; y: number; w: number; h: number; c: string; label: string; p?: number }> = ({ x, y, w, h, c, label, p = 1 }) =>
  p <= 0 ? null : (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, opacity: p }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 5, height: h * p, backgroundColor: c }} />
      <div style={{ position: "absolute", left: 5, right: 0, top: 0, bottom: 0, backgroundColor: withAlpha(c, 0.035), borderTop: `${stroke.hair}px solid ${withAlpha(c, 0.4)}`, borderBottom: `${stroke.hair}px solid ${withAlpha(c, 0.4)}` }} />
      <div style={{ position: "absolute", right: 14, top: 10, ...mono(22, 700), color: c }}>{label}</div>
    </div>
  );
