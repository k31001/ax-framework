import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, ease, lerp, progress } from "../../../video/anim";
import { CheckIcon } from "../../../video/components/Icons";
import { Trace } from "../../../video/components/Trace";
import type { Pt } from "../../../video/components/Trace";
import { color, fullSvg, mono, sans, stroke, withAlpha } from "../../../video/theme";
import { CodePanel, ShiftSheet } from "../../lib";
import { BASE_EDGE_IDS, BASE_NODE_IDS, TraceGraph, edgeLabelAt, place } from "./graph";
import { Box, EdgeTag, Note, StepStrip, T, useCues } from "./kitB";

// s9 채우는 방법 ④ 증분 갱신, 그래프는 파생물.
// 1) main 의 commit 마다 그래프의 일부만 깜박인다 → MR 에서 이름이 바뀌어 링크가 깨진다 → 밤에 전체를 다시 그린다.
// 2) 그래프가 작아져 '파생물' 상자로 들어간다. 원본은 Jira 와 git. 지워도 추출이 다시 만든다.

const P1 = { x: 96, y: 232, scale: 0.76 } as const;
const P2 = { x: 1055, y: 300, scale: 0.5 } as const;
const MAIN_Y = 190;
const DOT_X = [300, 480, 660, 840];
const TOUCHED = [
  ["field", "set_host_burst"],
  ["prio_q", "a_host_first", "a_gc_no_starve"],
  ["policy_init", "stats_dump"],
  ["ratio_test", "VER-543"],
];
const ADD = ["fw_role", "impl_policy"];
const RX = 1110;
const GBOX = { x: 1020, y: 270, w: 720, h: 460 } as const;
const FROM_JIRA: Pt[] = [[610, 375], [800, 375], [800, 440], [GBOX.x, 440]];
const FROM_GIT: Pt[] = [[610, 625], [800, 625], [800, 560], [GBOX.x, 560]];

export const S9: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, within } = useCues();
  const t1 = cue("s9.1");
  const t2 = cue("s9.2");
  const t3 = cue("s9.3");
  const t4 = cue("s9.4");
  const t5 = cue("s9.5");

  const dotAt = [0.12, 0.36, 0.6, 0.84].map((k) => within("s9.1", k));
  const renameAt = within("s9.2", 0.15);
  const breakAt = within("s9.2", 0.36);
  const lintAt = within("s9.2", 0.6);
  const wipeAt = t3 + 4;
  const redrawAt = t3 + 22;
  const sameAt = within("s9.3", 0.82);

  // 1) → 2)
  const out1 = 1 - progress(frame, t4 - 6, DUR.exit, ease.in);
  const mv = progress(frame, t4, DUR.move, ease.inOut);
  const view = { x: lerp(P1.x, P2.x, mv), y: lerp(P1.y, P2.y, mv), scale: lerp(P1.scale, P2.scale, mv) };
  const boxAt = t4 + 10;
  const srcAt = within("s9.4", 0.5);
  const pullAt = within("s9.4", 0.68);
  const backAt = within("s9.4", 0.86);
  const trashAt = t5;
  const regenAt = within("s9.5", 0.5);
  const erased = progress(frame, trashAt + 8, 12, ease.in) * (1 - progress(frame, regenAt + 18, 16));
  const trash = progress(frame, trashAt, DUR.enter) * (1 - progress(frame, regenAt + 10, 10, ease.in));
  const flow = progress(frame, regenAt, 24, ease.inOut);
  const flowFade = 1 - progress(frame, regenAt + 26, 12);

  // 다시 그리기: 노드가 먼저, 엣지가 뒤에
  const redraw: Record<string, number> = {};
  [...BASE_NODE_IDS, "fw_role"].forEach((id, i) => (redraw[id] = redrawAt + Math.round(i * 1.2)));
  [...BASE_EDGE_IDS, "impl_policy"].forEach((id, i) => (redraw[id] = redrawAt + 22 + Math.round(i * 1.4)));

  const [bx, by] = place(P1, ...edgeLabelAt("impl_policy"));
  const broken = progress(frame, breakAt, 10) * (1 - progress(frame, wipeAt, 10));
  const main = progress(frame, t1, 30, ease.inOut);
  const branch = progress(frame, t2, DUR.draw);

  return (
    <ShiftSheet>
      <StepStrip active={3} c={color.agent} />

      {/* ── main 의 commit ── */}
      <svg {...fullSvg} opacity={out1}>
        <line x1={170} y1={MAIN_Y} x2={170 + (1084 - 170) * main} y2={MAIN_Y} stroke={color.lineStrong} strokeWidth={stroke.trace} />
        {DOT_X.map((x, i) => {
          const p = progress(frame, dotAt[i], 10);
          const ring = progress(frame, dotAt[i], 22);
          return (
            <g key={i} opacity={p}>
              <circle cx={x} cy={MAIN_Y} r={9} fill={color.agent} />
              <circle cx={x} cy={MAIN_Y} r={9 + 14 * ring} fill="none" stroke={color.agent} strokeWidth={stroke.thin} opacity={1 - ring} />
            </g>
          );
        })}
        <Trace pts={[[900, MAIN_Y], [930, MAIN_Y], [930, 156], [RX, 156]]} stroke={color.human} width={stroke.trace} progress={branch} />
        <circle cx={1000} cy={156} r={8} fill={color.bg} stroke={color.human} strokeWidth={stroke.trace} opacity={progress(frame, t2 + 12, 10)} />
        <Trace pts={[[RX + 40, 176], [RX + 40, 250]]} stroke={color.problem} width={stroke.thin} arrow at={lintAt - 4} opacity={1 - progress(frame, t3, 10)} />
        {/* 끊어진 링크 */}
        <g opacity={broken} stroke={color.problem} strokeWidth={stroke.bold}>
          <line x1={bx - 13} y1={by - 13} x2={bx + 13} y2={by + 13} />
          <line x1={bx + 13} y1={by - 13} x2={bx - 13} y2={by + 13} />
        </g>
      </svg>
      <div style={{ position: "absolute", left: 96, top: MAIN_Y - 17, ...mono(26, 700), letterSpacing: "0", color: color.inkSoft, opacity: progress(frame, t1, 12) * out1 }}>main</div>
      <Note x={RX} y={136} text="MR" c={color.human} code px={26} weight={700} h={40} p={progress(frame, t2 + 10, DUR.enter) * out1} />
      <Note x={1084} y={204} align="right" text="graph@9f3c2e1" c={color.agent} code px={24} weight={700} border={false} p={progress(frame, dotAt[3] + 8, DUR.enter) * out1} />

      {/* ── 그래프: 증분으로 갱신되던 것 → 밤에 처음부터 다시 그린 것 → 파생물 상자 안의 것 ── */}
      <TraceGraph
        {...P1}
        add={ADD}
        opacity={1 - progress(frame, wipeAt, 12, ease.in)}
        text={frame >= renameAt ? { policy_init: "rcv::policy_setup" } : {}}
        looks={[{ ids: ["impl_policy"], look: "problem", at: breakAt }]}
        hi={[
          ...TOUCHED.map((ids, i) => ({ ids, color: color.agent, at: dotAt[i], out: dotAt[i] + 20, fill: true })),
          { ids: ["policy_init"], color: color.human, at: renameAt, out: breakAt, fill: true },
          { ids: ["policy_init", "impl_policy", "fw_role"], color: color.problem, at: breakAt, ring: true },
        ]}
        dim={[{ at: breakAt, to: 0.45 }]}
      />
      {frame >= redrawAt ? <TraceGraph {...view} add={ADD} appear={redraw} opacity={1 - mv} bands={redrawAt} /> : null}
      {mv > 0 ? <TraceGraph {...view} add={ADD} nodeLabels={false} edgeLabels={false} subs={false} bands={false} opacity={mv * (1 - erased)} /> : null}

      {/* ── MR 에서 걸린다 ── */}
      <CodePanel
        x={RX}
        y={250}
        w={714}
        title="trace-lint · 깨진 링크 1"
        px={26}
        at={lintAt}
        out={t3 - 2}
        owner="none"
        lines={[
          { text: "rcv::policy_init → 없음 (이름 변경?)", tone: "problem", mark: lintAt + 8, markTone: "problem" },
          { text: "태그 HSI-RCV-010#fw_role 의 대상이 사라짐", tone: "plain" },
        ]}
      />

      {/* ── 밤 · 전체 재생성 ── */}
      <div style={{ position: "absolute", left: RX, top: 258, display: "flex", alignItems: "center", gap: 20, opacity: progress(frame, t3 + 6, DUR.enter) * out1 }}>
        <svg width={64} height={64} viewBox="0 0 64 64">
          <path d="M 44 8 A 26 26 0 1 0 56 44 A 20 20 0 0 1 44 8 Z" fill={withAlpha(color.inkSoft, 0.12)} stroke={color.inkSoft} strokeWidth={stroke.trace} strokeLinejoin="round" />
        </svg>
        <div style={{ ...sans(44, 700), whiteSpace: "nowrap" }}>밤 · 전체 재생성</div>
      </div>
      <div style={{ position: "absolute", left: RX, top: 372, display: "flex", alignItems: "center", gap: 16, opacity: progress(frame, sameAt, DUR.enter) * out1 }}>
        <CheckIcon size={52} color={color.agent} width={stroke.bold} />
        <div style={{ ...sans(64, 800), color: color.agent, whiteSpace: "nowrap" }}>차이 0</div>
      </div>

      {/* ── 원본과 파생물 ── */}
      <svg {...fullSvg}>
        <rect x={GBOX.x} y={GBOX.y} width={GBOX.w} height={GBOX.h} fill={withAlpha(color.agent, 0.03)} stroke={color.agent} strokeWidth={stroke.thin} strokeDasharray="10 8" opacity={progress(frame, boxAt, 14)} />
        <Trace pts={FROM_JIRA} stroke={color.agent} width={stroke.bold} arrow at={pullAt} duration={22} />
        <Trace pts={FROM_GIT} stroke={color.agent} width={stroke.bold} arrow at={pullAt + 6} duration={22} />
        {/* 그래프에서 원본으로는 가지 않는다 */}
        <Trace pts={[[GBOX.x, 500], [884, 500]]} stroke={color.problem} width={stroke.trace} dash="9 7" arrow at={backAt} />
        <g opacity={progress(frame, backAt + 14, 8)} stroke={color.problem} strokeWidth={stroke.bold}>
          <line x1={848} y1={484} x2={880} y2={516} />
          <line x1={880} y1={484} x2={848} y2={516} />
        </g>
        {/* 다시 흐르는 추출 */}
        {flow > 0 ? (
          <g opacity={flowFade}>
            <Trace pts={FROM_JIRA} stroke={color.ink} width={5} progress={flow} />
            <Trace pts={FROM_GIT} stroke={color.ink} width={5} progress={flow} />
          </g>
        ) : null}
        {/* 휴지통 */}
        <g opacity={trash} transform={`translate(${GBOX.x + GBOX.w / 2 - 60} ${GBOX.y + GBOX.h / 2 - 70})`} fill="none" stroke={color.problem} strokeWidth={5} strokeLinejoin="round">
          <path d="M 10 30 H 110 M 44 30 V 14 H 76 V 30 M 22 30 L 30 134 H 90 L 98 30 M 48 52 V 112 M 72 52 V 112" />
        </g>
      </svg>
      <EdgeTag x={GBOX.x + 24} y={GBOX.y} text="그래프" c={color.agent} px={30} p={progress(frame, boxAt + 4, 12)} />
      <T x={GBOX.x + GBOX.w / 2} y={186} text="파생물" px={52} weight={800} c={color.agent} align="center" at={boxAt} />
      <T x={380} y={186} text="원본" px={52} weight={800} c={color.human} align="center" at={srcAt} />
      {[
        { y: 300, name: "Jira", sub: "이슈 · 링크 · 결과", at: srcAt + 4 },
        { y: 550, name: "git", sub: "조항 · 코드 · 태그", at: srcAt + 10 },
      ].map((b) => (
        <Box key={b.name} x={150} y={b.y} w={460} h={150} c={color.human} bw={stroke.bold} fill={withAlpha(color.human, 0.07)} p={progress(frame, b.at, DUR.enter)} style={{ flexDirection: "column", gap: 6 }}>
          <div style={{ ...mono(48, 700), letterSpacing: "0", color: color.ink }}>{b.name}</div>
          <div style={{ ...sans(32, 500), color: color.human, whiteSpace: "nowrap" }}>{b.sub}</div>
        </Box>
      ))}
      <Note x={650} y={322} text="추출" c={color.agent} border={false} px={32} weight={700} p={progress(frame, pullAt + 10, 12)} />
      <Note x={650} y={632} text="추출" c={color.agent} border={false} px={32} weight={700} p={progress(frame, pullAt + 16, 12)} />
    </ShiftSheet>
  );
};
