import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, countUp, ease, enter, lerp, progress, stagger, sub } from "../anim";
import type { Principle } from "../content";
import { color, mono, sans, size, stroke } from "../theme";
import { ChainIcon, LoopIcon, SourceIcon } from "./Icons";
import { Trace } from "./Trace";

// 원칙 표식: 도면 아래쪽 표제란처럼 칸으로 나뉜 띠.
// 왼쪽은 원칙 이름. 수치가 있으면 가운데에 수치의 이름과 출처, 오른쪽에 0~100 눈금자 위의 수치 변화.
// at 프레임부터: 위아래 선이 그려지고 → 이름이 들어오고 → 눈금자가 그려지고 → 막대가 자라며 수치가 올라간다.

export type PrincipleIcon = "loop" | "source" | "chain";

const ICONS = { loop: LoopIcon, source: SourceIcon, chain: ChainIcon } as const;

export const PRINCIPLE_NAME_W = 372;
const STAT_W = 384;

export const PrincipleStrip: React.FC<{
  principle: Pick<Principle, "name" | "stat">;
  x: number;
  y: number;
  w: number;
  h: number;
  /** 나타나는 프레임 */
  at: number;
  icon?: PrincipleIcon;
}> = ({ principle, x, y, w, h, at, icon = "loop" }) => {
  const frame = useCurrentFrame();
  const rules = progress(frame, at, DUR.draw + 6, ease.out);
  if (rules <= 0) return null;

  const Icon = ICONS[icon];
  const rule = `${stroke.hair}px solid ${color.lineStrong}`;
  const cellRule = sub(rules, 0.4, 1);
  const stat = principle.stat;

  // 눈금자
  const rulerW = w - PRINCIPLE_NAME_W - STAT_W;
  const x0 = 56;
  const x1 = rulerW - 88;
  const axisY = h - 34;
  const pos = (percent: number) => x0 + ((x1 - x0) * percent) / 100;
  const from = stat ? parseFloat(stat.from) : 0;
  const to = stat ? parseFloat(stat.to) : 0;
  const unit = stat ? stat.to.replace(/[\d.\s]/g, "") : "";
  const ticks: number[] = [];
  for (let p = 0; p <= 100; p += 5) ticks.push(p);

  const rulerAt = at + 14;
  const axis = progress(frame, rulerAt, DUR.draw, ease.out);
  const fromP = progress(frame, rulerAt + 12, DUR.enter, ease.out);
  const grow = progress(frame, rulerAt + 24, 30, ease.inOut);
  const value = lerp(from, to, grow);

  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h }}>
      {/* 위아래 선: 왼쪽에서 오른쪽으로 */}
      <div style={{ position: "absolute", left: 0, top: 0, width: w * rules, borderTop: rule }} />
      <div style={{ position: "absolute", left: 0, bottom: 0, width: w * rules, borderTop: rule }} />

      {/* 원칙 이름 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: PRINCIPLE_NAME_W,
          height: h,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 10,
        }}
      >
        <div style={{ ...mono(size.label, 500), color: color.inkDim, opacity: progress(frame, at + 4) }}>PRINCIPLE</div>
        <div style={{ display: "flex", alignItems: "center", gap: 18, ...enter(frame, at + 6, { from: "left" }) }}>
          <Icon size={42} color={color.agent} width={3} />
          <div style={{ ...sans(size.sub, 800), lineHeight: "56px", whiteSpace: "nowrap" }}>{principle.name}</div>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: PRINCIPLE_NAME_W,
          top: (h * (1 - cellRule)) / 2,
          height: h * cellRule,
          borderLeft: rule,
        }}
      />

      {stat ? (
        <>
          {/* 수치 이름 · 출처 */}
          <div
            style={{
              position: "absolute",
              left: PRINCIPLE_NAME_W,
              top: 0,
              width: STAT_W,
              height: h,
              boxSizing: "border-box",
              paddingLeft: 36,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <div style={{ ...sans(size.small, 600), whiteSpace: "nowrap", ...enter(frame, stagger(at + 10, 0, 4)) }}>
              {stat.label}
            </div>
            <div
              style={{
                ...sans(size.small, 500),
                color: color.inkDim,
                whiteSpace: "nowrap",
                ...enter(frame, stagger(at + 10, 1, 4)),
              }}
            >
              {stat.source}
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              left: PRINCIPLE_NAME_W + STAT_W,
              top: (h * (1 - cellRule)) / 2,
              height: h * cellRule,
              borderLeft: rule,
            }}
          />

          {/* 눈금자 */}
          <div style={{ position: "absolute", left: PRINCIPLE_NAME_W + STAT_W, top: 0, width: rulerW, height: h }}>
            <svg width={rulerW} height={h} viewBox={`0 0 ${rulerW} ${h}`} style={{ position: "absolute", inset: 0 }}>
              <line
                x1={x0}
                x2={lerp(x0, x1, axis)}
                y1={axisY}
                y2={axisY}
                stroke={color.lineStrong}
                strokeWidth={stroke.hair}
              />
              {ticks.map((p) =>
                p / 100 <= axis ? (
                  <line
                    key={p}
                    x1={pos(p)}
                    x2={pos(p)}
                    y1={axisY}
                    y2={axisY + (p % 50 === 0 ? 14 : p % 10 === 0 ? 9 : 5)}
                    stroke={color.lineStrong}
                    strokeWidth={stroke.hair}
                  />
                ) : null,
              )}
              <line
                x1={pos(from)}
                x2={pos(from)}
                y1={axisY - 14 * fromP}
                y2={axisY}
                stroke={color.inkSoft}
                strokeWidth={stroke.trace}
                opacity={fromP}
              />
              {grow > 0 ? (
                <>
                  <Trace
                    pts={[
                      [pos(from), axisY],
                      [pos(value), axisY],
                    ]}
                    stroke={color.agent}
                    width={stroke.bold}
                    arrow
                  />
                  <line
                    x1={pos(value)}
                    x2={pos(value)}
                    y1={axisY - 14}
                    y2={axisY + 14}
                    stroke={color.agent}
                    strokeWidth={stroke.bold}
                  />
                </>
              ) : null}
            </svg>
            <div
              style={{
                position: "absolute",
                left: x0 - 34,
                top: axisY - 13,
                ...mono(size.label),
                color: color.inkDim,
                opacity: sub(axis, 0, 0.3),
              }}
            >
              0
            </div>
            <div
              style={{
                position: "absolute",
                left: x1 + 14,
                top: axisY - 13,
                ...mono(size.label),
                color: color.inkDim,
                opacity: sub(axis, 0.7, 1),
              }}
            >
              100
            </div>
            <div
              style={{
                position: "absolute",
                left: pos(from) - 100,
                width: 200,
                bottom: h - axisY + 20,
                textAlign: "center",
                ...mono(size.sub, 500),
                lineHeight: 1,
                color: color.inkSoft,
                opacity: fromP,
                translate: `0px ${(1 - fromP) * 8}px`,
              }}
            >
              {stat.from}
            </div>
            {/* 올라가는 수치: 막대의 머리를 따라간다 */}
            <div
              style={{
                position: "absolute",
                left: pos(value) - 150,
                width: 300,
                bottom: h - axisY + 20,
                textAlign: "center",
                ...mono(size.title, 700),
                lineHeight: 1,
                color: color.agent,
                opacity: sub(grow, 0.3, 0.55),
              }}
            >
              {countUp(grow, from, to)}
              {unit}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
