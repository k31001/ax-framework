import React from "react";
import { color, stroke } from "../../theme";

// 열매. S1 의 열매와 같은 규격이다:
// 반지름 10px 의 속이 찬 원(color.human), 위로 8px 짜리 꼭지 선(color.inkSoft, stroke.trace).
// <svg> 안에서 쓴다. (x, y)는 원의 중심.

export const FRUIT_R = 10;
export const FRUIT_STEM = 8;

export const Fruit: React.FC<{ x: number; y: number; opacity?: number }> = ({ x, y, opacity = 1 }) =>
  opacity <= 0 ? null : (
    <g opacity={opacity}>
      <line
        x1={x}
        x2={x}
        y1={y - FRUIT_R}
        y2={y - FRUIT_R - FRUIT_STEM}
        stroke={color.inkSoft}
        strokeWidth={stroke.trace}
      />
      <circle cx={x} cy={y} r={FRUIT_R} fill={color.human} />
    </g>
  );
