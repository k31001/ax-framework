import React from "react";
import { useCurrentFrame } from "remotion";
import { ease, lerp, progress } from "../../../video/anim";
import { color, fullSvg, stroke, withAlpha } from "../../../video/theme";
import { CodePanel, ShiftSheet } from "../../lib";
import { TraceGraph, nodeRect, place } from "./graph";
import type { GEdge, GNode, GraphView } from "./graph";
import { Box, Grid, T, useCues, vis } from "./kitC";

// S13 효과 ③ 버그 역추적: 실패 → 버그 → field(값 0) → 조항 → 쓰는 함수 셋 → 원인 함수 하나 → 같은 형태의 코드 한 곳 더.

const TX = {
  title: "효과 ③ 버그 역추적",
  bug: [
    "BUG-2317  버그   상태: 초안   triage-agent",
    "GC 구간에서 host P99.99 2.4 ms (예시)",
    "발견   emulation · VER-530 FAIL @ VER-640",
    "signature  prio_q / soft 큐 대기 급증",
    "           PRIOQ_CFG.HOST_BURST = 0",
  ],
  query: [
    "MATCH (b:Issue {key:'BUG-2317'})",
    "      -[:OBSERVED_AT]->(f:Field)",
    "MATCH (f)-[:IMPLEMENTS]->(c:Clause)",
    "MATCH (fn:Func)-[x:READS|WRITES]->(f)",
    "RETURN c.id, type(x) AS access, x.via,",
    "       fn.name, fn.owner",
  ],
  head: ["access", "via", "func", "owner", ""],
  rows: [
    ["WRITES", "accessor", "rcv::policy_init", "FW 복구", ""],
    ["WRITES", "reg", "gc::throttle_update", "FW GC", "←"],
    ["READS", "accessor", "rcv::stats_dump", "FW 복구", ""],
  ],
  code: ["bus.write(PRIOQ_CFG,", "          (backlog > kHigh) << 8);", "// GC_BOOST 를 켜면서 HOST_BURST 를 0 으로 덮음"],
  noteA: "host_cnt < 0 은 성립 안 함 · 조건을 못 만난 통과",
  noteB: "값의 범위 없음 · 계약의 빈칸",
  query3: [
    "MATCH (fn:Func)-[:WRITES {via:'reg'}]->",
    "      (f:Field)<-[:HAS_FIELD]-(r:Reg)",
    "WITH fn, r, count(f) AS fields",
    "     WHERE fields > 1",
    "RETURN fn.name, r.name, fields",
  ],
  rows3: [
    ["gc::throttle_update", "PRIOQ_CFG", "2"],
    ["nand::retry_cfg_apply", "RETRY_CFG", "3"],
  ],
  notYet: "아직 실패 안 함",
  fix: "MR !2334 · 계약에 범위 1~8 · FW는 접근 함수 사용 · 태그 추가",
} as const;

const VIEW: GraphView = { x: 800, y: 104, scale: 0.8 };
const LX = 96;
const LW = 688;
const TOP = 150;

const VIA_REG = "writes {via:'reg'}";
const EXTRA_NODES: GNode[] = [
  { id: "retry_apply", kind: "func", label: "nand::retry_cfg_apply", x: 1118, y: 290, w: 360, h: 46, px: 24, problem: true },
  { id: "retry_cfg", kind: "reg", label: "RETRY_CFG", x: 1118, y: 366, w: 220, h: 40, problem: true },
];
const EXTRA_EDGES: GEdge[] = [
  { id: "writes_gc", from: "throttle_update", to: "field", rel: VIA_REG, origin: "extract", pts: [[950, 600], [670, 600], [670, 398]], labelAt: [810, 600] },
  { id: "writes_retry", from: "retry_apply", to: "retry_cfg", rel: VIA_REG, origin: "extract", problem: true, pts: [[1118, 313], [1118, 346]], labelAt: [1118, 329] },
];

export const S13: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, within } = useCues();
  const t1 = cue("s13.1");
  const t2 = cue("s13.2");
  const t3 = cue("s13.3");
  const t4 = cue("s13.4");
  const t5 = cue("s13.5");
  const t6 = cue("s13.6");
  const t7 = cue("s13.7");

  const bugAt = within("s13.2", 0.38);
  const zeroAt = t3 + 22;
  const walk1 = within("s13.4", 0.12);
  const walk2 = within("s13.4", 0.5);
  const causeAt = t5 + 2;
  const codeAt = within("s13.5", 0.34);
  const coverAt = within("s13.5", 0.62);
  const noteA = within("s13.5", 0.86);
  const noteB = noteA + 16;
  const leftOut5 = t6 - 10;
  const foundAt = within("s13.6", 0.58);
  const ringGo = progress(frame, foundAt - 4, 26, ease.inOut);

  // 같은 형태를 찾는 고리: 원인 함수에서 새로 나온 한 쌍으로 옮겨 간다
  const src = nodeRect("throttle_update");
  const ringFrom = { x: src.x - 9, y: src.y - 9, w: src.w + 18, h: src.h + 18 };
  const ringTo = { x: 926, y: 255, w: 384, h: 143 };
  const ring = {
    x: lerp(ringFrom.x, ringTo.x, ringGo),
    y: lerp(ringFrom.y, ringTo.y, ringGo),
    w: lerp(ringFrom.w, ringTo.w, ringGo),
    h: lerp(ringFrom.h, ringTo.h, ringGo),
  };
  const [rx, ry] = place(VIEW, ring.x, ring.y);
  const ringOn = progress(frame, t6 + 4, 12);
  const s = VIEW.scale ?? 1;
  const [tagX, tagY] = place(VIEW, 952, 203);

  return (
    <ShiftSheet>
      <T x={LX} y={78} px={40} weight={800} at={t1 - 4}>{TX.title}</T>

      {/* ── 그래프 ── */}
      <TraceGraph
        {...VIEW}
        add={["observed"]}
        extraNodes={EXTRA_NODES}
        extraEdges={EXTRA_EDGES}
        appear={{ observed: t3 + 4, retry_apply: foundAt + 12, retry_cfg: foundAt + 18, writes_retry: foundAt + 24 }}
        dim={[{ at: t1 + 6, to: 0.36 }]}
        subText={frame >= zeroAt ? { field: "= 0" } : {}}
        hi={[
          { ids: ["fail"], color: color.problem, at: t2 + 2, out: t6 - 8, ring: true },
          { ids: ["BUG-2317"], color: color.problem, at: bugAt, out: t6 - 8, ring: true },
          { ids: ["observed"], at: t3 + 4, out: t6 - 8 },
          { ids: ["field"], color: color.problem, at: zeroAt - 6, ring: true },
          { ids: ["throttle_update"], color: color.problem, at: causeAt - 6, fill: true },
          { ids: ["writes_gc"], color: color.problem, at: causeAt - 6 },
          { ids: ["a_host_first"], at: noteA, out: t6 - 8, ring: true },
          { ids: ["order"], at: noteB, out: t6 - 8, ring: true },
          { ids: ["retry_apply", "retry_cfg", "writes_retry"], at: foundAt },
          { ids: ["retry_apply"], color: color.problem, at: t7, blink: true },
        ]}
        walks={[
          { at: walk1, steps: [["impl_field"]], color: color.problem, gap: 22, out: t6 - 8 },
          { at: walk2, steps: [{ edges: ["writes_policy", "writes_gc", "reads_stats"], reverse: true }], color: color.problem, gap: 26, out: causeAt + 4 },
        ]}
      />
      <svg {...fullSvg}>
        <rect x={rx} y={ry} width={ring.w * s} height={ring.h * s} fill={withAlpha(color.problem, 0.05 * ringGo)} stroke={color.problem} strokeWidth={stroke.trace} strokeDasharray="9 7" opacity={ringOn} />
      </svg>
      <T x={tagX} y={tagY} px={30} weight={800} c={color.problem} at={t7 + 2}>{TX.notYet}</T>

      {/* ── 왼쪽: 버그 카드 → 질의 → 결과와 원인 → 같은 형태 질의 ── */}
      <CodePanel
        x={LX}
        y={TOP}
        w={LW}
        title="JIRA · BUG-2317"
        owner="agent"
        px={26}
        at={t2 + 6}
        out={t4 - 8}
        lines={TX.bug.map((text, i) => (i === 4 ? { text, tone: "problem" as const, mark: t3, markTone: "problem" as const } : i === 0 ? { text, tone: "plain" as const } : { text, tone: i === 3 ? ("dim" as const) : ("plain" as const) }))}
      />
      <CodePanel
        x={LX}
        y={TOP}
        w={LW}
        title="back_trace.cypher"
        px={26}
        at={t4}
        out={t5 - 8}
        lines={[
          { text: TX.query[0], at: t4 + 6, mark: t4 + 8, unmark: walk1, markTone: "problem" },
          { text: TX.query[1], at: t4 + 9, mark: t4 + 8, unmark: walk1, markTone: "problem" },
          { text: TX.query[2], at: walk1 - 4, mark: walk1, unmark: walk2, markTone: "problem" },
          { text: TX.query[3], at: walk2 - 4, mark: walk2, unmark: within("s13.4", 0.9), markTone: "problem" },
          { text: TX.query[4], at: within("s13.4", 0.82), tone: "dim" },
          { text: TX.query[5], at: within("s13.4", 0.82) + 3, tone: "dim" },
        ]}
      />

      <Box x={LX} y={TOP} w={LW} h={208} at={t5 - 2} out={leftOut5} />
      <Grid
        x={LX + 16}
        y={TOP + 8}
        cols={[108, 140, 312, 92, 20]}
        rows={[TX.head, ...TX.rows]}
        rowH={48}
        px={26}
        code
        at={t5}
        out={leftOut5}
        rowAt={(r) => t5 + r * 4}
        marks={{ 2: { at: causeAt, c: color.problem } }}
      />
      <CodePanel
        x={LX}
        y={TOP + 224}
        w={LW}
        title="fw/gc/gc_throttle.cpp"
        px={26}
        at={codeAt - 6}
        out={leftOut5}
        lines={[
          { text: TX.code[0], at: codeAt },
          { text: TX.code[1], at: codeAt + 3 },
          { text: TX.code[2], at: coverAt, tone: "problem", mark: coverAt + 4, markTone: "problem" },
        ]}
      />
      <T x={LX} y={598} px={22} weight={700} c={color.agent} at={noteA} out={leftOut5} code>a_host_first</T>
      <T x={LX} y={628} px={30} weight={500} c={color.inkDim} at={noteA} out={leftOut5}>{TX.noteA}</T>
      <T x={LX} y={690} px={22} weight={700} c={color.human} at={noteB} out={leftOut5} code>HSI-RCV-010#order</T>
      <T x={LX} y={720} px={30} weight={500} c={color.inkDim} at={noteB} out={leftOut5}>{TX.noteB}</T>

      <CodePanel x={LX} y={TOP} w={LW} title="same_shape.cypher" px={26} at={t6} lines={TX.query3.map((text, i) => ({ text, at: t6 + 6 + i * 4, ...(i < 2 ? { mark: t6 + 14, markTone: "problem" as const } : {}) }))} />
      <Box x={LX} y={TOP + 291} w={LW} h={120} at={within("s13.6", 0.4)} c={frame >= foundAt ? color.problem : color.lineStrong} />
      <Grid
        x={LX + 24}
        y={TOP + 303}
        cols={[370, 200, 40]}
        rows={TX.rows3}
        rowH={48}
        px={26}
        code
        noHead
        at={within("s13.6", 0.4)}
        rowAt={(r) => (r === 0 ? within("s13.6", 0.4) + 4 : foundAt)}
        marks={{ 1: { at: foundAt + 2, c: color.problem } }}
      />
      <svg {...fullSvg}>
        <line x1={LX} x2={LX + 1728 * progress(frame, within("s13.7", 0.55) - 4, 20, ease.inOut)} y1={832} y2={832} stroke={color.line} strokeWidth={stroke.hair} />
      </svg>
      <T x={LX} y={846} px={22} weight={700} c={color.human} at={within("s13.7", 0.55)} code style={{ opacity: vis(frame, within("s13.7", 0.55)) }}>FIX</T>
      <T x={LX + 70} y={840} px={30} weight={600} at={within("s13.7", 0.55)}>{TX.fix}</T>
    </ShiftSheet>
  );
};
