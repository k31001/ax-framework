import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, progress } from "../../../video/anim";
import { AgentIcon, HumanIcon } from "../../../video/components/Icons";
import { Trace } from "../../../video/components/Trace";
import { color, fullSvg, mono, stroke, withAlpha } from "../../../video/theme";
import { CodePanel, ShiftSheet } from "../../lib";
import { TraceGraph } from "./graph";
import type { GEdge, GNode } from "./graph";
import { Note, T, Table, useCues } from "./kitB";
import { EXTERNAL, Lock, Tag, vis } from "./kitD";

// s11 판본이 바뀔 때.
// 위: 판본의 가로줄(2.1 → 2.2 → 2.3 → 2.4)과 그 사이의 TP · ECN.
// 가운데: 왼쪽부터 우리 것(코드 · 테스트 → 사내 요구사항) | 옛 판본의 조항 | 새 판본의 조항. supersedes 로 잇는다.
//   해시가 같은 것은 청록 실선(자동), 다른 것은 점선 제안 → 호박색 확정, 그 조항에서 우리 코드까지 붉은 빛이 걸어간다.
// 아래: 질의와 결과 표 → 다른 외부 문서와 지키는 선.

const std = (id: string, label: string, x: number, y: number, more: Partial<GNode> = {}): GNode => ({ id, kind: "clause", label, x, y, w: 290, h: 46, px: 22, ...more });
const OLD_X = 1185;
const NEW_X = 1655;

const NODES: GNode[] = [
  { id: "f_cw", kind: "func", label: "smart::build_cw", x: 221, y: 350, w: 250, h: 46, px: 22 },
  { id: "t_cw", kind: "test", label: "smart_cw_test", x: 112, y: 430, w: 28, h: 28, px: 22 },
  { id: "req", kind: "clause", label: "REQ-NVME-031#AC-1", x: 645, y: 350, w: 290, h: 52, px: 22 },
  std("ed21", "NVMe Base 2.1", OLD_X, 236, { px: 24 }),
  std("o_ndr", "SMART.CW.NDR", OLD_X, 300),
  std("o_bits", "SMART.CW.bits7-6", OLD_X, 412, { sub: { text: "Reserved", x: OLD_X + 141, y: 454, anchor: "end" } }),
  std("ed23", "NVMe Base 2.3", NEW_X, 236, { px: 24 }),
  std("n_ndr", "SMART.CW.NDR", NEW_X, 300),
  std("n_ips", "SMART.CW.IPS", NEW_X, 388, { sub: { text: "bit 6 · 새 정의", x: NEW_X + 141, y: 344, anchor: "end" } }),
  std("n_bit7", "SMART.CW.bit7", NEW_X, 452, { sub: { text: "Reserved", x: NEW_X + 141, y: 494, anchor: "end" } }),
];
const P_IPS: GEdge["pts"] = [[1510, 388], [1420, 388], [1420, 404], [1330, 404]];
const P_BIT7: GEdge["pts"] = [[1510, 452], [1420, 452], [1420, 420], [1330, 420]];
const EDGES: GEdge[] = [
  { id: "impl", from: "f_cw", to: "req", rel: "implements", origin: "tag", pts: [[346, 350], [500, 350]] },
  { id: "ver", from: "t_cw", to: "req", rel: "verifies", origin: "tag", pts: [[320, 430], [440, 430], [440, 364], [500, 364]], labelAt: [380, 430] },
  { id: "der_ndr", from: "req", to: "o_ndr", rel: "derives_from", origin: "tag", pts: [[790, 350], [960, 350], [960, 300], [1040, 300]], labelAt: [875, 350] },
  { id: "der_bits", from: "req", to: "o_bits", rel: "derives_from", origin: "tag", pts: [[790, 350], [960, 350], [960, 412], [1040, 412]], labelAt: [875, 350] },
  { id: "sup_ed", from: "ed23", to: "ed21", rel: "supersedes", origin: "extract", pts: [[1510, 236], [1330, 236]] },
  { id: "sup_ndr", from: "n_ndr", to: "o_ndr", rel: null, origin: "extract", pts: [[1510, 300], [1330, 300]] },
  { id: "p_ips", from: "n_ips", to: "o_bits", rel: null, origin: "proposed", pts: P_IPS },
  { id: "p_bit7", from: "n_bit7", to: "o_bits", rel: null, origin: "proposed", pts: P_BIT7 },
  { id: "c_ips", from: "n_ips", to: "o_bits", rel: null, origin: "tag", pts: P_IPS },
  { id: "c_bit7", from: "n_bit7", to: "o_bits", rel: null, origin: "tag", pts: P_BIT7 },
];
const STD_NODES = ["ed21", "o_ndr", "o_bits", "ed23", "n_ndr", "n_ips", "n_bit7"];
const NEW_COL = ["ed23", "n_ndr", "n_ips", "n_bit7"];

// 판본의 가로줄
const LINE_Y = 140;
const LINE_H = 52;
const EDS = [
  { x: 96, w: 381, text: "NVMe Base 2.1 (2024-08)" },
  { x: 739, w: 225, text: "2.2 (2025-03)" },
  { x: 1320, w: 225, text: "2.3 (2025-07)" },
  { x: 1599, w: 225, text: "2.4 (2026-08)", faint: true },
];
const CHANGES = [
  { cx: 608, w: 222, text: "TP4194 · ECN123" },
  { cx: 1142, w: 320, text: "TP4163 외 4건 · ECN 6건" },
];

const QX = 96;
const QY = 572;
const RX = 920;

export const S11: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, within } = useCues();
  const t1 = cue("s11.1");
  const t2 = cue("s11.2");
  const t3 = cue("s11.3");
  const t4 = cue("s11.4");
  const t5 = cue("s11.5");
  const t6 = cue("s11.6");

  const edAt = (i: number): number => t1 + 4 + i * 12;
  const chgAt = within("s11.1", 0.55);
  const newAt = t2 + 4;
  const supAt = within("s11.2", 0.55);
  const sameAt = t3 + 6;
  const propAt = t4 + 6;
  const confirmAt = within("s11.4", 0.62);
  const walkAt = within("s11.5", 0.18);
  const rowsAt = within("s11.5", 0.5);
  const qOut = t6 - 8;
  const lineAt = within("s11.6", 0.5);

  return (
    <ShiftSheet>
      <T x={96} y={76} text="판본이 바뀔 때" px={40} weight={800} at={4} />

      {/* ── 판본의 가로줄과 TP · ECN ── */}
      <svg {...fullSvg}>
        {EDS.slice(0, -1).map((e, i) => (
          <Trace key={i} pts={[[e.x + e.w, LINE_Y + LINE_H / 2], [EDS[i + 1].x, LINE_Y + LINE_H / 2]]} stroke={EXTERNAL} width={stroke.thin} arrow at={edAt(i) + 8} opacity={i === 2 ? 0.5 : 1} />
        ))}
      </svg>
      {EDS.map((e, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: e.x,
            top: LINE_Y,
            width: e.w,
            height: LINE_H,
            boxSizing: "border-box",
            border: `${stroke.thin}px solid ${EXTERNAL}`,
            backgroundColor: withAlpha(color.panel, 0.92),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            ...mono(26, 600),
            letterSpacing: "0",
            color: color.ink,
            opacity: progress(frame, edAt(i), DUR.enter) * (e.faint ? 0.5 : 1),
          }}
        >
          {e.text}
        </div>
      ))}
      {CHANGES.map((c, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: c.cx - c.w / 2,
            top: LINE_Y + 5,
            width: c.w,
            height: LINE_H - 10,
            boxSizing: "border-box",
            border: `${stroke.thin}px solid ${color.agent}`,
            backgroundColor: color.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            ...mono(22, 700),
            letterSpacing: "0",
            color: color.agent,
            opacity: progress(frame, chgAt + i * 8, DUR.enter),
          }}
        >
          {c.text}
        </div>
      ))}
      <Note x={1142} y={84} align="center" c={color.agent} p={vis(frame, chgAt + 14, t5 - 8)} text="TP · ECN 도 노드" />

      {/* ── 우리 것 | 옛 판본 | 새 판본 ── */}
      <TraceGraph
        show={[]}
        bands={false}
        extraNodes={NODES}
        extraEdges={EDGES}
        appear={{
          f_cw: t1 + 6,
          t_cw: t1 + 9,
          req: t1 + 12,
          impl: t1 + 16,
          ver: t1 + 18,
          ed21: t1 + 18,
          o_ndr: t1 + 21,
          o_bits: t1 + 24,
          der_ndr: t1 + 28,
          der_bits: t1 + 30,
          ed23: newAt,
          n_ndr: newAt + 5,
          n_ips: newAt + 10,
          n_bit7: newAt + 15,
          sup_ed: supAt,
          sup_ndr: sameAt,
          p_ips: propAt,
          p_bit7: propAt + 8,
          c_ips: confirmAt,
          c_bit7: confirmAt + 6,
        }}
        vanish={{ p_ips: confirmAt, p_bit7: confirmAt + 6 }}
        looks={[{ ids: STD_NODES, look: "plain" }]}
        dim={[{ ids: ["f_cw", "t_cw", "req", "impl", "ver", "der_ndr", "der_bits", "ed21", "o_ndr", "o_bits"], at: t1 + 40, out: t5 - 6, to: 0.6 }]}
        hi={[
          { ids: NEW_COL, color: color.agent, at: newAt, out: supAt + 10 },
          { ids: ["sup_ndr", "n_ndr", "o_ndr"], color: color.agent, at: sameAt, out: t4 - 4 },
          { ids: ["n_ips", "n_bit7", "o_bits"], color: color.problem, at: propAt, ring: true },
          { ids: ["p_ips", "p_bit7"], at: propAt },
          { ids: ["c_ips", "c_bit7"], color: color.human, at: confirmAt, out: t5 },
          { ids: ["req", "f_cw", "t_cw"], color: color.problem, at: walkAt + 60, ring: true },
          { ids: ["c_ips", "c_bit7", "der_bits", "impl", "ver"], color: color.problem, at: walkAt + 60 },
        ]}
        walks={[{ at: walkAt, steps: [["c_ips", "c_bit7"], { edges: ["der_bits"], reverse: true }, { edges: ["impl", "ver"], reverse: true }], gap: 22, color: color.problem, out: walkAt + 84 }]}
      />
      <T x={1420} y={308} align="center" text="해시 같음" px={30} weight={700} c={color.agent} at={sameAt + 8} />
      <T x={1040} y={516} text="해시 다름" px={30} weight={700} c={color.problem} at={propAt + 6} />
      <Tag x={1186} y={510} c={color.agent} dash p={progress(frame, propAt + 12, DUR.enter)} icon={<AgentIcon size={28} color={color.agent} />} text="에이전트 제안" />
      <Tag x={1450} y={510} c={color.human} p={progress(frame, confirmAt, DUR.enter)} icon={<HumanIcon size={28} color={color.human} />} text="표준 담당 확인" />

      {/* ── 질의와 결과 ── */}
      <CodePanel
        x={QX}
        y={QY}
        w={800}
        title="CYPHER"
        px={26}
        at={t5}
        out={qOut}
        lines={[
          { text: "MATCH (n:StdClause {doc:'NVME-BASE-2.3'})" },
          { text: "      -[s:SUPERSEDES]->(o:StdClause)", mark: walkAt, unmark: walkAt + 22, markTone: "problem" },
          { text: "WHERE s.change <> 'same'", mark: walkAt, unmark: walkAt + 22, markTone: "problem" },
          { text: "MATCH (o)<-[:DERIVES_FROM]-(r:Clause)", mark: walkAt + 22, unmark: walkAt + 44, markTone: "problem" },
          { text: "      <-[:IMPLEMENTS|VERIFIES]-(x)", mark: walkAt + 44, unmark: walkAt + 70, markTone: "problem" },
          { text: "RETURN n.id, r.id, labels(x)[0] AS kind, x.name" },
        ]}
      />
      <Table
        x={RX}
        y={QY}
        w={904}
        title="graph@9f3c2e1 (예시) · 4행"
        titlePx={22}
        at={rowsAt - 6}
        px={28}
        rowH={42}
        owner="agent"
        cols={[{ w: 222, code: true }, { w: 290, code: true }, { w: 96, code: true }, { w: 260, code: true }]}
        head={["n.id", "r.id", "kind", "x.name"]}
        rows={(
          [
            ["SMART.CW.IPS", "Func", "smart::build_cw"],
            ["SMART.CW.IPS", "Test", "smart_cw_test"],
            ["SMART.CW.bit7", "Func", "smart::build_cw"],
            ["SMART.CW.bit7", "Test", "smart_cw_test"],
          ] as const
        ).map(([n, kind, name], i) => ({
          cells: [{ t: n, c: color.problem }, { t: "REQ-NVME-031#AC-1", c: color.human }, { t: kind, c: color.inkDim }, { t: name, weight: 700 }],
          at: rowsAt + i * 8,
        }))}
      />

      {/* ── 다른 외부 문서도 같은 방식 · 지키는 선 ── */}
      <T x={QX} y={QY} text="같은 방식" px={30} weight={700} c={color.inkSoft} at={t6} />
      {(
        [
          ["ONFI · NAND 데이터시트", 0, 0, 372],
          ["PCIe Base", 384, 0, 204],
          ["고객 요구서", 600, 0, 200],
          ["OCP Datacenter NVMe SSD", 0, 58, 450],
        ] as const
      ).map(([name, dx, dy, w], i) => (
        <Tag key={i} x={QX + dx} y={QY + 48 + dy} w={w} p={progress(frame, t6 + 6 + i * 6, DUR.enter)} icon={<Lock size={24} />} text={name} />
      ))}
      <T x={QX} y={QY + 176} text="보관 · 색인화 조건은 법무 확인" px={30} weight={700} c={color.human} at={lineAt} />
      <T x={QX} y={QY + 226} text="PDF 추출은 표 · 비트 필드에서 깨지기 쉬움 → 닿는 절만 먼저" px={30} weight={700} c={color.human} at={lineAt + 10} />
    </ShiftSheet>
  );
};
