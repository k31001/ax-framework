import React from "react";
import type { CSSProperties } from "react";
import { useCurrentFrame } from "remotion";
import { clamp01, progress } from "../../../video/anim";
import { CARD } from "../../../video/content";
import { color, mono, sans, stroke, withAlpha } from "../../../video/theme";
import { useScene } from "../../lib";

// 추적성 편 s1~s6 (갑) 의 부품.
//   useCues        cue/end 에 더해 문장 안의 한 지점(0~1)의 프레임
//   Box · At       테두리 상자, 자리 잡은 글자
//   MiniReqCard    본편 요구사항 카드의 작은 판 (REQ-QOS-07 · REQ-207)
//   Stripes        코드 줄 무늬
//   StepStrip      화면 위의 네 단계 띠 (s7~s9 의 띠와 같은 자리·크기)

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

export const tx = (px: number, weight = 500, c: string = color.ink): CSSProperties => ({ ...sans(px, weight), color: c, whiteSpace: "nowrap" });
export const mx = (px: number, weight = 500, c: string = color.inkSoft): CSSProperties => ({ ...mono(px, weight), letterSpacing: "0", color: c });

/** 테두리 상자. p 는 나타난 정도(0~1). 내용은 가운데에 놓인다. */
export const Box: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  c?: string;
  dash?: boolean;
  bg?: string;
  bw?: number;
  p?: number;
  o?: number;
  round?: boolean;
  style?: CSSProperties;
  children?: React.ReactNode;
}> = ({ x, y, w, h, c = color.lineStrong, dash, bg = withAlpha(color.panel, 0.92), bw = stroke.thin, p = 1, o = 1, round, style, children }) =>
  p <= 0 || o <= 0 ? null : (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        boxSizing: "border-box",
        border: `${bw}px ${dash ? "dashed" : "solid"} ${c}`,
        borderRadius: round ? h / 2 : 0,
        backgroundColor: bg,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        opacity: p * o,
        translate: `0px ${(1 - p) * 10}px`,
        ...style,
      }}
    >
      {children}
    </div>
  );

/** 자리 잡은 글자 한 덩이 */
export const At: React.FC<{ x: number; y: number; p?: number; o?: number; right?: boolean; center?: boolean; style?: CSSProperties; children: React.ReactNode }> = ({ x, y, p = 1, o = 1, right, center, style, children }) =>
  p <= 0 || o <= 0 ? null : (
    <div
      style={{
        position: "absolute",
        top: y,
        ...(right ? { right: 1920 - x } : center ? { left: x - 1000, width: 2000, display: "flex", justifyContent: "center" } : { left: x }),
        opacity: p * o,
        translate: `0px ${(1 - p) * 10}px`,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </div>
  );

// ── 요구사항 카드 (작은 판) ─────────────────────────────────────────────
export const REQ_CARD = { w: 640, h: 110 } as const;

export const MiniReqCard: React.FC<{ x: number; y: number; p?: number }> = ({ x, y, p = 1 }) =>
  p <= 0 ? null : (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: REQ_CARD.w,
        height: REQ_CARD.h,
        boxSizing: "border-box",
        border: `${stroke.thin}px solid ${color.lineStrong}`,
        backgroundColor: withAlpha(color.panel, 0.95),
        opacity: p,
        translate: `0px ${(1 - p) * 12}px`,
      }}
    >
      <div style={{ height: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", borderBottom: `${stroke.hair}px solid ${color.line}` }}>
        <div style={mx(30, 700, color.ink)}>{CARD.id}</div>
        <div style={mx(28, 500, color.inkSoft)}>{CARD.criterion}</div>
      </div>
      <div style={{ height: 56, display: "flex", alignItems: "center", gap: 16, padding: "0 20px" }}>
        <div style={{ ...tx(30, 700), flex: 1 }}>{CARD.title}</div>
        <div style={mx(22, 700, color.inkDim)}>JIRA</div>
        <div style={mx(26, 700, color.agent)}>{CARD.jira}</div>
      </div>
    </div>
  );

/** 코드 줄 무늬. p 만큼 왼쪽에서 그려진다. */
export const Stripes: React.FC<{ x: number; y: number; c?: string; p?: number; rows?: readonly (readonly [number, number])[] }> = ({
  x,
  y,
  c = color.inkDim,
  p = 1,
  rows = [
    [0, 150],
    [22, 208],
    [22, 176],
    [22, 120],
    [0, 190],
  ],
}) => (
  <svg width={300} height={rows.length * 16 + 8} style={{ position: "absolute", left: x, top: y, overflow: "visible" }}>
    {rows.map(([indent, w], i) => (
      <line key={i} x1={indent} x2={indent + w * clamp01(p * 1.6 - i * 0.12)} y1={6 + i * 16} y2={6 + i * 16} stroke={c} strokeWidth={stroke.bold} />
    ))}
  </svg>
);

// ── 네 단계 띠 (s6. s7~s9 는 kitB 의 같은 띠) ───────────────────────────
export const STEPS = ["① 도구 추출", "② 추적 태그", "③ 에이전트 제안 · 사람 승인", "④ commit마다 갱신"] as const;
const STEP_W = [250, 250, 470, 330];
export const STRIP = { x: 96, y: 76, h: 52, gap: 34 } as const;

/** at 에 띠가 놓이고, onAt 에 active 번째가 켜진다. */
export const StepStrip: React.FC<{ active: number; c: string; at: number; onAt: number }> = ({ active, c, at, onAt }) => {
  const frame = useCurrentFrame();
  let x: number = STRIP.x;
  const on = progress(frame, onAt, 14);
  return (
    <>
      {STEPS.map((name, i) => {
        const x0 = x;
        x += STEP_W[i] + STRIP.gap;
        const lit = i === active ? on : 0;
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
                border: `${stroke.thin}px solid ${blend(color.line, c, lit)}`,
                backgroundColor: withAlpha(c, 0.12 * lit),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...sans(30, lit > 0.5 ? 700 : 500),
                whiteSpace: "nowrap",
                color: blend(color.lineStrong, c, lit),
                opacity: progress(frame, at + i * 5, 12),
              }}
            >
              {name}
            </div>
            {i < 3 ? (
              <svg width={STRIP.gap} height={STRIP.h} style={{ position: "absolute", left: x0 + STEP_W[i], top: STRIP.y, opacity: progress(frame, at + i * 5 + 4, 12) }}>
                <path d={`M 4 ${STRIP.h / 2} H ${STRIP.gap - 12} M ${STRIP.gap - 16} ${STRIP.h / 2 - 7} L ${STRIP.gap - 6} ${STRIP.h / 2} L ${STRIP.gap - 16} ${STRIP.h / 2 + 7}`} fill="none" stroke={color.lineStrong} strokeWidth={stroke.thin} />
              </svg>
            ) : null}
          </React.Fragment>
        );
      })}
    </>
  );
};
