import React from "react";
import { interpolateColors } from "remotion";
import { clamp01, lerp, sub } from "../anim";
import { color, fullSvg, safe, sans, size, stroke } from "../theme";
import { Trace } from "./Trace";

// 7단계 진행 표시. 지난 단계는 실선과 채운 점, 현재 단계는 청록 고리, 남은 단계는 점선과 빈 점.
// position 이 소수면 고리가 두 단계 사이를 trace 를 따라 이동하는 중이다.
// 요구사항 카드는 stageX()로 단계의 x를 구해 그 위에 놓는다.

export const stageX = (
  index: number,
  count = 7,
  x0: number = safe.left,
  x1: number = safe.right,
): number => x0 + ((x1 - x0) / count) * (index + 0.5);

/** 닫히는 고리가 진행 표시 아래로 내려가는 깊이 */
export const TRACK_LOOP_DROP = 80;
const LOOP_OUT = 24;

export const StageTrack: React.FC<{
  stages: readonly string[];
  /** 현재 단계(0부터). 소수면 이동 중. 예: 2.4 는 3번째에서 4번째로 가는 길의 40% */
  position: number;
  /** trace의 y 좌표. 단계 이름은 그 아래에 놓인다. */
  y: number;
  x0?: number;
  x1?: number;
  /** 처음 그려지는 정도 0~1. 선이 왼쪽에서 오른쪽으로 그려지고 점과 이름이 차례로 나타난다. */
  appear?: number;
  /** 마지막 단계에서 첫 단계로 돌아가는 고리가 그려진 정도 0~1 */
  loop?: number;
}> = ({ stages, position, y, x0 = safe.left, x1 = safe.right, appear = 1, loop = 0 }) => {
  const count = stages.length;
  const slot = (x1 - x0) / count;
  const xs = stages.map((_, i) => stageX(i, count, x0, x1));
  const ringX = lerp(x0 + slot / 2, x1 - slot / 2, clamp01(position / (count - 1)));

  // 등장: 선이 먼저 그려지고(0~0.7), 선이 지나간 자리의 점과 이름이 뒤따른다.
  const lineEnd = lerp(x0, x1, sub(appear, 0, 0.7));
  const nodeP = (x: number): number => {
    const reach = ((x - x0) / (x1 - x0)) * 0.7;
    return sub(appear, reach, reach + 0.25);
  };

  return (
    <>
      <svg {...fullSvg}>
        {/* 지나온 구간 */}
        <line
          x1={x0}
          x2={Math.min(ringX, lineEnd)}
          y1={y}
          y2={y}
          stroke={color.inkSoft}
          strokeWidth={stroke.trace}
        />
        {/* 남은 구간 */}
        {lineEnd > ringX ? (
          <line
            x1={ringX}
            x2={lineEnd}
            y1={y}
            y2={y}
            stroke={color.lineStrong}
            strokeWidth={stroke.trace}
            strokeDasharray="3 9"
          />
        ) : null}
        <line
          x1={x0}
          x2={x0}
          y1={y - 9}
          y2={y + 9}
          stroke={color.inkSoft}
          strokeWidth={stroke.trace}
          opacity={sub(appear, 0, 0.1)}
        />
        <line
          x1={x1}
          x2={x1}
          y1={y - 9}
          y2={y + 9}
          stroke={loop > 0 ? color.agent : color.lineStrong}
          strokeWidth={stroke.trace}
          opacity={sub(appear, 0.7, 0.8)}
        />

        {/* 끝에서 처음으로: 고리가 닫힌다 */}
        {loop > 0 ? (
          <Trace
            pts={[
              [x1, y],
              [x1 + LOOP_OUT, y],
              [x1 + LOOP_OUT, y + TRACK_LOOP_DROP],
              [x0 - LOOP_OUT, y + TRACK_LOOP_DROP],
              [x0 - LOOP_OUT, y],
              [x0 - 2, y],
            ]}
            stroke={color.agent}
            dash="10 8"
            chamfer={12}
            arrow
            progress={loop}
          />
        ) : null}

        {xs.map((x, i) => {
          const p = nodeP(x);
          if (p <= 0) return null;
          const done = x < ringX;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={7 * (0.5 + 0.5 * p)}
              opacity={p}
              fill={done ? color.inkSoft : color.bg}
              stroke={done ? color.inkSoft : color.lineStrong}
              strokeWidth={stroke.trace}
            />
          );
        })}

        {/* 현재 단계의 고리 */}
        {nodeP(ringX) > 0 ? (
          <g opacity={nodeP(ringX)}>
            <circle cx={ringX} cy={y} r={14} fill={color.bg} stroke={color.agent} strokeWidth={stroke.bold} />
            <circle cx={ringX} cy={y} r={5.5} fill={color.agent} />
          </g>
        ) : null}
      </svg>

      {stages.map((name, i) => {
        const p = nodeP(xs[i]);
        // 고리가 가까울수록 "현재"에 가깝다.
        const near = clamp01(1 - Math.abs(position - i));
        const base = i < position ? color.inkSoft : color.inkDim;
        return (
          <div
            key={name}
            style={{
              position: "absolute",
              left: xs[i] - slot / 2,
              width: slot,
              top: y + 22,
              textAlign: "center",
              whiteSpace: "nowrap",
              ...sans(size.small, Math.round(lerp(500, 700, near))),
              lineHeight: "38px",
              color: interpolateColors(near, [0, 1], [base, color.ink]),
              opacity: p,
              translate: `0px ${(1 - p) * 8}px`,
            }}
          >
            {name}
          </div>
        );
      })}
    </>
  );
};
