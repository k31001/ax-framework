// 추적성 편의 공유 그래프 부품. 자리는 s4 에서 정해지고 끝까지 같다(그래프 좌표 1300 × 810).
//
// 사용법
//   <TraceGraph x={96} y={80} scale={1} />                 다 그려진 기본 그래프(노드 19 · 엣지 22). 화면의 60% 폭이면 scale 0.88
//   appear={{ order: cue("s4.2"), derives: t }}            그 프레임에 등장(노드는 떠오르고 엣지는 from→to 로 그려진다). 없는 id 는 처음부터 있다
//   vanish={{ p_stats: t }}                                그 프레임에 사라진다
//   hi={[{ ids: ["order"], color: color.human, at, out, ring, fill, blink }]}   강조. color 를 빼면 제 색으로 또렷해지기만 한다. 강조된 것은 dim 을 이긴다
//   dim={[{ at, to: 0.25 }]}  dim={[{ ids: [...], at, out }]}                   흐리게. ids 를 빼면 전부
//   looks={[{ look: "plain", until: t }, { ids: TAG_EDGES, look: "ghost" }]}    선의 모양을 바꾼다: own | plain(흰 가는 선) | ghost(빈 점선 자국)
//                                                          | extract | tag | proposed | problem. ids 를 빼면 모든 엣지. 노드 id 도 받는다(ghost = 회색)
//   walks={[{ at, steps: [{ edges: ["impl_field", "ver_host"], reverse: true }, ["writes_gc"]], color }]}
//                                                          질의가 걸어가는 빛. 단계마다 엣지를 따라 흐르고 닿은 노드가 켜진다. reverse = 화살표를 거슬러
//   add={["full", "fw_role", "impl_policy", "p_gc"]}       미리 놓아 둔 선택 노드·엣지(OPTIONAL_*)를 더한다. hide 로 빼고, show 로 그릴 것을 직접 정한다
//   extraNodes / extraEdges                                새 노드·엣지. 같은 id 를 주면 기본 것을 덮어쓴다(자리·라벨 고치기). pts 없는 엣지는 직각으로 자동 연결
//   text={{ policy_init: "rcv::policy_setup" }} subText={{ field: "= 0", ac1: null }}   라벨·작은 글자 바꾸기
//   nodeLabels / edgeLabels / subs / bands={false}         작게 쓸 때 글자와 띠를 끈다. bands={프레임} 은 그때 띠가 나타난다
// 화면에 꼬리표를 붙일 자리: place(view, gx, gy), nodeRect(id), edgeLabelAt(id). view = { x, y, scale }.
// id 목록: NODES, EDGES, BASE_IDS, EXTRACT_EDGES, TAG_EDGES, JIRA_EDGES.

import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, clamp01, ease, lerp, progress } from "../../../video/anim";
import { Trace, pointOnTrace, traceLength } from "../../../video/components/Trace";
import type { Pt } from "../../../video/components/Trace";
import { MONO, SANS } from "../../../fonts";
import { color, stroke, withAlpha } from "../../../video/theme";

export const GRAPH = { w: 1300, h: 810 } as const;

export type NodeKind = "clause" | "issue" | "field" | "reg" | "module" | "assertion" | "csymbol" | "func" | "test" | "exec";
export type EdgeOrigin = "extract" | "tag" | "proposed";
export type Look = "own" | "plain" | "ghost" | "extract" | "tag" | "proposed" | "problem";

export type GNode = {
  id: string;
  kind: NodeKind;
  label: string;
  /** 가운데 좌표(그래프 좌표). test · exec 은 원의 가운데 */
  x: number;
  y: number;
  w: number;
  h: number;
  /** 라벨 글자 크기. 기본 26 */
  px?: number;
  /** 작은 글자와 그 자리(그래프 좌표) */
  sub?: { text: string; x: number; y: number; anchor?: "start" | "middle" | "end" };
  /** 문제 쪽 노드(붉은색) */
  problem?: boolean;
  /** 강조하기 전에는 흐리게 있는 노드 (BUG-2317, VER-640 FAIL) */
  faint?: boolean;
  /** exec 의 판정 */
  status?: "pass" | "fail";
};

export type GEdge = {
  id: string;
  from: string;
  to: string;
  /** 선 가운데에 적는 이름. null 이면 적지 않는다 */
  rel: string | null;
  origin: EdgeOrigin;
  /** 지나는 꼭짓점(그래프 좌표, from 쪽에서 to 쪽으로). 없으면 자동 */
  pts?: readonly Pt[];
  labelAt?: Pt;
  labelAnchor?: "start" | "middle" | "end";
  problem?: boolean;
};

// ── 노드 ────────────────────────────────────────────────────────────────
const chip = (id: string, y: number, more: Partial<GNode> = {}): GNode => ({ id, kind: "issue", label: id, x: 114, y, w: 160, h: 42, ...more });

export const NODES: readonly GNode[] = [
  // 왼쪽 세로 띠 JIRA
  chip("REQ-207", 70),
  chip("FEAT-338", 192),
  chip("VER-541", 530),
  chip("VER-542", 600),
  chip("VER-543", 670),
  chip("BUG-2317", 735, { faint: true }),
  // 가운데 세로축: 조항 → 조항 → field
  { id: "ac1", kind: "clause", label: "REQ-QOS-07#AC-1", x: 746, y: 70, w: 290, h: 56, sub: { text: "고객 요구서 §4.2", x: 891, y: 24, anchor: "end" } },
  { id: "order", kind: "clause", label: "HSI-RCV-010#order", x: 746, y: 210, w: 400, h: 76, px: 30 },
  { id: "field", kind: "field", label: "PRIOQ_CFG.HOST_BURST", x: 751, y: 370, w: 330, h: 56, px: 24, sub: { text: "[3:0] reset 4", x: 772, y: 322 } },
  // 가운데 아래 왼쪽: HW
  { id: "prio_q", kind: "module", label: "prio_q", x: 365, y: 455, w: 150, h: 46 },
  { id: "a_host_first", kind: "assertion", label: "a_host_first", x: 418, y: 530, w: 256, h: 46 },
  { id: "a_gc_no_starve", kind: "assertion", label: "a_gc_no_starve", x: 418, y: 600, w: 256, h: 46 },
  // 가운데 아래 오른쪽: FW
  { id: "set_host_burst", kind: "csymbol", label: "set_host_burst", x: 1080, y: 455, w: 260, h: 46, sub: { text: "header · 생성물", x: 1210, y: 418, anchor: "end" } },
  { id: "policy_init", kind: "func", label: "rcv::policy_init", x: 1125, y: 530, w: 350, h: 46 },
  { id: "throttle_update", kind: "func", label: "gc::throttle_update", x: 1125, y: 600, w: 350, h: 46 },
  { id: "stats_dump", kind: "func", label: "rcv::stats_dump", x: 1125, y: 670, w: 350, h: 46 },
  // 맨 아래 가로 띠: 검증 · 증거
  { id: "pass", kind: "exec", label: "VER-631 PASS", x: 250, y: 768, w: 28, h: 28, status: "pass" },
  { id: "ratio_test", kind: "test", label: "prio_q_ratio_test", x: 566, y: 768, w: 28, h: 28 },
  { id: "fail", kind: "exec", label: "VER-640 FAIL", x: 900, y: 768, w: 28, h: 28, status: "fail", problem: true, faint: true },
];

/** 기본 그래프에는 없고 add 로 더하는 노드 (s8, s11, s12 …) */
export const OPTIONAL_NODES: readonly GNode[] = [
  { id: "full", kind: "clause", label: "#full", x: 1110, y: 200, w: 200, h: 44 },
  { id: "fw_role", kind: "clause", label: "#fw_role", x: 1110, y: 256, w: 200, h: 46 },
  { id: "a_full_gc_bp", kind: "assertion", label: "a_full_gc_bp", x: 418, y: 670, w: 256, h: 46 },
  { id: "arch", kind: "clause", label: "rcv.arch.yaml#prio_q.order", x: 1125, y: 70, w: 350, h: 50, px: 20, sub: { text: "값의 원본 · 모델이 여기서 파생", x: 1125, y: 112, anchor: "middle" } },
  { id: "adr", kind: "clause", label: "ADR-RCV-003", x: 1090, y: 156, w: 220, h: 44 },
];

// ── 엣지 ────────────────────────────────────────────────────────────────
const TRUNK = 566; // verifies 가 올라가는 세로선
const testsBus = (y: number): Pt[] => [
  [34, y - 8],
  [22, y - 8],
  [22, 192],
  [34, 192],
];
const resultBus = (y: number): Pt[] => [
  [236, 768],
  [10, 768],
  [10, y + 12],
  [34, y + 12],
];

export const EDGES: readonly GEdge[] = [
  // ① 유도
  { id: "derives", from: "order", to: "ac1", rel: "derives_from", origin: "tag", pts: [[746, 172], [746, 98]], labelAt: [746, 135] },
  // ② 구현
  { id: "impl_field", from: "field", to: "order", rel: "implements", origin: "tag", pts: [[746, 342], [746, 248]], labelAt: [746, 294] },
  { id: "impl_prio_q", from: "prio_q", to: "order", rel: "implements", origin: "tag", pts: [[340, 432], [340, 232], [546, 232]], labelAt: [443, 232] },
  // ③ 검증
  { id: "ver_host", from: "a_host_first", to: "order", rel: "verifies", origin: "tag", pts: [[546, 530], [TRUNK, 530], [TRUNK, 248]], labelAt: [TRUNK, 294] },
  { id: "ver_gc", from: "a_gc_no_starve", to: "order", rel: "verifies", origin: "tag", pts: [[546, 600], [TRUNK, 600], [TRUNK, 248]], labelAt: [TRUNK, 294] },
  { id: "ver_test", from: "ratio_test", to: "order", rel: "verifies", origin: "tag", pts: [[TRUNK, 754], [TRUNK, 248]], labelAt: [TRUNK, 294] },
  // ④ 읽기 · 쓰기 · 생성
  { id: "reads_prio_q", from: "prio_q", to: "field", rel: "reads", origin: "extract", pts: [[440, 455], [610, 455], [610, 398]], labelAt: [500, 455] },
  { id: "gen_shb", from: "set_host_burst", to: "field", rel: "generated_from", origin: "extract", pts: [[950, 455], [730, 455], [730, 398]], labelAt: [840, 455] },
  { id: "writes_policy", from: "policy_init", to: "field", rel: "writes", origin: "extract", pts: [[950, 530], [700, 530], [700, 398]], labelAt: [825, 530] },
  { id: "writes_gc", from: "throttle_update", to: "field", rel: "writes", origin: "extract", pts: [[950, 600], [670, 600], [670, 398]], labelAt: [810, 600] },
  { id: "reads_stats", from: "stats_dump", to: "field", rel: "reads", origin: "extract", pts: [[950, 670], [640, 670], [640, 398]], labelAt: [795, 670] },
  // ⑤ Jira 와 가운데를 잇는 tracks
  { id: "trk_req", from: "REQ-207", to: "ac1", rel: "tracks", origin: "extract", pts: [[194, 70], [601, 70]], labelAt: [400, 70] },
  { id: "trk_feat", from: "FEAT-338", to: "order", rel: "tracks", origin: "extract", pts: [[194, 192], [546, 192]], labelAt: [272, 192] },
  { id: "trk_541", from: "VER-541", to: "a_host_first", rel: "tracks", origin: "extract", pts: [[194, 530], [290, 530]], labelAt: [247, 530] },
  { id: "trk_542", from: "VER-542", to: "a_gc_no_starve", rel: "tracks", origin: "extract", pts: [[194, 600], [290, 600]], labelAt: [247, 600] },
  { id: "trk_543", from: "VER-543", to: "ratio_test", rel: "tracks", origin: "extract", pts: [[194, 670], [270, 670], [270, 712], [505, 712], [505, 768], [552, 768]], labelAt: [390, 712] },
  // Jira 띠 안의 링크
  { id: "jira_impl", from: "FEAT-338", to: "REQ-207", rel: "Implements", origin: "extract", pts: [[114, 171], [114, 91]], labelAt: [114, 131] },
  { id: "tests_541", from: "VER-541", to: "FEAT-338", rel: "Tests", origin: "extract", pts: testsBus(530), labelAt: [32, 360], labelAnchor: "start" },
  { id: "tests_542", from: "VER-542", to: "FEAT-338", rel: "Tests", origin: "extract", pts: testsBus(600), labelAt: [32, 360], labelAnchor: "start" },
  { id: "tests_543", from: "VER-543", to: "FEAT-338", rel: "Tests", origin: "extract", pts: testsBus(670), labelAt: [32, 360], labelAnchor: "start" },
  // 실행 결과
  { id: "res_541", from: "pass", to: "VER-541", rel: "result", origin: "extract", pts: resultBus(530), labelAt: [126, 768] },
  { id: "res_542", from: "pass", to: "VER-542", rel: "result", origin: "extract", pts: resultBus(600), labelAt: [126, 768] },
];

/** 기본 그래프에는 없고 add 로 더하는 엣지 */
export const OPTIONAL_EDGES: readonly GEdge[] = [
  // 버그가 관측된 field (s5.2 에서 잠깐, s13 에서 다시)
  { id: "observed", from: "BUG-2317", to: "field", rel: "observed_at", origin: "extract", problem: true, pts: [[194, 735], [204, 735], [204, 370], [586, 370]], labelAt: [450, 370] },
  // rcv::policy_init 의 태그 (s5.3, s7.4)
  { id: "impl_policy", from: "policy_init", to: "fw_role", rel: "implements", origin: "tag", pts: [[1250, 507], [1250, 248], [1210, 248]], labelAt: [1250, 336] },
  // 에이전트의 링크 후보 1 · 2 · 3 (s8)
  { id: "p_stats", from: "stats_dump", to: "fw_role", rel: "proposed", origin: "proposed", pts: [[1300, 682], [1307, 682], [1307, 266], [1210, 266]], labelAt: [1306, 310], labelAnchor: "end" },
  { id: "p_gc", from: "throttle_update", to: "order", rel: "proposed", origin: "proposed", pts: [[950, 588], [930, 588], [930, 248]], labelAt: [930, 414] },
  { id: "p_full", from: "a_full_gc_bp", to: "full", rel: "proposed", origin: "proposed", pts: [[546, 670], [582, 670], [582, 308], [980, 308], [980, 200], [1010, 200]], labelAt: [880, 308] },
  // 위쪽으로 이어지는 유도 (s11.6)
  { id: "derives_arch", from: "order", to: "arch", rel: null, origin: "tag", pts: [[918, 172], [918, 70], [950, 70]] },
  { id: "derives_adr", from: "order", to: "adr", rel: null, origin: "tag", pts: [[934, 172], [934, 156], [980, 156]] },
];

export const BASE_NODE_IDS: readonly string[] = NODES.map((n) => n.id);
export const BASE_EDGE_IDS: readonly string[] = EDGES.map((e) => e.id);
export const BASE_IDS: readonly string[] = [...BASE_NODE_IDS, ...BASE_EDGE_IDS];
/** 도구가 추출하는 엣지(청록) */
export const EXTRACT_EDGES: readonly string[] = EDGES.filter((e) => e.origin === "extract").map((e) => e.id);
/** 사람이 태그로 적는 엣지(호박색): derives, impl_*, ver_* */
export const TAG_EDGES: readonly string[] = EDGES.filter((e) => e.origin === "tag").map((e) => e.id);
/** Jira 에서 오는 엣지: tracks, Implements, Tests, result */
export const JIRA_EDGES: readonly string[] = EDGES.filter((e) => /^(trk_|jira_|tests_|res_)/.test(e.id)).map((e) => e.id);

const ALL_NODES: readonly GNode[] = [...NODES, ...OPTIONAL_NODES];
const ALL_EDGES: readonly GEdge[] = [...EDGES, ...OPTIONAL_EDGES];

// ── 좌표 도우미 ─────────────────────────────────────────────────────────
export type GraphView = { x: number; y: number; scale?: number };

/** 그래프 좌표 → 화면 좌표 */
export const place = (view: GraphView, gx: number, gy: number): [number, number] => [view.x + gx * (view.scale ?? 1), view.y + gy * (view.scale ?? 1)];

const labelWidth = (n: GNode): number => n.label.length * (n.px ?? 26) * 0.6;

/** 노드가 차지하는 사각형(그래프 좌표). test · exec 은 원과 옆의 라벨을 합친 범위 */
export const nodeRect = (id: string, extra: readonly GNode[] = []): { x: number; y: number; w: number; h: number; cx: number; cy: number } => {
  const n = [...extra, ...ALL_NODES].find((v) => v.id === id);
  if (!n) throw new Error(`graph node ${id} does not exist`);
  if (n.kind === "test" || n.kind === "exec") return { x: n.x - 14, y: n.y - 14, w: 28 + 10 + labelWidth(n), h: 28, cx: n.x, cy: n.y };
  return { x: n.x - n.w / 2, y: n.y - n.h / 2, w: n.w, h: n.h, cx: n.x, cy: n.y };
};

const boxOf = (n: GNode) => ({ l: n.x - n.w / 2, r: n.x + n.w / 2, t: n.y - n.h / 2, b: n.y + n.h / 2 });

/** pts 가 없는 엣지의 직각 경로 */
const autoPts = (a: GNode, b: GNode): Pt[] => {
  const A = boxOf(a);
  const B = boxOf(b);
  if (Math.abs(a.x - b.x) < 24 || (a.x > B.l + 12 && a.x < B.r - 12)) return b.y < a.y ? [[a.x, A.t], [a.x, B.b]] : [[a.x, A.b], [a.x, B.t]];
  if (Math.abs(a.y - b.y) < 16 || (a.y > B.t && a.y < B.b)) return b.x > a.x ? [[A.r, a.y], [B.l, a.y]] : [[A.l, a.y], [B.r, a.y]];
  return [
    [a.x, b.y < a.y ? A.t : A.b],
    [a.x, b.y],
    [b.x > a.x ? B.l : B.r, b.y],
  ];
};

const midOfLongest = (pts: readonly Pt[]): Pt => {
  let best = 0;
  let at: Pt = pts[0];
  for (let i = 1; i < pts.length; i++) {
    const len = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (len > best) {
      best = len;
      at = [(pts[i][0] + pts[i - 1][0]) / 2, (pts[i][1] + pts[i - 1][1]) / 2];
    }
  }
  return at;
};

/** 엣지 이름이 적히는 자리(그래프 좌표). 꼬리표를 붙일 때 쓴다 */
export const edgeLabelAt = (id: string): Pt => {
  const e = ALL_EDGES.find((v) => v.id === id);
  if (!e) throw new Error(`graph edge ${id} does not exist`);
  return e.labelAt ?? midOfLongest(e.pts ?? []);
};

// ── 색 ──────────────────────────────────────────────────────────────────
const blend = (a: string, b: string, t: number): string => {
  const x = parseInt(a.slice(1), 16);
  const y = parseInt(b.slice(1), 16);
  const k = clamp01(t);
  const ch = (s: number): number => {
    const u = (x >> s) & 255;
    const v = (y >> s) & 255;
    return Math.round(u + (v - u) * k);
  };
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`;
};

const nodeOwnColor = (n: GNode): string => (n.problem ? color.problem : n.kind === "clause" ? color.human : n.kind === "issue" ? color.ink : color.agent);

type EdgeStyle = { c: string; w: number; dash?: string; arrow: number; label: number };
const lookStyle = (look: Look, e: GEdge): EdgeStyle => {
  const own: Look = look === "own" ? (e.problem ? "problem" : e.origin) : look;
  switch (own) {
    case "plain":
      return { c: color.inkSoft, w: stroke.thin, arrow: 1, label: 1 };
    case "ghost":
      return { c: color.inkDim, w: stroke.thin, dash: "4 8", arrow: 0, label: 0 };
    case "tag":
      return { c: color.human, w: 4, arrow: 1, label: 1 };
    case "proposed":
      return { c: color.agent, w: stroke.thin, dash: "9 7", arrow: 1, label: 1 };
    case "problem":
      return { c: color.problem, w: stroke.trace, arrow: 1, label: 1 };
    default:
      return { c: color.agent, w: stroke.thin, arrow: 1, label: 1 };
  }
};
const lookNodeColor = (look: Look, n: GNode): string =>
  look === "ghost" ? color.lineStrong : look === "plain" ? color.inkSoft : look === "problem" ? color.problem : look === "tag" ? color.human : look === "extract" || look === "proposed" ? color.agent : nodeOwnColor(n);

// ── props ───────────────────────────────────────────────────────────────
export type Hi = {
  ids: readonly string[];
  /** 강조 색. 없으면 제 색 그대로 또렷해진다 */
  color?: string;
  at?: number;
  out?: number;
  /** 노드 안을 색으로 채운다 */
  fill?: boolean;
  /** 노드 둘레에 고리를 두른다 */
  ring?: boolean;
  /** 깜박인다 */
  blink?: boolean;
};
export type Dim = { ids?: readonly string[]; at?: number; out?: number; /** 흐려진 뒤의 투명도. 기본 0.25 */ to?: number };
export type LookRule = { ids?: readonly string[]; look: Look; /** 이 프레임부터 */ at?: number; /** 이 프레임까지 */ until?: number };
export type WalkStep = readonly string[] | { edges: readonly string[]; reverse?: boolean };
export type Walk = {
  at: number;
  steps: readonly WalkStep[];
  /** 한 단계의 길이(프레임). 기본 18 */
  gap?: number;
  color?: string;
  /** 모든 단계를 화살표 반대 방향으로 */
  reverse?: boolean;
  /** 이 프레임에 빛이 꺼진다. 없으면 켜진 채 남는다 */
  out?: number;
};

export type TraceGraphProps = {
  x?: number;
  y?: number;
  scale?: number;
  /** 그릴 노드·엣지 id. 기본 BASE_IDS */
  show?: readonly string[];
  /** 기본에 더할 선택 노드·엣지 id */
  add?: readonly string[];
  hide?: readonly string[];
  extraNodes?: readonly GNode[];
  extraEdges?: readonly GEdge[];
  /** id → 등장 프레임. 없는 id 는 다 그려진 상태 */
  appear?: Readonly<Record<string, number>>;
  /** id → 사라지는 프레임 */
  vanish?: Readonly<Record<string, number>>;
  hi?: readonly Hi[];
  dim?: readonly Dim[];
  looks?: readonly LookRule[];
  walks?: readonly Walk[];
  /** 노드 라벨 바꾸기 */
  text?: Readonly<Record<string, string>>;
  /** 작은 글자 바꾸기. null 이면 지운다 */
  subText?: Readonly<Record<string, string | null>>;
  nodeLabels?: boolean;
  edgeLabels?: boolean;
  subs?: boolean;
  /** 띠(JIRA, 문서 · 조항, HW, FW, 검증 · 증거). 숫자면 그 프레임에 나타난다 */
  bands?: boolean | number;
  opacity?: number;
};

const FONT_MONO = `"${MONO}", "${SANS}"`;
const mix = (items: readonly { k: number; c?: string }[], base: string): string => items.reduce((c, it) => (it.c ? blend(c, it.c, it.k) : c), base);

export const TraceGraph: React.FC<TraceGraphProps> = ({
  x = 0,
  y = 0,
  scale = 1,
  show,
  add = [],
  hide = [],
  extraNodes = [],
  extraEdges = [],
  appear = {},
  vanish = {},
  hi = [],
  dim = [],
  looks = [],
  walks = [],
  text = {},
  subText = {},
  nodeLabels = true,
  edgeLabels = true,
  subs = true,
  bands = true,
  opacity = 1,
}) => {
  const frame = useCurrentFrame();

  const extraIds = new Set([...extraNodes.map((n) => n.id), ...extraEdges.map((e) => e.id)]);
  const wanted = new Set<string>([...(show ?? BASE_IDS), ...add, ...extraIds]);
  for (const id of hide) wanted.delete(id);
  const nodeList = [...extraNodes, ...ALL_NODES.filter((n) => !extraIds.has(n.id))].filter((n) => wanted.has(n.id));
  const nodeById = new Map<string, GNode>([...ALL_NODES, ...extraNodes].map((n) => [n.id, n]));
  const edgeList = [...ALL_EDGES.filter((e) => !extraIds.has(e.id)), ...extraEdges].filter((e) => wanted.has(e.id));
  const edgeById = new Map<string, GEdge>([...ALL_EDGES, ...extraEdges].map((e) => [e.id, e]));
  const ptsOf = (e: GEdge): readonly Pt[] => {
    if (e.pts) return e.pts;
    const a = nodeById.get(e.from);
    const b = nodeById.get(e.to);
    return a && b ? autoPts(a, b) : [];
  };

  // 걸어가는 빛: 엣지마다 진행값, 닿는 노드마다 켜진 정도
  type Lit = { k: number; c?: string; fill?: boolean; ring?: boolean; blink?: boolean };
  const walkEdges: { e: GEdge; p: number; fade: number; c: string; reverse: boolean }[] = [];
  const walkNode = new Map<string, Lit[]>();
  const walkEdgeK = new Map<string, number>();
  for (const wk of walks) {
    const gap = wk.gap ?? 18;
    const c = wk.color ?? color.ink;
    const fade = wk.out === undefined ? 1 : 1 - progress(frame, wk.out, 12, ease.in);
    wk.steps.forEach((step, i) => {
      const ids = Array.isArray(step) ? (step as readonly string[]) : (step as { edges: readonly string[] }).edges;
      const reverse = (Array.isArray(step) ? undefined : (step as { reverse?: boolean }).reverse) ?? wk.reverse ?? false;
      const start = wk.at + i * gap;
      const p = progress(frame, start, gap, ease.inOut);
      if (p <= 0) return;
      for (const id of ids) {
        const e = edgeById.get(id);
        if (!e) continue;
        walkEdges.push({ e, p, fade, c, reverse });
        walkEdgeK.set(id, Math.max(walkEdgeK.get(id) ?? 0, p * fade));
        const dest = reverse ? e.from : e.to;
        const arrive = progress(frame, start + gap - 6, 10) * fade;
        if (arrive > 0) walkNode.set(dest, [...(walkNode.get(dest) ?? []), { k: arrive, c }]);
      }
    });
  }

  const litOf = (id: string): Lit[] => {
    const out: Lit[] = [];
    for (const h of hi) {
      if (!h.ids.includes(id)) continue;
      let k = h.at === undefined ? 1 : progress(frame, h.at, 12);
      if (h.out !== undefined) k *= 1 - progress(frame, h.out, 12, ease.in);
      if (k <= 0) continue;
      if (h.blink) k *= 0.55 + 0.45 * Math.cos(((frame - (h.at ?? 0)) / 22) * Math.PI * 2);
      out.push({ k, c: h.color, fill: h.fill, ring: h.ring, blink: h.blink });
    }
    return [...out, ...(walkNode.get(id) ?? [])];
  };

  const appearP = (id: string, dur: number, easing = ease.out): number => (appear[id] === undefined ? 1 : progress(frame, appear[id], dur, easing));
  const goneP = (id: string): number => (vanish[id] === undefined ? 0 : progress(frame, vanish[id], 12, ease.in));

  const dimOf = (id: string): number => {
    let op = 1;
    for (const d of dim) {
      if (d.ids && !d.ids.includes(id)) continue;
      let k = d.at === undefined ? 1 : progress(frame, d.at, 14, ease.inOut);
      if (d.out !== undefined) k *= 1 - progress(frame, d.out, 14, ease.inOut);
      op = Math.min(op, lerp(1, d.to ?? 0.25, k));
    }
    return op;
  };

  const rulesFor = (id: string, isEdge: boolean): { look: Look; k: number }[] => {
    const out: { look: Look; k: number }[] = [];
    for (const r of looks) {
      if (r.ids ? !r.ids.includes(id) : !isEdge) continue;
      let k = r.at === undefined ? 1 : progress(frame, r.at, 14, ease.inOut);
      if (r.until !== undefined) k *= 1 - progress(frame, r.until, 14, ease.inOut);
      if (k > 0) out.push({ look: r.look, k });
    }
    return out;
  };

  const bandP = bands === false ? 0 : bands === true ? 1 : progress(frame, bands, DUR.enter);

  // ── 엣지 ──
  const edgeEls: React.ReactNode[] = [];
  const labelEls: React.ReactNode[] = [];
  const seenLabel = new Set<string>();
  for (const e of edgeList) {
    const pts = ptsOf(e);
    if (pts.length < 2) continue;
    const drawn = appearP(e.id, DUR.draw + 4, ease.inOut);
    const gone = goneP(e.id);
    if (drawn <= 0 || gone >= 1) continue;
    let st = lookStyle("own", e);
    for (const r of rulesFor(e.id, true)) {
      const t = lookStyle(r.look, e);
      st = { c: blend(st.c, t.c, r.k), w: lerp(st.w, t.w, r.k), dash: r.k >= 0.5 ? t.dash : st.dash, arrow: lerp(st.arrow, t.arrow, r.k), label: lerp(st.label, t.label, r.k) };
    }
    const lit = litOf(e.id);
    const litK = Math.max(0, ...lit.map((l) => l.k), walkEdgeK.get(e.id) ?? 0);
    const c = mix(lit, st.c);
    const w = st.w + (lit.length ? 1.2 * Math.max(...lit.map((l) => l.k)) : 0);
    const op = (1 - gone) * lerp(dimOf(e.id), 1, clamp01(litK));
    edgeEls.push(<Trace key={e.id} pts={pts} stroke={c} width={w} dash={st.dash} arrow={st.arrow > 0.5} chamfer={6} progress={drawn} opacity={op} />);
    if (edgeLabels && e.rel && st.label > 0) {
      const at = e.labelAt ?? midOfLongest(pts);
      const anchor = e.labelAnchor ?? "middle";
      const lp = progress(frame, (appear[e.id] ?? -100) + DUR.draw - 2, 10) * st.label * op;
      const key = `${e.rel}@${at[0]},${at[1]}`;
      if (lp > 0 && !(seenLabel.has(key) && lp >= 1)) {
        if (lp >= 1) seenLabel.add(key);
        const tw = e.rel.length * 12 + 12;
        const x0 = anchor === "middle" ? at[0] - tw / 2 : anchor === "start" ? at[0] - 4 : at[0] - tw + 4;
        labelEls.push(
          <g key={`l-${e.id}`} opacity={lp}>
            <rect x={x0} y={at[1] - 12} width={tw} height={24} fill={color.bg} />
            <text x={at[0]} y={at[1] + 1} textAnchor={anchor} dominantBaseline="central" fontFamily={FONT_MONO} fontSize={20} fontWeight={500} fill={blend(c, color.inkSoft, 0.25)}>
              {e.rel}
            </text>
          </g>,
        );
      }
    }
  }

  // ── 걸어가는 빛 ──
  const walkEls: React.ReactNode[] = [];
  walkEdges.forEach(({ e, p, fade, c, reverse }, i) => {
    if (!wanted.has(e.id)) return;
    const base = ptsOf(e);
    if (base.length < 2) return;
    const pts = reverse ? base.slice().reverse() : base;
    walkEls.push(<Trace key={`w${i}`} pts={pts} stroke={c} width={4.5} chamfer={6} progress={p} opacity={fade * 0.95} />);
    if (p < 1) {
      const head = pointOnTrace(pts, traceLength(pts, 6) * p, 6);
      walkEls.push(<circle key={`h${i}`} cx={head.x} cy={head.y} r={8} fill={c} opacity={fade} />);
      walkEls.push(<circle key={`g${i}`} cx={head.x} cy={head.y} r={16} fill={c} opacity={0.25 * fade} />);
    }
  });

  // ── 노드 ──
  const nodeEls: React.ReactNode[] = [];
  for (const n of nodeList) {
    const shownP = appearP(n.id, DUR.enter);
    const gone = goneP(n.id);
    if (shownP <= 0 || gone >= 1) continue;
    const lit = litOf(n.id);
    const litK = clamp01(Math.max(0, ...lit.map((l) => l.k)));
    let own = nodeOwnColor(n);
    for (const r of rulesFor(n.id, false)) own = blend(own, lookNodeColor(r.look, n), r.k);
    const c = mix(lit, own);
    const fillK = Math.max(0, ...lit.filter((l) => l.fill).map((l) => l.k));
    const ringK = Math.max(0, ...lit.filter((l) => l.ring).map((l) => l.k));
    const baseOp = n.faint ? 0.34 : 1;
    const op = shownP * (1 - gone) * lerp(Math.min(baseOp, dimOf(n.id)), 1, litK);
    const sw = (n.id === "order" ? stroke.trace : stroke.thin) + 1.2 * litK;
    const fill = blend(blend(color.panel, own, 0.06), c, 0.14 * litK + 0.5 * fillK);
    const px = n.px ?? 26;
    const label = text[n.id] ?? n.label;
    const B = boxOf(n);
    const dy = (1 - shownP) * 10;
    const labelFill = blend(color.ink, c, n.kind === "clause" || n.problem ? 0.35 : 0.12 + 0.3 * litK);
    let shape: React.ReactNode;
    let labelX = n.x;
    let anchor: "start" | "middle" = "middle";
    if (n.kind === "clause") {
      const f = Math.min(16, n.h * 0.3);
      shape = (
        <>
          <path d={`M ${B.l} ${B.t} H ${B.r - f} L ${B.r} ${B.t + f} V ${B.b} H ${B.l} Z`} fill={fill} stroke={c} strokeWidth={sw} strokeLinejoin="miter" />
          <path d={`M ${B.r - f} ${B.t} V ${B.t + f} H ${B.r}`} fill="none" stroke={c} strokeWidth={stroke.hair} />
        </>
      );
    } else if (n.kind === "issue") {
      shape = <rect x={B.l} y={B.t} width={n.w} height={n.h} rx={n.h / 2} fill={fill} stroke={c} strokeWidth={sw} />;
    } else if (n.kind === "field" || n.kind === "reg") {
      const s = 26;
      shape = (
        <>
          <rect x={B.l} y={B.t} width={n.w} height={n.h} fill={fill} stroke={c} strokeWidth={sw} />
          <path d={`M ${B.l + s} ${B.t} V ${B.b} M ${B.l} ${B.t + n.h / 3} H ${B.l + s} M ${B.l} ${B.t + (2 * n.h) / 3} H ${B.l + s}`} fill="none" stroke={c} strokeWidth={stroke.hair} />
          <rect x={B.l + 1} y={B.t + n.h / 3} width={s - 1} height={n.h / 3} fill={withAlpha(c, 0.45)} />
        </>
      );
      labelX = n.x + s / 2;
    } else if (n.kind === "module" || n.kind === "assertion") {
      const q = 8;
      shape = (
        <>
          <rect x={B.l} y={B.t} width={n.w} height={n.h} fill={fill} stroke={c} strokeWidth={sw} />
          {n.kind === "assertion" ? (
            <g fill={c}>
              <rect x={B.r - 2 * q - 2} y={B.t + 2} width={q} height={q} />
              <rect x={B.r - q - 2} y={B.t + 2 + q} width={q} height={q} />
              <rect x={B.r - 3 * q - 2} y={B.t + 2 + q} width={q} height={q} opacity={0.5} />
            </g>
          ) : null}
        </>
      );
    } else if (n.kind === "csymbol" || n.kind === "func") {
      shape = (
        <>
          <rect x={B.l} y={B.t} width={n.w} height={n.h} fill={fill} stroke={c} strokeWidth={sw} />
          {nodeLabels ? (
            <text x={B.l + 8} y={n.y + 1} dominantBaseline="central" fontFamily={FONT_MONO} fontSize={20} fontWeight={700} fill={c}>
              {"{}"}
            </text>
          ) : (
            <path d={`M ${B.l + 12} ${B.t + 8} h -5 v ${n.h - 16} h 5`} fill="none" stroke={c} strokeWidth={stroke.thin} />
          )}
        </>
      );
      labelX = n.x + 16;
    } else {
      const r = 14;
      shape = (
        <>
          <circle cx={n.x} cy={n.y} r={r} fill={n.kind === "exec" ? blend(fill, c, 0.3) : fill} stroke={c} strokeWidth={sw} />
          {n.status === "pass" ? <path d={`M ${n.x - 6} ${n.y} l 4.5 5 l 8 -9.5`} fill="none" stroke={c} strokeWidth={stroke.trace} /> : null}
          {n.status === "fail" ? <path d={`M ${n.x - 5.5} ${n.y - 5.5} l 11 11 M ${n.x + 5.5} ${n.y - 5.5} l -11 11`} fill="none" stroke={c} strokeWidth={stroke.trace} /> : null}
          {n.kind === "test" ? <circle cx={n.x} cy={n.y} r={4.5} fill={c} /> : null}
        </>
      );
      labelX = n.x + r + 10;
      anchor = "start";
    }
    const sub = n.sub && subs && subText[n.id] !== null ? { ...n.sub, text: subText[n.id] ?? n.sub.text } : subText[n.id] && n.sub ? { ...n.sub, text: subText[n.id] as string } : null;
    nodeEls.push(
      <g key={n.id} opacity={op} transform={`translate(0 ${dy})`}>
        {ringK > 0 && n.kind !== "test" && n.kind !== "exec" ? (
          <rect x={B.l - 9} y={B.t - 9} width={n.w + 18} height={n.h + 18} rx={n.kind === "issue" ? n.h / 2 + 9 : 0} fill="none" stroke={c} strokeWidth={stroke.thin} opacity={ringK} />
        ) : null}
        {ringK > 0 && (n.kind === "test" || n.kind === "exec") ? <circle cx={n.x} cy={n.y} r={23} fill="none" stroke={c} strokeWidth={stroke.thin} opacity={ringK} /> : null}
        {shape}
        {nodeLabels ? (
          <text x={labelX} y={n.y + 1} textAnchor={anchor} dominantBaseline="central" fontFamily={FONT_MONO} fontSize={px} fontWeight={n.id === "order" ? 700 : 500} fill={labelFill}>
            {label}
          </text>
        ) : null}
        {nodeLabels && sub ? (
          <text x={sub.x} y={sub.y + 1} textAnchor={sub.anchor ?? "start"} dominantBaseline="central" fontFamily={FONT_MONO} fontSize={22} fontWeight={500} fill={blend(color.inkDim, c, 0.25)}>
            {sub.text}
          </text>
        ) : null}
      </g>,
    );
  }

  const bandText = (tx: number, ty: number, s: string, anchor: "start" | "end" = "start") => (
    <text x={tx} y={ty} textAnchor={anchor} dominantBaseline="central" fontFamily={FONT_MONO} fontSize={22} fontWeight={700} letterSpacing="0.06em" fill={color.inkDim}>
      {s}
    </text>
  );

  return (
    <div style={{ position: "absolute", left: x, top: y, width: GRAPH.w, height: GRAPH.h, transform: `scale(${scale})`, transformOrigin: "0 0", opacity }}>
      <svg width={GRAPH.w} height={GRAPH.h} viewBox={`0 0 ${GRAPH.w} ${GRAPH.h}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {bandP > 0 ? (
          <g opacity={bandP}>
            <rect x={0} y={34} width={200} height={770} fill={withAlpha(color.panel, 0.45)} stroke={color.line} strokeWidth={stroke.hair} />
            <rect x={216} y={734} width={1084} height={70} fill={withAlpha(color.panel, 0.45)} stroke={color.line} strokeWidth={stroke.hair} />
            {nodeLabels ? (
              <>
                {bandText(2, 14, "JIRA")}
                {bandText(546, 14, "문서 · 조항")}
                {bandText(290, 410, "HW")}
                {bandText(1290, 410, "FW", "end")}
                {bandText(1288, 768, "검증 · 증거", "end")}
              </>
            ) : null}
          </g>
        ) : null}
        {edgeEls}
        {labelEls}
        {walkEls}
        {nodeEls}
      </svg>
    </div>
  );
};
