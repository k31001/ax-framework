import React from "react";
import { draw, sub } from "../../anim";
import { color, mono, sans, size, stroke, withAlpha } from "../../theme";
import { NODE } from "./layout";

// 이슈 한 건: 가는 선의 카드. 왼쪽 위 테두리에 그 유형을 맡는 곳(JIRA · R4J · XRAY)의 mono 라벨이 얹힌다.
// 실제 Jira 화면의 색이나 로고는 쓰지 않는다.

export const IssueNode: React.FC<{
  x: number;
  y: number;
  issueKey: string;
  type: string;
  app: string;
  /** 등장 진행값 0~1 */
  p: number;
  tint?: string;
  /** 아직 제안인 이슈: 점선 테두리 */
  dashed?: boolean;
  /** 강조 0~1 */
  glow?: number;
  glowTint?: string;
}> = ({ x, y, issueKey, type, app, p, tint = color.inkSoft, dashed, glow = 0, glowTint = color.agent }) => {
  if (p <= 0) return null;
  const { w, h } = NODE;
  const outline = 2 * (w + h);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: color.panel,
          opacity: sub(p, 0.1, 0.7),
        }}
      />
      <div style={{ position: "absolute", inset: 0, backgroundColor: withAlpha(glowTint, 0.14 * glow) }} />
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <rect
          x={1}
          y={1}
          width={w - 2}
          height={h - 2}
          fill="none"
          stroke={tint}
          strokeWidth={stroke.thin}
          {...(dashed ? { strokeDasharray: "8 6", opacity: sub(p, 0, 0.6) } : draw(sub(p, 0, 0.8), outline))}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          left: 14,
          top: -14,
          height: 28,
          padding: "0 8px",
          display: "flex",
          alignItems: "center",
          backgroundColor: color.bg,
          ...mono(size.label, 700),
          color: color.inkDim,
          opacity: sub(p, 0.3, 0.8),
        }}
      >
        {app}
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "6px 20px 0",
          opacity: sub(p, 0.3, 1),
          translate: `0px ${(1 - sub(p, 0.3, 1)) * 8}px`,
        }}
      >
        <div style={{ ...mono(size.body, 700), color: color.ink }}>{issueKey}</div>
        <div style={{ ...sans(size.small, 600), color: color.inkSoft, whiteSpace: "nowrap" }}>{type}</div>
      </div>
    </div>
  );
};
