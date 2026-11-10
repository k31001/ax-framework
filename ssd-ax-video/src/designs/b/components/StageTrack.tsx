import type { FC } from "react";
import { COLOR, RULE, SIZE, WEIGHT, mono, pad2, sans } from "../theme";
import { HRule, VRule } from "./Rule";

type StageTrackProps = {
  stages: readonly string[];
  /** 현재 단계(0부터) */
  current: number;
  x: number;
  y: number;
  width: number;
  /** 현재 단계의 깃대 길이. 요구사항 카드의 윗변까지 내린다. */
  poleLength?: number;
};

/** i번째 단계 칸의 왼쪽 x와 너비 */
export const stageSlot = (
  index: number,
  count: number,
  x: number,
  width: number,
): { x: number; width: number } => ({
  x: x + (width / count) * index,
  width: width / count,
});

export const STAGE_TRACK_HEIGHT = 90;

// 7단계 진행 표시. 지나온 구간은 굵은 괘선, 남은 구간은 가는 괘선이다.
// 현재 단계의 눈금이 깃대로 길어지고, 요구사항 카드가 그 깃대에 걸린다.
// 영상에서는 단계가 바뀔 때 굵은 괘선이 한 칸 더 그어지고 깃대와 카드가 따라 옮겨 간다.
export const StageTrack: FC<StageTrackProps> = ({
  stages,
  current,
  x,
  y,
  width,
  poleLength = STAGE_TRACK_HEIGHT,
}) => {
  const count = stages.length;
  const doneEnd = stageSlot(current + 1, count, x, width).x;
  return (
    <>
      <HRule x={x} y={y} length={doneEnd - x} weight={RULE.heavy} />
      <HRule
        x={doneEnd}
        y={y + (RULE.heavy - RULE.hair) / 2}
        length={x + width - doneEnd}
        weight={RULE.hair}
      />
      {stages.map((name, i) => {
        const slot = stageSlot(i, count, x, width);
        const isCurrent = i === current;
        const isAhead = i > current;
        const color = isAhead ? COLOR.inkFaint : COLOR.ink;
        return (
          <div key={name}>
            {i > 0 && !isCurrent ? (
              <VRule
                x={slot.x}
                y={y + (isAhead ? 0 : RULE.heavy)}
                length={STAGE_TRACK_HEIGHT - (isAhead ? 0 : RULE.heavy)}
                weight={RULE.hair}
                color={color}
              />
            ) : null}
            {isCurrent ? (
              <VRule x={slot.x} y={y} length={poleLength} weight={RULE.mid} />
            ) : null}
            <div
              style={{
                position: "absolute",
                left: slot.x + (i === 0 ? 0 : 14),
                top: y + RULE.heavy + 8,
                color,
                whiteSpace: "nowrap",
              }}
            >
              <div style={mono(SIZE.label, isCurrent ? 700 : 500)}>
                {pad2(i + 1)}
              </div>
              <div
                style={{
                  marginTop: 1,
                  ...sans(SIZE.note, isCurrent ? WEIGHT.heavy : WEIGHT.medium, {
                    letterSpacing: "-0.03em",
                  }),
                }}
              >
                {name}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
};
