import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, ease, enter, progress } from "../../../video/anim";
import { AgentIcon } from "../../../video/components/Icons";
import { Pad, Trace, Via } from "../../../video/components/Trace";
import { color, fullSvg, sans, stroke } from "../../../video/theme";
import { ShiftSheet, ShiftTitle } from "../../lib";
import { ChatIcon, QuestionCard, useCues } from "./kit";
import { TX } from "./text";

// S1 제목. 오른쪽에 흩어진 챗봇 창 → 도구 핀이 달린 플랫폼 칩, 아래에 같은 질문 하나가 두 갈래로.

const WIN = { x: 1100, w: 150, h: 76, ys: [170, 270, 370] } as const;
const CHIP = { x: 1500, y: 208, w: 220, h: 200 } as const;
const PINS = [248, 288, 328, 368];
const MERGE_Y = 308;

export const S1: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, within } = useCues();
  const a = cue("s1.2");
  const b = cue("s1.3");
  const split = within("s1.3", 0.45);
  const chip = progress(frame, a + 26, DUR.enter);

  return (
    <ShiftSheet>
      <ShiftTitle />
      <svg {...fullSvg}>
        {WIN.ys.map((y, i) => {
          const p = progress(frame, a + i * 4, DUR.enter);
          return (
            <g key={y} opacity={p}>
              <rect x={WIN.x} y={y} width={WIN.w} height={WIN.h} fill={color.panel} stroke={color.lineStrong} strokeWidth={stroke.thin} />
              <line x1={WIN.x} x2={WIN.x + WIN.w} y1={y + 20} y2={y + 20} stroke={color.line} strokeWidth={stroke.hair} />
              <line x1={WIN.x + 18} x2={WIN.x + 96} y1={y + 40} y2={y + 40} stroke={color.lineStrong} strokeWidth={stroke.thin} />
              <line x1={WIN.x + 18} x2={WIN.x + 66} y1={y + 56} y2={y + 56} stroke={color.lineStrong} strokeWidth={stroke.thin} />
            </g>
          );
        })}
        {WIN.ys.map((y, i) => (
          <Trace key={y} pts={[[WIN.x + WIN.w, y + WIN.h / 2], [1320, y + WIN.h / 2], [1320, MERGE_Y]]} stroke={color.lineStrong} dash="3 7" width={stroke.thin} at={a + 10 + i * 3} />
        ))}
        <Via x={1320} y={MERGE_Y} stroke={color.agent} p={progress(frame, a + 18, 8)} />
        <Trace pts={[[1326, MERGE_Y], [CHIP.x - 6, MERGE_Y]]} stroke={color.agent} width={stroke.bold} arrow at={a + 18} duration={DUR.draw + 4} easing={ease.inOut} />
        <g opacity={chip}>
          <rect x={CHIP.x} y={CHIP.y} width={CHIP.w} height={CHIP.h} fill={color.panel} stroke={color.agent} strokeWidth={stroke.trace} />
          <path d={`M ${CHIP.x + CHIP.w / 2 - 14} ${CHIP.y} a 14 14 0 0 0 28 0`} fill="none" stroke={color.agent} strokeWidth={stroke.thin} />
        </g>
        {PINS.map((y, i) => {
          const p = progress(frame, a + 34 + i * 4, DUR.draw);
          return (
            <g key={y}>
              <Trace pts={[[CHIP.x + CHIP.w, y], [1776, y]]} stroke={color.agent} progress={p} />
              <Pad x={1784} y={y} fill={color.agent} s={14} p={p} />
            </g>
          );
        })}
        {/* 질문 카드에서 두 시스템으로 갈라지는 선 */}
        <Trace pts={[[960, 658], [960, 716], [560, 716], [560, 764]]} stroke={color.lineStrong} at={split} arrow />
        <Trace pts={[[960, 658], [960, 716], [1360, 716], [1360, 764]]} stroke={color.lineStrong} at={split} arrow />
        <Via x={960} y={716} stroke={color.lineStrong} p={progress(frame, split + 4, 8)} />
      </svg>
      <div style={{ position: "absolute", left: CHIP.x, top: CHIP.y, width: CHIP.w, height: CHIP.h, display: "flex", alignItems: "center", justifyContent: "center", opacity: chip }}>
        <AgentIcon size={84} color={color.agent} />
      </div>

      <div style={{ position: "absolute", left: 0, width: 1920, top: 572, display: "flex", justifyContent: "center", ...enter(frame, b, { distance: 16 }) }}>
        <QuestionCard text={TX.question} px={36} h={86} />
      </div>
      {[
        { x: 560, text: TX.chatbot, Icon: ChatIcon },
        { x: 1360, text: TX.platformAgent, Icon: AgentIcon },
      ].map(({ x, text, Icon }, i) => (
        <div key={text} style={{ position: "absolute", left: x - 400, width: 800, top: 776, display: "flex", justifyContent: "center", alignItems: "center", gap: 16, ...enter(frame, split + 12 + i * 4) }}>
          <Icon size={40} color={color.inkDim} />
          <div style={{ ...sans(40, 600), color: color.inkDim, whiteSpace: "nowrap" }}>{text}</div>
        </div>
      ))}
    </ShiftSheet>
  );
};
