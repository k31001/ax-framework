import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, ease, lerp, progress, pulse } from "../../../video/anim";
import { CheckIcon, WarnIcon } from "../../../video/components/Icons";
import { Trace } from "../../../video/components/Trace";
import { color, fullSvg, stroke, withAlpha } from "../../../video/theme";
import { ShiftSheet } from "../../lib";
import { At, BlockRow, Box, TrackRow, blend, tx, useCues } from "./kitA";

// S2 논쟁: RTL 먼저가 맞는 조건(왼쪽, 호박색)과 모델 먼저가 맞는 조건(오른쪽, 청록).

const T = {
  left: "RTL 먼저가 맞는 조건",
  right: "모델 먼저가 맞는 조건",
  quote: "\"빨리 RTL을 짜서 검증하고 고치는 게 빠르다\"",
  loop: ["RTL", "검증", "수정"],
  sofar: "지금까지는 합리적",
  why: ["구조는 이전 실리콘이 검증", "모델 구축·보정 비용이 큼"],
  fixed: "고정비",
  condL: ["구조 유지 · 변경이 블록 안 · 문제가 국소적", "블록 검증으로 판정"],
  condR: ["HW/FW 경계 이동 · 새 경쟁 경로", "판정 지표가 시스템 통계 (P99.99)"],
  line: ["구조", "RTL", "블록 검증", "emulation"],
  late: "늦게, 비싸게",
} as const;

const L = { x: 96, w: 848 } as const;
const R = { x: 976, w: 848 } as const;
const PANEL = { y: 96, h: 520 } as const;
const COND_Y = 476;
const LINE = { y: 772, h: 64, pitch: 452, cellW: 372 } as const;

const Panel: React.FC<{ x: number; w: number; title: string; c: string; p: number; lit: number }> = ({ x, w, title, c, p, lit }) =>
  p <= 0 ? null : (
    <>
      <div style={{ position: "absolute", left: x, top: PANEL.y, width: w, height: PANEL.h, boxSizing: "border-box", border: `${stroke.hair}px solid ${blend(color.line, c, 0.25 + 0.6 * lit)}`, backgroundColor: withAlpha(color.panel, 0.45), opacity: p }} />
      <div style={{ position: "absolute", left: x + 24, top: PANEL.y - 24, padding: "0 14px", backgroundColor: color.bg, ...tx(36, 800, blend(color.inkDim, c, lit)), opacity: p }}>{title}</div>
    </>
  );

const Cond: React.FC<{ x: number; lines: readonly string[]; c: string; at: number }> = ({ x, lines, c, at }) => {
  const frame = useCurrentFrame();
  const p = progress(frame, at, DUR.enter);
  if (p <= 0) return null;
  return (
    <div style={{ position: "absolute", left: x + 28, top: COND_Y, width: 792, height: 112, boxSizing: "border-box", borderLeft: `5px solid ${c}`, backgroundColor: withAlpha(c, 0.07), padding: "10px 22px", opacity: p }}>
      {lines.map((l, i) => (
        <div key={l} style={{ ...tx(32, 700), lineHeight: "46px", opacity: progress(frame, at + 6 + i * 22, DUR.enter) }}>
          {l}
        </div>
      ))}
    </div>
  );
};

export const S2: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, within } = useCues();
  const c1 = cue("s2.1");
  const c2 = cue("s2.2");
  const c3 = cue("s2.3");
  const c4 = cue("s2.4");
  const c5 = cue("s2.5");
  const c6 = cue("s2.6");

  const rightOn = progress(frame, c5, 14);
  const leftLit = 1 - 0.5 * rightOn;
  const loopAt = within("s2.1", 0.45);
  const why2 = within("s2.3", 0.5);
  const bar = progress(frame, why2 + 6, 22, ease.out);
  const hotAt = within("s2.5", 0.45);
  const markAt = within("s2.6", 0.3);
  const backAt = within("s2.6", 0.5);
  const lx = L.x + 32;
  const loopY = 232;
  const loopX = (i: number): number => lx + i * 156;

  return (
    <ShiftSheet>
      <Panel x={L.x} w={L.w} title={T.left} c={color.human} p={progress(frame, 4, 14)} lit={leftLit} />
      <Panel x={R.x} w={R.w} title={T.right} c={color.agent} p={progress(frame, 8, 14)} lit={rightOn} />

      <div style={{ opacity: 0.55 + 0.45 * leftLit }}>
        {/* 인용 */}
        <Box x={lx} y={144} w={760} h={64} c={color.human} bg={withAlpha(color.human, 0.08)} p={progress(frame, c1, DUR.enter)}>
          <div style={tx(30, 600)}>{T.quote}</div>
        </Box>
        {/* RTL → 검증 → 수정 의 짧은 루프 */}
        {T.loop.map((s, i) => (
          <Box key={s} x={loopX(i)} y={loopY} w={116} h={50} c={color.inkSoft} p={progress(frame, loopAt + i * 6, DUR.enter)}>
            <div style={tx(30, 600)}>{s}</div>
          </Box>
        ))}
        <svg {...fullSvg}>
          {[0, 1].map((i) => (
            <Trace key={i} pts={[[loopX(i) + 116, loopY + 25], [loopX(i + 1), loopY + 25]]} stroke={color.inkSoft} width={stroke.thin} arrow at={loopAt + 4 + i * 6} />
          ))}
          <Trace pts={[[loopX(2) + 58, loopY + 50], [loopX(2) + 58, loopY + 74], [loopX(0) + 58, loopY + 74], [loopX(0) + 58, loopY + 50]]} stroke={color.inkSoft} width={stroke.thin} arrow at={loopAt + 16} duration={20} />
        </svg>
        {/* 지금까지는 합리적 */}
        <At x={lx + 492} y={loopY + 4} p={progress(frame, c2 + 4, DUR.enter)} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <CheckIcon size={36} color={color.human} width={3.5} />
          <div style={tx(32, 700, color.human)}>{T.sofar}</div>
        </At>
        {/* 이유 두 줄 */}
        {T.why.map((s, i) => {
          const at = i === 0 ? c3 + 4 : why2;
          return (
            <At key={s} x={lx} y={340 + i * 52} p={progress(frame, at, DUR.enter)} style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 12, height: 12, backgroundColor: color.human }} />
              <div style={tx(32, 600)}>{s}</div>
            </At>
          );
        })}
        {/* 고정비 막대 */}
        <svg {...fullSvg}>
          <line x1={lx + 480} x2={lx + 480 + 250 * progress(frame, why2, 14)} y1={436} y2={436} stroke={color.lineStrong} strokeWidth={stroke.thin} />
          <rect x={lx + 510} y={436 - 108 * bar} width={52} height={108 * bar} fill={withAlpha(color.human, 0.25)} stroke={color.human} strokeWidth={stroke.thin} />
        </svg>
        <At x={lx + 580} y={372} p={progress(frame, why2 + 16, DUR.enter)} style={tx(30, 600, color.human)}>
          {T.fixed}
        </At>
        <Cond x={L.x} lines={T.condL} c={color.human} at={c4 + 4} />
      </div>

      {/* 오른쪽: 문제는 블록과 블록 사이 */}
      <div style={{ opacity: lerp(0.35, 1, rightOn) }}>
        <BlockRow x={R.x + 54} y={250} bw={140} bh={96} gap={60} p={progress(frame, 12, 30, ease.linear)} hotGaps={[0, 2]} hot={progress(frame, hotAt, 12)} ring={pulse(frame, hotAt, 40)} />
        <Cond x={R.x} lines={T.condR} c={color.agent} at={within("s2.5", 0.62)} />
      </div>

      {/* 늦게, 비싸게 */}
      <TrackRow
        x={96}
        y={LINE.y}
        h={LINE.h}
        pitch={LINE.pitch}
        cellW={LINE.cellW}
        px={32}
        cells={T.line.map((label, i) => ({ label, lit: i === 3 ? 1 : 0.7, c: i === 3 ? blend(color.inkSoft, color.problem, progress(frame, markAt, 12)) : color.inkSoft }))}
        p={progress(frame, c6, 26, ease.inOut)}
      />
      <svg {...fullSvg}>
        <Trace
          pts={[[96 + 3 * LINE.pitch + 186, LINE.y - 4], [96 + 3 * LINE.pitch + 186, LINE.y - 50], [96 + 186, LINE.y - 50], [96 + 186, LINE.y - 4]]}
          stroke={color.problem}
          width={stroke.bold}
          dash="12 9"
          arrow
          at={backAt}
          duration={34}
          easing={ease.inOut}
        />
      </svg>
      <At x={96 + 3 * LINE.pitch + cellRight - 56} y={LINE.y + 12} p={progress(frame, markAt, DUR.enter)}>
        <WarnIcon size={40} color={color.problem} />
      </At>
      <At x={960} y={LINE.y - 76} center p={progress(frame, backAt + 18, DUR.enter)}>
        <div style={{ ...tx(40, 800, color.problem), backgroundColor: color.bg, padding: "0 22px" }}>{T.late}</div>
      </At>
    </ShiftSheet>
  );
};

const cellRight = LINE.cellW;
