import React from "react";
import { ease, lerp, progress } from "../../anim";
import { Trace, Via } from "../../components";
import { color, stroke, withAlpha } from "../../theme";
import { FRUIT_R, Fruit } from "./Fruit";
import { AT, GROUND, NODE_X, RIGHT, SEED, SEGMENTS, SPROUT, TREAD_Y, stepAt } from "./layout";

// S8 의 선 그림: 올라가는 계단형 trace, 그 아래의 단면, 열매와 거기서 자라는 trace.
// 화면 전체를 덮는 <svg> 안에서 쓴다.

const HATCH = "s8-hatch";
const LEAD = 14; // 단계 글자보다 이만큼 먼저 그 단의 선이 그려지기 시작한다
const PLANT_FRAMES = 20; // 열매가 내려가 심기는 시간

export const Stairs: React.FC<{ frame: number }> = ({ frame }) => {
  const reach = progress(frame, AT.reach, 12);
  const planted = progress(frame, AT.plant + PLANT_FRAMES - 4, 18);
  return (
    <g>
      <defs>
        <pattern id={HATCH} width={16} height={16} patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
          <line x1={0} y1={0.5} x2={16} y2={0.5} stroke={withAlpha(color.inkSoft, 0.2)} strokeWidth={stroke.hair} />
        </pattern>
      </defs>

      {/* 단면: 그 단의 선이 그려진 뒤에 채워진다 */}
      {GROUND.map((g, i) => (
        <rect
          key={i}
          x={g.x}
          y={g.y}
          width={g.w}
          height={g.h}
          fill={`url(#${HATCH})`}
          opacity={progress(frame, stepAt(i) - 4, 22)}
        />
      ))}

      {/* 계단 trace: 단계마다 한 토막씩 */}
      {SEGMENTS.map((pts, i) => (
        <Trace key={i} pts={pts} chamfer={0} at={stepAt(i) - LEAD} duration={18} />
      ))}
      {/* 마지막 단은 청록으로 이어진다 (S3 과 같다) */}
      <Trace
        pts={[
          [NODE_X[2], TREAD_Y[2]],
          [RIGHT, TREAD_Y[2]],
        ]}
        stroke={color.agent}
        width={stroke.bold}
        at={stepAt(2) + 2}
        duration={22}
      />

      {/* 열매에서 자라 2단계로 올라가는 trace */}
      <Trace
        pts={SPROUT}
        stroke={color.human}
        width={stroke.bold}
        chamfer={14}
        arrow
        at={AT.sprout}
        duration={AT.reach - AT.sprout}
        easing={ease.inOut}
      />

      {/* 각 단의 노드 */}
      {NODE_X.map((x, i) => (
        <Via
          key={i}
          x={x}
          y={TREAD_Y[i]}
          r={8}
          stroke={i === 2 ? color.agent : color.inkSoft}
          p={progress(frame, stepAt(i), 12)}
        />
      ))}
      {/* 재투자가 닿은 2단계의 노드 */}
      {reach > 0 ? (
        <circle cx={NODE_X[1]} cy={TREAD_Y[1]} r={4.5 * reach} fill={color.human} opacity={reach} />
      ) : null}

      {/* 심긴 자리에서 고리 하나가 한 번 퍼진다 */}
      {planted > 0 && planted < 1 ? (
        <circle
          cx={SEED.x}
          cy={SEED.y1}
          r={lerp(FRUIT_R, 30, planted)}
          fill="none"
          stroke={color.human}
          strokeWidth={stroke.thin}
          opacity={0.8 * (1 - planted)}
        />
      ) : null}
      <Fruit
        x={SEED.x}
        y={lerp(SEED.y0, SEED.y1, progress(frame, AT.plant, PLANT_FRAMES, ease.inOut))}
        opacity={progress(frame, AT.seed, 8)}
      />
    </g>
  );
};
