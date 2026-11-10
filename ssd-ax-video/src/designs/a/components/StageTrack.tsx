import React from "react";
import { FRAME, color, safe, sans, size, stroke } from "../theme";

// 7단계 진행 표시. 지난 단계는 실선, 현재 단계는 청록 고리, 남은 단계는 점선.
// 요구사항 카드는 stageX()로 현재 단계의 x를 구해 그 위에 놓는다.

export const stageX = (
  index: number,
  count: number,
  x0: number = safe.left,
  x1: number = safe.right,
): number => x0 + ((x1 - x0) / count) * (index + 0.5);

export const StageTrack: React.FC<{
  stages: readonly string[];
  current: number;
  /** trace의 y 좌표. 단계 이름은 그 아래에 놓인다. */
  y: number;
  x0?: number;
  x1?: number;
}> = ({ stages, current, y, x0 = safe.left, x1 = safe.right }) => {
  const count = stages.length;
  const slot = (x1 - x0) / count;
  const xs = stages.map((_, i) => stageX(i, count, x0, x1));
  const cx = xs[current];

  return (
    <>
      <svg
        width={FRAME.w}
        height={FRAME.h}
        viewBox={`0 0 ${FRAME.w} ${FRAME.h}`}
        style={{ position: "absolute", inset: 0 }}
      >
        {/* 지나온 구간 */}
        <line x1={x0} x2={cx} y1={y} y2={y} stroke={color.inkSoft} strokeWidth={stroke.trace} />
        {/* 남은 구간 */}
        <line
          x1={cx}
          x2={x1}
          y1={y}
          y2={y}
          stroke={color.lineStrong}
          strokeWidth={stroke.trace}
          strokeDasharray="3 9"
        />
        <line x1={x0} x2={x0} y1={y - 9} y2={y + 9} stroke={color.inkSoft} strokeWidth={stroke.trace} />
        <line x1={x1} x2={x1} y1={y - 9} y2={y + 9} stroke={color.lineStrong} strokeWidth={stroke.trace} />

        {xs.map((x, i) => {
          if (i === current) {
            return (
              <g key={i}>
                <circle cx={x} cy={y} r={14} fill={color.bg} stroke={color.agent} strokeWidth={stroke.bold} />
                <circle cx={x} cy={y} r={5.5} fill={color.agent} />
              </g>
            );
          }
          const done = i < current;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={7}
              fill={done ? color.inkSoft : color.bg}
              stroke={done ? color.inkSoft : color.lineStrong}
              strokeWidth={stroke.trace}
            />
          );
        })}
      </svg>

      {stages.map((name, i) => (
        <div
          key={name}
          style={{
            position: "absolute",
            left: xs[i] - slot / 2,
            width: slot,
            top: y + 22,
            textAlign: "center",
            whiteSpace: "nowrap",
            ...sans(size.small, i === current ? 700 : 500),
            lineHeight: "38px",
            color: i === current ? color.ink : i < current ? color.inkSoft : color.inkDim,
          }}
        >
          {name}
        </div>
      ))}
    </>
  );
};
