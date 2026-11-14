import React from "react";
import { useCurrentFrame } from "remotion";
import { ease, lerp, progress } from "../../../video/anim";
import { AgentIcon } from "../../../video/components/Icons";
import { Trace } from "../../../video/components/Trace";
import { color, fullSvg, mono, stroke, withAlpha } from "../../../video/theme";
import { CodePanel, ShiftSheet } from "../../lib";
import { TraceGraph, place } from "./graph";
import type { GraphView } from "./graph";
import { Box, Grid, T, useCues, vis } from "./kitC";

// S14 효과 ④ 에이전트의 맥락: 지금(저장소 전체를 긁는다) 대 그래프(부분 그래프만 받는다) → MR 댓글 → 공개 근거.

const TX = {
  title: "효과 ④ 에이전트의 맥락",
  agent: "에이전트",
  now: "지금",
  graph: "그래프",
  grep: [
    "$ grep -rn HOST_BURST .",
    "fw/include/rcv_ctrl_hsi.hpp   (생성물)",
    "docs/api/rcv_ctrl.md          (문서)",
    "build/rcv_ctrl_regs.sv        (생성물)",
    "logs/emu_run_231.log          (로그)",
    "…  겹치고 섞인 결과 · 통째 쓰기는 안 나옴",
  ],
  tool: [
    "trace.subgraph(",
    "  seed='rcv_ctrl.PRIOQ_CFG.HOST_BURST', hops=2)",
    "→ 노드 14 · 엣지 19 · 파일 8 (예시)",
    "  각 노드: 종류 · 이름 · 경로 · 줄 범위",
    "  각 엣지: 종류 · method · commit",
  ],
  opened: "에이전트에게 연 것: 이름 붙은 질의 · 부분 그래프 · 제안. 그래프 쓰기 없음",
  mr: [
    "[에이전트 · req-agent · 영향 분석]  MR !2334",
    "변경      gc::throttle_update (fw/gc/)",
    "닿는 조항 HSI-RCV-010#order (HOST_BURST 쓰기)",
    "요구사항  REQ-207 (REQ-QOS-07 AC-1) · FEAT-338",
    "다시 볼 것 VER-541 · VER-542 · VER-543 → 선택 실행",
    "근거      graph@9f3c2e1 · 질의 impact_v1",
    "확인 못 한 것  제안 링크 2건은 제외함",
  ],
  evidence: "공개 근거 (2026-11 확인)",
  rows: [
    ["코드 그래프 + 에이전트", "연구 있음 · 뚜렷한 우위는 아님"],
    ["스펙 · RTL 그래프 → SVA", "연구 있음"],
    ["SoC 추적 그래프의 효과", "공개 수치 없음 → 직접 측정"],
  ],
} as const;

const AG = { x: 940, y: 250, s: 72 } as const;
const VIEW: GraphView = { x: 1262, y: 196, scale: 0.43 };
const REST: GraphView = { x: 1030, y: 222, scale: 0.18 };

const HOP0 = ["field"];
const HOP1 = ["order", "prio_q", "set_host_burst", "policy_init", "throttle_update", "stats_dump", "impl_field", "reads_prio_q", "gen_shb", "writes_policy", "writes_gc", "reads_stats"];
const HOP2 = ["ac1", "FEAT-338", "a_host_first", "a_gc_no_starve", "ratio_test", "derives", "trk_feat", "ver_host", "ver_gc", "ver_test", "impl_prio_q"];
const SUB = [...HOP0, ...HOP1, ...HOP2];

// 저장소의 파일 격자
const COLS = 22;
const ROWS = 9;
const CELL = { x: 96, y: 214, w: 24, h: 16, dx: 30, dy: 26 } as const;
const HITS = Array.from({ length: 16 }, (_, k) => ({ c: (k * 7 + 3) % COLS, r: (k * 5 + 2) % ROWS }));

export const S14: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, within, end } = useCues();
  const t1 = cue("s14.1");
  const t2 = cue("s14.2");
  const t3 = cue("s14.3");
  const t4 = cue("s14.4");
  const t5 = cue("s14.5");

  const leftOut = t4 - 10;
  const leftV = vis(frame, t2 - 4, leftOut);
  const seedAt = t3 + 6;
  const hopAt = within("s14.3", 0.3);
  const takeAt = within("s14.3", 0.62);
  const take = progress(frame, takeAt, 26, ease.inOut);
  const rightDim = 1 - 0.5 * progress(frame, t4 - 6, 16, ease.inOut);
  const graphOut = t5 - 10;
  const graphV = vis(frame, t3 - 6, graphOut);
  const hitAt = (k: number): number => t2 + 6 + Math.round(((end("s14.2") - t2 - 12) * k) / HITS.length);
  const field = place(VIEW, 586, 370);

  const moving: GraphView = { x: lerp(VIEW.x, REST.x, take), y: lerp(VIEW.y, REST.y, take), scale: lerp(VIEW.scale ?? 1, REST.scale ?? 1, take) };
  const mrAt = [t4 + 6, within("s14.4", 0.16), within("s14.4", 0.3), within("s14.4", 0.52), within("s14.4", 0.72), within("s14.4", 0.86), within("s14.4", 0.94)];
  const rowAt = [t5 + 6, t5 + 14, within("s14.5", 0.34)];
  const measureAt = within("s14.5", 0.6);

  return (
    <ShiftSheet>
      <T x={96} y={78} px={40} weight={800} at={t1 - 4}>{TX.title}</T>

      {/* ── 에이전트 ── */}
      <T x={AG.x + AG.s / 2} y={204} px={30} weight={700} c={color.agent} align="center" at={within("s14.1", 0.4)}>{TX.agent}</T>
      <div style={{ position: "absolute", left: AG.x, top: AG.y, opacity: vis(frame, within("s14.1", 0.4)) }}>
        <AgentIcon size={AG.s} color={color.agent} />
      </div>
      <div style={{ position: "absolute", left: AG.x - 20, top: AG.y + AG.s + 8, width: AG.s + 40, textAlign: "center", ...mono(22, 700), color: color.agent, opacity: vis(frame, within("s14.1", 0.4) + 4) }}>AGENT</div>

      {/* ── 지금: 저장소 전체를 긁는다 ── */}
      {leftV > 0 ? (
        <div style={{ opacity: leftV }}>
          <T x={96} y={150} px={34} weight={800} c={color.inkSoft} at={t2 - 4}>{TX.now}</T>
          <svg {...fullSvg}>
            {Array.from({ length: COLS * ROWS }, (_, i) => {
              const c = i % COLS;
              const r = Math.floor(i / COLS);
              const k = HITS.findIndex((h) => h.c === c && h.r === r);
              const on = k < 0 ? 0 : progress(frame, hitAt(k) + 6, 8);
              return (
                <rect
                  key={i}
                  x={CELL.x + c * CELL.dx}
                  y={CELL.y + r * CELL.dy}
                  width={CELL.w}
                  height={CELL.h}
                  fill={on > 0 ? withAlpha(color.agent, 0.45 * on) : withAlpha(color.inkDim, 0.1)}
                  stroke={on > 0 ? color.agent : color.line}
                  strokeWidth={1.5}
                  opacity={progress(frame, t2 - 4 + (c + r) * 0.6, 10)}
                />
              );
            })}
            {HITS.map((h, k) => {
              const p = progress(frame, hitAt(k), 10, ease.out);
              const fade = 1 - 0.6 * progress(frame, hitAt(k) + 14, 16, ease.inOut);
              const tx = CELL.x + h.c * CELL.dx + CELL.w / 2;
              const ty = CELL.y + h.r * CELL.dy + CELL.h / 2;
              return p <= 0 ? null : <line key={k} x1={AG.x - 6} y1={AG.y + AG.s / 2} x2={lerp(AG.x - 6, tx, p)} y2={lerp(AG.y + AG.s / 2, ty, p)} stroke={color.agent} strokeWidth={stroke.hair} opacity={fade} />;
            })}
            <line x1={120} x2={120 + 600 * progress(frame, within("s14.2", 0.84) + 8, 16)} y1={793} y2={793} stroke={color.problem} strokeWidth={stroke.thin} strokeDasharray="7 6" />
          </svg>
          <CodePanel
            x={96}
            y={500}
            w={664}
            title="terminal"
            px={26}
            at={t2 + 2}
            lines={TX.grep.map((text, i) =>
              i === 0
                ? { text, at: t2 + 8 }
                : i === 5
                  ? { text, at: within("s14.2", 0.84), tone: "problem" as const }
                  : { text, at: within("s14.2", 0.22 + i * 0.13), tone: "dim" as const },
            )}
          />
        </div>
      ) : null}

      {/* ── 그래프: 출발점에서 두 걸음 안의 부분 그래프만 ── */}
      <div style={{ opacity: rightDim }}>
        <T x={1262} y={150} px={34} weight={800} c={color.agent} at={t3 - 4} out={graphOut}>{TX.graph}</T>
        {graphV > 0 ? (
          <>
            <TraceGraph
              {...VIEW}
              opacity={graphV}
              nodeLabels={false}
              edgeLabels={false}
              subs={false}
              dim={[{ at: t3 + 2, to: 0.3 }]}
              hi={[
                { ids: HOP0, at: seedAt + 12, ring: true, fill: true },
                { ids: HOP1, at: hopAt },
                { ids: HOP2, at: hopAt + 12 },
              ]}
            />
            <svg {...fullSvg} opacity={graphV * (1 - 0.8 * take)}>
              <Trace pts={[[AG.x + AG.s + 6, AG.y + AG.s / 2], [1216, AG.y + AG.s / 2], [1216, field[1]], [field[0] - 4, field[1]]]} stroke={color.agent} width={stroke.bold} arrow at={seedAt} duration={20} />
            </svg>
          </>
        ) : null}
        {/* 떼어져 에이전트에게 오는 덩어리 */}
        {frame >= takeAt && frame < graphOut + 10 ? (
          <TraceGraph {...moving} show={SUB} bands={false} nodeLabels={false} edgeLabels={false} subs={false} opacity={vis(frame, takeAt, graphOut, 8)} />
        ) : null}

        <CodePanel
          x={1024}
          y={556}
          w={800}
          title="MCP · trace.subgraph"
          owner="agent"
          px={26}
          at={t3}
          lines={[
            { text: TX.tool[0], at: t3 + 6 },
            { text: TX.tool[1], at: t3 + 9, mark: seedAt + 10, unmark: takeAt, markTone: "agent" },
            { text: TX.tool[2], at: takeAt, tone: "agent", mark: takeAt + 4, markTone: "agent" },
            { text: TX.tool[3], at: takeAt + 8, tone: "dim" },
            { text: TX.tool[4], at: takeAt + 12, tone: "dim" },
          ]}
        />
        <T x={1024} y={846} px={28} weight={500} c={color.inkDim} at={within("s14.3", 0.9)}>{TX.opened}</T>
      </div>

      {/* ── MR 댓글 ── */}
      <svg {...fullSvg}>
        <Trace pts={[[AG.x - 4, AG.y + AG.s / 2], [906, AG.y + AG.s / 2]]} stroke={color.agent} width={stroke.bold} arrow at={t4} />
      </svg>
      <CodePanel
        x={96}
        y={230}
        w={804}
        title="MR !2334 · review"
        owner="agent"
        px={26}
        at={t4 - 2}
        lines={TX.mr.map((text, i) => ({
          text,
          at: mrAt[i],
          tone: i === 0 ? ("agent" as const) : i === 6 ? ("dim" as const) : ("plain" as const),
          ...(i === 3 ? { mark: mrAt[3] + 4, markTone: "human" as const } : {}),
        }))}
      />

      {/* ── 공개 근거 ── */}
      <Box x={1040} y={150} w={784} h={256} c={color.ink} at={t5} />
      <T x={1064} y={166} px={30} weight={700} at={t5 + 2}>{TX.evidence}</T>
      <svg {...fullSvg}>
        <line x1={1040} x2={1040 + 784 * progress(frame, t5 + 4, 20, ease.inOut)} y1={220} y2={220} stroke={color.line} strokeWidth={stroke.hair} />
      </svg>
      <Grid
        x={1064}
        y={230}
        cols={[346, 390]}
        rows={TX.rows.map(([a, b], i) => [
          { text: a, weight: 600, c: i === 2 && frame >= measureAt ? color.ink : color.inkSoft },
          { text: b, weight: i === 2 ? 700 : 500, c: i === 2 ? color.human : color.inkSoft },
        ])}
        rowH={56}
        px={28}
        noHead
        at={t5}
        rowAt={(r) => rowAt[r]}
        marks={{ 2: { at: measureAt, c: color.human } }}
      />
    </ShiftSheet>
  );
};
