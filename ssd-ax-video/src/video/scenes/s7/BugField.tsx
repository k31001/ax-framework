import React from "react";
import { interpolateColors } from "remotion";
import { clamp01, countUp, draw, ease, enter, lerp, progress } from "../../anim";
import { CheckIcon } from "../../components";
import { S7 as content } from "../../content";
import { FRAME, color, fullSvg, mono, size, stroke } from "../../theme";
import { AT, BOX, DOTS, DOT_R, PITCH } from "./field";

// bug 806개의 격자.
// 처음에는 모두 붉다(주입한 bug). 에이전트의 검사가 지나가면 찾은 점은 청록이 되고,
// 전체에 "SIGN-OFF" 표식이 찍힌다. 그래도 21%는 붉게 남는다. 마지막에 청록 점이 물러나 남은 점만 또렷해진다.

const BOX_RIGHT = BOX.x + BOX.w;
const BOX_BOTTOM = BOX.y + BOX.h;
const TAB_H = 40;

// 표식의 테두리: 오른쪽 위(꼬리표 자리)에서 시작해 한 바퀴
const SIGN_PATH = `M ${BOX_RIGHT} ${BOX.y} H ${BOX.x} V ${BOX_BOTTOM} H ${BOX_RIGHT} Z`;

export const BugField: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < AT.dots) return null;

  const sweep = progress(frame, AT.sweep, 28, ease.inOut);
  const sweepX = lerp(BOX.x - PITCH, BOX_RIGHT + PITCH, sweep);
  const sign = progress(frame, AT.sign, 20, ease.inOut);
  const reveal = progress(frame, AT.reveal, 14);
  const counted = progress(frame, AT.dots, 24);
  const scan = Math.sin(Math.PI * sweep);

  return (
    <>
      <svg {...fullSvg}>
        {DOTS.map((d, i) => {
          const appear = progress(frame, AT.dots + (d.col + d.row) * 0.4, 8);
          if (appear <= 0) return null;
          if (d.missed) {
            return (
              <circle
                key={i}
                cx={d.x}
                cy={d.y}
                r={lerp(DOT_R, DOT_R + 1.2, reveal) * (0.5 + 0.5 * appear)}
                fill={color.problem}
                opacity={appear}
              />
            );
          }
          const found = clamp01((sweepX - d.x) / 36);
          return (
            <circle
              key={i}
              cx={d.x}
              cy={d.y}
              r={DOT_R * (0.5 + 0.5 * appear)}
              fill={interpolateColors(found, [0, 1], [color.problem, color.agent])}
              opacity={appear * lerp(1, 0.45, reveal)}
            />
          );
        })}

        {/* 검사가 지나가는 선 */}
        {scan > 0.01 ? (
          <line
            x1={sweepX}
            x2={sweepX}
            y1={BOX.y - 8}
            y2={BOX_BOTTOM + 8}
            stroke={color.agent}
            strokeWidth={stroke.thin}
            opacity={scan}
          />
        ) : null}

        {/* 완료 표식의 테두리 */}
        {sign > 0 ? (
          <path
            d={SIGN_PATH}
            pathLength={1}
            fill="none"
            stroke={color.agent}
            strokeWidth={stroke.thin}
            {...draw(sign)}
          />
        ) : null}
      </svg>

      {/* 장식 라벨: 주입한 수 */}
      <div
        style={{
          position: "absolute",
          left: BOX.x,
          top: BOX.y - 12 - 26,
          ...mono(size.label, 500),
          color: color.inkDim,
          opacity: counted,
        }}
      >
        INJECTED {countUp(counted, 0, content.stat.injected)}
      </div>

      {/* 완료 표식의 꼬리표 */}
      <div
        style={{
          position: "absolute",
          right: FRAME.w - BOX_RIGHT,
          top: BOX.y - TAB_H,
          height: TAB_H,
          padding: "0 14px 0 10px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          backgroundColor: color.agent,
          ...enter(frame, AT.tab, { distance: 8, from: "down" }),
        }}
      >
        <CheckIcon size={22} color={color.bg} width={stroke.bold} />
        <div style={{ ...mono(size.label, 700), color: color.bg }}>SIGN-OFF</div>
      </div>

      {/* 남은 점 */}
      <div
        style={{
          position: "absolute",
          right: FRAME.w - BOX_RIGHT,
          top: BOX_BOTTOM + 16,
          display: "flex",
          alignItems: "center",
          gap: 10,
          ...enter(frame, AT.reveal + 2, { distance: 8 }),
        }}
      >
        <div style={{ width: 11, height: 11, borderRadius: "50%", backgroundColor: color.problem }} />
        <div style={{ ...mono(size.label, 700), color: color.problem }}>
          MISSED {content.stat.missedPercent}%
        </div>
      </div>
    </>
  );
};
