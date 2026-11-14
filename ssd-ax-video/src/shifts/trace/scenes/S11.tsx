import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, ease, lerp, progress } from "../../../video/anim";
import { HumanIcon } from "../../../video/components/Icons";
import { Trace } from "../../../video/components/Trace";
import { color, fullSvg, sans, stroke, withAlpha } from "../../../video/theme";
import { CodePanel, ShiftSheet } from "../../lib";
import { JIRA_EDGES, TraceGraph, place } from "./graph";
import { Box, Note, T, Table, useCues } from "./kitB";

// s11 효과 ① 변경 영향 분석 (이 편의 정점).
// 1) 질의(왼쪽)가 그래프(오른쪽) 위를 걸어간다: #order → 구현·검증 5개 → register 접근 4개.
// 2) 질의가 결과 표로 바뀐다(9행). GC 담당의 태그 없는 함수가 표와 그래프에서 함께 켜진다. 위쪽 조항 셋.
// 3) 그래프가 물러나고 답 둘이 나란히 선다: Jira 의 답(이슈 4건) 대 그래프의 답(9행), 아래에 대비 표.

const V = { x: 868, y: 150, scale: 0.735 } as const;
const HOP1 = ["impl_field", "impl_prio_q", "ver_host", "ver_gc", "ver_test"];
const HOP1_NODES = ["field", "prio_q", "a_host_first", "a_gc_no_starve", "ratio_test"];
const HOP2 = ["reads_prio_q", "gen_shb", "writes_policy", "writes_gc", "reads_stats"];
const HOP2_NODES = ["set_host_burst", "policy_init", "throttle_update", "stats_dump"];
const GAP = 36;
// 결과 표가 덮는 자리(JIRA 띠)의 노드와 엣지
const JIRA_SIDE = ["REQ-207", "FEAT-338", "VER-541", "VER-542", "VER-543", "BUG-2317", "pass", ...JIRA_EDGES];

const RESULT_X = 893; // 3) 에서 결과 표가 옮겨 가는 자리
const ROW_H = 38;

export const S11: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, within } = useCues();
  const t1 = cue("s11.1");
  const t2 = cue("s11.2");
  const t3 = cue("s11.3");
  const t4 = cue("s11.4");
  const t5 = cue("s11.5");
  const t6 = cue("s11.6");
  const t7 = cue("s11.7");

  const startAt = within("s11.2", 0.5);
  const hop1 = t3 + 4;
  const hop2 = within("s11.3", 0.5);
  const restAt = within("s11.3", 0.86);
  const queryOut = t4 - 10;
  const tagAt = within("s11.5", 0.42);
  const up = [within("s11.6", 0.06), within("s11.6", 0.36), within("s11.6", 0.66)];

  // 3) 답 둘이 나란히
  const m7 = progress(frame, t7, DUR.move, ease.inOut);
  const graphOp = 1 - progress(frame, t7 - 2, 14, ease.in);
  const jiraAt = t7 + 10;
  const countAt = within("s11.7", 0.2);
  const vsAt = t7 + 26;
  const listAt = within("s11.7", 0.5);

  const [tagX, tagY] = place(V, 1300, 697);
  const [nx, ny] = place(V, 1290, 600);
  const tagP = progress(frame, tagAt, DUR.enter) * graphOp;
  const tagP2 = progress(frame, vsAt + 6, DUR.enter);
  const gcRowY = 150 + 44 + 8 + 4 * ROW_H + ROW_H / 2;

  return (
    <ShiftSheet>
      <T x={96} y={76} text="효과 ① 변경 영향" px={40} weight={800} at={t1} />
      {/* s3 의 질문이 돌아온다 */}
      <Box x={470} y={74} w={404} h={54} c={color.human} fill={withAlpha(color.human, 0.07)} p={progress(frame, within("s11.1", 0.45), DUR.enter)} style={{ gap: 12 }}>
        <HumanIcon size={30} color={color.human} />
        <div style={{ ...sans(30, 600), whiteSpace: "nowrap" }}>그 4가 어디어디에 있지?</div>
      </Box>

      {/* ── 그래프 ── */}
      <TraceGraph
        {...V}
        opacity={graphOp}
        add={["arch", "adr", "derives_arch", "derives_adr"]}
        appear={{ arch: up[0] - 4, derives_arch: up[0], adr: up[1] - 4, derives_adr: up[1] }}
        dim={[{ to: 0.5 }, { at: t2, to: 0.2 }, { ids: JIRA_SIDE, at: t4 - 8, to: 0.03 }]}
        hi={[
          { ids: ["order"], color: color.human, at: startAt, ring: true },
          { ids: [...HOP1, ...HOP1_NODES], at: hop1 + GAP - 8 },
          { ids: [...HOP2, ...HOP2_NODES], at: hop2 + GAP - 8 },
          { ids: ["throttle_update"], color: color.human, at: t5, out: t6 - 4, blink: true, ring: true },
          { ids: ["throttle_update"], color: color.human, at: t5, ring: true },
          { ids: ["derives_arch", "arch"], at: up[0] + 12 },
          { ids: ["derives_adr", "adr"], at: up[1] + 12 },
          { ids: ["derives", "ac1"], at: up[2] + 12 },
        ]}
        walks={[
          { at: hop1, steps: [{ edges: HOP1, reverse: true }], gap: GAP, out: hop1 + GAP + 14 },
          { at: hop2, steps: [{ edges: HOP2, reverse: true }], gap: GAP, out: hop2 + GAP + 14 },
          { at: up[0], steps: [["derives_arch"]], gap: 24, color: color.human, out: up[0] + 40 },
          { at: up[1], steps: [["derives_adr"]], gap: 24, color: color.human, out: up[1] + 40 },
          { at: up[2], steps: [["derives"]], gap: 24, color: color.human, out: up[2] + 40 },
        ]}
      />
      <svg {...fullSvg}>
        <Trace pts={[[nx, ny], [nx + 6, ny], [nx + 6, tagY]]} stroke={color.human} width={stroke.thin} at={tagAt} opacity={graphOp} />
        <Trace pts={[[RESULT_X + 828, gcRowY], [RESULT_X + 905, gcRowY], [RESULT_X + 905, 572]]} stroke={color.human} width={stroke.thin} at={vsAt + 2} />
      </svg>
      <Note x={tagX} y={tagY} h={40} align="right" text="extract · via: reg · 태그 없음" c={color.human} p={tagP} />

      {/* ── 질의 ── */}
      <CodePanel
        x={96}
        y={150}
        w={688}
        title="CYPHER"
        px={26}
        at={t2}
        out={queryOut}
        lines={[
          { text: "MATCH (c:Clause {id:'HSI-RCV-010#order'})", at: t2 + 6, mark: startAt, unmark: t3, markTone: "human" },
          { text: "      <-[:IMPLEMENTS|VERIFIES]-(s)", at: within("s11.2", 0.25), mark: t3, unmark: hop2, markTone: "human" },
          { text: "OPTIONAL MATCH", at: hop2 - 6 },
          { text: "  (s)<-[:READS|WRITES|GENERATED_FROM]-(u)", at: hop2 - 3, mark: hop2 },
          { text: "WITH collect(DISTINCT s)", at: restAt, tone: "dim" },
          { text: "     + collect(DISTINCT u) AS hit", at: restAt + 2, tone: "dim" },
          { text: "UNWIND hit AS n", at: restAt + 4, tone: "dim" },
          { text: "RETURN DISTINCT labels(n)[0] AS kind,", at: restAt + 6 },
          { text: "       n.name AS name, n.path AS path", at: restAt + 8 },
        ]}
      />

      {/* ── 결과: 9행 ── */}
      <Table
        x={lerp(96, RESULT_X, m7)}
        y={150}
        w={931}
        title="graph@9f3c2e1 (예시) · 9행"
        titlePx={22}
        at={t4}
        px={28}
        rowH={ROW_H}
        owner="agent"
        cols={[{ w: 156, code: true }, { w: 322, code: true }, { w: 421, code: true }]}
        rows={(
          [
            ["Assertion", "a_gc_no_starve", "rtl/rcv/prio_q_sva.sv"],
            ["Assertion", "a_host_first", "rtl/rcv/prio_q_sva.sv"],
            ["CSymbol", "set_host_burst", "fw/include/rcv_ctrl_hsi.hpp"],
            ["Field", "PRIOQ_CFG.HOST_BURST", "hsi/rdl/rcv_ctrl.rdl"],
            ["Func", "gc::throttle_update", "fw/gc/gc_throttle.cpp"],
            ["Func", "rcv::policy_init", "fw/rcv/rcv_policy.cpp"],
            ["Func", "rcv::stats_dump", "fw/rcv/rcv_stats.cpp"],
            ["Module", "prio_q", "rtl/rcv/prio_q.sv"],
            ["Test", "prio_q_ratio_test", "dv/rcv/tests/"],
          ] as const
        ).map(([kind, name, path], i) => ({
          cells: [{ t: kind, c: color.inkDim }, { t: name, weight: i === 4 ? 700 : 500, c: i === 4 && frame >= t5 ? color.human : undefined }, { t: path, c: color.inkSoft }],
          at: t4 + 8 + i * 9,
          ...(i === 4 ? { mark: t5, markC: color.human } : {}),
        }))}
      />
      <Note x={RESULT_X + 931} y={572} align="right" text="extract · via: reg · 태그 없음" c={color.human} p={tagP2} />

      {/* ── Jira 의 답 ── */}
      <Table
        x={96}
        y={150}
        w={640}
        title="JIRA"
        titlePx={22}
        at={jiraAt}
        px={28}
        rowH={ROW_H}
        cols={[{ w: 150, code: true }, { w: 316, code: true }, { w: 130 }]}
        rows={[
          { cells: ["FEAT-338", { t: "우선 큐", code: false }, "구현 중"], at: jiraAt + 6, c: color.inkSoft },
          { cells: ["VER-541", "a_host_first", "승인"], at: jiraAt + 9, c: color.inkSoft },
          { cells: ["VER-542", "a_gc_no_starve", "승인"], at: jiraAt + 12, c: color.inkSoft },
          { cells: ["VER-543", "prio_q_ratio_test", "승인"], at: jiraAt + 15, c: color.inkSoft },
        ]}
      />
      <T x={120} y={384} text="이슈 4건" px={60} weight={800} at={countAt} />
      {/* 그래프의 답을 세면 */}
      <div style={{ position: "absolute", left: lerp(120, RESULT_X + 24, m7), top: 562, display: "flex", gap: 18, ...sans(60, 800), whiteSpace: "nowrap" }}>
        <span style={{ color: color.agent, opacity: progress(frame, within("s11.4", 0.08), DUR.enter) }}>심볼 9</span>
        <span style={{ color: color.agent, opacity: progress(frame, within("s11.4", 0.5), DUR.enter) }}>· 파일 8</span>
        <span style={{ color: color.human, opacity: progress(frame, up[2] + 24, DUR.enter) * (1 - progress(frame, t7 - 4, 8)) }}>· 조항 3</span>
      </div>

      {/* ── 대비 ── */}
      <Table
        x={96}
        y={652}
        w={1728}
        title={"\"host 4 : gc 1 을 바꾸면?\" (예시)"}
        at={vsAt}
        rowH={44}
        cols={[{ w: 204 }, { w: 593 }, { w: 800 }]}
        head={["", "Jira만", "그래프"]}
        rows={[
          { cells: [{ t: "나오는 것", c: color.inkSoft }, { t: "이슈 4건", weight: 700 }, { t: "심볼 9 · 파일 8 · 조항 3", weight: 700, c: color.agent }], at: vsAt + 8, mark: listAt },
          { cells: [{ t: "빠지는 것", c: color.inkSoft }, { t: "FW 함수 · field", c: color.problem }, "태그도 접근도 없는 코드"], at: vsAt + 14 },
          { cells: [{ t: "하는 일", c: color.inkSoft }, "MR을 열어 훑기", "질의 한 번 + 사람 확인"], at: vsAt + 20 },
        ]}
      />
    </ShiftSheet>
  );
};
