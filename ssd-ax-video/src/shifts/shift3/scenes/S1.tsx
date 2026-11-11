import React from "react";
import { useCurrentFrame } from "remotion";
import { ease, enter, progress } from "../../../video/anim";
import { Trace } from "../../../video/components/Trace";
import { S6 as table } from "../../../video/content";
import { color, fullSvg, mono, sans, size, stroke, withAlpha } from "../../../video/theme";
import { ShiftSheet, ShiftTitle, useScene } from "../../lib";
import { STEP_WORDS, split } from "./kit";

// s1 제목과 질문.
//   s1.1  제목 블록 + 본편 5대 전환 표의 축약판(3행만 밝다)
//   s1.2  제목이 물러나고 질문 한 줄
//   s1.3  의도 정의 → 실행 → 증거 기반 판단 세 칸 띠

const QUESTION = "코드를 직접 쓰지 않는다면, 엔지니어는 무엇을 하는가";
const ROW = 2; // 업무 방식

const CHIP = { x: 1330, y: 136, w: 300, h: 400, top: 64, pitch: 68 };

const MiniTable: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const body = progress(frame, at, 16, ease.out);
  const lit = progress(frame, at + 16, 14, ease.out);
  return (
    <>
      <svg {...fullSvg}>
        <rect x={CHIP.x} y={CHIP.y} width={CHIP.w} height={CHIP.h * body} fill={withAlpha(color.panel, 0.9)} stroke={color.lineStrong} strokeWidth={stroke.thin} opacity={body} />
        {table.rows.map((_, i) => {
          const y = CHIP.y + CHIP.top + i * CHIP.pitch;
          const on = i === ROW;
          const p = progress(frame, at + 6 + i * 3, 14, ease.out);
          return (
            <g key={i} opacity={on ? 1 : 0.45}>
              <line x1={CHIP.x - 90 * p} y1={y} x2={CHIP.x} y2={y} stroke={on ? color.inkSoft : color.lineStrong} strokeWidth={stroke.thin} strokeDasharray="3 7" />
              <rect x={CHIP.x - 6} y={y - 6} width={12} height={12} fill={color.bg} stroke={color.lineStrong} strokeWidth={stroke.thin} opacity={p} />
              <rect x={CHIP.x + CHIP.w - 6} y={y - 6} width={12} height={12} fill={on ? color.agent : color.lineStrong} opacity={p} />
              {on ? <Trace pts={[[CHIP.x + CHIP.w + 6, y], [1824, y]]} stroke={color.agent} arrow progress={lit} /> : null}
            </g>
          );
        })}
      </svg>
      {table.rows.map((row, i) => {
        const on = i === ROW;
        return (
          <div
            key={row.axis}
            style={{
              position: "absolute",
              left: CHIP.x,
              width: CHIP.w,
              top: CHIP.y + CHIP.top + i * CHIP.pitch - 24,
              height: 48,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              ...sans(on ? size.body : size.small, on ? 800 : 500),
              color: on ? color.ink : color.inkDim,
              ...enter(frame, at + 6 + i * 3),
              opacity: progress(frame, at + 6 + i * 3) * (on ? 1 : 0.55),
            }}
          >
            {row.axis}
          </div>
        );
      })}
      <div style={{ position: "absolute", left: CHIP.x + 14, top: CHIP.y + 10, ...mono(size.label, 500), color: color.inkDim, opacity: body }}>5 SHIFTS</div>
    </>
  );
};

const STRIP = { y: 720, h: 104 };
const CELLS = [
  { x: 96, w: 330 },
  { x: 560, w: 132 },
  { x: 826, w: 470 },
];

export const S1: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, end, script } = useScene();
  const q = cue("s1.2");
  const a = cue("s1.3");
  const recede = progress(frame, q - 6, 18, ease.inOut);
  const [intent, judge] = script.to.split(" · ");
  const t1 = a;
  const t3 = split(a, end("s1.3"), 1, 2);
  const t2 = split(a, end("s1.3"), 3, 4);
  const cy = STRIP.y + STRIP.h / 2;
  const cell = (i: number, text: string, at: number, big: boolean) => {
    const c = i === 1 ? color.agent : color.human;
    return (
      <div
        style={{
          position: "absolute",
          left: CELLS[i].x,
          top: big ? STRIP.y : cy - 32,
          width: CELLS[i].w,
          height: big ? STRIP.h : 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `${stroke.trace}px solid ${c}`,
          backgroundColor: withAlpha(c, 0.12),
          ...sans(big ? size.head : size.body, 800),
          color: c,
          whiteSpace: "nowrap",
          ...enter(frame, at),
        }}
      >
        {text}
      </div>
    );
  };
  return (
    <ShiftSheet>
      <div style={{ opacity: 1 - 0.72 * recede }}>
        <ShiftTitle />
        <MiniTable at={cue("s1.1")} />
      </div>
      <div style={{ position: "absolute", left: 96, top: 578, ...sans(66, 800), whiteSpace: "nowrap", ...enter(frame, q, { distance: 20, duration: 18 }) }}>{QUESTION}</div>
      <svg {...fullSvg}>
        <Trace pts={[[CELLS[0].x + CELLS[0].w, cy], [CELLS[1].x, cy]]} stroke={color.inkSoft} arrow at={t2} />
        <Trace pts={[[CELLS[1].x + CELLS[1].w, cy], [CELLS[2].x, cy]]} stroke={color.inkSoft} arrow at={t2 + 8} />
      </svg>
      {cell(0, intent, t1, true)}
      {cell(2, judge, t3, true)}
      {cell(1, STEP_WORDS[1], t2, false)}
    </ShiftSheet>
  );
};
