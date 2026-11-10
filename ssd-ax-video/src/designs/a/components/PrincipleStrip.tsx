import React from "react";
import { color, mono, sans, size, stroke } from "../theme";
import { LoopIcon } from "./Icons";
import { Trace } from "./Trace";

// 원칙 표식: 도면 아래쪽 표제란처럼 칸으로 나뉜 띠.
// 왼쪽은 원칙 이름, 가운데는 수치의 이름과 출처, 오른쪽은 0~100 눈금자 위의 수치 변화.

export type PrincipleData = {
  name: string;
  stat: string;
  from: string;
  to: string;
  source: string;
};

const NAME_W = 372;
const STAT_W = 384;

export const PrincipleStrip: React.FC<{
  principle: PrincipleData;
  x: number;
  y: number;
  w: number;
  h: number;
  icon?: React.ReactNode;
}> = ({ principle, x, y, w, h, icon }) => {
  const rule = `${stroke.hair}px solid ${color.lineStrong}`;
  const rulerW = w - NAME_W - STAT_W;
  const x0 = 56;
  const x1 = rulerW - 88;
  const axisY = h - 34;
  const at = (percent: number) => x0 + ((x1 - x0) * percent) / 100;
  const from = parseFloat(principle.from);
  const to = parseFloat(principle.to);
  const ticks: number[] = [];
  for (let p = 0; p <= 100; p += 5) ticks.push(p);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        boxSizing: "border-box",
        borderTop: rule,
        borderBottom: rule,
        display: "flex",
      }}
    >
      {/* 원칙 이름 */}
      <div
        style={{
          width: NAME_W,
          boxSizing: "border-box",
          borderRight: rule,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 10,
        }}
      >
        <div style={{ ...mono(size.label, 500), color: color.inkDim }}>PRINCIPLE</div>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {icon ?? <LoopIcon size={42} color={color.agent} width={3} />}
          <div style={{ ...sans(size.sub, 800), lineHeight: "56px", whiteSpace: "nowrap" }}>
            {principle.name}
          </div>
        </div>
      </div>

      {/* 수치 이름 · 출처 */}
      <div
        style={{
          width: STAT_W,
          boxSizing: "border-box",
          borderRight: rule,
          paddingLeft: 36,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <div style={{ ...sans(size.small, 600), whiteSpace: "nowrap" }}>{principle.stat}</div>
        <div style={{ ...sans(size.small, 500), color: color.inkDim, whiteSpace: "nowrap" }}>
          {principle.source}
        </div>
      </div>

      {/* 눈금자 */}
      <div style={{ position: "relative", width: rulerW }}>
        <svg width={rulerW} height={h} viewBox={`0 0 ${rulerW} ${h}`} style={{ position: "absolute", inset: 0 }}>
          <line x1={x0} x2={x1} y1={axisY} y2={axisY} stroke={color.lineStrong} strokeWidth={stroke.hair} />
          {ticks.map((p) => (
            <line
              key={p}
              x1={at(p)}
              x2={at(p)}
              y1={axisY}
              y2={axisY + (p % 50 === 0 ? 14 : p % 10 === 0 ? 9 : 5)}
              stroke={color.lineStrong}
              strokeWidth={stroke.hair}
            />
          ))}
          <line
            x1={at(from)}
            x2={at(from)}
            y1={axisY - 14}
            y2={axisY}
            stroke={color.inkSoft}
            strokeWidth={stroke.trace}
          />
          <Trace
            pts={[
              [at(from), axisY],
              [at(to), axisY],
            ]}
            stroke={color.agent}
            width={stroke.bold}
            arrow
          />
          <line
            x1={at(to)}
            x2={at(to)}
            y1={axisY - 14}
            y2={axisY + 14}
            stroke={color.agent}
            strokeWidth={stroke.bold}
          />
        </svg>
        <div style={{ position: "absolute", left: x0 - 34, top: axisY - 13, ...mono(size.label), color: color.inkDim }}>
          0
        </div>
        <div style={{ position: "absolute", left: x1 + 14, top: axisY - 13, ...mono(size.label), color: color.inkDim }}>
          100
        </div>
        <div
          style={{
            position: "absolute",
            left: at(from) - 100,
            width: 200,
            bottom: h - axisY + 20,
            textAlign: "center",
            ...mono(size.sub, 500),
            lineHeight: 1,
            color: color.inkSoft,
          }}
        >
          {principle.from}
        </div>
        <div
          style={{
            position: "absolute",
            left: at(to) - 150,
            width: 300,
            bottom: h - axisY + 20,
            textAlign: "center",
            ...mono(size.title, 700),
            lineHeight: 1,
            color: color.agent,
          }}
        >
          {principle.to}
        </div>
      </div>
    </div>
  );
};
