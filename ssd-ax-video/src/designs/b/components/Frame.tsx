import type { FC, ReactNode } from "react";
import { AbsoluteFill } from "remotion";
import { COLOR, GRID, colX, sans, SIZE, WEIGHT } from "../theme";

// 모든 씬의 바탕. grid를 켜면 12단 격자와 안전 여백이 보인다(구도 확인용).
export const Frame: FC<{ children: ReactNode; grid?: boolean }> = ({
  children,
  grid = false,
}) => (
  <AbsoluteFill
    style={{
      backgroundColor: COLOR.paper,
      color: COLOR.ink,
      ...sans(SIZE.body, WEIGHT.medium),
    }}
  >
    {grid
      ? Array.from({ length: GRID.cols }, (_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: colX(i),
              top: GRID.top,
              width: GRID.col,
              height: GRID.height,
              backgroundColor: "rgba(224, 60, 20, 0.08)",
            }}
          />
        ))
      : null}
    {children}
  </AbsoluteFill>
);
