import type { FC } from "react";
import { COLOR } from "../theme";

export type DotCluster = { count: number; cx: number; cy: number };

type DotClustersProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  clusters: readonly DotCluster[];
  /** 점 사이 간격을 정하는 값. 묶음의 반지름은 pitch × √count 이다. */
  pitch?: number;
  dotRadius?: number;
  color?: string;
};

const GOLDEN_ANGLE = 2.399963229728653;

// 실패 건수만큼의 점이 원인별 묶음으로 모인 그림.
// 영상에서는 점이 흩어져 찍힌 뒤 묶음의 자리로 모여 멈춘다.
export const DotClusters: FC<DotClustersProps> = ({
  x,
  y,
  width,
  height,
  clusters,
  pitch = 7.2,
  dotRadius = 3.3,
  color = COLOR.vermilion,
}) => (
  <svg
    width={width}
    height={height}
    viewBox={`0 0 ${width} ${height}`}
    style={{ position: "absolute", left: x, top: y, overflow: "visible" }}
  >
    {clusters.map((cluster, c) => (
      <g key={c} fill={color}>
        {Array.from({ length: cluster.count }, (_, k) => {
          const radius = pitch * Math.sqrt(k + 0.5);
          const angle = k * GOLDEN_ANGLE + c;
          return (
            <circle
              key={k}
              cx={cluster.cx + radius * Math.cos(angle)}
              cy={cluster.cy + radius * Math.sin(angle)}
              r={dotRadius}
            />
          );
        })}
      </g>
    ))}
  </svg>
);
