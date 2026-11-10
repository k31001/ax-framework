import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { DUR, ease, progress, sceneFade } from "../anim";
import type { SceneFadeOptions } from "../anim";
import { FRAME, color, mono, size, space, stroke } from "../theme";
import type { SceneId } from "../timeline";
import { sceneFrames, sheetLabel } from "../timeline";

// 모든 씬의 바탕: 남색 면, 옅은 격자, 도면 테두리와 눈금.
// 바탕과 테두리는 씬 사이에 끊기지 않는다. 씬마다 똑같이 그려지고, 투명도가 바뀌지 않는다.
// children(내용물)만 씬의 첫 10프레임에 나타나고 마지막 8프레임에 사라진다.
//
// 테두리 위의 영문 라벨은 장식이다. 안전 영역(safe) 바깥에 놓인다.

const F = space.frame;
const X1 = FRAME.w - F;
const Y1 = FRAME.h - F;

const majorXs: number[] = [];
for (let x = F; x <= X1; x += space.gridMajor) majorXs.push(x);
const majorYs: number[] = [];
for (let y = F; y <= Y1; y += space.gridMajor) majorYs.push(y);

const CornerMark: React.FC<{ x: number; y: number; dx: 1 | -1; dy: 1 | -1 }> = ({ x, y, dx, dy }) => (
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

/** 바탕 그림. 씬마다 똑같다. */
const Backdrop: React.FC = () => (
  <svg
    width={FRAME.w}
    height={FRAME.h}
    viewBox={`0 0 ${FRAME.w} ${FRAME.h}`}
    style={{ position: "absolute", inset: 0 }}
  >
    <defs>
      <pattern
        id="sheet-grid-minor"
        width={space.grid}
        height={space.grid}
        patternUnits="userSpaceOnUse"
        patternTransform="translate(0.5 0.5)"
      >
        <path
          d={`M ${space.grid} 0 H 0 V ${space.grid}`}
          fill="none"
          stroke={color.gridMinor}
          strokeWidth={stroke.grid}
        />
      </pattern>
    </defs>
    <rect width={FRAME.w} height={FRAME.h} fill="url(#sheet-grid-minor)" />
    {majorXs.map((x) => (
      <line
        key={`gx${x}`}
        x1={x + 0.5}
        x2={x + 0.5}
        y1={0}
        y2={FRAME.h}
        stroke={color.gridMajor}
        strokeWidth={stroke.grid}
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
        strokeWidth={stroke.grid}
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
);

/**
 * 씬 내용물을 감싸 첫 10프레임에 나타나고 마지막 8프레임에 사라지게 한다.
 * <Sheet> 가 children 에 이미 적용하므로, Sheet 에 fade={false} 를 준 씬에서만 직접 쓴다.
 */
export const SceneFade: React.FC<{
  id: SceneId;
  in?: boolean;
  out?: boolean;
  children: React.ReactNode;
}> = ({ id, in: fadeIn, out: fadeOut, children }) => {
  const frame = useCurrentFrame();
  const opacity = sceneFade(frame, sceneFrames(id), { in: fadeIn, out: fadeOut });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

export const Sheet: React.FC<{
  /** 씬 id. 오른쪽 위 라벨("SHEET 08 / 15")과 씬 길이를 timeline.ts 에서 찾는다. */
  id: SceneId;
  /** 테두리 왼쪽 아래 장식 라벨을 숨긴다(그 자리를 그림이 쓰는 씬). */
  hideFooter?: boolean;
  /**
   * 내용물의 들어옴/나감. 기본은 둘 다 한다.
   * false 를 주면 하지 않는다(씬 사이에 이어져야 하는 요소가 있을 때. 나머지는 <SceneFade> 로 감싼다).
   */
  fade?: boolean | SceneFadeOptions;
  children: React.ReactNode;
}> = ({ id, hideFooter, fade = true, children }) => {
  const frame = useCurrentFrame();
  const opacity =
    fade === false ? 1 : sceneFade(frame, sceneFrames(id), fade === true ? {} : fade);
  // 씬이 바뀌면 도면 번호가 새로 찍힌다.
  const stamp = 0.35 + 0.65 * progress(frame, 0, DUR.sceneIn, ease.out);

  return (
    <AbsoluteFill style={{ backgroundColor: color.bg }}>
      <Backdrop />

      <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>

      <BorderLabel edge="top" align="right">
        <span style={{ opacity: stamp }}>{sheetLabel(id)}</span>
      </BorderLabel>
      {hideFooter ? null : (
        <BorderLabel edge="bottom" align="left">
          SSD CONTROLLER SOC · AX
        </BorderLabel>
      )}
    </AbsoluteFill>
  );
};
