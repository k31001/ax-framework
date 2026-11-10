import React from "react";
import { useCurrentFrame } from "remotion";
import { ease, lerp, progress } from "../../anim";
import { DimLine, Trace } from "../../components/Trace";
import { color, fullSvg, mono, size, stroke, withAlpha } from "../../theme";
import { BRACKET_Y, DIM_Y, ROW, SHARE, T, VERIFY } from "./layout";

// 흐름 아래의 치수선: 과제 전체의 길이. 개인 작업이 빨라져도 줄지 않는다.
// 수치가 나오면 검증 쪽 두 단계에서 내려온 선이 이 치수선 위에서 60~70% 길이의 띠로 벌어진다.
//   굵은 띠 = 60%, 양쪽 점선 = 70%까지

const BAND_H = 12;
const MID_Y = (BRACKET_Y + DIM_Y) / 2 + 2;

export const Share: React.FC<{ tint: string }> = ({ tint }) => {
  const frame = useCurrentFrame();
  const dim = progress(frame, T.dim, 22, ease.out);
  const labelOut = 1 - progress(frame, T.stat - 12, 10, ease.linear);

  const bracket = progress(frame, T.stat - 8, 12, ease.inOut);
  const funnelAt = T.stat - 2;
  const band = progress(frame, T.stat + 6, 20, ease.inOut);
  const whisker = progress(frame, T.stat + 20, 12);

  const mid = (VERIFY.x0 + VERIFY.x1) / 2;
  const [c0, c1] = SHARE.core;
  const [o0, o1] = SHARE.outer;

  return (
    <>
      <svg {...fullSvg}>
        <DimLine from={[ROW.x0, DIM_Y]} to={[ROW.x1, DIM_Y]} stroke={color.inkSoft} tick={11} p={dim} />

        {/* 검증 쪽 두 단계를 묶는 꺾쇠 */}
        {bracket > 0 ? (
          <path
            d={`M ${lerp(mid, VERIFY.x0, bracket)} ${BRACKET_Y - 10} V ${BRACKET_Y} H ${lerp(mid, VERIFY.x1, bracket)} V ${
              BRACKET_Y - 10
            }`}
            fill="none"
            stroke={tint}
            strokeWidth={stroke.thin}
            opacity={Math.min(1, bracket * 3)}
          />
        ) : null}
        {/* 꺾쇠에서 띠의 양 끝으로 벌어지는 선 */}
        {[
          [VERIFY.x0, c0],
          [VERIFY.x1, c1],
        ].map(([from, to]) => (
          <Trace
            key={from}
            pts={[
              [from, BRACKET_Y],
              [from, MID_Y],
              [to, MID_Y],
              [to, DIM_Y - BAND_H / 2],
            ]}
            stroke={tint}
            width={stroke.thin}
            chamfer={10}
            at={funnelAt}
            duration={18}
            easing={ease.inOut}
          />
        ))}

        {/* 60% 띠: 가운데에서 양쪽으로 펴진다 */}
        {band > 0 ? (
          <rect
            x={lerp(mid, c0, band)}
            y={DIM_Y - BAND_H / 2}
            width={lerp(0, c1 - c0, band)}
            height={BAND_H}
            fill={tint}
          />
        ) : null}
        {/* 70%까지: 점선과 끝 눈금 */}
        {whisker > 0 ? (
          <g stroke={tint} strokeWidth={stroke.bold} opacity={whisker}>
            <line x1={c0} x2={lerp(c0, o0, whisker)} y1={DIM_Y} y2={DIM_Y} strokeDasharray="6 6" />
            <line x1={c1} x2={lerp(c1, o1, whisker)} y1={DIM_Y} y2={DIM_Y} strokeDasharray="6 6" />
            <line x1={o0} x2={o0} y1={DIM_Y - 11} y2={DIM_Y + 11} strokeWidth={stroke.thin} />
            <line x1={o1} x2={o1} y1={DIM_Y - 11} y2={DIM_Y + 11} strokeWidth={stroke.thin} />
          </g>
        ) : null}
      </svg>

      {/* 장식 라벨: 전체 일정은 그대로 */}
      <div
        style={{
          position: "absolute",
          left: (ROW.x0 + ROW.x1) / 2 - 150,
          width: 300,
          top: DIM_Y - 15,
          display: "flex",
          justifyContent: "center",
          opacity: progress(frame, T.dim + 8, 12) * labelOut,
        }}
      >
        <div
          style={{
            ...mono(size.label, 700),
            lineHeight: "30px",
            padding: "0 16px",
            color: color.inkSoft,
            backgroundColor: color.bg,
            boxShadow: `0 0 0 6px ${withAlpha(color.bg, 1)}`,
          }}
        >
          SCHEDULE ±0
        </div>
      </div>
    </>
  );
};
