import React from "react";
import { DUR, ease, progress } from "../../../video/anim";
import { color, mono, sans, stroke, withAlpha } from "../../../video/theme";

// 추적성 편 s10~s11(고칠 수 없는 문서, 판본 변경)이 같이 쓰는 부품: 자물쇠, 자물쇠 달린 칩, 등장·퇴장 도우미.
// 상자·글자·표·창은 kitB 의 것을 그대로 쓴다.

/** at 에 나타나고 out 에 사라지는 정도 0~1 */
export const vis = (frame: number, at: number, out?: number, d: number = DUR.enter): number =>
  progress(frame, at, d) * (out === undefined ? 1 : 1 - progress(frame, out, DUR.exit, ease.in));

/** 표준 문서와 그 조항의 색: 우리 것이 아니다(사람의 호박색도, 도구의 청록도 아닌 흰 회색) */
export const EXTERNAL = color.inkSoft;

/** 자물쇠. size 는 높이 */
export const Lock: React.FC<{ size?: number; c?: string; style?: React.CSSProperties }> = ({ size = 30, c = EXTERNAL, style }) => (
  <svg width={size * 0.8} height={size} viewBox="0 0 24 30" style={{ flex: "none", ...style }}>
    <path d="M 6.5 13 V 9 a 5.5 5.5 0 0 1 11 0 V 13" fill="none" stroke={c} strokeWidth={2.4} />
    <rect x={3} y={13} width={18} height={14} fill={withAlpha(c, 0.18)} stroke={c} strokeWidth={2.4} />
    <rect x={10.8} y={17.5} width={2.4} height={5} fill={c} />
  </svg>
);

/** 화면 좌표에 놓는 자물쇠 */
export const LockAt: React.FC<{ x: number; y: number; size?: number; c?: string; p?: number }> = ({ x, y, size = 30, c, p = 1 }) =>
  p <= 0 ? null : (
    <div style={{ position: "absolute", left: x, top: y, opacity: p, display: "flex" }}>
      <Lock size={size} c={c} />
    </div>
  );

/** 테두리 칩: 아이콘(선택) + 글자 한 줄. 높이 46 */
export const Tag: React.FC<{
  x: number;
  y: number;
  w?: number;
  text: React.ReactNode;
  c?: string;
  p?: number;
  code?: boolean;
  px?: number;
  dash?: boolean;
  icon?: React.ReactNode;
  h?: number;
}> = ({ x, y, w, text, c = EXTERNAL, p = 1, code, px = 30, dash, icon, h = 46 }) =>
  p <= 0 ? null : (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        boxSizing: "border-box",
        border: `${stroke.thin}px ${dash ? "dashed" : "solid"} ${c}`,
        backgroundColor: withAlpha(c, 0.07),
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "0 14px",
        opacity: p,
        translate: `0px ${(1 - p) * 8}px`,
        ...(code ? mono(px, 600) : sans(px, 600)),
        letterSpacing: code ? "0" : undefined,
        whiteSpace: "nowrap",
        color: code ? color.ink : color.ink,
      }}
    >
      {icon}
      {text}
    </div>
  );

/** 붉은 X (막힘). (x, y) 가 가운데 */
export const Cross: React.FC<{ x: number; y: number; r?: number; p?: number }> = ({ x, y, r = 13, p = 1 }) =>
  p <= 0 ? null : (
    <svg width={r * 2 + 8} height={r * 2 + 8} style={{ position: "absolute", left: x - r - 4, top: y - r - 4, opacity: p }}>
      <path d={`M 4 4 L ${r * 2 + 4} ${r * 2 + 4} M ${r * 2 + 4} 4 L 4 ${r * 2 + 4}`} stroke={color.problem} strokeWidth={stroke.bold} fill="none" />
    </svg>
  );
