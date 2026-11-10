// 7단계 진행 표시. 위에 단계 이름, 아래에 궤도와 점.
// 요구사항 카드는 현재 단계의 점 아래에 매달려 궤도를 따라 이동한다.
// 좌표를 layoutStages()로 미리 계산하므로, 영상에서는 cx를 보간해 카드를 옮기면 된다.

import { C, KR, R, T } from "../theme";
import { estimateWidth } from "../text";
import { CheckIcon } from "./Icons";

export type StageBox = { x: number; w: number; cx: number };

const LABEL_H = 52;
const TRACK_Y = LABEL_H + 20;
export const STRIP_H = TRACK_Y + 10;

const CURRENT_PAD = 22;

/** 단계 이름의 폭에 맞춰 칸을 나누고 남는 폭을 사이 간격으로 고르게 나눈다. */
export const layoutStages = (stages: readonly string[], current: number, width: number): StageBox[] => {
  const widths = stages.map((s, i) =>
    i === current ? estimateWidth(s, T.sub) * 1.02 + CURRENT_PAD * 2 : estimateWidth(s, T.label) * 1.02,
  );
  const total = widths.reduce((a, b) => a + b, 0);
  const gap = (width - total) / (stages.length - 1);
  let x = 0;
  return widths.map((w) => {
    const box = { x, w, cx: x + w / 2 };
    x += w + gap;
    return box;
  });
};

export const ProgressStrip: React.FC<{
  stages: readonly string[];
  current: number;
  width: number;
  boxes?: StageBox[];
}> = ({ stages, current, width, boxes }) => {
  const layout = boxes ?? layoutStages(stages, current, width);
  const first = layout[0].cx;
  const last = layout[layout.length - 1].cx;
  const now = layout[current].cx;
  return (
    <div style={{ position: "relative", width, height: STRIP_H }}>
      {stages.map((s, i) => {
        const b = layout[i];
        const isNow = i === current;
        const done = i < current;
        return (
          <div
            key={s}
            style={{
              ...KR,
              position: "absolute",
              left: b.x,
              top: 0,
              width: b.w,
              height: LABEL_H,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              whiteSpace: "nowrap",
              fontSize: isNow ? T.sub : T.label,
              fontWeight: isNow ? 800 : done ? 600 : 500,
              color: isNow ? "#FFFFFF" : done ? C.ink2 : C.ink3,
              backgroundColor: isNow ? C.ink : "transparent",
              borderRadius: R.md,
            }}
          >
            {s}
          </div>
        );
      })}
      {/* 궤도 */}
      <div
        style={{
          position: "absolute",
          left: first,
          top: TRACK_Y - 2,
          width: last - first,
          height: 4,
          borderRadius: 2,
          backgroundColor: C.line,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: first,
          top: TRACK_Y - 2,
          width: now - first,
          height: 4,
          borderRadius: 2,
          backgroundColor: C.ink,
        }}
      />
      {layout.map((b, i) => {
        const isNow = i === current;
        const done = i < current;
        const d = isNow ? 22 : 18;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: b.cx - d / 2,
              top: TRACK_Y - d / 2,
              width: d,
              height: d,
              borderRadius: "50%",
              boxSizing: "border-box",
              backgroundColor: isNow ? "#FFFFFF" : done ? C.ink : C.bg,
              border: isNow ? `6px solid ${C.ink}` : done ? "none" : `3px solid ${C.ink4}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {done ? <CheckIcon size={12} color="#FFFFFF" stroke={3.6} /> : null}
          </div>
        );
      })}
    </div>
  );
};
