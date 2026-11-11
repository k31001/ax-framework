import React from "react";
import { interpolateColors, useCurrentFrame } from "remotion";
import { DUR, clamp01, ease, enter, enterExit, progress } from "../../../video/anim";
import { color, mono, sans, size, stroke, withAlpha } from "../../../video/theme";

// 3편(업무 방식)의 씬들이 함께 쓰는 부품.
//   split      문장의 cue~end 사이를 등분한 프레임
//   Pane       CodePanel 과 같은 모습의 빈 창(줄을 직접 그릴 때)
//   CodeRow    창 안의 코드 한 줄(색·강조 띠·취소선을 프레임마다 정할 수 있다)
//   Tag        테두리가 있는 작은 표지
//   Steps      상단의 세 칸 진행 표시 (정의 → 실행 → 판단)
//   Stamp      승인·반려 도장
//   아이콘      LockIcon, DocIcon, BundleIcon

/** a~b 사이를 n 등분했을 때 i 번째 경계의 프레임 */
export const split = (a: number, b: number, i: number, n: number): number => Math.round(a + ((b - a) * i) / n);

export const mix = (p: number, from: string, to: string): string => interpolateColors(clamp01(p), [0, 1], [from, to]);

// 세 칸 띠의 낱말 (대본 s1 · s3 의 visual)
export const STEP_WORDS = ["정의", "실행", "판단"] as const;

// 예제의 코드 조각 (docs/shifts/03-way-of-working.md 4.1)
export const TB_CODE = [
  "class rec_done_q_seq extends uvm_sequence #(rec_item);",
  "  `uvm_object_utils(rec_done_q_seq)",
  "  task body();",
  "    repeat (200)",
  "      `uvm_do_with(req, { src inside {HOST, GC};",
  "                          gap inside {[0:8]}; })",
  "  endtask",
  "endclass",
] as const;

export const HEAD = 44;
export const rowH = (px: number): number => Math.round(px * 1.5);
export const paneH = (rows: number, px = 28): number => HEAD + 20 + rows * rowH(px) + 16;

export const Pane: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  title?: string;
  /** 왼쪽 띠의 색 (누구의 것인가) */
  edge?: string;
  /** 테두리 색 */
  border?: string;
  at: number;
  out?: number;
  opacity?: number;
  scale?: number;
  children?: React.ReactNode;
}> = ({ x, y, w, h, title, edge = color.lineStrong, border = color.line, at, out, opacity = 1, scale = 1, children }) => {
  const frame = useCurrentFrame();
  const open = progress(frame, at, DUR.draw, ease.out);
  if (open <= 0) return null;
  const gone = out === undefined ? 0 : progress(frame, out, DUR.exit, ease.in);
  if (gone >= 1) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        opacity: (1 - gone) * opacity,
        transform: scale === 1 ? undefined : `scale(${scale})`,
        transformOrigin: "0 0",
      }}
    >
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
        <rect x={1} y={1} width={w - 2} height={h - 2} fill={withAlpha(color.panel, 0.94 * open)} stroke={border} strokeWidth={stroke.thin} opacity={open} />
        {title !== undefined ? <line x1={1} y1={HEAD} x2={1 + (w - 2) * open} y2={HEAD} stroke={color.line} strokeWidth={stroke.hair} /> : null}
        <rect x={0} y={0} width={5} height={h * open} fill={edge} />
      </svg>
      {title !== undefined ? (
        <div style={{ position: "absolute", left: 24, top: 0, height: HEAD, display: "flex", alignItems: "center", ...mono(size.label, 700), color: color.inkSoft, opacity: open }}>
          {title}
        </div>
      ) : null}
      {children}
    </div>
  );
};

export const CodeRow: React.FC<{
  /** 몇 번째 줄인가 (0부터) */
  i: number;
  px?: number;
  c?: string;
  /** 투명도 0~1 */
  o?: number;
  /** 강조 띠 0~1 */
  mark?: number;
  markColor?: string;
  /** 취소선 0~1 */
  strike?: number;
  strikeColor?: string;
  children: React.ReactNode;
}> = ({ i, px = 28, c = color.ink, o = 1, mark = 0, markColor = color.agent, strike = 0, strikeColor = color.human, children }) => {
  if (o <= 0) return null;
  const h = rowH(px);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: HEAD + 20 + i * h, height: h }}>
      {mark > 0 ? (
        <div style={{ position: "absolute", left: 6, right: 2, top: 1, bottom: 1, backgroundColor: withAlpha(markColor, 0.16 * mark), borderLeft: `3px solid ${withAlpha(markColor, mark)}` }} />
      ) : null}
      <div style={{ position: "absolute", left: 24, top: 0, lineHeight: `${h}px`, ...mono(px, 500), letterSpacing: "0", fontVariantLigatures: "none", whiteSpace: "pre", color: c, opacity: o }}>
        {children}
        {strike > 0 ? (
          <div style={{ position: "absolute", left: 0, top: h / 2 - 1, height: 3, width: `${strike * 100}%`, backgroundColor: strikeColor }} />
        ) : null}
      </div>
    </div>
  );
};

/** 테두리가 있는 작은 표지. x, y 를 주면 그 자리에 놓인다. */
export const Tag: React.FC<{
  text: string;
  c?: string;
  x?: number;
  y?: number;
  at: number;
  out?: number;
  px?: number;
  dashed?: boolean;
  fill?: boolean;
  right?: boolean;
  style?: React.CSSProperties;
}> = ({ text, c = color.inkSoft, x, y, at, out, px = size.small, dashed, fill, right, style }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  return (
    <div
      style={{
        ...(x === undefined ? {} : { position: "absolute", top: y, ...(right ? { right: 1920 - x } : { left: x }) }),
        display: "inline-flex",
        alignItems: "center",
        height: Math.round(px * 1.6),
        padding: "0 14px",
        border: `${stroke.thin}px ${dashed ? "dashed" : "solid"} ${c}`,
        backgroundColor: fill ? withAlpha(c, 0.16) : withAlpha(color.bg, 0.6),
        ...sans(px, 700),
        color: c,
        whiteSpace: "nowrap",
        ...enterExit(frame, at, out),
        ...style,
      }}
    >
      {text}
    </div>
  );
};

/** 상단의 세 칸 진행 표시. active 칸이 밝다. */
export const Steps: React.FC<{ active?: number; at?: number; activeAt?: { index: number; at: number }[] }> = ({ active, at = 4, activeAt }) => {
  const frame = useCurrentFrame();
  let current = active;
  if (activeAt) for (const a of activeAt) if (frame >= a.at) current = a.index;
  return (
    <div style={{ position: "absolute", right: 96, top: 76, display: "flex", alignItems: "center", ...enter(frame, at, { distance: 0 }) }}>
      {STEP_WORDS.map((word, i) => {
        const c = i === 1 ? color.agent : color.human;
        const on = i === current;
        return (
          <React.Fragment key={word}>
            {i > 0 ? <div style={{ width: 18, height: 2, backgroundColor: color.lineStrong }} /> : null}
            <div
              style={{
                height: 46,
                padding: "0 12px",
                display: "flex",
                alignItems: "center",
                border: `${stroke.thin}px solid ${on ? c : withAlpha(c, 0.4)}`,
                backgroundColor: on ? withAlpha(c, 0.2) : "transparent",
                ...sans(size.small, on ? 800 : 500),
                color: on ? c : withAlpha(c, 0.55),
              }}
            >
              {word}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

/** 도장. 살짝 큰 상태에서 내려찍힌다. */
export const Stamp: React.FC<{
  text: string;
  c: string;
  x: number;
  y: number;
  at: number;
  out?: number;
  px?: number;
  rotate?: number;
  /** 0~1. 뒤로 물러난 정도 */
  faded?: number;
}> = ({ text, c, x, y, at, out, px = size.head, rotate = -4, faded = 0 }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const p = progress(frame, at, 9, ease.out);
  const gone = out === undefined ? 0 : progress(frame, out, DUR.exit, ease.in);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        padding: "6px 22px",
        border: `5px solid ${c}`,
        outline: `2px solid ${withAlpha(c, 0.5)}`,
        outlineOffset: 5,
        backgroundColor: withAlpha(c, 0.14),
        ...sans(px, 800),
        color: c,
        whiteSpace: "nowrap",
        opacity: p * (1 - gone) * (1 - 0.6 * faded),
        transform: `rotate(${rotate}deg) scale(${1.45 - 0.45 * p})`,
        transformOrigin: "50% 50%",
      }}
    >
      {text}
    </div>
  );
};

// ── 아이콘 (24×24) ─────────────────────────────────────────────────────
type IconProps = { size?: number; color?: string };
const Svg: React.FC<IconProps & { children: React.ReactNode }> = ({ size: s = 32, color: c = color.ink, children }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={(stroke.trace * 24) / s} strokeLinecap="square" strokeLinejoin="miter" style={{ display: "block", flex: "none" }}>
    {children}
  </svg>
);

export const LockIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <rect x={5} y={11} width={14} height={10} />
    <path d="M8 11V7.5a4 4 0 0 1 8 0V11M12 15v2.5" />
  </Svg>
);

export const DocIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M5.5 2.5h9l4 4v15h-13z" />
    <path d="M8.5 11h7M8.5 14.5h7M8.5 18h4.5" />
  </Svg>
);

/** 증거 묶음: 끈으로 묶은 꾸러미 */
export const BundleIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <rect x={3} y={7.5} width={18} height={13} />
    <path d="M3 12h18M12 7.5v13M8 7.5 12 3.5l4 4" />
  </Svg>
);
