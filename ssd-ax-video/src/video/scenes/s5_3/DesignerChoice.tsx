import React from "react";
import { interpolateColors, useCurrentFrame } from "remotion";
import { DUR, ease, lerp, progress } from "../../anim";
import { HumanIcon } from "../../components";
import { color, mono, sans, size, stroke, withAlpha } from "../../theme";

// S5-3 강조 문구: 예산을 지키는 방법은 설계자가 정한다. 원칙 띠 자리(1112×134)에 놓였다가 원칙이 나오기 전에 비켜 준다.
// 공통 NoteBanner 와 같은 꺾쇠 상자이되 사람의 색(호박색)이다.
//   왼쪽   사람 표식과 문구
//   오른쪽 복구 단계의 상태도. 구조가 준 출발점(점선)이 설계자의 결정(호박색 실선)으로 바뀐다

const CORNER = 22;
const STATES = ["IDLE", "RETRY", "SOFT", "DONE"] as const;
const SKETCH = { w: 356, r: 15, pitch: 98, cy: 54 } as const;

export const DesignerChoice: React.FC<{
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
  at: number;
  out: number;
}> = ({ text, x, y, w, h, at, out }) => {
  const frame = useCurrentFrame();
  const open = progress(frame, at, DUR.draw + 2, ease.out);
  if (open <= 0) return null;
  const gone = progress(frame, out, DUR.exit, ease.in);
  if (gone >= 1) return null;
  const textP = progress(frame, at + 6, DUR.enter, ease.out);

  const inset = lerp(w * 0.18, 0, open);
  const left = inset + stroke.trace / 2;
  const right = w - inset - stroke.trace / 2;
  const top = stroke.trace / 2;
  const bottom = h - stroke.trace / 2;
  const sx = w - SKETCH.w - 28;

  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, opacity: 1 - gone }}>
      <div
        style={{
          position: "absolute",
          left: inset,
          right: inset,
          top: 0,
          bottom: 0,
          backgroundColor: withAlpha(color.human, 0.07),
          opacity: open,
        }}
      />
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", inset: 0 }}>
        <g fill="none" stroke={color.human} strokeWidth={stroke.trace} opacity={open}>
          <path d={`M ${left + CORNER} ${top} H ${left} V ${top + CORNER}`} />
          <path d={`M ${right - CORNER} ${top} H ${right} V ${top + CORNER}`} />
          <path d={`M ${left + CORNER} ${bottom} H ${left} V ${bottom - CORNER}`} />
          <path d={`M ${right - CORNER} ${bottom} H ${right} V ${bottom - CORNER}`} />
        </g>
        {/* 상태도: 출발점(점선) → 설계자의 결정(실선) */}
        <g opacity={textP}>
          {STATES.map((_, i) => {
            const decided = progress(frame, at + 34 + i * 9, 12);
            const cx = sx + SKETCH.r + i * SKETCH.pitch;
            const tint = interpolateColors(decided, [0, 1], [color.inkDim, color.human]);
            return (
              <g key={i}>
                {i > 0 ? (
                  <path
                    d={`M ${cx - SKETCH.pitch + SKETCH.r + 5} ${SKETCH.cy} H ${cx - SKETCH.r - 12} m 0 -6 l 9 6 l -9 6`}
                    fill="none"
                    stroke={tint}
                    strokeWidth={stroke.thin}
                    strokeDasharray={decided > 0.5 ? undefined : "5 5"}
                  />
                ) : null}
                <circle
                  cx={cx}
                  cy={SKETCH.cy}
                  r={SKETCH.r}
                  fill={withAlpha(color.human, 0.16 * decided)}
                  stroke={tint}
                  strokeWidth={lerp(stroke.thin, stroke.trace, decided)}
                  strokeDasharray={decided > 0.5 ? undefined : "5 5"}
                />
              </g>
            );
          })}
        </g>
      </svg>
      <div style={{ position: "absolute", left: 28, top: 14, ...mono(size.label, 700), color: color.human, opacity: textP }}>
        NOTE
      </div>
      <div
        style={{
          position: "absolute",
          left: sx,
          width: SKETCH.w,
          top: 88,
          textAlign: "center",
          ...mono(size.label, 500),
          color: color.inkDim,
          opacity: textP,
        }}
      >
        FSM · DATAPATH · PIPELINE
      </div>
      <div
        style={{
          position: "absolute",
          left: 30,
          top: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          gap: 20,
          paddingTop: 16,
          opacity: textP,
          translate: `0px ${(1 - textP) * 12}px`,
        }}
      >
        <HumanIcon size={48} color={color.human} width={3} />
        <div style={{ ...sans(size.head, 700), whiteSpace: "nowrap" }}>{text}</div>
      </div>
    </div>
  );
};
