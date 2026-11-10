import React from "react";
import { interpolateColors } from "remotion";
import { draw, ease, lerp, progress } from "../../anim";
import { Trace } from "../../components";
import { color, safe, stroke } from "../../theme";
import { AT, CHIP, CHIP_CX, CHIP_RIGHT, HEADER_H, PIN, WIRE_X0, rowState, rowY } from "./layout";

// S6 의 선 그림. 화면 전체를 덮는 <svg> 안에서 쓴다.

const NOTCH = 18;

// 윤곽: 위쪽 홈의 오른쪽 끝에서 시계 방향으로 한 바퀴
const OUTLINE = `M ${CHIP_CX + NOTCH} ${CHIP.y} H ${CHIP_RIGHT} V ${CHIP.y + CHIP.h} H ${CHIP.x} V ${CHIP.y} H ${
  CHIP_CX - NOTCH
}`;

/** IC 패키지의 몸통. 윤곽이 그려지고 면이 채워진다. */
export const Package: React.FC<{ frame: number }> = ({ frame }) => {
  const outline = progress(frame, AT.outline, 26, ease.inOut);
  const body = progress(frame, AT.outline + 4, 20);
  const notch = progress(frame, AT.outline + 22, 8);
  const divider = progress(frame, AT.title, 16);
  const dividerY = CHIP.y + HEADER_H;
  return (
    <g>
      <rect x={CHIP.x} y={CHIP.y} width={CHIP.w} height={CHIP.h} fill={color.panel} opacity={body} />
      <path
        d={OUTLINE}
        pathLength={1}
        fill="none"
        stroke={color.inkSoft}
        strokeWidth={stroke.trace}
        strokeLinecap="square"
        {...draw(outline)}
      />
      <path
        d={`M ${CHIP_CX - NOTCH} ${CHIP.y} a ${NOTCH} ${NOTCH} 0 0 0 ${NOTCH * 2} 0`}
        fill={color.bg}
        stroke={color.inkSoft}
        strokeWidth={stroke.trace}
        opacity={notch}
      />
      {/* 제목 칸과 핀 칸을 나누는 선: 가운데에서 양쪽으로 */}
      <line
        x1={lerp(CHIP_CX, CHIP.x, divider)}
        x2={lerp(CHIP_CX, CHIP_RIGHT, divider)}
        y1={dividerY}
        y2={dividerY}
        stroke={color.line}
        strokeWidth={stroke.hair}
        opacity={divider}
      />
    </g>
  );
};

/** 한 줄의 선: 왼쪽 점선(현재) → 칩 안 → 오른쪽 청록 실선(전환 후) */
export const RowWires: React.FC<{ frame: number; index: number }> = ({ frame, index }) => {
  const y = rowY(index);
  const s = rowState(frame, index);
  if (s.base <= 0) return null;

  const wireColor = interpolateColors(s.dim, [0, 1], [color.inkSoft, color.lineStrong]);
  const pinInColor = interpolateColors(s.lit, [0, 1], [color.lineStrong, color.inkSoft]);

  // 칩 안을 지나가는 짧은 선. 지나가는 동안 청록으로 바뀐다.
  const head = lerp(CHIP.x, CHIP_RIGHT, s.cross);
  const tail = Math.max(CHIP.x, head - 110);
  const crossing = Math.sin(Math.PI * s.cross);

  return (
    <g>
      {/* 현재: 왼쪽 끝에서 칩으로 들어오는 점선 */}
      <Trace
        pts={[
          [WIRE_X0, y],
          [CHIP.x, y],
        ]}
        stroke={wireColor}
        dash="3 9"
        progress={s.wireIn}
      />
      {s.wireIn > 0 ? (
        <circle
          cx={WIRE_X0}
          cy={y}
          r={6}
          fill={color.bg}
          stroke={wireColor}
          strokeWidth={stroke.trace}
          opacity={Math.min(1, s.wireIn * 4)}
        />
      ) : null}

      {/* 칩 안쪽: 핀에서 핀까지 */}
      <line
        x1={CHIP.x}
        x2={lerp(CHIP.x, CHIP_RIGHT, s.base)}
        y1={y}
        y2={y}
        stroke={color.line}
        strokeWidth={stroke.hair}
      />
      {crossing > 0.01 ? (
        <line
          x1={tail}
          x2={head}
          y1={y}
          y2={y}
          stroke={interpolateColors(s.cross, [0, 1], [color.inkSoft, color.agent])}
          strokeWidth={stroke.trace}
          opacity={crossing}
        />
      ) : null}

      {/* 전환 후: 칩에서 오른쪽으로 나가는 청록 실선 */}
      <Trace
        pts={[
          [CHIP_RIGHT, y],
          [safe.right, y],
        ]}
        stroke={color.agent}
        width={stroke.bold}
        arrow
        progress={s.wireOut}
      />

      {/* 핀 */}
      <rect
        x={CHIP.x - PIN / 2}
        y={y - PIN / 2}
        width={PIN}
        height={PIN}
        fill={color.bg}
        stroke={pinInColor}
        strokeWidth={stroke.trace}
        opacity={s.base}
      />
      <rect
        x={CHIP_RIGHT - PIN / 2}
        y={y - PIN / 2}
        width={PIN}
        height={PIN}
        fill={color.bg}
        stroke={color.lineStrong}
        strokeWidth={stroke.trace}
        opacity={s.base * (1 - s.pin)}
      />
      {s.pin > 0 ? (
        <rect
          x={CHIP_RIGHT - PIN / 2}
          y={y - PIN / 2}
          width={PIN}
          height={PIN}
          fill={color.agent}
          opacity={s.pin}
        />
      ) : null}
    </g>
  );
};
