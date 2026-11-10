import type { FC } from "react";
import { COLOR, RULE } from "../theme";

// 평면 화살표. 가는 몸통과 꽉 찬 삼각 머리로만 그린다.
export const ArrowRight: FC<{
  length: number;
  weight?: number;
  color?: string;
}> = ({ length, weight = RULE.mid, color = COLOR.ink }) => {
  const head = weight * 3.2;
  const h = head * 1.3;
  return (
    <svg
      width={length}
      height={h}
      viewBox={`0 0 ${length} ${h}`}
      style={{ display: "block", flex: "none" }}
    >
      <rect
        x={0}
        y={h / 2 - weight / 2}
        width={length - head + 1}
        height={weight}
        fill={color}
      />
      <polygon
        points={`${length - head},0 ${length},${h / 2} ${length - head},${h}`}
        fill={color}
      />
    </svg>
  );
};

// 아래로 향하는 평면 화살표.
export const ArrowDown: FC<{
  length: number;
  weight?: number;
  color?: string;
}> = ({ length, weight = RULE.mid, color = COLOR.ink }) => {
  const head = weight * 3.2;
  const w = head * 1.3;
  return (
    <svg
      width={w}
      height={length}
      viewBox={`0 0 ${w} ${length}`}
      style={{ display: "block", flex: "none" }}
    >
      <rect
        x={w / 2 - weight / 2}
        y={0}
        width={weight}
        height={length - head + 1}
        fill={color}
      />
      <polygon
        points={`0,${length - head} ${w},${length - head} ${w / 2},${length}`}
        fill={color}
      />
    </svg>
  );
};

// 꺾인 화살표(↳). "현재" 줄에서 "전환 후" 줄로 내려오는 방향을 나타낸다.
export const ArrowElbow: FC<{
  width: number;
  height: number;
  weight?: number;
  color?: string;
}> = ({ width, height, weight = 6, color = COLOR.vermilion }) => {
  const head = weight * 2.6;
  const midY = height - head * 0.75;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block", flex: "none" }}
    >
      <rect
        x={0}
        y={0}
        width={weight}
        height={midY + weight / 2}
        fill={color}
      />
      <rect
        x={0}
        y={midY - weight / 2}
        width={width - head + 1}
        height={weight}
        fill={color}
      />
      <polygon
        points={`${width - head},${midY - head * 0.75} ${width},${midY} ${width - head},${midY + head * 0.75}`}
        fill={color}
      />
    </svg>
  );
};
