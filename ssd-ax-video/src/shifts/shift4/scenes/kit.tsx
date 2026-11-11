import React from "react";
import { clamp01 } from "../../../video/anim";
import { AgentIcon, HumanIcon } from "../../../video/components/Icons";
import { color, mono, sans, stroke, withAlpha } from "../../../video/theme";
import { useScene } from "../../lib";

// 이 편(시스템)의 씬들이 같이 쓰는 부품: 시간 도우미, 선 아이콘, 도구 노드, 질문 카드, 에이전트 노드.

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

// ── 아이콘 (24×24 좌표계, 선으로만) ─────────────────────────────────────
export type IcoProps = { size?: number; color?: string; width?: number };
export type IconType = React.FC<IcoProps>;

const Ico: React.FC<IcoProps & { children: React.ReactNode }> = ({ size: s = 40, color: c = color.ink, width = stroke.trace, children }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={(width * 24) / s} strokeLinecap="square" strokeLinejoin="miter" style={{ display: "block", flex: "none" }}>
    {children}
  </svg>
);

export const DbIcon: IconType = (p) => (
  <Ico {...p}>
    <ellipse cx={12} cy={6} rx={8} ry={3} />
    <path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6" />
    <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
  </Ico>
);
export const SimIcon: IconType = (p) => (
  <Ico {...p}>
    <rect x={3} y={4} width={18} height={16} />
    <path d="M10 8.5v7l6-3.5z" />
  </Ico>
);
export const WaveIcon: IconType = (p) => (
  <Ico {...p}>
    <path d="M2 16h4V8h5v8h4V8h5v8h2" />
  </Ico>
);
export const SpecIcon: IconType = (p) => (
  <Ico {...p}>
    <path d="M6 3h9l4 4v14H6z" />
    <path d="M9 11h7M9 14.5h7M9 18h4" />
  </Ico>
);
export const BugIcon: IconType = (p) => (
  <Ico {...p}>
    <ellipse cx={12} cy={13.5} rx={4.5} ry={6} />
    <path d="M12 8v11M9 4.5l1.5 3M15 4.5l-1.5 3M3.5 10l4 1.5M3.5 17.5l4-1.5M20.5 10l-4 1.5M20.5 17.5l-4-1.5" />
  </Ico>
);
export const TicketIcon: IconType = (p) => (
  <Ico {...p}>
    <path d="M3 6h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4z" />
    <path d="M9 9v1.5M9 13.5V15" />
  </Ico>
);
export const CodeIcon: IconType = (p) => (
  <Ico {...p}>
    <path d="M5 3h10l4 4v14H5z" />
    <path d="M10.5 11.5 8 14l2.5 2.5M13.5 11.5 16 14l-2.5 2.5" />
  </Ico>
);
export const SearchIcon: IconType = (p) => (
  <Ico {...p}>
    <circle cx={10.5} cy={10.5} r={6} />
    <path d="M15.5 15.5l5 5" />
  </Ico>
);
export const ChatIcon: IconType = (p) => (
  <Ico {...p}>
    <path d="M3 4h18v12H10l-5 4v-4H3z" />
  </Ico>
);
export const LockIcon: React.FC<IcoProps & { open?: boolean }> = ({ open, ...p }) => (
  <Ico {...p}>
    <rect x={5} y={11} width={14} height={10} />
    <path d={open ? "M8 11V7.5a4 4 0 0 1 7.7-1.5" : "M8 11V7.5a4 4 0 0 1 8 0V11"} />
  </Ico>
);

// ── 도구 노드 ───────────────────────────────────────────────────────────
// 흐린 상태(연결 없음)에서 lit(청록, 에이전트가 닿음) 또는 hot(붉은색, 막힘)으로 바뀐다.
export const TOOL = { x: 1330, w: 460, h: 88, y0: 140, pitch: 118 } as const;
export const toolY = (i: number): number => TOOL.y0 + i * TOOL.pitch;
export const toolCy = (i: number): number => toolY(i) + TOOL.h / 2;

export const ToolNode: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  Icon: IconType;
  label: string;
  /** 나타난 정도 */
  p?: number;
  lit?: number;
  hot?: number;
  code?: boolean;
  px?: number;
  children?: React.ReactNode;
}> = ({ x, y, w, h, Icon, label, p = 1, lit = 0, hot = 0, code, px = 30, children }) => {
  if (p <= 0) return null;
  const edge = blend(blend(color.line, color.agent, lit), color.problem, hot);
  const ink = blend(blend(color.inkDim, color.ink, lit), color.inkSoft, hot * (1 - lit));
  const ico = blend(blend(color.inkDim, color.agent, lit), color.problem, hot);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        boxSizing: "border-box",
        border: `${stroke.thin}px solid ${edge}`,
        backgroundColor: withAlpha(color.panel, 0.9),
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "0 22px",
        opacity: p,
        translate: `${(1 - p) * 12}px 0px`,
      }}
    >
      <Icon size={Math.min(44, h - 28)} color={ico} />
      <div style={{ ...(code ? mono(px, 500) : sans(px, 600)), color: ink, whiteSpace: "nowrap" }}>{label}</div>
      {children}
    </div>
  );
};

/** 노드 오른쪽 끝의 작은 표식 자리 */
export const Badge: React.FC<{ p: number; children: React.ReactNode }> = ({ p, children }) =>
  p <= 0 ? null : (
    <div style={{ position: "absolute", right: 18, top: 0, bottom: 0, display: "flex", alignItems: "center", opacity: p, scale: `${0.7 + 0.3 * p}` }}>{children}</div>
  );

// ── 질문 카드 (사람의 질문, 호박색) ─────────────────────────────────────
export const QuestionCard: React.FC<{ text: string; px?: number; h?: number; style?: React.CSSProperties }> = ({ text, px = 30, h = 64, style }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 16,
      height: h,
      boxSizing: "border-box",
      padding: "0 22px",
      border: `${stroke.thin}px solid ${color.human}`,
      backgroundColor: withAlpha(color.panel, 0.96),
      ...style,
    }}
  >
    <HumanIcon size={Math.round(px * 1.05)} color={color.human} />
    <div style={{ ...sans(px, 600), whiteSpace: "nowrap" }}>{text}</div>
  </div>
);

// ── 에이전트 노드 ───────────────────────────────────────────────────────
export const AgentNode: React.FC<{ x: number; y: number; w: number; h: number; p?: number; glow?: number; label?: string }> = ({ x, y, w, h, p = 1, glow = 0, label = "AGENT" }) =>
  p <= 0 ? null : (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        boxSizing: "border-box",
        border: `${stroke.trace}px solid ${color.agent}`,
        backgroundColor: blend(color.panel, color.agent, 0.06 + 0.2 * glow),
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        opacity: p,
        scale: `${0.92 + 0.08 * p}`,
      }}
    >
      <AgentIcon size={Math.min(56, h - 56)} color={color.agent} />
      <div style={{ ...mono(22, 700), color: color.agent }}>{label}</div>
    </div>
  );

/** 테두리 위에 얹는 작은 꼬리표 (번호, 영문 라벨) */
export const EdgeTag: React.FC<{ x: number; y: number; text: string; c?: string; p?: number; px?: number }> = ({ x, y, text, c = color.inkSoft, p = 1, px = 22 }) =>
  p <= 0 ? null : (
    <div style={{ position: "absolute", left: x, top: y - Math.round(px * 0.75), padding: "0 10px", backgroundColor: color.bg, ...(px <= 22 ? mono(px, 700) : sans(px, 700)), color: c, opacity: p, whiteSpace: "nowrap" }}>{text}</div>
  );
