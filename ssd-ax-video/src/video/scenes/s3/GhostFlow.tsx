import React from "react";
import { interpolateColors, useCurrentFrame } from "remotion";
import { ease, lerp, progress } from "../../anim";
import { color, stroke } from "../../theme";
import { GHOST_ADDONS, GHOST_X0, GHOST_X1, GHOST_XS, GHOST_Y, T } from "./layout";

// 도입 문구 옆: 지금의 7단계 흐름과, 그 위에 덧붙인 조각 셋.
// 먼저 또렷하게 그려진다(흐름은 밝은 선, 덧붙인 조각은 청록 점선). 핵심 문구가 나오기 직전에
// 색이 빠지며 승인 스틸의 흐린 자국이 된다. <svg> 안에서 쓴다.

const ADDON_W = 44;
const ADDON_H = 22;

export const GhostFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const line = progress(frame, T.flow, 20, ease.inOut);
  if (line <= 0) return null;
  const dim = progress(frame, T.dim, 12, ease.inOut);
  const headX = lerp(GHOST_X0, GHOST_X1, line);

  const tint = (bright: string, ghost: string): string => interpolateColors(dim, [0, 1], [bright, ghost]);

  return (
    <g fill="none" opacity={lerp(1, 0.75, dim)}>
      <line
        x1={GHOST_X0}
        x2={headX}
        y1={GHOST_Y}
        y2={GHOST_Y}
        stroke={tint(color.inkSoft, color.line)}
        strokeWidth={stroke.trace}
      />
      {GHOST_XS.map((x, i) => {
        const p = progress(frame, T.flow + ((x - GHOST_X0) / (GHOST_X1 - GHOST_X0)) * 20, 8);
        return p <= 0 ? null : (
          <circle
            key={i}
            cx={x}
            cy={GHOST_Y}
            r={5 * (0.4 + 0.6 * p)}
            opacity={p}
            fill={color.bg}
            stroke={tint(color.inkSoft, color.lineStrong)}
            strokeWidth={stroke.thin}
          />
        );
      })}
      {GHOST_ADDONS.map(({ at, side }, i) => {
        const p = progress(frame, T.addon(i), 12);
        if (p <= 0) return null;
        const x = GHOST_XS[at] + ADDON_W;
        const y = GHOST_Y + side * 30;
        // 조각은 제자리보다 6px 바깥에서 들어와 흐름에 붙는다.
        const slide = (1 - p) * side * 6;
        return (
          <g
            key={at}
            stroke={tint(color.agent, color.lineStrong)}
            strokeWidth={stroke.thin}
            strokeDasharray="4 5"
            opacity={p}
          >
            <path d={`M ${GHOST_XS[at] + 8} ${GHOST_Y} H ${x} V ${y - side * (ADDON_H / 2) + slide}`} />
            <rect x={x - ADDON_W / 2} y={y - ADDON_H / 2 + slide} width={ADDON_W} height={ADDON_H} />
          </g>
        );
      })}
    </g>
  );
};
