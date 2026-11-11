import React from "react";
import { useCurrentFrame } from "remotion";
import { ease, enter, enterExit, lerp, progress, pulse } from "../../../video/anim";
import { AgentIcon, HumanIcon } from "../../../video/components/Icons";
import { Trace } from "../../../video/components/Trace";
import { color, fullSvg, mono, sans, size, stroke, withAlpha } from "../../../video/theme";
import { ShiftSheet, useScene } from "../../lib";
import { CodeRow, HEAD, Pane, Stamp, Steps, Tag, mix, paneH, rowH, split } from "./kit";

// s5 예제 ②: 증거 묶음과 반려. 이 편의 중심 장면.
//   s5.1  청록 창 evidence/VER-REC-012/summary.yaml 의 줄이 위에서부터 켜진다
//   s5.2  regression · coverage 가 밝아지고 agent: "검증 완료"
//   s5.3  사람의 시선이 위 줄을 건너뛰어 mutation 줄에 멈춘다
//   s5.4  점 120개: 검출 109, 미검출 11 → 동등 4 / 공백 7
//   s5.5  붉은 점 하나 → M-031 창과 PUSH/POP 파형
//   s5.6  test · assertion 없음 → 붉은 도장 '#1 반려'
//   s5.7  assertion 추가 → 점이 청록으로 → '#2 승인'

const PX = 26;
const LH = rowH(PX);
const SUM = { x: 96, y: 150, w: 900 };
const SUM_H = paneH(9, PX);
const rowY = (i: number): number => SUM.y + HEAD + 20 + i * LH + LH / 2;

const SUMMARY = [
  "task: VER-REC-012  rtl: 3f9c2e1  tb: a71b04d   # 예시",
  "regression: 1840 run / fail 0",
  "coverage:   code 98.6%  functional 96.2%",
  "formal:     proven 14 / cex 0 / inconclusive 1",
  "mutation:   주입 120 / 검출 109 / 미검출 11",
  "            동등 4 (formal로 확인) / 공백 7",
  "changed:    tb/ sva/ 만 변경. 금지 경로 0건",
  "questions:  1건 (큐가 찬 상태의 abort 처리)",
];
const MUTATION_AFTER = "mutation:   미검출 4 (전건 동등)";
const AGENT_KEY = "agent:      ";
const AGENT_SAYS = '"검증 완료"';
const AGENT_NOTE = "   # 판정 근거 아님";

// 점 격자
const COLS = 15;
const N = 120;
const PITCH = 38;
const GRID = { x: 1060, y: 172 };
const MISSED = [7, 19, 26, 38, 44, 52, 63, 71, 85, 97, 112];
const EQUIV = [19, 52, 85, 97];
const OPENED = 112; // M-031
const dotAt = (i: number) => ({ x: GRID.x + (i % COLS) * PITCH + PITCH / 2, y: GRID.y + Math.floor(i / COLS) * PITCH + PITCH / 2 });
const LEGEND = [
  { text: "검출 109", c: color.agent },
  { text: "동등 4", c: color.inkDim },
  { text: "공백 7", c: color.problem },
];

const MUT = { x: 1000, y: 548, w: 824 };
const MUT_ROWS = [
  "- if (push_i)           wr_ptr_q <= wr_ptr_q + 1;",
  "+ if (push_i && !pop_i) wr_ptr_q <= wr_ptr_q + 1;",
  "→ push와 pop이 같은 cycle이면 완료 1건 유실",
];
const SVA = [
  "// 완료 개수 보존: 넣은 수 = 꺼낸 수 + 큐에 남은 수",
  "a_done_conserve: assert property (",
  "  @(posedge clk) disable iff (!rst_n)",
  "  push_cnt == pop_cnt + q_level);",
];
const REASON = "완료 개수를 보존하는 checker 없음";

// PUSH / POP 파형. 5번째 cycle 에 둘이 겹친다.
const WAVE = { x: 1096, y: 800, cyc: 48, n: 8, h: 30, gap: 50 };
const PUSH = [0, 1, 0, 0, 1, 0, 0, 0];
const POP = [0, 0, 0, 1, 1, 0, 0, 0];
const wavePath = (bits: number[], y: number): string => {
  let d = "";
  bits.forEach((b, i) => {
    const x = WAVE.x + i * WAVE.cyc;
    const yy = b ? y : y + WAVE.h;
    d += i === 0 ? `M ${x} ${yy}` : ` L ${x} ${yy}`;
    d += ` L ${x + WAVE.cyc} ${yy}`;
  });
  return d;
};

export const S5: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, end } = useScene();
  const c1 = cue("s5.1");
  const c2 = cue("s5.2");
  const c3 = cue("s5.3");
  const c4 = cue("s5.4");
  const c5 = cue("s5.5");
  const c6 = cue("s5.6");
  const c7 = cue("s5.7");
  const e1 = end("s5.1");
  const e2 = end("s5.2");
  const e3 = end("s5.3");
  const e4 = end("s5.4");
  const e5 = end("s5.5");
  const e6 = end("s5.6");
  const e7 = end("s5.7");

  const declare = split(c2, e2, 5, 9); // "에이전트는 완료를 선언합니다"
  const gazeEnd = split(c3, e3, 3, 5);
  const gaze = progress(frame, c3 + 4, gazeEnd - c3 - 4, ease.inOut);
  const sink = progress(frame, c3, 16, ease.inOut);
  const colored = progress(frame, c4 + 20, 12, ease.out);
  const sorted = progress(frame, split(c4, e4, 2, 5), 14, ease.inOut);
  const overlap = split(c5, e5, 2, 5);
  const reject = split(c6, e6, 1, 2);
  const rejected = progress(frame, reject, 10, ease.out);
  const fixedAt = split(c7, e7, 1, 3);
  const fixed = progress(frame, fixedAt, 14, ease.inOut);
  const approve = split(c7, e7, 2, 3);
  const approved = progress(frame, approve, 12, ease.out);
  const flash = rejected * (1 - progress(frame, reject + 10, 30, ease.inOut));

  const sumBorder = mix(approved, mix(rejected, withAlpha(color.agent, 0.55), color.problem), withAlpha(color.agent, 0.55));

  return (
    <ShiftSheet>
      <Steps activeAt={[{ index: 1, at: 0 }, { index: 2, at: c3 }]} />
      <Tag text="출처: tool 출력" c={color.agent} x={SUM.x} y={90} at={c1 + 8} />

      {/* ── 증거 묶음 요약 ─────────────────────────────────────────── */}
      <Pane x={SUM.x} y={SUM.y} w={SUM.w} h={SUM_H} title="evidence/VER-REC-012/summary.yaml" edge={color.agent} border={sumBorder} at={c1}>
        {flash > 0 ? <div style={{ position: "absolute", inset: 0, backgroundColor: withAlpha(color.problem, 0.22 * flash) }} /> : null}
        {SUMMARY.map((l, i) => {
          const [code, note] = l.split("#");
          const isMut = i === 4 || i === 5;
          const good = i === 1 ? progress(frame, c2, 10) : i === 2 ? progress(frame, split(c2, e2, 2, 9), 10) : 0;
          const goodOff = 1 - progress(frame, c3 - 6, 10);
          const base = isMut ? color.ink : mix(sink, color.ink, color.inkDim);
          const swap = i === 4 ? progress(frame, split(c7, e7, 1, 2), 10, ease.inOut) : 0;
          return (
            <CodeRow
              key={i}
              i={i}
              px={PX}
              c={good * goodOff > 0 ? mix(good * goodOff, base, color.agent) : base}
              o={progress(frame, split(c1 + 10, e1, i, 8), 10) * (i === 5 ? 1 - fixed : 1)}
              mark={i === 1 || i === 2 ? good * goodOff : i === 4 ? progress(frame, gazeEnd, 10) : 0}
              markColor={isMut ? color.human : color.agent}
            >
              {swap > 0.5 ? MUTATION_AFTER : code}
              {note !== undefined ? <span style={{ color: color.inkDim }}>{`#${note}`}</span> : null}
            </CodeRow>
          );
        })}
        <CodeRow i={8} px={PX} c={mix(sink, color.ink, color.inkDim)} o={progress(frame, declare, 10)} mark={progress(frame, declare, 10) * (1 - sink)} strike={rejected} strikeColor={color.problem}>
          {AGENT_KEY}
          <span style={{ color: mix(sink, color.agent, color.inkDim), fontWeight: 700 }}>{AGENT_SAYS}</span>
          <span style={{ color: color.inkDim, opacity: sink }}>{AGENT_NOTE}</span>
        </CodeRow>
        {/* 사람의 시선 */}
        {frame >= c3 ? (
          <div style={{ position: "absolute", left: 6, right: 4, top: HEAD + 20 + lerp(0, 4, gaze) * LH, height: LH, border: `${stroke.trace}px solid ${color.human}`, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 8, opacity: progress(frame, c3, 8) }}>
            <HumanIcon size={28} color={color.human} />
          </div>
        ) : null}
      </Pane>

      {/* 밤사이 에이전트가 올린다 */}
      <div style={{ position: "absolute", left: 1350, top: 296, display: "flex", alignItems: "center", gap: 20, ...enterExit(frame, c1, c3 + 6) }}>
        <AgentIcon size={128} color={color.agent} />
        <div style={{ ...mono(size.label, 700), color: color.agent }}>AGENT</div>
      </div>
      <Tag text={AGENT_SAYS} c={color.agent} x={1350} y={216} at={declare} out={c3 + 6} px={size.body} fill />

      {/* ── 점 120개 ───────────────────────────────────────────────── */}
      <svg {...fullSvg}>
        <Trace pts={[[SUM.x + SUM.w, rowY(4)], [GRID.x - 8, rowY(4)]]} stroke={color.human} at={c4} />
        {Array.from({ length: N }, (_, i) => {
          const p = progress(frame, c4 + 4 + i * 0.12, 8, ease.out);
          if (p <= 0) return null;
          const { x, y } = dotAt(i);
          const missed = MISSED.includes(i);
          const equiv = EQUIV.includes(i);
          const gap = missed && !equiv;
          let fill = mix(colored, color.lineStrong, missed ? color.problem : color.agent);
          if (equiv) fill = mix(sorted, fill, color.inkDim);
          if (gap) fill = mix(fixed, fill, color.agent);
          const r = 11 + (gap ? 3 * sorted * (1 - fixed) : 0);
          const ring = gap ? sorted * (1 - fixed) : 0;
          return (
            <g key={i} opacity={p * (missed ? 1 : 1 - 0.45 * sorted)}>
              <circle cx={x} cy={y} r={r} fill={fill} />
              {ring > 0 ? <circle cx={x} cy={y} r={r + 5} fill="none" stroke={color.problem} strokeWidth={stroke.hair} opacity={ring * (i === OPENED && frame >= c5 ? 1 : 0.5)} /> : null}
              {gap && fixed > 0 && fixed < 1 ? <circle cx={x} cy={y} r={r + 5 + 12 * fixed} fill="none" stroke={color.agent} strokeWidth={stroke.thin} opacity={1 - fixed} /> : null}
            </g>
          );
        })}
        {/* 붉은 점 하나를 연다 */}
        <Trace pts={[[dotAt(OPENED).x, dotAt(OPENED).y + 20], [dotAt(OPENED).x, MUT.y]]} stroke={frame >= c7 ? color.agent : color.problem} width={stroke.bold} at={c5} />
        {/* 반려: 에이전트에게 되돌아간다 */}
        <Trace pts={[[912, 708], [912, 752]]} stroke={color.problem} width={stroke.bold} dash="8 6" arrow at={reject + 16} />
        <Trace pts={[[1330, 360], [SUM.x + SUM.w + 6, 360]]} stroke={color.agent} width={stroke.bold} arrow at={c1 + 6} duration={22} opacity={1 - progress(frame, c3 + 6, 10)} />
        <Trace pts={[[954, 792], [MUT.x - 2, 792]]} stroke={color.agent} width={stroke.bold} arrow at={c7} duration={10} />
      </svg>
      {LEGEND.map((l, i) => {
        const at = i === 0 ? c4 + 20 : split(c4, e4, 2, 5) + (i - 1) * 6;
        return (
          <div key={i} style={{ position: "absolute", left: 1652, top: GRID.y + 12 + i * 56, display: "flex", alignItems: "center", gap: 12, ...enter(frame, at) }}>
            <div style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: l.c }} />
            <div style={{ ...sans(size.small, 700), color: l.c, whiteSpace: "nowrap", opacity: i === 2 ? 1 - 0.6 * fixed : 1, textDecoration: i === 2 && fixed > 0.5 ? "line-through" : "none" }}>{l.text}</div>
          </div>
        );
      })}

      {/* ── M-031 ─────────────────────────────────────────────────── */}
      <Pane x={MUT.x} y={MUT.y} w={MUT.w} h={paneH(4, PX)} title="M-031 · rec_done_q.sv:88" edge={color.problem} border={color.problem} at={c5 + 8} out={c7 - 6}>
        <CodeRow i={0} px={PX} c={color.inkSoft} o={progress(frame, c5 + 14, 10)}>
          <span style={{ color: color.problem, fontWeight: 700 }}>미검출</span>
          {"  출처: 과거 bug 유형"}
        </CodeRow>
        <CodeRow i={1} px={PX} c={color.inkDim} o={progress(frame, c5 + 20, 10)}>
          {MUT_ROWS[0]}
        </CodeRow>
        <CodeRow i={2} px={PX} c={color.problem} o={progress(frame, c5 + 26, 10)} mark={progress(frame, c5 + 30, 10)} markColor={color.problem}>
          {MUT_ROWS[1]}
        </CodeRow>
        <CodeRow i={3} px={PX} o={progress(frame, overlap, 10)}>
          {MUT_ROWS[2]}
        </CodeRow>
      </Pane>
      {frame >= overlap && frame < c7 + 4 ? (
        <div style={{ ...enterExit(frame, overlap + 6, c7 - 6) }}>
          <svg {...fullSvg}>
            <rect x={WAVE.x + 4 * WAVE.cyc} y={WAVE.y - 6} width={WAVE.cyc} height={WAVE.h * 2 + WAVE.gap - WAVE.h + 12} fill={withAlpha(color.problem, 0.22)} stroke={color.problem} strokeWidth={stroke.thin} />
            <path d={wavePath(PUSH, WAVE.y)} fill="none" stroke={color.inkSoft} strokeWidth={stroke.thin} />
            <path d={wavePath(POP, WAVE.y + WAVE.gap)} fill="none" stroke={color.inkSoft} strokeWidth={stroke.thin} />
          </svg>
          <div style={{ position: "absolute", left: MUT.x, top: WAVE.y + 2, ...mono(size.label, 700), color: color.inkDim }}>PUSH</div>
          <div style={{ position: "absolute", left: MUT.x, top: WAVE.y + WAVE.gap + 2, ...mono(size.label, 700), color: color.inkDim }}>POP</div>
        </div>
      ) : null}
      <Tag text="test · assertion 없음" c={color.problem} x={1824} right y={818} at={c6} out={c7 - 6} fill />

      {/* ── 재제출: assertion ─────────────────────────────────────── */}
      <Pane x={MUT.x} y={MUT.y} w={MUT.w} h={paneH(4, PX)} title="sva/rec_done_q_sva.sv" edge={color.agent} border={withAlpha(color.agent, 0.6)} at={c7 + 2}>
        {SVA.map((l, i) => (
          <CodeRow key={i} i={i} px={PX} c={i === 0 ? color.inkDim : i === 3 ? color.agent : color.ink} o={progress(frame, c7 + 8 + i * 5, 10)}>
            {l}
          </CodeRow>
        ))}
      </Pane>

      {/* ── 승인 기록 ─────────────────────────────────────────────── */}
      <Stamp text="#1 반려" c={color.problem} x={102} y={622} at={reject} px={72} faded={progress(frame, c7, 14)} />
      <div style={{ position: "absolute", left: 470, top: 652, ...sans(size.body, 700), color: color.problem, whiteSpace: "nowrap", ...enter(frame, reject + 8, { from: "left" }), opacity: progress(frame, reject + 8) * (1 - 0.6 * progress(frame, c7, 14)) }}>{REASON}</div>
      <div style={{ position: "absolute", left: 876, top: 756, ...enter(frame, reject + 12) }}>
        <AgentIcon size={72} color={color.agent} />
      </div>
      <Stamp text="#2 승인 · 검증 담당 서명" c={color.human} x={102} y={782} at={approve} px={size.sub} rotate={-2} />
      {frame >= reject && frame < reject + 40 ? (
        <svg {...fullSvg}>
          <rect x={SUM.x - 6} y={SUM.y - 6} width={SUM.w + 12} height={SUM_H + 12} fill="none" stroke={color.problem} strokeWidth={4} opacity={1 - pulse(frame, reject, 40)} />
        </svg>
      ) : null}
    </ShiftSheet>
  );
};
