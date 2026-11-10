import React from "react";
import { AbsoluteFill } from "remotion";
import { FRAME, color, mono, size, space, stroke } from "../theme";

// 모든 씬의 바탕: 남색 면, 옅은 격자, 도면 테두리와 눈금.
// 테두리 위의 영문 라벨은 장식이다. 안전 영역(safe) 바깥에 놓인다.

const F = space.frame;
const X1 = FRAME.w - F;
const Y1 = FRAME.h - F;

const majorXs: number[] = [];
for (let x = F; x <= X1; x += space.gridMajor) majorXs.push(x);
const majorYs: number[] = [];
for (let y = F; y <= Y1; y += space.gridMajor) majorYs.push(y);

const CornerMark: React.FC<{ x: number; y: number; dx: 1 | -1; dy: 1 | -1 }> = ({
  x,
  y,
  dx,
  dy,
}) => (
  <path
    d={`M ${x + dx * 28} ${y} H ${x} V ${y + dy * 28}`}
    fill="none"
    stroke={color.inkDim}
    strokeWidth={stroke.trace}
  />
);

const BorderLabel: React.FC<{
  children: React.ReactNode;
  edge: "top" | "bottom";
  align: "left" | "right";
}> = ({ children, edge, align }) => (
  <div
    style={{
      position: "absolute",
      [align]: 96 - 12,
      top: (edge === "top" ? F : Y1) - 15,
      height: 30,
      padding: "0 12px",
      display: "flex",
      alignItems: "center",
      backgroundColor: color.bg,
      ...mono(size.label, 500),
      color: color.inkDim,
    }}
  >
    {children}
  </div>
);

export const Sheet: React.FC<{
  /** 테두리 오른쪽 위에 놓는 장식 라벨. 예: "SHEET 03 / 15" */
  sheet?: string;
  /** 테두리 왼쪽 아래 장식 라벨을 숨긴다(그 자리를 그림이 쓰는 씬). */
  hideFooter?: boolean;
  children: React.ReactNode;
}> = ({ sheet, hideFooter, children }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: color.bg }}>
      <svg
        width={FRAME.w}
        height={FRAME.h}
        viewBox={`0 0 ${FRAME.w} ${FRAME.h}`}
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <pattern
            id="a-grid-minor"
            width={space.grid}
            height={space.grid}
            patternUnits="userSpaceOnUse"
            patternTransform="translate(0.5 0.5)"
          >
            <path
              d={`M ${space.grid} 0 H 0 V ${space.grid}`}
              fill="none"
              stroke={color.gridMinor}
              strokeWidth={stroke.hair}
            />
          </pattern>
        </defs>
        <rect width={FRAME.w} height={FRAME.h} fill="url(#a-grid-minor)" />
        {majorXs.map((x) => (
          <line
            key={`gx${x}`}
            x1={x + 0.5}
            x2={x + 0.5}
            y1={0}
            y2={FRAME.h}
            stroke={color.gridMajor}
            strokeWidth={stroke.hair}
          />
        ))}
        {majorYs.map((y) => (
          <line
            key={`gy${y}`}
            x1={0}
            x2={FRAME.w}
            y1={y + 0.5}
            y2={y + 0.5}
            stroke={color.gridMajor}
            strokeWidth={stroke.hair}
          />
        ))}

        {/* 도면 테두리 */}
        <rect
          x={F + 0.5}
          y={F + 0.5}
          width={X1 - F}
          height={Y1 - F}
          fill="none"
          stroke={color.line}
          strokeWidth={stroke.hair}
        />
        {/* 좌표 눈금: 굵은 격자와 만나는 자리마다 테두리 바깥으로 짧은 선 */}
        {majorXs.map((x) => (
          <g key={`tx${x}`} stroke={color.lineStrong} strokeWidth={stroke.hair}>
            <line x1={x + 0.5} x2={x + 0.5} y1={F - 12} y2={F} />
            <line x1={x + 0.5} x2={x + 0.5} y1={Y1} y2={Y1 + 12} />
          </g>
        ))}
        {majorYs.map((y) => (
          <g key={`ty${y}`} stroke={color.lineStrong} strokeWidth={stroke.hair}>
            <line x1={F - 12} x2={F} y1={y + 0.5} y2={y + 0.5} />
            <line x1={X1} x2={X1 + 12} y1={y + 0.5} y2={y + 0.5} />
          </g>
        ))}
        <CornerMark x={F} y={F} dx={1} dy={1} />
        <CornerMark x={X1} y={F} dx={-1} dy={1} />
        <CornerMark x={F} y={Y1} dx={1} dy={-1} />
        <CornerMark x={X1} y={Y1} dx={-1} dy={-1} />
      </svg>

      {children}

      {sheet ? (
        <BorderLabel edge="top" align="right">
          {sheet}
        </BorderLabel>
      ) : null}
      {hideFooter ? null : (
        <BorderLabel edge="bottom" align="left">
          SSD CONTROLLER SOC · AX
        </BorderLabel>
      )}
    </AbsoluteFill>
  );
};
