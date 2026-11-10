import React from "react";
import { color, stroke } from "../theme";

// 실패 건수만큼의 점이 원인별 묶음으로 모인 모습. <svg> 안에서 쓴다.
// 점은 해바라기 씨앗 배열(황금각)로 놓아 묶음마다 고르게 찬다.
// 영상에서는 점들이 흩어진 자리에서 묶음의 자리로 모여든다.

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

export type Cluster = { cx: number; cy: number; count: number };

export const clusterRadius = (count: number, spacing: number): number => spacing * Math.sqrt(count);

/** 왼쪽 x에서 시작해 묶음들을 한 줄로 놓는다. */
export const layoutClusters = (
  counts: readonly number[],
  x: number,
  cy: number,
  gap: number,
  spacing: number,
): Cluster[] => {
  let cursor = x;
  return counts.map((count) => {
    const r = clusterRadius(count, spacing);
    const cluster = { cx: cursor + r, cy, count };
    cursor += r * 2 + gap;
    return cluster;
  });
};

export const ClusterField: React.FC<{
  clusters: readonly Cluster[];
  /** 점 사이 간격을 정하는 값. 묶음 반지름 = spacing × √count */
  spacing: number;
  dotRadius?: number;
  fill?: string;
  /** 고리로 강조할 묶음 */
  highlight?: number;
}> = ({ clusters, spacing, dotRadius = 2.3, fill = color.problem, highlight }) => (
  <g>
    {clusters.map((cluster, ci) => {
      const dots: React.ReactNode[] = [];
      for (let k = 0; k < cluster.count; k++) {
        const r = spacing * Math.sqrt(k + 0.5);
        const a = k * GOLDEN_ANGLE + ci * 1.3;
        dots.push(
          <circle
            key={k}
            cx={cluster.cx + r * Math.cos(a)}
            cy={cluster.cy + r * Math.sin(a)}
            r={dotRadius}
            fill={fill}
            opacity={highlight === undefined || highlight === ci ? 1 : 0.62}
          />,
        );
      }
      return (
        <g key={ci}>
          {highlight === ci ? (
            <circle
              cx={cluster.cx}
              cy={cluster.cy}
              r={clusterRadius(cluster.count, spacing) + 9}
              fill="none"
              stroke={color.ink}
              strokeWidth={stroke.thin}
            />
          ) : null}
          {dots}
        </g>
      );
    })}
  </g>
);
