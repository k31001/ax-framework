import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, ease, progress } from "../../../video/anim";
import { CheckIcon } from "../../../video/components/Icons";
import { color, fullSvg, mono, sans, stroke, withAlpha } from "../../../video/theme";
import { CodePanel, ShiftSheet } from "../../lib";
import { TraceGraph, nodeRect, place } from "./graph";
import type { GEdge, GNode } from "./graph";
import { Note, T, Table, useCues } from "./kitB";

// s12 효과 ② 빈틈 검출.
// 오른쪽: 계약 HSI-RCV-010 의 조항 넷. 조항마다 검사 → Jira Test → PASS 가 이어지는지 본다.
//   (조항을 가로로 펴면 #order 의 검사 셋이 들어가지 않아, 조항을 세로로 놓고 사슬을 오른쪽으로 폈다.)
// 왼쪽: 질의와 결과 표. 위에는 Jira(R4J)의 채워진 칸 한 줄.
// 끝: s5 의 그래프로 돌아가 조항에 닿지 않는 함수 하나를 찾는다.

const V = { x: 916, y: 172, scale: 0.698 } as const;
const ROW = { host: 150, gc: 250, test: 350, full: 530, bound: 700, fw: 870 } as const;

const clause = (id: string, label: string, y: number): GNode => ({ id, kind: "clause", label, x: 120, y, w: 200, h: 52, px: 28 });
const NODES: GNode[] = [
  clause("c_order", "#order", ROW.gc),
  clause("c_full", "#full", ROW.full),
  clause("c_bound", "#bound", ROW.bound),
  clause("c_fw", "#fw_role", ROW.fw),
  { id: "k_host", kind: "assertion", label: "a_host_first", x: 500, y: ROW.host, w: 256, h: 46 },
  { id: "k_gc", kind: "assertion", label: "a_gc_no_starve", x: 500, y: ROW.gc, w: 256, h: 46 },
  { id: "k_test", kind: "test", label: "prio_q_ratio_test", x: 386, y: ROW.test, w: 28, h: 28 },
  { id: "k_full", kind: "assertion", label: "a_full_gc_bp", x: 500, y: ROW.full, w: 256, h: 46 },
  ...(["host", "gc", "test"] as const).flatMap((r, i): GNode[] => [
    { id: `j${i}`, kind: "issue", label: `VER-54${i + 1}`, x: 880, y: ROW[r], w: 160, h: 42 },
    { id: `e${i}`, kind: "exec", label: "PASS @ VER-631", x: 1085, y: ROW[r], w: 28, h: 28, px: 22, status: "pass" },
  ]),
];
const EDGES: GEdge[] = [
  { id: "v_host", from: "k_host", to: "c_order", rel: null, origin: "tag", pts: [[372, ROW.host], [250, ROW.host], [250, ROW.gc], [220, ROW.gc]] },
  { id: "v_gc", from: "k_gc", to: "c_order", rel: "verifies", origin: "tag", pts: [[372, ROW.gc], [220, ROW.gc]], labelAt: [316, ROW.gc] },
  { id: "v_test", from: "k_test", to: "c_order", rel: null, origin: "tag", pts: [[372, ROW.test], [250, ROW.test], [250, ROW.gc], [220, ROW.gc]] },
  { id: "v_full", from: "k_full", to: "c_full", rel: "verifies", origin: "tag", pts: [[372, ROW.full], [220, ROW.full]], labelAt: [300, ROW.full] },
  ...(["host", "gc", "test"] as const).flatMap((r, i): GEdge[] => [
    { id: `t${i}`, from: `j${i}`, to: i === 2 ? "k_test" : i === 0 ? "k_host" : "k_gc", rel: "tracks", origin: "extract", pts: [[800, ROW[r]], [i === 2 ? 678 : 628, ROW[r]]], labelAt: [i === 2 ? 740 : 714, ROW[r]] },
    { id: `r${i}`, from: `e${i}`, to: `j${i}`, rel: "result", origin: "extract", pts: [[1071, ROW[r]], [960, ROW[r]]], labelAt: [1014, ROW[r]] },
  ]),
];
const CHECKS = ["k_host", "k_gc", "k_test", "k_full"];
const VERIFIES = ["v_host", "v_gc", "v_test", "v_full"];
const ORDER_CHAIN = ["c_order", "k_host", "k_gc", "k_test", "v_host", "v_gc", "v_test", "j0", "j1", "j2", "t0", "t1", "t2", "r0", "r1", "r2", "e0", "e1", "e2"];

const LX = 96;
const LW = 800;

export const S12: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, within } = useCues();
  const t1 = cue("s12.1");
  const t2 = cue("s12.2");
  const t3 = cue("s12.3");
  const t4 = cue("s12.4");
  const t5 = cue("s12.5");
  const t6 = cue("s12.6");

  const ckAt = within("s12.2", 0.3);
  const evAt = within("s12.2", 0.62);
  const r4jAt = t3 + 4;
  const boundAt = within("s12.4", 0.45);
  const fullAt = t5 + 10;
  const neverAt = within("s12.5", 0.5);
  const orderAt = within("s12.5", 0.8);
  const leftOut = t6 - 8;
  const g1 = 1 - progress(frame, t6 - 4, 12, ease.in);
  const g2 = progress(frame, t6 + 6, 14);
  const orphanAt = t6 + 18;
  const whereAt = within("s12.6", 0.4);
  const rowAt = within("s12.6", 0.62);

  const appear: Record<string, number> = {};
  ["c_order", "c_full", "c_bound", "c_fw"].forEach((id, i) => (appear[id] = t1 + 12 + i * 6));
  CHECKS.forEach((id, i) => (appear[id] = ckAt + i * 4));
  VERIFIES.forEach((id, i) => (appear[id] = ckAt + 8 + i * 4));
  [0, 1, 2].forEach((i) => {
    appear[`j${i}`] = evAt + i * 4;
    appear[`t${i}`] = evAt + 6 + i * 4;
    appear[`e${i}`] = evAt + 14 + i * 4;
    appear[`r${i}`] = evAt + 18 + i * 4;
  });

  const at = (gx: number, gy: number) => place(V, gx, gy);
  const s = V.scale;
  const bound = progress(frame, boundAt + 4, DUR.enter) * g1;
  const full = progress(frame, fullAt + 6, DUR.enter) * g1;
  const fw = progress(frame, t4 + 10, DUR.enter) * g1;
  const [hx, hy] = at(20, 78);
  const [bcx, bcy] = at(400, ROW.bound);
  const [fcx, fcy] = at(400, ROW.fw);
  const [slx, sly] = at(800, ROW.full - 21);
  const [pcx, pcy] = at(1085, ROW.full);
  const gc = nodeRect("throttle_update");
  const [ox, oy] = place(V, gc.x, gc.y);
  const orphan = progress(frame, orphanAt, 12);

  const cell = (text: string, w: number, bold = false): React.ReactNode => (
    <div style={{ width: w, height: "100%", boxSizing: "border-box", borderLeft: `${stroke.hair}px solid ${color.line}`, display: "flex", alignItems: "center", paddingLeft: 18, ...sans(30, bold ? 700 : 500), whiteSpace: "nowrap" }}>{text}</div>
  );

  return (
    <ShiftSheet>
      <T x={LX} y={76} text="효과 ② 빈틈 검출" px={40} weight={800} at={t1} />

      {/* ── Jira(R4J): 이슈 수준에서는 채워진 칸 ── */}
      <div style={{ position: "absolute", left: 470, top: 74, height: 56, boxSizing: "border-box", border: `${stroke.thin}px solid ${color.inkSoft}`, backgroundColor: withAlpha(color.panel, 0.92), display: "flex", alignItems: "center", opacity: progress(frame, r4jAt, DUR.enter), translate: `0px ${(1 - progress(frame, r4jAt, DUR.enter)) * 8}px` }}>
        <div style={{ width: 324, paddingLeft: 18, boxSizing: "border-box", ...mono(22, 700), color: color.inkSoft }}>R4J · Coverage View</div>
        {cell("REQ-207 read 지연 보장", 350)}
        {cell("FEAT-338 우선 큐", 270)}
        <div style={{ width: 100, height: "100%", boxSizing: "border-box", borderLeft: `${stroke.hair}px solid ${color.line}`, backgroundColor: withAlpha(color.agent, 0.14), display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: progress(frame, within("s12.3", 0.5), 12) }}>
          <div style={{ ...mono(32, 700), letterSpacing: "0", color: color.agent }}>3</div>
          <CheckIcon size={28} color={color.agent} />
        </div>
      </div>

      {/* ── 조항별 사슬 ── */}
      <TraceGraph
        {...V}
        show={[]}
        bands={false}
        opacity={g1}
        extraNodes={NODES}
        extraEdges={EDGES}
        appear={appear}
        hi={[
          { ids: ["j0", "j1", "j2"], at: within("s12.3", 0.45), out: t4 - 4, ring: true },
          { ids: ["c_bound"], color: color.problem, at: boundAt, ring: true },
          { ids: ["c_full"], color: color.problem, at: fullAt, ring: true },
          { ids: ORDER_CHAIN, at: orderAt },
          { ids: ["e0", "e1", "e2"], color: color.agent, at: orderAt, fill: true },
        ]}
        dim={[{ ids: ORDER_CHAIN, at: boundAt, out: orderAt, to: 0.5 }]}
      />
      <div style={{ position: "absolute", left: hx, top: hy - 22, ...mono(30, 700), letterSpacing: "0", color: color.human, opacity: progress(frame, t1 + 8, 12) * g1 }}>HSI-RCV-010</div>
      <svg {...fullSvg}>
        {/* #bound: 검사가 없다 */}
        <g opacity={bound} fill="none" stroke={color.problem} strokeWidth={stroke.thin} strokeDasharray="7 6">
          <line x1={at(220, 0)[0]} y1={bcy} x2={bcx - 22} y2={bcy} />
          <circle cx={bcx} cy={bcy} r={20} />
        </g>
        {/* #fw_role: 구현 태그만 */}
        <g opacity={fw * 0.8} fill="none" stroke={color.lineStrong} strokeWidth={stroke.thin} strokeDasharray="7 6">
          <line x1={at(220, 0)[0]} y1={fcy} x2={fcx - 22} y2={fcy} />
          <circle cx={fcx} cy={fcy} r={20} />
        </g>
        {/* #full: Jira Test 와 PASS 의 자리가 비어 있다 */}
        <g opacity={full} fill="none" stroke={color.problem} strokeWidth={stroke.thin} strokeDasharray="7 6">
          <line x1={at(628, 0)[0]} y1={pcy} x2={slx} y2={pcy} />
          <rect x={slx} y={sly} width={160 * s} height={42 * s} rx={21 * s} />
          <line x1={slx + 160 * s} y1={pcy} x2={pcx - 14} y2={pcy} />
          <circle cx={pcx} cy={pcy} r={14} />
        </g>
        {/* 고아 코드 */}
        <rect x={ox - 8} y={oy - 8} width={gc.w * s + 16} height={gc.h * s + 16} fill="none" stroke={color.problem} strokeWidth={stroke.trace} strokeDasharray="8 6" opacity={orphan} />
      </svg>
      <Note x={bcx + 34} y={bcy - 22} h={44} text="검사 없음" c={color.problem} border={false} weight={700} p={bound} />
      <Note x={1824} y={at(0, ROW.full + 40)[1]} h={42} align="right" text="Xray Test 미등록 · 실행된 적 없음" c={color.problem} p={progress(frame, neverAt, DUR.enter) * g1} />

      {/* ── s5 의 그래프: 조항에 닿지 않는 코드 ── */}
      {g2 > 0 ? (
        <TraceGraph
          {...V}
          opacity={g2}
          dim={[{ to: 0.32 }]}
          hi={[
            { ids: ["throttle_update"], color: color.problem, at: orphanAt },
            { ids: ["writes_gc", "field", "impl_field", "order"], at: whereAt - 6 },
          ]}
          walks={[{ at: whereAt - 10, steps: [["writes_gc"], ["impl_field"]], gap: 22, out: whereAt + 50 }]}
        />
      ) : null}

      {/* ── 질의 1: 조항마다 검사와 통과 증거를 센다 ── */}
      <CodePanel
        x={LX}
        y={172}
        w={LW}
        title="CYPHER"
        px={26}
        at={t2}
        out={leftOut}
        lines={[
          "MATCH (c:Clause {doc:'HSI-RCV-010'})",
          { text: "OPTIONAL MATCH (c)<-[:VERIFIES]-(v)", mark: ckAt, unmark: evAt, markTone: "human" },
          { text: "OPTIONAL MATCH (v)<-[:TRACKS]-(t:Issue)", mark: evAt, unmark: t3 },
          { text: "    <-[:RESULT {status:'PASS'}]-(:Exec)", mark: evAt, unmark: t3 },
          "RETURN c.id AS clause,",
          "       count(DISTINCT v) AS checks,",
          "       count(DISTINCT t) AS passed",
        ]}
      />
      <Table
        x={LX}
        y={541}
        w={LW}
        title="graph@9f3c2e1"
        titlePx={22}
        at={t4}
        out={leftOut}
        rowH={44}
        owner="agent"
        cols={[{ w: 336, code: true }, { w: 112, code: true }, { w: 112, code: true }, { w: 210 }]}
        head={["clause", "checks", "passed", ""]}
        rows={[
          { cells: ["HSI-RCV-010#bound", "0", "0", { t: "← 검증 없음", c: color.problem, weight: 700 }], at: t4 + 8, mark: boundAt, markC: color.problem },
          { cells: ["HSI-RCV-010#full", "1", "0", { t: "← 실행 증거 없음", c: frame >= fullAt ? color.problem : color.inkDim, weight: 700 }], at: t4 + 12, mark: fullAt, markC: color.problem },
          { cells: ["HSI-RCV-010#fw_role", "0", "0", { t: "← 구현 태그만", c: color.inkDim }], at: t4 + 16, c: color.inkSoft },
          { cells: ["HSI-RCV-010#order", "3", "3", ""], at: t4 + 20, mark: orderAt },
        ]}
      />

      {/* ── 질의 2: 어느 조항에도 닿지 않는 함수 ── */}
      <CodePanel
        x={LX}
        y={172}
        w={LW}
        title="CYPHER"
        px={26}
        at={t6}
        lines={[
          "MATCH (f:Func)-[w:WRITES]->(:Field)",
          "      -[:IMPLEMENTS]->(c:Clause)",
          { text: "WHERE NOT (f)-[:IMPLEMENTS]->(:Clause)", mark: whereAt, markTone: "problem" },
          "RETURN f.name, f.owner, w.via, c.id",
        ]}
      />
      <Table
        x={LX}
        y={430}
        w={LW}
        title="graph@9f3c2e1"
        titlePx={22}
        at={rowAt}
        px={28}
        rowH={46}
        owner="agent"
        cols={[{ w: 314, code: true }, { w: 100, code: true }, { w: 66, code: true }, { w: 280, code: true }]}
        rows={[{ cells: [{ t: "gc::throttle_update", c: color.problem, weight: 700 }, "FW GC", "reg", "HSI-RCV-010#order"], at: rowAt + 6, mark: rowAt + 6, markC: color.problem }]}
      />
    </ShiftSheet>
  );
};
