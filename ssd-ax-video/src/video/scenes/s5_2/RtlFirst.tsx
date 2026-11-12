import React from "react";
import { interpolateColors, useCurrentFrame } from "remotion";
import { draw, ease, enterSvg, progress, sub } from "../../anim";
import { Trace } from "../../components";
import { FIG } from "../../content";
import { color, stroke, withAlpha } from "../../theme";
import { Label } from "./Label";

// S5-2 "현재"의 그림: RTL 먼저.
//   구조 → RTL → 블록 검증 → emulation 을 차례로 지나고, 구조의 문제(P99.99 초과)는 emulation 에서야 보인다.
//   거기서 붉은 점선이 맨 앞의 "구조"로 되돌아간다.

const L = FIG["S5-2"].rtlFirst;

const ROW_Y = 282;
const H = 58;
const WIDTHS = [96, 90, 164, 186] as const;
const GAP = 40;
const X0 = 12;
const BOXES = WIDTHS.map((w, i) => ({
  x: X0 + WIDTHS.slice(0, i).reduce((sum, v) => sum + v + GAP, 0),
  w,
}));
const LAST = BOXES.length - 1;
const EMU = BOXES[LAST];
const EMU_CX = EMU.x + EMU.w / 2;
const FLAG = { w: 262, h: 58, y: 178 } as const;
const FLAG_X = EMU.x + EMU.w - FLAG.w;
const BACK_Y = ROW_Y + H + 70;
const FIRST_CX = BOXES[0].x + BOXES[0].w / 2;

/** 단계가 켜지는 시점(등장 후 프레임). emulation 은 한참 뒤에 온다. */
const STEP_AT = [4, 18, 36, 72] as const;
const FOUND_AT = 92;

export const RtlFirst: React.FC<{ at: number; out: number }> = ({ at, out }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const gone = progress(frame, out, 8, ease.in);
  if (gone >= 1) return null;

  const found = progress(frame, at + FOUND_AT, 14);
  const back = progress(frame, at + FOUND_AT + 14, 26, ease.inOut);

  return (
    <g opacity={1 - gone}>
      <g {...enterSvg(frame, at + 2, { distance: 6 })}>
        <Label x={X0} y={ROW_Y - 34} text="RTL FIRST" deco />
      </g>

      {BOXES.map((b, i) => {
        const p = progress(frame, at + STEP_AT[i], 14);
        if (p <= 0) return null;
        const isEmu = i === LAST;
        const tint = isEmu
          ? interpolateColors(found, [0, 1], [color.inkSoft, color.problem])
          : i === 0 && back >= 1
            ? color.problem
            : color.inkSoft;
        // RTL, 블록 검증은 통과 표시가 붙는다.
        const passed = i === 1 || i === 2 ? progress(frame, at + STEP_AT[i] + 12, 10) : 0;
        return (
          <g key={i}>
            {i > 0 ? (
              <Trace
                pts={[
                  [BOXES[i - 1].x + BOXES[i - 1].w + 4, ROW_Y + H / 2],
                  [b.x - 4, ROW_Y + H / 2],
                ]}
                stroke={color.inkSoft}
                width={stroke.thin}
                arrow
                progress={progress(frame, at + STEP_AT[i] - (isEmu ? 30 : 10), isEmu ? 30 : 10, ease.linear)}
              />
            ) : null}
            <rect
              x={b.x}
              y={ROW_Y}
              width={b.w}
              height={H}
              fill={isEmu ? withAlpha(color.problem, 0.1 * found) : withAlpha(color.ink, 0.04)}
              stroke={tint}
              strokeWidth={stroke.thin}
              {...(p < 1 ? draw(p, 2 * (b.w + H)) : {})}
            />
            <g opacity={sub(p, 0.3, 1)}>
              <Label
                x={b.x + b.w / 2}
                y={ROW_Y + H / 2}
                text={L.steps[i]}
                anchor="middle"
                fill={isEmu ? interpolateColors(found, [0, 1], [color.ink, color.problem]) : color.ink}
              />
            </g>
            {passed > 0 ? (
              <g opacity={sub(passed, 0, 0.4)}>
                <circle cx={b.x + b.w} cy={ROW_Y} r={13} fill={color.bg} stroke={color.inkSoft} strokeWidth={stroke.thin} />
                <path
                  d={`M ${b.x + b.w - 6} ${ROW_Y + 0.5} l 4.5 4.5 l 8 -9.5`}
                  fill="none"
                  stroke={color.ink}
                  strokeWidth={stroke.trace}
                  pathLength={1}
                  {...draw(sub(passed, 0.3, 1))}
                />
              </g>
            ) : null}
          </g>
        );
      })}

      {/* 문제는 emulation 에서야 보인다 */}
      {found > 0 ? (
        <g>
          <line
            x1={EMU_CX}
            x2={EMU_CX}
            y1={ROW_Y}
            y2={ROW_Y - (ROW_Y - FLAG.y - FLAG.h) * found}
            stroke={color.problem}
            strokeWidth={stroke.trace}
          />
          <g opacity={found} transform={`translate(0 ${(1 - found) * 10})`}>
            <rect
              x={FLAG_X}
              y={FLAG.y}
              width={FLAG.w}
              height={FLAG.h}
              fill={withAlpha(color.problem, 0.1)}
              stroke={color.problem}
              strokeWidth={stroke.trace}
            />
            <path
              d={`M ${FLAG_X + 34} ${FLAG.y + 15} l 15 27 h -30 Z M ${FLAG_X + 34} ${FLAG.y + 25} v 9 M ${FLAG_X + 34} ${FLAG.y + 37} v 1`}
              fill="none"
              stroke={color.problem}
              strokeWidth={stroke.trace}
              strokeLinejoin="miter"
            />
            <Label x={FLAG_X + 64} y={FLAG.y + FLAG.h / 2} text={L.found} weight={700} fill={color.problem} />
          </g>
        </g>
      ) : null}

      {/* 맨 앞의 구조로 되돌아간다 */}
      <Trace
        pts={[
          [EMU_CX, ROW_Y + H + 4],
          [EMU_CX, BACK_Y],
          [FIRST_CX, BACK_Y],
          [FIRST_CX, ROW_Y + H + 4],
        ]}
        stroke={color.problem}
        dash="10 8"
        arrow
        progress={back}
      />
      <g {...enterSvg(frame, at + FOUND_AT + 24, { distance: 8 })}>
        <Label x={(EMU_CX + FIRST_CX) / 2} y={BACK_Y + 36} text={L.back} anchor="middle" weight={700} fill={color.problem} />
      </g>
    </g>
  );
};
