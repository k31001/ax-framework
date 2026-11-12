import React from "react";
import { useCurrentFrame } from "remotion";
import { ease, lerp, progress, pulse } from "../../../video/anim";
import { CheckIcon, WarnIcon } from "../../../video/components/Icons";
import { Trace } from "../../../video/components/Trace";
import { color, fullSvg, stroke, withAlpha } from "../../../video/theme";
import { ShiftSheet } from "../../lib";
import { At, Box, CandidateDiagram, TrackRow, blend, mx, tx, useCues } from "./kitA";

// S4 RTL 먼저로 가면: 타임라인 한 줄을 왼쪽에서 오른쪽으로 따라가고, emulation 에서 구조까지 되돌아간다.

export const T4 = {
  title: "RTL 먼저",
  titleNote: "(예시 · 단계 기준)",
  cells: ["구조 회의", "RTL · 블록 검증", "FW", "emulation", "재작업", "emulation 2회차"],
  pick: "후보 B · retry만 HW로",
  pass: "기능 통과 · 재발행 cycle 수 통과",
  calc: ["P99.99 판정", "꼬리 표본 수천 건", "read 수천만 건"],
  sim: "RTL 시뮬레이션",
  meet: "RTL + FW 첫 만남",
  over: "P99.99 2.3 ms · 기준 초과 (예시)",
  cause: ["원인: bug 아님 · 구조", "(soft 단계가 FW 제어, decoder 공유)"],
  rework: ["ECC datapath · rcv_ctrl 신규", "register · C++ header (HSI)", "FW 복구 경로", "testbench · testplan"],
  gc: "GC 경쟁 발견",
  notes: ["처음부터 C를 골랐다면 첫 재작업은 없다", "retry FSM과 그 검증은 대부분 다시 쓴다"],
  model: "모델 먼저",
} as const;

export const LINE4 = { x: 96, y: 500, h: 76, pitch: 288, cellW: 264 } as const;
const cx = (i: number): number => LINE4.x + i * LINE4.pitch + LINE4.cellW / 2;
const cl = (i: number): number => LINE4.x + i * LINE4.pitch;
const UNDER = LINE4.y + LINE4.h + 18;

export const S4: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, within } = useCues();
  const c1 = cue("s4.1");
  const c2 = cue("s4.2");
  const c3 = cue("s4.3");
  const c4 = cue("s4.4");
  const c5 = cue("s4.5");
  const c6 = cue("s4.6");
  const c7 = cue("s4.7");
  const c8 = cue("s4.8");

  const on = (at: number): number => progress(frame, at, 14);
  const strike = progress(frame, within("s4.5", 0.12), 12);
  const toEmu = within("s4.5", 0.4);
  const over = on(c6 + 4);
  const backAt = c7 + 2;
  const reworkAt = [within("s4.7", 0.08), within("s4.7", 0.3), within("s4.7", 0.52), within("s4.7", 0.74)];
  const gcAt = within("s4.7", 0.9);
  const diagramDim = lerp(1, 0.4, on(c3));

  const lit = [on(c2), on(c3), on(toEmu - 6), on(toEmu + 6), on(backAt + 20), on(gcAt)];
  const tones = [color.human, color.human, color.human, blend(color.human, color.problem, over), color.problem, color.human];

  return (
    <ShiftSheet>
      {/* 제목 */}
      <At x={96} y={68} p={on(c1)} style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
        <div style={tx(48, 800)}>{T4.title}</div>
        <div style={tx(30, 500, color.inkDim)}>{T4.titleNote}</div>
      </At>

      {/* 구조 회의에서 고른 안 */}
      <At x={96} y={134} p={on(c2 + 6)} style={{ ...tx(32, 700, color.agent), opacity: on(c2 + 6) * diagramDim }}>
        {T4.pick}
      </At>
      <CandidateDiagram kind="B" x={96} y={186} at={c2} diffAt={within("s4.2", 0.5)} accentAt={within("s4.2", 0.8)} fromBase opacity={diagramDim} />

      {/* 타임라인 */}
      <TrackRow x={LINE4.x} y={LINE4.y} h={LINE4.h} pitch={LINE4.pitch} cellW={LINE4.cellW} cells={T4.cells.map((label, i) => ({ label, c: tones[i], lit: lit[i] }))} p={progress(frame, c1 + 4, 36, ease.inOut)} />

      {/* 블록 검증 통과 */}
      <At x={cl(1)} y={UNDER} p={on(c3 + 10)} style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <CheckIcon size={34} color={color.human} width={3.5} />
        <div style={tx(30, 600)}>{T4.pass}</div>
      </At>
      {/* P99.99 를 보려면 */}
      <At x={cl(1)} y={UNDER + 48} p={on(c4 + 2)} style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {T4.calc.map((s, i) => (
          <React.Fragment key={s}>
            {i > 0 ? <div style={{ ...mx(30, 700, color.inkDim), opacity: on(within("s4.4", i === 1 ? 0.25 : 0.55)) }}>=</div> : null}
            <div style={{ ...tx(30, 700, i === 2 ? color.problem : color.ink), opacity: on(i === 0 ? c4 + 2 : within("s4.4", i === 1 ? 0.25 : 0.55)) }}>{s}</div>
          </React.Fragment>
        ))}
      </At>
      {/* 시뮬레이션으로는 못 본다 → emulation */}
      <At x={cl(1)} y={UNDER + 96} p={on(c5)}>
        <div style={{ position: "relative", ...tx(30, 600, blend(color.ink, color.inkSoft, strike)) }}>
          {T4.sim}
          <div style={{ position: "absolute", left: -6, top: 19, height: 3, width: `calc(${strike * 100}% + ${12 * strike}px)`, backgroundColor: color.problem }} />
        </div>
      </At>
      <svg {...fullSvg}>
        <Trace pts={[[cl(1) + 226, UNDER + 115], [cx(3), UNDER + 115], [cx(3), LINE4.y + LINE4.h + 2]]} stroke={color.human} arrow at={toEmu - 4} duration={22} />
        {/* emulation → 구조 회의 */}
        <Trace pts={[[cx(3), LINE4.y - 3], [cx(3), LINE4.y - 22], [cx(0), LINE4.y - 22], [cx(0), LINE4.y - 3]]} stroke={color.problem} width={stroke.bold} dash="12 9" arrow at={backAt} duration={34} easing={ease.inOut} />
        {/* 2회차의 문제 */}
        <circle cx={cl(5) + 14} cy={LINE4.y - 44} r={9 * on(gcAt)} fill={color.problem} />
        <circle cx={cl(5) + 14} cy={LINE4.y - 44} r={9 + 16 * pulse(frame, gcAt, 40)} fill="none" stroke={color.problem} strokeWidth={stroke.thin} opacity={on(gcAt) * (1 - pulse(frame, gcAt, 40))} />
      </svg>
      <At x={cx(3) + 16} y={LINE4.y - 68} p={on(toEmu + 10) * (1 - 0.25 * on(backAt))} style={tx(30, 700, color.human)}>
        {T4.meet}
      </At>

      {/* 기준 초과 */}
      <Box x={cl(3) + 20} y={196} w={600} h={68} c={color.problem} bg={withAlpha(color.problem, 0.12)} bw={stroke.trace} p={over} style={{ flexDirection: "row", gap: 16 }}>
        <WarnIcon size={36} color={color.problem} />
        <div style={tx(32, 800, color.problem)}>{T4.over}</div>
      </Box>
      {T4.cause.map((s, i) => (
        <At key={s} x={cl(3) + 24} y={282 + i * 44} p={on(within("s4.6", 0.5) + i * 8)} style={tx(30, i === 0 ? 700 : 500, i === 0 ? color.ink : color.inkSoft)}>
          {s}
        </At>
      ))}

      {/* 다시 여는 것 */}
      {T4.rework.map((s, i) => (
        <At key={s} x={cl(4)} y={UNDER + i * 46} p={on(reworkAt[i])} style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 12, height: 12, border: `${stroke.thin}px solid ${color.problem}`, boxSizing: "border-box" }} />
          <div style={tx(30, 600)}>{s}</div>
        </At>
      ))}
      <At x={cl(5) + 36} y={LINE4.y - 64} p={on(gcAt + 4)} style={tx(30, 700, color.problem)}>
        {T4.gc}
      </At>

      {/* 단서 */}
      {T4.notes.map((s, i) => (
        <At key={s} x={96} y={UNDER + 158 + i * 44} p={on(i === 0 ? c8 + 4 : within("s4.8", 0.5))} style={tx(30, 500, color.ink)}>
          {s}
        </At>
      ))}

      {/* 아래 줄: 모델 먼저 (흐리게) */}
      <div style={{ opacity: 0.4 * on(c1 + 10) }}>
        <At x={96} y={850} style={tx(30, 700, color.agent)}>
          {T4.model}
        </At>
        <TrackRow x={324} y={848} h={42} pitch={250} cellW={226} cells={Array.from({ length: 6 }, () => ({ c: color.agent, lit: 0.5 }))} dashEmpty />
      </div>
    </ShiftSheet>
  );
};
