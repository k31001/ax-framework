import React from "react";
import { interpolateColors, useCurrentFrame } from "remotion";
import { draw, ease, enterSvg, lerp, progress, sub } from "../../anim";
import { Pad, Trace, Via } from "../../components";
import { FIG } from "../../content";
import { color, stroke, withAlpha } from "../../theme";
import { Label } from "./Label";

// S5-3 위쪽: API 문서의 문장 → 계약 → RTL · C++ header · assertion.
//   human  문서의 문장 세 줄이 계약 블록으로 건너가 확인되는 규칙(체크 칸)이 된다
//   agent  계약에서 trace 세 갈래가 뻗어 세 산출물이 함께 나온다

const L = FIG["S5-3"];

const DOC = { x: 2, y: 62, w: 108, h: 136, fold: 20 } as const;
const DOC_LINES = [
  { dy: 26, len: 72 },
  { dy: 48, len: 80 },
  { dy: 70, len: 58 },
  { dy: 92, len: 76 },
  { dy: 114, len: 46 },
] as const;
const MOVED = [1, 2, 3] as const; // 계약으로 건너가는 문장(동작 규약)
const DOC_LINE_X = DOC.x + 14;

const BOX = { x: 172, y: 62, w: 140, h: 136 } as const;
const RULE_YS = [92, 130, 168] as const;
const RULE = { check: BOX.x + 16, x: BOX.x + 42, len: 82 } as const;
const MID_Y = BOX.y + BOX.h / 2;

const JOIN_X = 352;
const OUT_X = 392;
const OUT_YS = [80, 130, 180] as const;

export const ContractFanout: React.FC<{
  before: number;
  humanAt: number;
  agentAt: number;
  /** 배경 그림이 본문 전체를 쓰는 동안(시작, 끝 프레임)은 비켜 준다. */
  away?: readonly [number, number];
}> = ({ before, humanAt, agentAt, away }) => {
  const frame = useCurrentFrame();
  const appear = progress(frame, before, 18);
  if (appear <= 0) return null;
  const shown = away ? 1 - progress(frame, away[0], 8, ease.in) + progress(frame, away[1], 12) : 1;
  if (shown <= 0) return null;

  const faded = progress(frame, humanAt + 14, 22); // 문서가 물러난다
  const docTint = interpolateColors(faded, [0, 1], [color.inkSoft, color.lineStrong]);
  const box = progress(frame, humanAt + 4, 18);
  const right = DOC.x + DOC.w;

  return (
    <g opacity={shown}>
      {/* API 문서 */}
      <g {...enterSvg(frame, before + 4)}>
        <Label
          x={DOC.x}
          y={DOC.y - 29}
          text={L.from}
          fill={interpolateColors(faded, [0, 1], [color.inkSoft, color.inkDim])}
        />
      </g>
      <path
        d={`M ${DOC.x} ${DOC.y} H ${right - DOC.fold} L ${right} ${DOC.y + DOC.fold} V ${DOC.y + DOC.h} H ${DOC.x} Z`}
        fill={withAlpha(color.panel, 0.6 * appear)}
        stroke={docTint}
        strokeWidth={stroke.thin}
        strokeLinejoin="round"
        pathLength={1}
        {...draw(appear)}
      />
      <path
        d={`M ${right - DOC.fold} ${DOC.y} V ${DOC.y + DOC.fold} H ${right}`}
        fill="none"
        stroke={docTint}
        strokeWidth={stroke.hair}
        opacity={sub(appear, 0.6, 1)}
      />
      {DOC_LINES.map((line, i) => {
        const y = DOC.y + line.dy;
        const shown = sub(appear, 0.3 + i * 0.08, 0.7 + i * 0.08);
        const rule = MOVED.indexOf(i as (typeof MOVED)[number]);
        if (rule < 0) {
          return (
            <line
              key={i}
              x1={DOC_LINE_X}
              x2={DOC_LINE_X + line.len}
              y1={y}
              y2={y}
              stroke={docTint}
              strokeWidth={stroke.trace}
              opacity={shown * 0.85}
            />
          );
        }
        // 건너가는 문장: 문서의 자리 → 계약의 규칙 줄
        const start = humanAt + 12 + rule * 5;
        const move = progress(frame, start, 16, ease.inOut);
        const x = lerp(DOC_LINE_X, RULE.x, move);
        const ly = lerp(y, RULE_YS[rule], move);
        const checked = progress(frame, start + 14, 12);
        return (
          <g key={i} opacity={shown}>
            {/* 떠난 자리 */}
            <line
              x1={DOC_LINE_X}
              x2={DOC_LINE_X + line.len}
              y1={y}
              y2={y}
              stroke={color.line}
              strokeWidth={stroke.trace}
              strokeDasharray="4 5"
              opacity={move}
            />
            <line
              x1={x}
              x2={x + lerp(line.len, RULE.len, move)}
              y1={ly}
              y2={ly}
              stroke={interpolateColors(move, [0, 1], [color.inkSoft, color.ink])}
              strokeWidth={stroke.trace}
              opacity={lerp(0.85, 1, move)}
            />
            {checked > 0 ? (
              <g opacity={sub(checked, 0, 0.5)}>
                <rect
                  x={RULE.check}
                  y={RULE_YS[rule] - 7}
                  width={14}
                  height={14}
                  fill="none"
                  stroke={color.human}
                  strokeWidth={stroke.hair}
                />
                <path
                  d={`M ${RULE.check + 3} ${RULE_YS[rule]} l 3.5 3.5 l 5.5 -7`}
                  fill="none"
                  stroke={color.human}
                  strokeWidth={stroke.trace}
                  pathLength={1}
                  {...draw(sub(checked, 0.3, 1))}
                />
              </g>
            ) : null}
          </g>
        );
      })}

      {/* 문서 → 계약 */}
      <Trace
        pts={[
          [right + 8, MID_Y],
          [BOX.x - 6, MID_Y],
        ]}
        stroke={color.human}
        arrow
        progress={progress(frame, humanAt, 12)}
      />

      {/* 계약 */}
      {box > 0 ? (
        <>
          <rect
            x={BOX.x}
            y={BOX.y}
            width={BOX.w}
            height={BOX.h}
            fill={withAlpha(color.human, 0.06 * box)}
            stroke={color.human}
            strokeWidth={stroke.trace}
            {...(box < 1 ? draw(box, 2 * (BOX.w + BOX.h)) : {})}
          />
          <g {...enterSvg(frame, humanAt + 8)}>
            <Label x={BOX.x} y={BOX.y - 29} text={L.contract} weight={700} fill={color.ink} />
          </g>
        </>
      ) : null}

      {/* 계약 → 세 산출물 */}
      <Trace
        pts={[
          [BOX.x + BOX.w, MID_Y],
          [JOIN_X, MID_Y],
        ]}
        stroke={color.agent}
        progress={progress(frame, agentAt + 2, 8, ease.linear)}
      />
      {OUT_YS.map((y, k) => (
        <React.Fragment key={k}>
          <Trace
            pts={
              y === MID_Y
                ? [
                    [JOIN_X, MID_Y],
                    [OUT_X, y],
                  ]
                : [
                    [JOIN_X, MID_Y],
                    [JOIN_X, y],
                    [OUT_X, y],
                  ]
            }
            stroke={color.agent}
            progress={progress(frame, agentAt + 9, 12)}
          />
          <Pad x={OUT_X} y={y} fill={color.agent} p={progress(frame, agentAt + 18 + k * 2, 8)} />
          <g {...enterSvg(frame, agentAt + 16 + k * 2, { from: "right", distance: 10 })}>
            <Label x={OUT_X + 16} y={y} text={L.outputs[k]} fill={color.ink} />
          </g>
        </React.Fragment>
      ))}
      <Via x={JOIN_X} y={MID_Y} stroke={color.agent} p={progress(frame, agentAt + 8, 8)} />
    </g>
  );
};
