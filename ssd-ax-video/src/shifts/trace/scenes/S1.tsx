import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, ease, progress } from "../../../video/anim";
import { HumanIcon } from "../../../video/components/Icons";
import { Trace } from "../../../video/components/Trace";
import { color, fullSvg, stroke, withAlpha } from "../../../video/theme";
import { ShiftSheet, ShiftTitle } from "../../lib";
import { At, Box, MiniReqCard, REQ_CARD, Stripes, blend, mx, tx, useCues } from "./kitA";

// S1 제목과 질문: 요구사항 카드에서 두 코드로 내려가는 선. 가운데는 지금 사람의 기억과 grep 이고, 그 자리에 그래프가 놓인다.

const CX = 1455;
const CARD_Y = 96;
const LX = 1270;
const RX = 1640;
const TOP = CARD_Y + REQ_CARD.h;
const GAP = { y0: 300, y1: 470, mid: 385 } as const;
const PANEL = { y: 570, w: 340, h: 170 } as const;

export const S1: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, within } = useCues();
  const c2 = cue("s1.2");
  const c3 = cue("s1.3");
  const c4 = cue("s1.4");

  const rtlAt = within("s1.2", 0.22);
  const fwAt = within("s1.2", 0.36);
  const joinAt = within("s1.2", 0.66);
  const joined = progress(frame, joinAt, 14) * (1 - progress(frame, c3, 12));
  const broken = progress(frame, c3 + 2, 14, ease.inOut);
  const who = progress(frame, c3 + 10, DUR.enter) * (1 - progress(frame, c4 - 2, 12));
  const memAt = within("s1.3", 0.45);
  const grepAt = within("s1.3", 0.72);
  const graphAt = within("s1.4", 0.18);
  const healed = progress(frame, graphAt, 16, ease.inOut);
  const lineC = blend(color.inkSoft, color.ink, joined);
  const midC = blend(blend(color.inkSoft, color.problem, broken), color.agent, healed);
  const midDash = broken > 0.5 && healed < 0.5 ? "7 7" : undefined;
  // 끊어진 틈: 가운데가 벌어졌다가 그래프가 놓이며 닫힌다
  const open = 34 * broken * (1 - healed);
  const nodeP = (i: number): number => progress(frame, graphAt + 4 + i * 8, DUR.enter);
  const edgeP = (i: number): number => progress(frame, graphAt + 14 + i * 8, DUR.draw, ease.inOut);

  return (
    <ShiftSheet>
      <ShiftTitle />

      <MiniReqCard x={CX - REQ_CARD.w / 2} y={CARD_Y} p={progress(frame, c2, DUR.enter)} />
      <svg {...fullSvg}>
        {[
          { x: LX, at: rtlAt },
          { x: RX, at: fwAt },
        ].map(({ x, at }, i) => {
          const p = progress(frame, at, 22, ease.inOut);
          const len = PANEL.y - TOP;
          const y = TOP + len * p;
          const seg = (a: number, b: number, c: string, dash?: string, w: number = stroke.trace) =>
            y > a ? <line x1={x} x2={x} y1={a} y2={Math.min(b, y)} stroke={c} strokeWidth={w} strokeDasharray={dash} /> : null;
          return (
            <g key={i}>
              {seg(TOP, GAP.y0, lineC, undefined, stroke.trace + joined)}
              {seg(GAP.y0, GAP.mid - open, midC, midDash, stroke.trace + joined)}
              {seg(GAP.mid + open, GAP.y1, midC, midDash, stroke.trace + joined)}
              {seg(GAP.y1, PANEL.y, lineC, undefined, stroke.trace + joined)}
              {p >= 1 ? <path d={`M ${x - 8} ${PANEL.y - 13} L ${x} ${PANEL.y - 1} L ${x + 8} ${PANEL.y - 13}`} fill="none" stroke={lineC} strokeWidth={stroke.trace} /> : null}
            </g>
          );
        })}
        {/* 지식 그래프: 노드 셋과 엣지 둘 */}
        <Trace pts={[[LX + 34, GAP.mid], [CX - 34, GAP.mid]]} stroke={color.agent} progress={edgeP(0)} arrow />
        <Trace pts={[[CX + 34, GAP.mid], [RX - 34, GAP.mid]]} stroke={color.agent} progress={edgeP(1)} arrow />
        {[LX, CX, RX].map((x, i) => {
          const p = nodeP(i);
          if (p <= 0) return null;
          const fill = blend(color.panel, color.agent, 0.14);
          return (
            <g key={i} opacity={p} transform={`translate(0 ${(1 - p) * 10})`}>
              {i === 1 ? (
                <path d={`M ${x - 30} ${GAP.mid - 26} H ${x + 18} L ${x + 30} ${GAP.mid - 14} V ${GAP.mid + 26} H ${x - 30} Z`} fill={fill} stroke={color.agent} strokeWidth={stroke.thin} />
              ) : (
                <rect x={x - 30} y={GAP.mid - 24} width={60} height={48} fill={fill} stroke={color.agent} strokeWidth={stroke.thin} />
              )}
              {i === 0 ? <path d={`M ${x + 14} ${GAP.mid - 22} h 14 v 14`} fill="none" stroke={color.agent} strokeWidth={5} /> : null}
            </g>
          );
        })}
      </svg>
      <At x={RX - 20} y={GAP.mid - 20} p={nodeP(2)} style={mx(26, 700, color.agent)}>
        {"{}"}
      </At>

      {/* 두 코드 패널: 줄 무늬만 */}
      {[
        { x: LX - PANEL.w / 2, name: "rtl/rcv/prio_q.sv", at: rtlAt + 14 },
        { x: RX - PANEL.w / 2, name: "fw/rcv/rcv_policy.cpp", at: fwAt + 14 },
      ].map(({ x, name, at }) => {
        const p = progress(frame, at, DUR.enter);
        return (
          <React.Fragment key={name}>
            <Box x={x} y={PANEL.y} w={PANEL.w} h={PANEL.h} c={color.lineStrong} p={p} style={{ justifyContent: "flex-start", alignItems: "flex-start" }}>
              <div style={{ ...mx(24, 700, color.inkSoft), padding: "10px 16px", width: "100%", boxSizing: "border-box", borderBottom: `${stroke.hair}px solid ${color.line}` }}>{name}</div>
            </Box>
            {p > 0 ? <Stripes x={x + 28} y={PANEL.y + 68} p={progress(frame, at + 6, 24)} /> : null}
          </React.Fragment>
        );
      })}

      {/* 지금: 사람의 기억과 grep */}
      <div style={{ position: "absolute", left: CX - 32, top: GAP.mid - 34, opacity: who }}>
        <HumanIcon size={64} color={color.human} />
      </div>
      {[
        { text: "기억", x: LX + 26, at: memAt },
        { text: "grep", x: CX + 56, at: grepAt },
      ].map(({ text, x, at }) => (
        <Box key={text} x={x} y={GAP.mid - 30} w={106} h={60} c={color.human} bg={withAlpha(color.human, 0.1)} p={progress(frame, at, DUR.enter)} o={1 - progress(frame, c4 - 2, 12)} round>
          <div style={tx(32, 700, color.human)}>{text}</div>
        </Box>
      ))}

      <At x={CX} y={GAP.mid + 44} center p={progress(frame, within("s1.4", 0.3), DUR.enter)} style={tx(40, 800, color.agent)}>
        지식 그래프
      </At>
    </ShiftSheet>
  );
};
