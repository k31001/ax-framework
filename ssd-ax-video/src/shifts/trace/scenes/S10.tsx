import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, ease, progress } from "../../../video/anim";
import { Trace } from "../../../video/components/Trace";
import { color, fullSvg, sans, stroke, withAlpha } from "../../../video/theme";
import { CodePanel, ShiftSheet } from "../../lib";
import { BASE_IDS, TraceGraph, place } from "./graph";
import type { GEdge, GNode } from "./graph";
import { DocPanel, Note, T, Table, useCues } from "./kitB";
import { Cross, EXTERNAL, Lock, LockAt, vis } from "./kitD";

// s10 고칠 수 없는 문서: 표준 스펙 (네 단계 띠 밖의 별도 주제).
// 1) 왼쪽: 자물쇠 달린 표준 문서(PDF). 오른쪽: 문서 밖의 색인 파일(판본 고정 · 이름 식별자 · 위치와 해시).
// 2) 색인이 물러나고 그래프가 들어온다. 맨 위에 '표준 · 외부 문서' 층이 붙고,
//    코드 → 사내 요구사항 → (derives_from) → 표준 조항으로 이어진다. 끝: 색인을 만드는 일의 분담.

const V = { x: 916, y: 306, scale: 0.68 } as const;
const PDF = { x: 96, y: 150, w: 790 } as const;
const IDX = { x: 910, y: 150, w: 914 } as const;

const NEW_NODES: GNode[] = [
  { id: "ed21", kind: "clause", label: "NVMe Base 2.1", x: 400, y: -84, w: 290, h: 58, px: 30 },
  { id: "std_ndr", kind: "clause", label: "NVME-BASE-2.1#SMART.CW.NDR", x: 1010, y: -84, w: 500, h: 58, px: 30 },
  { id: "req_nvme", kind: "clause", label: "REQ-NVME-031#AC-1", x: 1125, y: 70, w: 340, h: 56, px: 28, sub: { text: "사내 요구사항 (예시)", x: 1290, y: 116, anchor: "end" } },
  { id: "build_cw", kind: "func", label: "smart::build_cw", x: 1125, y: 726, w: 350, h: 46 },
];
const NEW_EDGES: GEdge[] = [
  { id: "part_of", from: "std_ndr", to: "ed21", rel: "part_of", origin: "extract", pts: [[760, -84], [545, -84]] },
  { id: "derives_std", from: "req_nvme", to: "std_ndr", rel: "derives_from", origin: "tag", pts: [[1125, 42], [1125, -55]], labelAt: [1125, -8] },
  { id: "impl_cw", from: "build_cw", to: "req_nvme", rel: "implements", origin: "tag", pts: [[1300, 726], [1322, 726], [1322, 70], [1295, 70]], labelAt: [1322, 560], labelAnchor: "end" },
  { id: "direct", from: "build_cw", to: "std_ndr", rel: null, origin: "extract", problem: true, pts: [[1300, 716], [1334, 716], [1334, -84], [1260, -84]] },
];
// 기존 그래프에서 또렷하게 남는 줄기: REQ-207 → 수용 기준 → 계약 조항 → field
const SPINE = ["REQ-207", "trk_req", "ac1", "derives", "order", "impl_field", "field"];

export const S10: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, within } = useCues();
  const t1 = cue("s10.1");
  const t2 = cue("s10.2");
  const t3 = cue("s10.3");
  const t4 = cue("s10.4");
  const t5 = cue("s10.5");
  const t6 = cue("s10.6");
  const t7 = cue("s10.7");
  const t8 = cue("s10.8");

  // 1) 문서와 색인
  const lockAt = within("s10.1", 0.5);
  const tagAt = within("s10.1", 0.62);
  const crossAt = within("s10.1", 0.86);
  const pinAt = within("s10.2", 0.42);
  const pointAt = within("s10.2", 0.6);
  const numAt = within("s10.3", 0.5);
  const whyAt = within("s10.4", 0.45);
  const aOut = t5 - 8;
  const tagP = vis(frame, tagAt, aOut);
  const tagSlide = progress(frame, tagAt, 20, ease.out);

  // 2) 그래프
  const bandAt = t5 + 4;
  const nodeAt = within("s10.5", 0.3);
  const cardAt = t5 + 2;
  const funcAt = t6 + 2;
  const directAt = t6 + 10;
  const directX = within("s10.6", 0.34);
  const directOut = within("s10.6", 0.5);
  const reqAt = within("s10.6", 0.52);
  const implAt = within("s10.6", 0.66);
  const derAt = within("s10.6", 0.82);
  const reqFileAt = t7;
  const jobAt = t8;
  const proposeAt = t8 + 6;
  const confirmAt = within("s10.8", 0.7);

  const band = progress(frame, bandAt, DUR.enter);
  const [bx0, by0] = place(V, 216, -196);
  const [bx1, by1] = place(V, 1300, -36);
  const [dx, dy] = place(V, 1334, 300);

  return (
    <ShiftSheet>
      <T x={96} y={76} text="고칠 수 없는 문서: 표준 스펙" px={40} weight={800} at={4} />

      {/* ── 표준 문서(PDF): 고칠 수 없다 ── */}
      <DocPanel
        {...PDF}
        title="NVM Express Base Specification 2.1 · PDF"
        at={t1}
        px={26}
        headRight={<Lock size={28} style={{ opacity: progress(frame, lockAt, DUR.enter) }} />}
        rows={[
          { full: true, text: "5.1.12.1.3  SMART / Health Information", at: t1 + 8, c: color.inkSoft },
          { full: true, text: "Figure 206: SMART / Health Information Log Page", at: t1 + 12, c: color.inkSoft, mark: pointAt, unmark: aOut, markC: color.agent },
          { full: true, text: "Critical Warning (CW) · bit 2 NDR", at: t1 + 16, c: color.inkSoft },
        ]}
      />
      <Note x={PDF.x + PDF.w} y={353} align="right" c={EXTERNAL} p={progress(frame, lockAt, DUR.enter)} text={<span style={{ display: "flex", alignItems: "center", gap: 10 }}><Lock size={26} />고칠 수 없음</span>} />
      {/* 태그를 달 수 없다 */}
      <div style={{ position: "absolute", left: 120 + (1 - tagSlide) * 60, top: 353, opacity: tagP }}>
        <Note x={0} y={0} code px={28} c={color.human} text="// @trace …" />
      </div>
      <Cross x={222} y={376} r={15} p={vis(frame, crossAt, aOut)} />

      {/* ── 문서 밖의 색인 ── */}
      <Note x={1824} y={88} align="right" c={color.agent} p={vis(frame, t2, aOut)} text="문서 밖의 색인 · git" />
      <CodePanel
        {...IDX}
        title="spec/nvme-base-2.1/clauses.yaml"
        px={26}
        at={t2}
        out={aOut}
        owner="agent"
        lines={[
          { text: "doc: NVME-BASE-2.1           # 판본 = 노드", at: t2 + 8, mark: pinAt, unmark: t3 },
          { text: "file_sha256: 4e31f826…       # PDF 는 고치지 않는다", at: t2 + 11, mark: pinAt, unmark: t3 },
          { text: "clauses:", at: t2 + 14 },
          { text: "  - id: SMART.CW.NDR         # 이름으로 지은 식별자", at: t3, mark: t3 + 6, unmark: numAt, markTone: "human" },
          { text: "    kind: field", at: t3 + 3 },
          { text: "    at: {sec: 5.1.12.1.3, fig: 206, page: 209}", at: t3 + 6, mark: numAt, unmark: t4 },
          { text: "    text_sha256: 9a41c07e…   # 본문은 싣지 않는다", at: t3 + 9, mark: t4 },
          { text: "  - id: SMART.CW.AMRO#shall-1", at: t3 + 14, mark: t3 + 10, unmark: numAt, markTone: "human" },
          { text: "    kind: shall              # shall | should | may 단위", at: t3 + 17 },
          { text: "    at: {sec: 5.1.12.1.3, fig: 206, page: 209}", at: t3 + 20, mark: numAt, unmark: t4 },
          { text: "    text_sha256: 5d20e3b1…", at: t3 + 23, mark: t4 },
        ]}
      />
      <svg {...fullSvg}>
        <Trace pts={[[IDX.x, 420], [520, 420], [520, 347]]} stroke={color.agent} width={stroke.thin} dash="9 7" arrow at={pointAt} opacity={vis(frame, pointAt, aOut)} />
      </svg>
      <T x={544} y={430} text="가리키기만" px={30} weight={700} c={color.agent} at={pointAt + 8} out={aOut} />

      {/* 같은 조항의 번호가 판본마다 다르다 */}
      <Table
        x={96}
        y={500}
        w={790}
        title="같은 log page 의 자리 (공개 PDF에서 확인)"
        at={numAt}
        out={aOut}
        rowH={46}
        cols={[{ w: 150 }, { w: 200, code: true }, { w: 200, code: true }, { w: 200, code: true }]}
        head={["", "2.1", "2.2", "2.3"]}
        rows={[
          { cells: [{ t: "절", c: color.inkSoft }, "5.1.12.1.3", "5.1.12.1.3", { t: "5.2.12.1.3", c: color.human, weight: 700 }], at: numAt + 8 },
          { cells: [{ t: "Figure", c: color.inkSoft }, "206", { t: "207", c: color.human, weight: 700 }, { t: "210", c: color.human, weight: 700 }], at: numAt + 13 },
          { cells: [{ t: "쪽", c: color.inkSoft }, "209", { t: "206", c: color.human, weight: 700 }, { t: "214", c: color.human, weight: 700 }], at: numAt + 18 },
        ]}
      />
      <Note x={IDX.x} y={682} c={color.inkSoft} p={vis(frame, whyAt, aOut)} text="재배포 조건 회피" />
      <Note x={IDX.x + 270} y={682} c={color.inkSoft} p={vis(frame, whyAt + 8, aOut)} text="변경 검출" />

      {/* ── 그래프: 맨 위에 표준 조항 층 ── */}
      <div style={{ position: "absolute", left: bx0, top: by0, width: bx1 - bx0, height: by1 - by0, boxSizing: "border-box", border: `${stroke.thin}px solid ${withAlpha(EXTERNAL, 0.7)}`, backgroundColor: withAlpha(EXTERNAL, 0.05), opacity: band }}>
        <div style={{ position: "absolute", left: 14, top: 6, display: "flex", alignItems: "center", gap: 10, ...sans(30, 700), color: EXTERNAL, whiteSpace: "nowrap" }}>
          <Lock size={26} />
          표준 · 외부 문서
        </div>
      </div>
      {frame >= t5 - 2 ? (
        <TraceGraph
          {...V}
          opacity={progress(frame, t5, DUR.enter)}
          hide={["fail"]}
          extraNodes={NEW_NODES}
          extraEdges={NEW_EDGES}
          appear={{ ed21: nodeAt, std_ndr: nodeAt + 6, part_of: nodeAt + 14, build_cw: funcAt, direct: directAt, req_nvme: reqAt, impl_cw: implAt, derives_std: derAt }}
          vanish={{ direct: directOut }}
          looks={[{ ids: ["ed21", "std_ndr"], look: "plain" }]}
          dim={[{ ids: BASE_IDS, to: 0.3 }]}
          hi={[
            { ids: SPINE },
            { ids: ["ed21", "std_ndr"], color: color.agent, at: nodeAt, out: nodeAt + 36 },
            { ids: ["std_ndr"], color: color.agent, at: proposeAt, out: confirmAt, blink: true, ring: true },
            { ids: ["std_ndr"], color: color.human, at: confirmAt, ring: true },
            { ids: ["req_nvme"], at: t7, out: t8, ring: true, color: color.human },
          ]}
          walks={[{ at: derAt + 22, steps: [["impl_cw"], ["derives_std"]], gap: 20, color: color.human, out: derAt + 72 }]}
        />
      ) : null}
      <LockAt x={bx1 - 40} y={by0 + 8} size={28} p={band} />
      <Cross x={dx} y={dy} r={15} p={vis(frame, directX, directOut + 6)} />
      <Note x={1806} y={dy - 60} align="right" c={color.problem} p={vis(frame, directX, directOut + 6)} text="직접 가리키지 않음" />

      {/* 색인 카드 → 층의 노드 */}
      <CodePanel
        x={96}
        y={420}
        w={600}
        title="clauses.yaml"
        px={26}
        at={cardAt}
        owner="agent"
        lines={["- id: SMART.CW.NDR", "- id: SMART.CW.AMRO#shall-1"]}
      />
      <svg {...fullSvg}>
        <Trace pts={[[696, 498], [900, 498], [900, place(V, 0, -84)[1]], [place(V, 255, 0)[0] - 4, place(V, 0, -84)[1]]]} stroke={color.agent} width={stroke.thin} arrow at={nodeAt - 6} duration={22} />
      </svg>

      {/* 사내 요구사항: 지원 여부와 해석 */}
      <CodePanel
        x={96}
        y={600}
        w={790}
        title="req/REQ-NVME-031.yaml (예시)"
        px={26}
        at={reqFileAt}
        out={t8 - 8}
        owner="human"
        lines={[
          { text: "id: REQ-NVME-031             # 사내 요구사항" },
          { text: "derives_from:" },
          { text: "  - NVME-BASE-2.1#SMART.CW.NDR", tone: "human" },
          { text: "support: yes                 # optional 이면 여부", mark: within("s10.7", 0.2), markTone: "human" },
          { text: "reading: 복구 실패 누적 → bit 2   # 해석", mark: within("s10.7", 0.55), markTone: "human" },
        ]}
      />

      {/* 색인을 만드는 일 */}
      <Table
        x={96}
        y={600}
        w={790}
        title="색인을 만드는 일"
        at={jobAt}
        rowH={50}
        cols={[{ w: 440 }, { w: 300 }]}
        rows={[
          { cells: ["절 번호 · 표", { t: "도구", c: color.agent, weight: 700 }], at: jobAt + 8, mark: jobAt + 8, unmark: proposeAt + 20 },
          { cells: ["shall 문장 분리 · ID 부여", { t: "에이전트 제안", c: color.agent, weight: 700, u: color.agent }], at: within("s10.8", 0.3), mark: within("s10.8", 0.3), unmark: confirmAt },
          { cells: ["확정", { t: "표준 담당", c: color.human, weight: 700 }], at: confirmAt, mark: confirmAt, markC: color.human },
        ]}
      />
    </ShiftSheet>
  );
};
