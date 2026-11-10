import React from "react";
import { useCurrentFrame } from "remotion";
import { ease, enter, lerp, progress, pulse } from "../../anim";
import { Pad, Trace, Via } from "../../components/Trace";
import { color, fullSvg, mono, pad2, sans, size, stroke } from "../../theme";
import { AXIS, BARS, BAR_H, CARD_BOX, CRITERION_Y, LIMIT_X, T } from "./layout";

// 수용 기준선과 오류 복구 3단계.
//   - 카드의 수용 기준 칸에서 점선이 나와 오른쪽 벽(기준선)이 된다.
//   - 복구 단계가 차례로 한 칸씩 내려간다. 단계마다 지연 막대가 앞 단계가 끝난 자리에서 더 길게 이어진다.
//   - 마지막 막대가 기준선을 넘는다. 넘은 부분과 만나는 자리만 경고색이다.

const LABEL_UP = 64; // 막대 위로 단계 이름이 놓이는 거리

export const Recovery: React.FC<{ steps: readonly string[] }> = ({ steps }) => {
  const frame = useCurrentFrame();
  const limit = progress(frame, T.limit, T.limitDur, ease.inOut);
  const axis = progress(frame, T.axis, 24, ease.inOut);
  const last = BARS[BARS.length - 1];

  const bar = BARS.map((_, k) => progress(frame, T.step(k) + 4, T.barDur(k), k === BARS.length - 1 ? ease.inOut : ease.out));
  // 마지막 막대의 머리가 기준선에 닿은 뒤
  const headX = lerp(last.x0, last.x1, bar[bar.length - 1]);
  const crossed = headX >= LIMIT_X;
  const crossAt = T.step(BARS.length - 1) + 4 + T.barDur(BARS.length - 1) - 4;
  const hit = progress(frame, crossAt, 10);
  const beat = pulse(frame, crossAt + 6, 40);

  return (
    <>
      <svg {...fullSvg}>
        {/* 지연 축 */}
        <Trace
          pts={[
            [AXIS.x0, AXIS.y],
            [LIMIT_X + 56, AXIS.y],
          ]}
          stroke={color.lineStrong}
          width={stroke.thin}
          arrow
          progress={axis}
        />
        <line
          x1={AXIS.x0}
          x2={AXIS.x0}
          y1={AXIS.y - 9}
          y2={AXIS.y + 9}
          stroke={color.lineStrong}
          strokeWidth={stroke.thin}
          opacity={Math.min(1, axis * 4)}
        />

        {/* 수용 기준선: 카드의 기준 칸 → 오른쪽 → 아래 */}
        <Trace
          pts={[
            [CARD_BOX.x + CARD_BOX.w, CRITERION_Y],
            [LIMIT_X, CRITERION_Y],
            [LIMIT_X, AXIS.y],
          ]}
          stroke={color.ink}
          width={stroke.trace}
          dash="10 8"
          chamfer={10}
          progress={limit}
        />
        <Pad x={CARD_BOX.x + CARD_BOX.w} y={CRITERION_Y} fill={color.ink} s={12} p={progress(frame, T.limit - 2, 8)} />
        <line
          x1={LIMIT_X - 10}
          x2={LIMIT_X + 10}
          y1={AXIS.y}
          y2={AXIS.y}
          stroke={color.ink}
          strokeWidth={stroke.trace}
          opacity={progress(frame, T.limit + T.limitDur - 4, 8)}
        />

        {/* 단계 사이의 내려가는 선 */}
        {BARS.map((b, k) => {
          if (k === 0) return null;
          const prev = BARS[k - 1];
          return (
            <Trace
              key={`drop${k}`}
              pts={[
                [prev.x1, prev.y + BAR_H / 2],
                [prev.x1, b.y - 14],
              ]}
              stroke={color.lineStrong}
              width={stroke.thin}
              arrow
              at={T.step(k) - 10}
              duration={12}
              easing={ease.inOut}
            />
          );
        })}

        {/* 지연 막대 */}
        {BARS.map((b, k) => {
          if (bar[k] <= 0) return null;
          const x1 = lerp(b.x0, b.x1, bar[k]);
          const safeEnd = Math.min(x1, LIMIT_X);
          const isLast = k === BARS.length - 1;
          return (
            <g key={`bar${k}`}>
              <rect x={b.x0} y={b.y - BAR_H / 2} width={Math.max(0, (isLast ? safeEnd : x1) - b.x0)} height={BAR_H} fill={color.inkSoft} />
              {isLast && x1 > LIMIT_X ? (
                <rect x={LIMIT_X} y={b.y - BAR_H / 2} width={x1 - LIMIT_X} height={BAR_H} fill={color.problem} />
              ) : null}
            </g>
          );
        })}
        {BARS.map((b, k) => (
          <Via key={`via${k}`} x={b.x0} y={b.y} r={7} stroke={color.ink} p={progress(frame, T.step(k), 10)} />
        ))}

        {/* 기준선과 만나는 자리 */}
        {crossed ? (
          <g>
            <circle
              cx={LIMIT_X}
              cy={last.y}
              r={lerp(18, 40, beat)}
              fill="none"
              stroke={color.problem}
              strokeWidth={stroke.thin}
              opacity={hit * 0.7 * (1 - beat)}
            />
            <circle
              cx={LIMIT_X}
              cy={last.y}
              r={lerp(8, 18, hit)}
              fill={color.bg}
              stroke={color.problem}
              strokeWidth={stroke.bold}
              opacity={hit}
            />
            <rect x={LIMIT_X - 4} y={last.y - 4} width={8} height={8} fill={color.problem} opacity={hit} />
          </g>
        ) : null}
      </svg>

      {/* 장식 라벨 */}
      <div
        style={{
          position: "absolute",
          left: AXIS.x0 + 18,
          top: AXIS.y + 14,
          ...mono(size.label, 500),
          color: color.inkDim,
          opacity: progress(frame, T.axis + 6, 12),
        }}
      >
        LATENCY
      </div>
      <div
        style={{
          position: "absolute",
          right: 1920 - (LIMIT_X - 16),
          top: CARD_BOX.y + CARD_BOX.h + 28,
          ...mono(size.label, 700),
          color: color.inkSoft,
          opacity: progress(frame, T.limit + T.limitDur - 10, 12),
        }}
      >
        LIMIT
      </div>

      {/* 단계 이름 */}
      {steps.map((name, k) => {
        const b = BARS[k];
        return (
          <div
            key={name}
            style={{
              position: "absolute",
              left: b.x0 + (k === 0 ? 0 : 22),
              top: b.y - LABEL_UP,
              display: "flex",
              alignItems: "baseline",
              gap: 14,
              ...enter(frame, T.step(k), { distance: 14, duration: 16, from: "down" }),
            }}
          >
            <div style={{ ...mono(size.label, 700), color: color.inkDim }}>{pad2(k + 1)}</div>
            <div style={{ ...sans(size.body, 700), whiteSpace: "nowrap" }}>{name}</div>
          </div>
        );
      })}
    </>
  );
};
