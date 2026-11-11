import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, progress } from "../../../video/anim";
import { Trace } from "../../../video/components/Trace";
import { S6 } from "../../../video/content";
import { color, mono, pad2, sans, size, stroke, withAlpha } from "../../../video/theme";
import { ShiftSheet, ShiftTitle, useScene } from "../../lib";
import { Boxed, Layer, LoopRing, T, fade } from "./kit";

// s1 제목과 질문: 제목 블록, 다섯 전환 목록(2행만 밝게), 순차 handoff 줄과 상시 루프 줄, 예제 diff 한 줄.

const STAGES = [
  { text: "요구사항", w: 150 },
  { text: "구조", w: 96 },
  { text: "RTL", w: 96 },
  { text: "검증", w: 96 },
  { text: "emulation", w: 180 },
  { text: "FW", w: 96 },
  { text: "테스트", w: 124 },
];
const ROW_X = 380;
const ROW_END = 1824;
const GAP = (ROW_END - ROW_X - STAGES.reduce((s, b) => s + b.w, 0)) / (STAGES.length - 1);
const BOX_H = 60;
const lefts = STAGES.map((_, i) => ROW_X + STAGES.slice(0, i).reduce((s, b) => s + b.w, 0) + i * GAP);
const Y_A = 596;
const Y_B = 722;

const DEL = "- rcv_done[3:3]";
const ADD = "+ RCV_CPL_POP @ 0x48";

const Row: React.FC<{ y: number; at: number; tone: "before" | "after" }> = ({ y, at, tone }) => {
  const frame = useCurrentFrame();
  const after = tone === "after";
  return (
    <>
      {STAGES.map((b, i) => {
        const p = progress(frame, at + i * 3, DUR.enter);
        if (p <= 0) return null;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: lefts[i],
              top: y - BOX_H / 2,
              width: b.w,
              height: BOX_H,
              boxSizing: "border-box",
              border: `${stroke.thin}px solid ${after ? color.agent : color.lineStrong}`,
              backgroundColor: withAlpha(color.panel, 0.92),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              ...sans(size.small, 600),
              color: after ? color.ink : color.inkSoft,
              opacity: p,
              translate: `0px ${(1 - p) * 10}px`,
            }}
          >
            {b.text}
          </div>
        );
      })}
    </>
  );
};

export const S1: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue } = useScene();
  const c1 = cue("s1.1");
  const c2 = cue("s1.2");
  const c3 = cue("s1.3");
  const bAt = c2 + 58;
  const typed = progress(frame, c3 + 8, 50, (t) => t);
  const nDel = Math.round(DEL.length * Math.min(1, typed * 2.2));
  const nAdd = Math.round(ADD.length * Math.max(0, Math.min(1, (typed - 0.45) / 0.55)));
  const stripP = progress(frame, c3, DUR.draw);

  return (
    <ShiftSheet>
      <ShiftTitle />

      {/* 다섯 전환 목록: 2행만 밝다 */}
      {S6.rows.map((row, i) => {
        const here = i === 1;
        const p = fade(frame, c1 + 14 + i * 3);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 1380,
              top: 176 + i * 64,
              width: 444,
              height: 64,
              display: "flex",
              alignItems: "center",
              gap: 24,
              borderBottom: `${stroke.hair}px solid ${color.line}`,
              opacity: p * (here ? 1 : 0.45),
            }}
          >
            <div style={{ width: 6, height: 36, backgroundColor: here ? color.agent : "transparent" }} />
            <div style={{ ...mono(size.label, 700), color: here ? color.agent : color.inkDim }}>{pad2(i + 1)}</div>
            <div style={{ ...sans(size.body, here ? 800 : 500), color: here ? color.ink : color.inkDim, whiteSpace: "nowrap" }}>{row.axis}</div>
          </div>
        );
      })}

      {/* 순차 handoff: 칸 사이마다 붉은 점선 틈(대기) */}
      <T x={96} y={Y_A - 24} at={c2} px={size.body} weight={600} color={color.inkDim}>
        {S6.rows[1].before}
      </T>
      <Row y={Y_A} at={c2 + 4} tone="before" />
      <Layer>
        {STAGES.slice(0, -1).map((b, i) => {
          const x0 = lefts[i] + b.w + 6;
          const x1 = lefts[i + 1] - 6;
          return <Trace key={i} pts={[[x0, Y_A], [x1, Y_A]]} stroke={color.problem} dash="7 8" arrow at={c2 + 16 + i * 4} duration={14} />;
        })}

        {/* 위 줄에서 아래 줄로 */}
        <Trace pts={[[150, Y_A + 32], [150, Y_B - 34]]} stroke={color.agent} width={stroke.bold} arrow at={bAt - 12} />

        {/* 상시 루프: 같은 칸 사이를 도는 청록 고리 */}
        {STAGES.slice(0, -1).map((b, i) => {
          const x0 = lefts[i] + b.w;
          const x1 = lefts[i + 1];
          const cx = (x0 + x1) / 2;
          const at = bAt + 10 + i * 4;
          const p = progress(frame, at, 20);
          if (p <= 0) return null;
          return (
            <g key={i}>
              <line x1={x0} y1={Y_B} x2={cx - 26} y2={Y_B} stroke={color.agent} strokeWidth={stroke.thin} opacity={p} />
              <line x1={cx + 26} y1={Y_B} x2={x1} y2={Y_B} stroke={color.agent} strokeWidth={stroke.thin} opacity={p} />
              <LoopRing cx={cx} cy={Y_B} r={26} p={p} arrows={[0, 180]} width={stroke.trace} dot={p >= 1 ? ((frame - at) * 5 + 270) % 360 : undefined} />
            </g>
          );
        })}

        {/* 예제 diff 띠 */}
        {stripP > 0 ? (
          <g opacity={stripP}>
            <rect x={380} y={808} width={1060 * stripP} height={68} fill={withAlpha(color.panel, 0.92)} stroke={color.line} strokeWidth={stroke.thin} />
            <rect x={380} y={808} width={5} height={68} fill={color.human} />
          </g>
        ) : null}
      </Layer>
      <T x={96} y={Y_B - 24} at={bAt} px={size.body} weight={800}>
        {S6.rows[1].after}
      </T>
      <Row y={Y_B} at={bAt + 2} tone="after" />

      <T x={408} y={829} at={c3 + 2} px={size.label} weight={700} color={color.inkSoft} code>
        <span style={{ letterSpacing: "0.08em" }}>rcv_ctrl.rdl</span>
      </T>
      <T x={620} y={823} at={c3 + 6} px={size.small} color={color.problem} code>
        {DEL.slice(0, nDel)}
      </T>
      <T x={930} y={823} at={c3 + 6} px={size.small} color={color.agent} code>
        {ADD.slice(0, nAdd)}
      </T>
      <T x={1340} y={821} at={c3 + 10} weight={600}>
        <Boxed tone="dim">예제</Boxed>
      </T>
    </ShiftSheet>
  );
};
