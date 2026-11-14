import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, ease, lerp, progress } from "../../../video/anim";
import { color, mono, sans, stroke, withAlpha } from "../../../video/theme";
import { CodePanel, ShiftSheet } from "../../lib";
import { TAG_EDGES, TraceGraph, place } from "./graph";
import type { LookRule, Walk } from "./graph";
import { Box, Note, StepStrip, Table, useCues } from "./kitB";

// s7 채우는 방법 ② 추적 태그와 CI.
// 오른쪽: 청록 엣지만 있는 그래프. 태그 엣지의 자리는 빈 점선 자국이고, 태그가 적힐 때마다 호박색으로 채워진다.
// 왼쪽: 태그 문법 → assertion 의 태그 → SystemRDL · FW 의 태그 → 태그를 다는 경계(파일 트리) → trace-lint.

const BIG = { x: 375, y: 150, scale: 0.9 } as const;
const SIDE = { x: 940, y: 170, scale: 0.68 } as const;
const L = { x: 96, w: 814 } as const;
const TOP = 310;

type TreeRow = { text?: string; bars?: number[]; tone: "dir" | "edge" | "dark"; id?: string };
const TREE: TreeRow[] = [
  { text: "hsi/", tone: "edge" },
  { text: "  contracts/HSI-RCV-010.yaml", tone: "edge" },
  { text: "  rdl/rcv_ctrl.rdl", tone: "edge" },
  { text: "rtl/rcv/", tone: "dir" },
  { text: "  prio_q.sv", tone: "edge" },
  { text: "  prio_q_sva.sv", tone: "edge" },
  { bars: [150, 210], tone: "dark" },
  { text: "fw/rcv/", tone: "dir" },
  { text: "  rcv_policy.cpp", tone: "edge" },
  { text: "  rcv_stats.cpp", tone: "dark" },
  { bars: [190], tone: "dark" },
  { text: "fw/gc/", tone: "dir" },
  { text: "  gc_throttle.cpp", tone: "dark" },
];
const TREE_H = 38;
// 호박색 테두리로 묶는 줄 범위
const EDGE_GROUPS: [number, number][] = [
  [0, 2],
  [4, 5],
  [8, 8],
];

export const S7: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, within } = useCues();
  const t2 = cue("s7.2");
  const t3 = cue("s7.3");
  const t4 = cue("s7.4");
  const t5 = cue("s7.5");
  const t6 = cue("s7.6");

  // 그래프: 가운데 크게 → 오른쪽으로
  const m = progress(frame, t2 - 10, DUR.move, ease.inOut);
  const view = { x: lerp(BIG.x, SIDE.x, m), y: lerp(BIG.y, SIDE.y, m), scale: lerp(BIG.scale, SIDE.scale, m) };

  // 태그가 적히는 때 = 엣지가 채워지는 때
  const fill: Record<string, number> = {
    ver_host: within("s7.3", 0.3),
    ver_gc: within("s7.3", 0.62),
    impl_field: within("s7.4", 0.22),
    impl_policy: within("s7.4", 0.62),
    impl_prio_q: within("s7.5", 0.6),
    ver_test: within("s7.5", 0.6) + 5,
    derives: within("s7.5", 0.6) + 10,
  };
  const looks: LookRule[] = TAG_EDGES.map((id) => ({ ids: [id], look: "ghost" as const, until: fill[id] }));
  const walks: Walk[] = Object.entries(fill).map(([id, at]) => ({ at, steps: [[id]], gap: 20, color: color.human, out: at + 34 }));

  const whyAt = within("s7.1", 0.5);
  const why = progress(frame, whyAt, DUR.enter) * (1 - progress(frame, t2 - 14, DUR.exit, ease.in));
  const [qx, qy] = place(view, 566, 336);

  const svaOut = t4 - 8;
  const tagsOut = t5 - 8;
  const treeOut = t6 - 8;
  const tree = progress(frame, t5, DUR.enter) * (1 - progress(frame, treeOut, DUR.exit, ease.in));
  const edgeAt = within("s7.5", 0.5);
  const edge = progress(frame, edgeAt, 14);
  const missAt = within("s7.6", 0.42);
  const blockAt = within("s7.6", 0.72);

  const grammar = progress(frame, t2 + 4, DUR.enter);

  return (
    <ShiftSheet>
      <StepStrip active={1} c={color.human} />

      {/* ── 그래프 ── */}
      <TraceGraph
        {...view}
        add={["fw_role", "impl_policy"]}
        appear={{ fw_role: fill.impl_policy - 10, impl_policy: fill.impl_policy }}
        looks={looks}
        walks={walks}
        dim={[{ ids: ["REQ-207", "FEAT-338", "VER-541", "VER-542", "VER-543", "pass"], to: 0.6 }]}
        hi={[
          { ids: ["a_host_first", "order"], at: whyAt, out: t2 - 10, ring: true },
          { ids: ["a_host_first"], color: color.human, at: fill.ver_host, out: fill.ver_host + 34 },
          { ids: ["a_gc_no_starve"], color: color.human, at: fill.ver_gc, out: fill.ver_gc + 34 },
          { ids: ["field"], color: color.human, at: fill.impl_field, out: fill.impl_field + 34 },
          { ids: ["policy_init"], color: color.human, at: fill.impl_policy, out: fill.impl_policy + 34 },
          { ids: ["throttle_update"], color: color.problem, at: missAt, ring: true, fill: true },
        ]}
      />
      <div style={{ position: "absolute", right: 1920 - qx + 14, top: qy - 32, display: "flex", flexDirection: "row-reverse", alignItems: "center", gap: 16, opacity: why, translate: `0px ${(1 - why) * 8}px` }}>
        <div style={{ width: 64, height: 64, boxSizing: "border-box", border: `${stroke.bold}px solid ${color.human}`, backgroundColor: color.bg, display: "flex", alignItems: "center", justifyContent: "center", ...sans(48, 800), color: color.human }}>?</div>
        <div style={{ ...sans(44, 700), color: color.human, whiteSpace: "nowrap", backgroundColor: withAlpha(color.bg, 0.9), padding: "0 10px" }}>왜 있는가?</div>
      </div>

      {/* ── 태그 문법 ── */}
      <Box x={L.x} y={150} w={L.w} h={132} c={color.human} fill={withAlpha(color.human, 0.06)} p={grammar} center={false} style={{ flexDirection: "column", alignItems: "flex-start", justifyContent: "center", gap: 8, paddingLeft: 28 }}>
        <div style={{ ...mono(34, 700), letterSpacing: "0", color: color.human }}>{"@trace <관계> <ID>#<조항>"}</div>
        <div style={{ ...mono(30, 500), letterSpacing: "0", color: color.inkSoft, opacity: progress(frame, within("s7.2", 0.55), DUR.enter) }}>관계: implements | verifies</div>
      </Box>

      {/* ── assertion 위의 태그 ── */}
      <CodePanel
        x={L.x}
        y={TOP}
        w={L.w}
        title="rtl/rcv/prio_q_sva.sv (예시)"
        px={26}
        at={t3}
        out={svaOut}
        owner="human"
        step={2}
        lines={[
          { text: "// @trace verifies HSI-RCV-010#order", tone: "human", mark: fill.ver_host - 6, markTone: "human" },
          "a_host_first: assert property (@(posedge clk)",
          "  host_req && gc_req && host_cnt < cfg_host_burst",
          "  |-> !gc_gnt);",
          { text: "// @trace verifies HSI-RCV-010#order", tone: "human", mark: fill.ver_gc - 6, markTone: "human" },
          "a_gc_no_starve: assert property (@(posedge clk)",
          "  gc_req |-> s_eventually gc_gnt);",
        ]}
      />

      {/* ── SystemRDL 의 property, FW 의 주석 ── */}
      <CodePanel
        x={L.x}
        y={TOP}
        w={L.w}
        title="hsi/rdl/rcv_ctrl.rdl"
        px={26}
        at={t4}
        out={tagsOut}
        owner="human"
        lines={["field { sw = rw; hw = r;", { text: '  trace = "implements HSI-RCV-010#order";', tone: "human", mark: fill.impl_field - 6, markTone: "human" }, "} HOST_BURST[3:0] = 4;"]}
      />
      <CodePanel
        x={L.x}
        y={TOP + 214}
        w={L.w}
        title="fw/rcv/rcv_policy.cpp"
        px={26}
        at={within("s7.4", 0.5)}
        out={tagsOut}
        owner="human"
        lines={[
          { text: "// @trace implements HSI-RCV-010#fw_role", tone: "human", mark: fill.impl_policy - 6, markTone: "human" },
          "void rcv::policy_init(Bus& bus) {",
          "  rcv_ctrl::set_host_burst(bus, kHostBurst);  // 4",
          "}",
        ]}
      />

      {/* ── 태그를 다는 곳: 계약이 걸린 경계 ── */}
      <div style={{ position: "absolute", left: L.x, top: TOP + 4, width: L.w, opacity: tree }}>
        {TREE.map((row, i) => {
          const lit = row.tone === "edge" ? edge : 0;
          const dark = row.tone === "dark" ? edge : 0;
          return (
            <div key={i} style={{ height: TREE_H, display: "flex", alignItems: "center", paddingLeft: 20, opacity: progress(frame, t5 + i * 2, 10) * (1 - 0.6 * dark) }}>
              {row.text ? (
                <div style={{ ...mono(26, row.tone === "edge" ? 600 : 500), letterSpacing: "0", whiteSpace: "pre", color: lit > 0.5 ? color.human : row.tone === "dir" ? color.inkDim : color.inkSoft }}>{row.text}</div>
              ) : (
                <div style={{ display: "flex", gap: 14, paddingLeft: 32 }}>
                  {(row.bars ?? []).map((w, k) => (
                    <div key={k} style={{ width: w, height: 10, backgroundColor: color.line }} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {EDGE_GROUPS.map(([a, b], i) => (
          <div key={i} style={{ position: "absolute", left: 4, top: a * TREE_H + 1, width: 500, height: (b - a + 1) * TREE_H - 2, boxSizing: "border-box", border: `${stroke.thin}px solid ${color.human}`, backgroundColor: withAlpha(color.human, 0.05), opacity: progress(frame, edgeAt + i * 5, 14) }} />
        ))}
      </div>
      <Note x={L.x + 4} y={TOP + 4 + TREE.length * TREE_H + 12} text="태그 필수 = 계약이 걸린 경계" c={color.human} p={progress(frame, edgeAt + 8, DUR.enter) * (1 - progress(frame, treeOut, DUR.exit, ease.in))} />

      {/* ── CI: trace-lint ── */}
      <Table
        x={L.x}
        y={TOP}
        w={L.w}
        title="trace-lint · MR !2334 (예시)"
        titlePx={22}
        at={t6}
        rowH={44}
        owner="problem"
        cols={[{ w: 44, code: true }, { w: 236 }, { w: 440 }, { w: 50, code: true }]}
        rows={[
          { cells: ["1", "깨진 태그", { t: "가리키는 조항이 없음", c: color.inkSoft }, "0"], at: t6 + 6, mark: within("s7.6", 0.12), unmark: missAt },
          { cells: ["2", "verify 불일치", { t: "계약 verify ↔ 태그 달린 검사", c: color.inkSoft }, "0"], at: t6 + 9 },
          { cells: ["3", { t: "태그 없는 접근", weight: 700 }, "계약 걸린 field를 쓰는 함수", { t: "1", c: color.problem, weight: 700 }], at: t6 + 12, mark: missAt, markC: color.problem },
          { cells: ["", { t: "fw/gc/gc_throttle.cpp gc::throttle_update", code: true, c: color.problem }], at: missAt + 4 },
          { cells: ["4", "Jira 불일치", { t: "태그의 계약 ↔ MR의 이슈 키", c: color.inkSoft }, "0"], at: t6 + 15 },
          { cells: ["", { t: "결과 실패 → merge 차단", c: color.problem, weight: 700 }], at: blockAt, mark: blockAt, markC: color.problem },
        ]}
      />
    </ShiftSheet>
  );
};
