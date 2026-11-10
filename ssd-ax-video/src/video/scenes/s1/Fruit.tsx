import React from "react";
import { interpolateColors } from "remotion";
import { clamp01, ease } from "../../anim";
import { color, stroke } from "../../theme";

// 열매. S8 과 같은 규격이다.
//   달린 열매     반지름 10px 의 속이 찬 원(color.human) + 위로 8px 꼭지 선(color.inkSoft, stroke.trace)
//   수확된 자리   같은 크기의 빈 고리(color.lineStrong)
// (x, y) 는 꼭지가 가지에 붙는 자리다. 열매의 중심은 그 아래 18px 이다. <svg> 안에서 쓴다.

export const FRUIT_R = 10;
export const FRUIT_STEM = 8;

export const Fruit: React.FC<{
  x: number;
  y: number;
  /** 나타난 정도 0~1 */
  p?: number;
  /** 수확된 정도 0~1. 열매가 아래로 빠지며 사라지고 빈 고리가 남는다 */
  picked?: number;
}> = ({ x, y, p = 1, picked = 0 }) => {
  if (p <= 0) return null;
  const cy = y + FRUIT_STEM + FRUIT_R;
  const k = clamp01(picked);
  const drop = ease.in(k) * 26;
  return (
    <g opacity={p}>
      <line
        x1={x}
        x2={x}
        y1={y}
        y2={y + FRUIT_STEM}
        stroke={interpolateColors(k, [0, 1], [color.inkSoft, color.lineStrong])}
        strokeWidth={stroke.trace}
      />
      {k > 0 ? (
        <circle cx={x} cy={cy} r={FRUIT_R - stroke.thin / 2} fill="none" stroke={color.lineStrong} strokeWidth={stroke.thin} opacity={k} />
      ) : null}
      {k < 1 ? (
        <circle cx={x} cy={cy + drop} r={FRUIT_R * (0.5 + 0.5 * p)} fill={color.human} opacity={1 - ease.in(k)} />
      ) : null}
    </g>
  );
};
