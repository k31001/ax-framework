import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, draw, ease, enter, progress } from "../../../video/anim";
import { Trace, Via } from "../../../video/components/Trace";
import type { Pt } from "../../../video/components/Trace";
import { color, fullSvg, mono, pad2, sans, stroke, withAlpha } from "../../../video/theme";
import { ShiftSheet } from "../../lib";
import { AgentNode, EdgeTag, blend, useCues } from "./kit";
import { TX } from "./text";

// S6 구성 요소와 시작 순서. 가운데 에이전트, 둘레에 번호가 붙은 블록 7개, 아래에 5단계 순서 띠.

type Kind = "buy" | "build" | "split" | "none";
const COL = { l: 96, r: 1284, w: 540, h: 130, ys: [150, 310, 470] } as const;
const BLOCKS: { x: number; y: number; w: number; h: number; kind: Kind }[] = [
  { x: 760, y: 150, w: 400, h: 120, kind: "buy" },
  { x: COL.l, y: COL.ys[0], w: COL.w, h: COL.h, kind: "split" },
  { x: COL.l, y: COL.ys[1], w: COL.w, h: COL.h, kind: "build" },
  { x: COL.l, y: COL.ys[2], w: COL.w, h: COL.h, kind: "buy" },
  { x: COL.r, y: COL.ys[0], w: COL.w, h: COL.h, kind: "build" },
  { x: COL.r, y: COL.ys[1], w: COL.w, h: COL.h, kind: "build" },
  { x: COL.r, y: COL.ys[2], w: COL.w, h: COL.h, kind: "none" },
];
const AGENT = { x: 870, y: 350, w: 180, h: 120 } as const;
const ACY = AGENT.y + AGENT.h / 2;
const REACH = { x: 740, ys: [556, 616, 676] } as const;
const STRIP = { x: 96, y: 762, w: 1728, h: 106 } as const;
const CELL = STRIP.w / 5;
const BOOK = { x: 270, y: 612, w: 430, h: 124 } as const;

const tracesTo = (i: number): Pt[] => {
  const b = BLOCKS[i];
  if (i === 0) return [[960, AGENT.y], [960, b.y + b.h]];
  const cy = b.y + b.h / 2;
  if (b.x < 900) return [[AGENT.x, ACY], [700, ACY], [700, cy], [b.x + b.w, cy]];
  return [[AGENT.x + AGENT.w, ACY], [1220, ACY], [1220, cy], [b.x, cy]];
};

export const S6: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, within } = useCues();
  const t1 = cue("s6.1");
  const names = [0, 0.12, 0.26, 0.4, 0.55, 0.67, 0.83].map((t) => within("s6.2", t));
  const buyAt = cue("s6.3");
  const buildAt = cue("s6.4");
  const jiraAt = cue("s6.8");
  const t5 = cue("s6.5");
  const t6 = cue("s6.6");
  const t7 = cue("s6.7");
  const stepAt = [t5 + 14, within("s6.6", 0.3), within("s6.6", 0.66), t7, within("s6.7", 0.5)];
  const reachAt = [t5 + 4, t7 + 4, within("s6.7", 0.5) + 4];

  const dim = progress(frame, t5, 14, ease.inOut);
  const back = progress(frame, within("s6.7", 0.5) + 10, 16, ease.inOut);
  // 순서 띠의 단계에 따라 다시 켜지는 블록: 2 평가(05), 3 격리 실행(04), 4 지식(03)
  const relight: Record<number, number> = { 4: stepAt[1], 3: stepAt[2], 2: stepAt[3], 1: t5 + 4, 6: stepAt[4] };
  const alive = (i: number): number => {
    const r = relight[i] === undefined ? 0 : progress(frame, relight[i], DUR.enter);
    return 1 - 0.72 * dim * (1 - Math.max(r, back));
  };
  const buy = progress(frame, buyAt + 6, DUR.enter);
  const build = progress(frame, buildAt + 6, DUR.enter);

  return (
    <ShiftSheet>
      <svg {...fullSvg}>
        {BLOCKS.map((b, i) => {
          const p = progress(frame, t1 + i * 4, DUR.draw + 4);
          const named = progress(frame, names[i], DUR.enter);
          const tone = b.kind === "buy" ? buy : b.kind === "build" ? build : 0;
          const base = blend(color.lineStrong, color.agent, named);
          const edge = b.kind === "buy" ? blend(base, color.inkSoft, tone) : b.kind === "build" ? blend(base, color.human, tone) : b.kind === "split" ? blend(base, color.line, buy) : base;
          return (
            <g key={i} opacity={alive(i)}>
              <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={withAlpha(color.panel, 0.85 * named)} stroke={edge} strokeWidth={tone > 0.5 ? stroke.bold : stroke.thin} pathLength={1} {...draw(p)} />
              <Trace pts={tracesTo(i)} stroke={blend(color.lineStrong, color.agent, named)} width={stroke.thin} at={t1 + 14 + i * 4} />
            </g>
          );
        })}
        {/* 에이전트가 닿는 곳 */}
        {REACH.ys.map((y, i) => {
          const pts: Pt[] = [[960, AGENT.y + AGENT.h], [960, 510], [REACH.x, 510], [REACH.x, y], [REACH.x + 22, y]];
          return (
            <g key={y}>
              <Trace pts={pts} stroke={color.agent} width={stroke.bold} at={reachAt[i]} duration={DUR.draw + 8} />
              <Via x={REACH.x + 28} y={y} stroke={color.agent} p={progress(frame, reachAt[i] + 18, 8)} />
            </g>
          );
        })}
        {/* 순서 띠 */}
        {[0, 1, 2, 3, 4].map((i) => {
          const p = progress(frame, t5 + 6 + i * 3, DUR.draw);
          const on = progress(frame, stepAt[i], DUR.enter);
          const x = STRIP.x + i * CELL;
          return (
            <g key={i}>
              <rect x={x + 6} y={STRIP.y} width={CELL - 30} height={STRIP.h} fill={withAlpha(color.panel, 0.85 * p)} stroke={blend(color.line, color.agent, on)} strokeWidth={on > 0.5 ? stroke.trace : stroke.thin} pathLength={1} {...draw(p)} />
              {i < 4 ? <Trace pts={[[x + CELL - 22, STRIP.y + STRIP.h / 2], [x + CELL + 4, STRIP.y + STRIP.h / 2]]} stroke={blend(color.lineStrong, color.agent, progress(frame, stepAt[i + 1], 10))} arrow progress={p} /> : null}
            </g>
          );
        })}
        {/* 3단계: sandbox 점선 사각형 */}
        <rect x={STRIP.x + 2 * CELL + 18} y={STRIP.y + 40} width={CELL - 54} height={54} fill="none" stroke={color.agent} strokeWidth={stroke.hair} strokeDasharray="8 6" opacity={progress(frame, stepAt[2] + 6, 12)} />
        {/* 문제집에서 2단계로 */}
        <Trace pts={[[STRIP.x + CELL * 1.5 - 9, BOOK.y + BOOK.h], [STRIP.x + CELL * 1.5 - 9, STRIP.y - 2]]} stroke={color.human} width={stroke.thin} at={stepAt[1] + 12} />
      </svg>

      {BLOCKS.map((b, i) => {
        const named = progress(frame, names[i], DUR.enter);
        const num = progress(frame, t1 + 6 + i * 4, DUR.enter);
        const split = b.kind === "split";
        return (
          <div key={i} style={{ opacity: alive(i) }}>
            <EdgeTag x={b.x + 18} y={b.y} text={pad2(i + 1)} c={blend(color.inkDim, color.agent, named)} p={num} />
            <div style={{ position: "absolute", left: b.x + 30, top: b.y, height: b.h, display: "flex", alignItems: "center", ...sans(40, 700), whiteSpace: "nowrap", opacity: named * (split ? 1 - buy : 1), translate: `${(1 - named) * 12}px 0px` }}>{TX.blocks[i]}</div>
            {i === 2 || i === 5 ? (
              <div style={{ position: "absolute", left: b.x, top: b.y, width: b.w - 18, height: b.h, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10 }}>
                {(i === 2 ? TX.jiraKnow : [TX.jiraGate]).map((t, k) => (
                  <div key={t} style={{ height: 46, padding: "0 12px", display: "flex", alignItems: "center", boxSizing: "border-box", border: `${stroke.thin}px solid ${i === 5 ? color.human : color.agent}`, backgroundColor: color.bg, ...sans(30, 600), color: i === 5 ? color.human : color.agent, whiteSpace: "nowrap", ...enter(frame, jiraAt + (i === 5 ? within("s6.8", 0.55) - jiraAt : 6 + k * 14), { from: "left" }) }}>{t}</div>
                ))}
              </div>
            ) : null}
            {split ? (
              <>
                {[
                  { text: TX.vendorLink, p: buy, c: color.inkSoft, on: buy },
                  { text: TX.inhouseLink, p: buy, c: color.human, on: build },
                ].map((r, k) => (
                  <div key={k} style={{ position: "absolute", left: b.x + 12, top: b.y + 12 + k * 55, width: b.w - 24, height: 51, boxSizing: "border-box", border: `${r.on > 0.5 ? stroke.trace : stroke.hair}px solid ${blend(color.line, r.c, r.on)}`, display: "flex", alignItems: "center", padding: "0 16px", ...sans(30, 600), color: blend(color.inkDim, color.ink, r.on), whiteSpace: "nowrap", opacity: r.p }}>{r.text}</div>
                ))}
              </>
            ) : null}
          </div>
        );
      })}

      <AgentNode x={AGENT.x} y={AGENT.y} w={AGENT.w} h={AGENT.h} p={progress(frame, 4, DUR.enter)} />

      {/* 구매 / 구축 */}
      <div style={{ position: "absolute", left: COL.l, top: 90, display: "flex", alignItems: "center", gap: 14, ...enter(frame, buyAt + 4), opacity: progress(frame, buyAt + 4, DUR.enter) * (1 - 0.6 * dim * (1 - back)) }}>
        <div style={{ width: 30, height: 30, boxSizing: "border-box", border: `${stroke.bold}px solid ${color.inkSoft}` }} />
        <div style={{ ...sans(32, 700), color: color.inkSoft }}>{TX.buy}</div>
        <div style={{ ...sans(30, 500), color: color.inkSoft, whiteSpace: "nowrap" }}>{TX.buyNote}</div>
      </div>
      <div style={{ position: "absolute", right: 96, top: 90, display: "flex", alignItems: "center", gap: 14, ...enter(frame, buildAt + 4), opacity: progress(frame, buildAt + 4, DUR.enter) * (1 - 0.6 * dim * (1 - back)) }}>
        <div style={{ width: 30, height: 30, boxSizing: "border-box", border: `${stroke.bold}px solid ${color.human}` }} />
        <div style={{ ...sans(32, 700), color: color.human }}>{TX.build}</div>
        <div style={{ ...sans(30, 500), color: color.human, whiteSpace: "nowrap" }}>{TX.buildNote}</div>
      </div>

      {REACH.ys.map((y, i) => (
        <div key={y} style={{ position: "absolute", left: REACH.x + 46, top: y - 22, ...sans(32, 600), whiteSpace: "nowrap", ...enter(frame, reachAt[i] + 16, { from: "left" }) }}>{TX.reach[i]}</div>
      ))}

      {/* 순서 띠의 글자 */}
      {TX.steps.map((s, i) => {
        const on = progress(frame, stepAt[i], DUR.enter);
        const x = STRIP.x + i * CELL + 6;
        return (
          <div key={s} style={{ opacity: progress(frame, t5 + 10 + i * 3, DUR.enter) }}>
            <EdgeTag x={x + 16} y={STRIP.y} text={`STEP ${pad2(i + 1)}`} c={blend(color.inkDim, color.agent, on)} />
            <div style={{ position: "absolute", left: x, top: STRIP.y + 14, width: CELL - 30, height: STRIP.h - 14, display: "flex", alignItems: "center", justifyContent: "center", ...sans(i === 4 ? 30 : 34, 700), color: blend(color.inkDim, color.ink, on), whiteSpace: "nowrap" }}>{s}</div>
          </div>
        );
      })}
      <div style={{ position: "absolute", left: STRIP.x + CELL - 24 - 170, top: STRIP.y - 24, height: 44, padding: "0 12px", display: "flex", alignItems: "center", backgroundColor: color.bg, border: `${stroke.thin}px solid ${color.agent}`, ...sans(30, 700), color: color.agent, whiteSpace: "nowrap", ...enter(frame, t6 + 2, { distance: 8 }) }}>{TX.readOnly}</div>

      {/* 평가 세트: 문제집 */}
      <div style={{ position: "absolute", left: BOOK.x, top: BOOK.y, width: BOOK.w, height: BOOK.h, boxSizing: "border-box", border: `${stroke.thin}px solid ${color.human}`, borderLeft: `6px solid ${color.human}`, backgroundColor: color.panel, padding: "6px 20px", ...enter(frame, stepAt[1] + 4) }}>
        {TX.workbook.map((w, i) => (
          <div key={w} style={{ display: "flex", alignItems: "center", gap: 12, height: 37, ...enter(frame, stepAt[1] + 10 + i * 6, { distance: 6 }) }}>
            <div style={{ width: 14, height: 14, boxSizing: "border-box", border: `${stroke.thin}px solid ${color.human}` }} />
            <div style={{ ...(i === 1 ? mono(30, 500) : sans(30, 600)), color: color.ink, whiteSpace: "nowrap" }}>{w}</div>
          </div>
        ))}
      </div>
    </ShiftSheet>
  );
};
