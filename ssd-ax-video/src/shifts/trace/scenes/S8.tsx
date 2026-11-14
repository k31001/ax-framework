import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, ease, progress } from "../../../video/anim";
import { AgentIcon, HumanIcon } from "../../../video/components/Icons";
import { Trace } from "../../../video/components/Trace";
import { color, fullSvg, mono, sans, stroke, withAlpha } from "../../../video/theme";
import { CodePanel, ShiftSheet } from "../../lib";
import { TraceGraph } from "./graph";
import type { GEdge } from "./graph";
import { Box, DocPanel, Lane, Note, StepStrip, useCues } from "./kitB";

// s8 채우는 방법 ③ 에이전트 제안, 사람 승인.
// 오른쪽: 그래프. 태그 없는 노드 셋(회색) → 제안 엣지 셋(청록 점선) → 승인된 둘은 호박색 실선, 반려된 하나는 사라진다.
// 왼쪽: 위 AGENT 레인(링크 후보 댓글), 아래 HUMAN 레인(MR 승인 → 코드의 태그 → git, 반려 기록).

const V = { x: 940, y: 140, scale: 0.68 } as const;
const UNTAGGED = ["throttle_update", "stats_dump", "a_full_gc_bp"];

// 승인된 후보: 같은 길을 확정 엣지로 다시 그린다
const CONFIRMED: GEdge[] = [
  { id: "c_gc", from: "throttle_update", to: "order", rel: "implements", origin: "tag", pts: [[950, 588], [930, 588], [930, 248]], labelAt: [930, 418] },
  { id: "c_full", from: "a_full_gc_bp", to: "full", rel: null, origin: "tag", pts: [[546, 670], [582, 670], [582, 308], [980, 308], [980, 200], [1010, 200]] },
  // 후보 2 의 이름표 자리만 옮긴다(field 의 작은 글자와 겹치지 않게)
  { id: "p_gc", from: "throttle_update", to: "order", rel: "proposed", origin: "proposed", pts: [[950, 588], [930, 588], [930, 248]], labelAt: [930, 418] },
];

const LX = 124;

export const S8: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, within } = useCues();
  const t1 = cue("s8.1");
  const t2 = cue("s8.2");
  const t3 = cue("s8.3");
  const t4 = cue("s8.4");
  const t5 = cue("s8.5");
  const t6 = cue("s8.6");

  const agentAt = within("s8.1", 0.52);
  const cardAt = within("s8.2", 0.3);
  const cand = [t3 + 4, t3 + 16, t3 + 28];
  const pairAt = within("s8.3", 0.5);
  const pairOut = t4 - 8;
  const diffAt = within("s8.4", 0.42);
  const okAt = within("s8.4", 0.62);
  const noWriteAt = within("s8.5", 0.2);
  const gitAt = within("s8.5", 0.5);
  const rejAt = within("s8.6", 0.3);
  const dropAt = t6 + 6;

  const pair = progress(frame, pairAt, DUR.enter) * (1 - progress(frame, pairOut, DUR.exit, ease.in));
  const legend = progress(frame, t1 + 16, DUR.enter) * (1 - progress(frame, t5 - 8, DUR.exit, ease.in));
  const rejected = frame >= dropAt;

  return (
    <ShiftSheet>
      <StepStrip active={2} c={color.agent} />

      {/* ── 그래프 ── */}
      <TraceGraph
        {...V}
        add={["full", "fw_role", "a_full_gc_bp", "impl_policy", "p_stats", "p_gc", "p_full"]}
        extraEdges={CONFIRMED}
        appear={{ a_full_gc_bp: t1 + 6, p_stats: cand[0], p_gc: cand[1], p_full: cand[2], c_gc: okAt, c_full: okAt + 8 }}
        vanish={{ p_gc: okAt, p_full: okAt + 8, p_stats: rejAt }}
        looks={[
          { ids: ["throttle_update"], look: "ghost", until: okAt },
          { ids: ["a_full_gc_bp"], look: "ghost", until: okAt + 8 },
          { ids: ["stats_dump"], look: "ghost" },
          { ids: ["p_stats"], look: "ghost", at: dropAt },
        ]}
        dim={[{ ids: ["REQ-207", "FEAT-338", "VER-541", "VER-542", "VER-543", "pass", "ac1"], to: 0.6 }]}
        hi={[
          { ids: UNTAGGED, color: color.inkSoft, at: t1 + 12, out: t2 - 6, blink: true, ring: true },
          { ids: ["p_stats"], at: cand[0], out: cand[0] + 30 },
          { ids: ["p_gc"], at: cand[1], out: cand[1] + 30 },
          { ids: ["p_full"], at: cand[2], out: cand[2] + 30 },
          { ids: ["throttle_update", "c_gc"], color: color.human, at: okAt, out: okAt + 40 },
          { ids: ["a_full_gc_bp", "c_full"], color: color.human, at: okAt + 8, out: okAt + 48 },
        ]}
      />
      <div style={{ position: "absolute", right: 1920 - 1824, top: 132, height: 42, display: "flex", alignItems: "center", gap: 12, opacity: legend, backgroundColor: withAlpha(color.bg, 0.9), padding: "0 4px 0 10px" }}>
        <div style={{ width: 34, height: 22, boxSizing: "border-box", border: `${stroke.thin}px solid ${color.lineStrong}` }} />
        <div style={{ ...sans(30, 600), color: color.inkSoft, whiteSpace: "nowrap" }}>태그 없음</div>
      </div>
      <Note x={1824} y={130} align="right" text="직접 쓰기 없음" c={color.inkSoft} dash p={progress(frame, noWriteAt, DUR.enter)} />

      {/* ── 제안과 확정은 다른 종류의 엣지 ── */}
      <div style={{ position: "absolute", left: 940, top: 716, width: 884, height: 112, boxSizing: "border-box", border: `${stroke.thin}px solid ${color.line}`, backgroundColor: withAlpha(color.panel, 0.92), opacity: pair, translate: `0px ${(1 - pair) * 10}px`, display: "flex", flexDirection: "column", justifyContent: "center", gap: 6, paddingLeft: 22 }}>
        {[
          { code: "-[:IMPLEMENTS {method:'tag'}]->", label: "확정 · 실선", c: color.human, dash: undefined, w: 4 },
          { code: "-[:PROPOSED {relation:'implements'}]->", label: "제안 · 점선", c: color.agent, dash: "9 7", w: stroke.thin },
        ].map((r, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", height: 44, opacity: progress(frame, pairAt + 4 + (1 - i) * 14, 12) }}>
            <div style={{ width: 620, flex: "none", ...mono(26, 500), letterSpacing: "0", whiteSpace: "pre", fontVariantLigatures: "none", color: r.c }}>{r.code}</div>
            <svg width={76} height={20} style={{ flex: "none" }}>
              <line x1={2} y1={10} x2={70} y2={10} stroke={r.c} strokeWidth={r.w} strokeDasharray={r.dash} />
            </svg>
            <div style={{ ...sans(30, 700), whiteSpace: "nowrap", marginLeft: 10 }}>{r.label}</div>
          </div>
        ))}
      </div>

      {/* ── AGENT 레인 ── */}
      <Lane x={96} y={140} w={830} h={416} c={color.agent} label="AGENT" p={progress(frame, agentAt, DUR.enter)} />
      <Box x={LX} y={152} w={700} h={58} c={color.agent} fill={withAlpha(color.agent, 0.1)} p={progress(frame, t2, DUR.enter)} center={false} style={{ gap: 12, paddingLeft: 16 }}>
        <AgentIcon size={32} color={color.agent} />
        <div style={{ ...sans(30, 600), whiteSpace: "nowrap" }}>
          <span style={{ ...mono(28, 700), letterSpacing: "0", color: color.agent }}>trace-agent</span> · 조항 · 코드 · commit 메시지를 읽음
        </div>
      </Box>
      <DocPanel
        x={LX}
        y={228}
        w={772}
        title="[에이전트 · trace-agent · 초안]  FEAT-338"
        at={cardAt}
        px={26}
        owner="agent"
        rows={[
          { full: true, text: "링크 후보 3건 (rcv 블록, 태그 없는 심볼)", at: cardAt + 8 },
          { full: true, text: " 1 rcv::stats_dump      implements? #fw_role", at: cardAt + 16, mark: cand[0], unmark: dropAt, c: rejected ? color.inkDim : undefined },
          { full: true, text: " 2 gc::throttle_update  implements? #order", at: cardAt + 22, mark: cand[1], markC: frame >= okAt ? color.human : color.agent },
          { full: true, text: " 3 a_full_gc_bp         verifies?   #full", at: cardAt + 28, mark: cand[2], markC: frame >= okAt + 8 ? color.human : color.agent },
          { full: true, text: "확인 못 한 것  1번은 관계가 약함", at: cardAt + 36, c: color.inkSoft },
          { full: true, text: "요청  블록 담당: MR !2341 에서 승인 또는 반려", at: cardAt + 44, c: color.human },
        ]}
      />

      {/* ── HUMAN 레인 ── */}
      <Lane x={96} y={610} w={830} h={282} c={color.human} label="HUMAN" p={progress(frame, t4, DUR.enter)} />
      <Box x={LX} y={622} w={470} h={58} c={color.human} fill={withAlpha(color.human, 0.1)} p={progress(frame, t4 + 4, DUR.enter)} center={false} style={{ gap: 12, paddingLeft: 16 }}>
        <HumanIcon size={32} color={color.human} />
        <div style={{ ...sans(30, 600), whiteSpace: "nowrap" }}>블록 담당 · MR !2341 승인</div>
      </Box>
      <CodePanel
        x={LX}
        y={700}
        w={922}
        title="MR !2341 · fw/gc/gc_throttle.cpp"
        px={26}
        at={diffAt}
        out={t6 - 8}
        owner="human"
        lines={[
          { text: "+ // @trace implements HSI-RCV-010#order", tone: "human", mark: okAt - 6, markTone: "human" },
          "  void gc::throttle_update(Bus& bus, uint32_t backlog) {",
        ]}
      />
      <CodePanel
        x={LX}
        y={700}
        w={870}
        title="trace/rejected.yaml"
        px={26}
        at={rejAt}
        owner="human"
        lines={['- {from: rcv::stats_dump, to: "HSI-RCV-010#fw_role",', "   by: FW 복구 담당, why: 로그 출력일 뿐}"]}
      />

      {/* ── 확정은 git 에 ── */}
      <svg {...fullSvg}>
        <Trace pts={[[1056, 779], [1130, 779]]} stroke={color.human} width={stroke.bold} arrow at={gitAt + 6} />
        <Trace pts={[[1220, 729], [1220, 694]]} stroke={color.agent} width={stroke.thin} arrow at={gitAt + 16} />
      </svg>
      <Box x={1130} y={729} w={180} h={100} c={color.human} bw={stroke.bold} fill={withAlpha(color.human, 0.08)} p={progress(frame, gitAt, DUR.enter)}>
        <div style={{ ...mono(48, 700), letterSpacing: "0", color: color.ink }}>git</div>
      </Box>
      <div style={{ position: "absolute", left: 1334, top: 758, ...sans(36, 700), color: color.human, whiteSpace: "nowrap", opacity: progress(frame, gitAt + 10, DUR.enter) }}>확정 = 코드의 태그</div>
    </ShiftSheet>
  );
};
