import React from "react";
import { interpolateColors, useCurrentFrame } from "remotion";
import { clamp01, ease, lerp, progress, sub } from "../../anim";
import { color, fullSvg, sans, size, stroke } from "../../theme";
import { JAMS, ROW, SLOT, T, landedCount, stageX } from "./layout";

// 7단계가 한 줄로 이어진 흐름. 사례 구간의 진행 표시(StageTrack)와 같은 모양이다.
//   - 조각이 쌓이는 단계의 점은 쌓인 만큼 경고색으로 바뀌고, 그 뒤쪽 선은 흐려진다(흘러가는 것이 없다).
//   - 수치가 나오면 검증 쪽 두 단계의 이름만 또렷해진다.

export const StageRow: React.FC<{ stages: readonly string[] }> = ({ stages }) => {
  const frame = useCurrentFrame();
  const appear = progress(frame, T.row, T.rowDur, ease.inOut);
  const lineEnd = lerp(ROW.x0, ROW.x1, sub(appear, 0, 0.75));
  const nodeP = (x: number): number => {
    const reach = ((x - ROW.x0) / (ROW.x1 - ROW.x0)) * 0.75;
    return sub(appear, reach, reach + 0.25);
  };

  // 쌓인 정도 0~1
  const jam = JAMS.map((j, i) => clamp01((landedCount(frame, i) - 2) / (j.count * 0.5)));
  const focus = progress(frame, T.stat - 6, 16, ease.inOut);
  const firstJamX = stageX(JAMS[0].stage);
  const starved = jam[0];

  return (
    <>
      <svg {...fullSvg}>
        {/* 병목 앞까지 */}
        <line
          x1={ROW.x0}
          x2={Math.min(lineEnd, firstJamX)}
          y1={ROW.y}
          y2={ROW.y}
          stroke={color.inkSoft}
          strokeWidth={stroke.trace}
        />
        {/* 병목 뒤: 흘러가는 것이 줄어 선이 흐려진다 */}
        {lineEnd > firstJamX ? (
          <>
            <line
              x1={firstJamX}
              x2={lineEnd}
              y1={ROW.y}
              y2={ROW.y}
              stroke={color.inkSoft}
              strokeWidth={stroke.trace}
              opacity={1 - starved}
            />
            <line
              x1={firstJamX}
              x2={lineEnd}
              y1={ROW.y}
              y2={ROW.y}
              stroke={color.lineStrong}
              strokeWidth={stroke.trace}
              strokeDasharray="3 9"
              opacity={starved}
            />
          </>
        ) : null}
        {[ROW.x0, ROW.x1].map((x, i) => (
          <line
            key={x}
            x1={x}
            x2={x}
            y1={ROW.y - 9}
            y2={ROW.y + 9}
            stroke={i === 0 ? color.inkSoft : interpolateColors(starved, [0, 1], [color.inkSoft, color.lineStrong])}
            strokeWidth={stroke.trace}
            opacity={i === 0 ? sub(appear, 0, 0.1) : sub(appear, 0.75, 0.85)}
          />
        ))}

        {stages.map((_, i) => {
          const x = stageX(i);
          const p = nodeP(x);
          if (p <= 0) return null;
          const jamIndex = JAMS.map((j) => j.stage).indexOf(i);
          const level = jamIndex < 0 ? 0 : jam[jamIndex];
          const after = x > firstJamX ? starved : 0;
          return (
            <circle
              key={i}
              cx={x}
              cy={ROW.y}
              r={(7 + 3 * level) * (0.5 + 0.5 * p)}
              opacity={p}
              fill={color.bg}
              stroke={
                level > 0
                  ? interpolateColors(level, [0, 1], [color.inkSoft, color.problem])
                  : interpolateColors(after, [0, 1], [color.inkSoft, color.lineStrong])
              }
              strokeWidth={lerp(stroke.trace, stroke.bold, level)}
            />
          );
        })}
      </svg>

      {stages.map((name, i) => {
        const x = stageX(i);
        const p = nodeP(x);
        const jamIndex = JAMS.map((j) => j.stage).indexOf(i);
        const isJam = jamIndex >= 0;
        // 쌓이는 단계는 쌓이면서, 수치가 나오면 완전히 또렷해진다. 나머지는 수치가 나오면 물러난다.
        const strong = isJam ? Math.max(jam[jamIndex], focus) : 0;
        const rest = isJam ? 0 : focus;
        const tone = isJam
          ? interpolateColors(strong, [0, 1], [color.inkSoft, color.ink])
          : interpolateColors(rest, [0, 1], [color.inkSoft, color.inkDim]);
        return (
          <div
            key={name}
            style={{
              position: "absolute",
              left: x - SLOT / 2,
              width: SLOT,
              top: ROW.y + 22,
              textAlign: "center",
              whiteSpace: "nowrap",
              ...sans(size.small, Math.round(lerp(500, 700, strong))),
              lineHeight: "38px",
              color: tone,
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
