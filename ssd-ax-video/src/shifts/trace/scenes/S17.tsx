import React from "react";
import { useCurrentFrame } from "remotion";
import { ease, lerp, progress } from "../../../video/anim";
import { CheckIcon, HumanIcon } from "../../../video/components/Icons";
import { Trace } from "../../../video/components/Trace";
import type { Pt } from "../../../video/components/Trace";
import { color, fullSvg, mono, sans, stroke, withAlpha } from "../../../video/theme";
import { ShiftSheet } from "../../lib";
import { Box, GNode, MiniGraph, NodeShape, T, useCues, vis } from "./kitC";

// S17 지키는 선과 마무리: 호박색 가로선 위에 네 항목 → 선이 위로 물러나고, 끊어지지 않은 연결이 돌아온다.

const TX = {
  items: ["그래프는 파생물", "확정 링크는 사람이 승인", "태그 ≠ 통과", "충족 판정은 사람"],
  itemSub: "원본은 Jira와 git",
  jira: "Jira",
  git: "git",
  source: "원본",
  derived: "파생물",
  extract: "추출",
  graph: "그래프",
  approved: "승인",
  satisfied: "충족 확인",
  reqId: "REQ-QOS-07",
  reqText: "P99.99 ≤ 2 ms (예시)",
  reqKey: "REQ-207",
  feat: "FEAT-338",
  clause: "HSI-RCV-010#order",
  assertion: "a_host_first",
  field: "PRIOQ_CFG.HOST_BURST",
  func: "rcv::policy_init",
  rtlFile: "rtl/rcv/prio_q.sv",
  fwFile: "fw/rcv/rcv_policy.cpp",
  closing: "한 줄이 바뀌면, 고칠 곳이 보인다",
  series: "DEEP DIVE · 추적성 편",
  footer: "SSD CONTROLLER SOC · AX",
} as const;

const COL = 432;
const LINE_Y0 = 700;
const LINE_Y1 = 118;
const colX = (i: number): number => 96 + i * COL;

const StripePanel: React.FC<{ x: number; y: number; w: number; h: number; title: string; c: string; p: number; hot: number; hotRow: number }> = ({ x, y, w, h, title, c, p, hot, hotRow }) => {
  if (p <= 0) return null;
  const rows = [0.62, 0.84, 0.5, 0.76, 0.4];
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, opacity: p }}>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
        <rect x={1} y={1} width={w - 2} height={h - 2} fill={withAlpha(color.panel, 0.92)} stroke={hot > 0.5 ? c : color.line} strokeWidth={stroke.thin} />
        <rect x={0} y={0} width={5} height={h} fill={c} />
        <line x1={1} x2={w - 1} y1={44} y2={44} stroke={color.line} strokeWidth={stroke.hair} />
        {rows.map((r, i) => (
          <rect key={i} x={24} y={62 + i * 29} width={(w - 60) * r} height={11} fill={i === hotRow ? withAlpha(c, lerp(0.3, 1, hot)) : withAlpha(color.inkDim, 0.4)} />
        ))}
      </svg>
      <div style={{ position: "absolute", left: 24, top: 0, height: 44, display: "flex", alignItems: "center", ...mono(22, 700), color: color.inkSoft }}>{title}</div>
    </div>
  );
};

export const S17: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, within } = useCues();
  const t1 = cue("s17.1");
  const t2 = cue("s17.2");
  const t3 = cue("s17.3");
  const t4 = cue("s17.4");
  const t5 = cue("s17.5");
  const t6 = cue("s17.6");
  const itemAt = [within("s17.1", 0.42), t2, t3, t4];

  // 선이 위로 물러난다
  const up = progress(frame, t5 - 12, 24, ease.inOut);
  const lineY = lerp(LINE_Y0, LINE_Y1, up);
  const lineP = progress(frame, t1 - 2, 30, ease.inOut);
  const picOut = t5 - 14;
  const pic = (i: number): number => vis(frame, itemAt[i] + 4, picOut);

  // ① 원본 → 그래프
  const a1 = itemAt[0];
  const backP = progress(frame, within("s17.1", 0.72), 16, ease.inOut);
  // ② 제안 → 확정
  const confirmAt = within("s17.2", 0.6);
  const confirm = progress(frame, confirmAt, 16, ease.inOut);
  // ③ 태그 ≠ 통과
  const emptyAt = within("s17.3", 0.5);
  // ④ 판정
  const judgeAt = within("s17.4", 0.45);

  // 마무리 그림
  const f0 = t5 - 2;
  const jiraAt = t5 + 4;
  const graphAt = within("s17.5", 0.45);
  const hotAt = [t6 + 2, within("s17.6", 0.3), within("s17.6", 0.42), within("s17.6", 0.54), within("s17.6", 0.66), within("s17.6", 0.78)];
  const hot = (i: number): number => progress(frame, hotAt[i], 12);
  const blink = progress(frame, t6, 10) * (1 - 0.55 * progress(frame, t6 + 16, 14, ease.inOut));
  const closeAt = within("s17.6", 0.5);

  const left: Pt[] = [[960, 412], [960, 446], [620, 446], [620, 480]];
  const right: Pt[] = [[960, 446], [1300, 446], [1300, 480]];

  return (
    <ShiftSheet hold>
      {/* ── 호박색 가로선과 네 항목 ── */}
      <svg {...fullSvg}>
        <line x1={96} x2={96 + 1728 * lineP} y1={lineY} y2={lineY} stroke={color.human} strokeWidth={5} />
        {itemAt.map((at, i) => (
          <rect key={i} x={colX(i)} y={lineY - 9} width={18} height={18} fill={color.human} opacity={progress(frame, at, 10)} />
        ))}
      </svg>
      {TX.items.map((text, i) => (
        <T key={i} x={colX(i) + 2} y={lineY - lerp(64, 50, up)} px={Math.round(lerp(36, 30, up))} weight={700} c={up > 0.5 ? color.inkSoft : color.ink} at={itemAt[i]}>{text}</T>
      ))}
      <T x={colX(0) + 2} y={LINE_Y0 + 22} px={30} weight={500} c={color.inkSoft} at={itemAt[0] + 8} out={picOut}>{TX.itemSub}</T>

      {/* ① 그래프는 파생물: 원본 둘 → 그래프, 반대 방향은 막힌다 */}
      {pic(0) > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: pic(0), translate: "0px 40px" }}>
          <T x={120} y={262} px={30} weight={700} c={color.human} at={a1}>{TX.source}</T>
          <Box x={120} y={310} w={130} h={60} c={color.human} at={a1}><span style={{ ...sans(30, 700) }}>{TX.jira}</span></Box>
          <Box x={120} y={400} w={130} h={60} c={color.human} at={a1 + 4}><span style={{ ...sans(30, 700) }}>{TX.git}</span></Box>
          <T x={376} y={262} px={30} weight={700} c={color.agent} at={a1 + 12}>{TX.derived}</T>
          <Box x={376} y={310} w={128} h={150} c={color.agent} dashed at={a1 + 12} />
          <MiniGraph x={384} y={346} s={0.47} nodes={progress(frame, a1 + 26, 16)} extract={progress(frame, a1 + 30, 20)} tag={progress(frame, a1 + 36, 20)} opacity={vis(frame, a1 + 20)} />
          <T x={313} y={366} px={30} weight={600} c={color.agent} align="center" at={a1 + 14}>{TX.extract}</T>
          <svg {...fullSvg}>
            <Trace pts={[[250, 340], [376, 340]]} stroke={color.agent} arrow at={a1 + 10} />
            <Trace pts={[[250, 430], [376, 430]]} stroke={color.agent} arrow at={a1 + 14} />
            <Trace pts={[[440, 460], [440, 520], [185, 520], [185, 460]]} stroke={color.problem} dash="8 6" progress={backP * 0.5} />
            <g opacity={progress(frame, within("s17.1", 0.72) + 12, 10)} stroke={color.problem} strokeWidth={stroke.bold}>
              <line x1={298} y1={506} x2={326} y2={534} />
              <line x1={326} y1={506} x2={298} y2={534} />
            </g>
          </svg>
        </div>
      ) : null}

      {/* ② 확정 링크는 사람이 승인: 점선이 실선으로 */}
      {pic(1) > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: pic(1), translate: "0px 40px" }}>
          <svg {...fullSvg}>
            <Trace pts={[[640, 440], [640, 330], [800, 330]]} stroke={color.agent} dash="9 7" at={t2 + 8} duration={22} opacity={1 - confirm} />
            <Trace pts={[[640, 440], [640, 330], [800, 330]]} stroke={color.human} width={5} progress={confirm} />
            <NodeShape shape="func" cx={640} cy={470} w={140} h={60} c={color.agent} p={vis(frame, t2 + 2)} />
            <NodeShape shape="doc" cx={860} cy={330} w={120} h={70} c={color.human} p={vis(frame, t2 + 2)} />
          </svg>
          <T x={724} y={278} px={22} weight={700} c={confirm > 0.5 ? color.human : color.agent} align="center" at={t2 + 14} code>{confirm > 0.5 ? "tag" : "proposed"}</T>
          <div style={{ position: "absolute", left: 760, top: 420, display: "flex", alignItems: "center", gap: 12, opacity: vis(frame, confirmAt) }}>
            <HumanIcon size={56} color={color.human} />
            <CheckIcon size={44} color={color.human} width={4} />
            <svg width={90} height={40} style={{ overflow: "visible" }}>
              <path d="M 2 28 C 14 2, 22 2, 26 22 S 40 34, 46 14 S 60 6, 64 24 L 88 20" fill="none" stroke={color.human} strokeWidth={stroke.trace} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - progress(frame, confirmAt + 6, 20, ease.inOut)} />
            </svg>
          </div>
        </div>
      ) : null}

      {/* ③ 태그 ≠ 통과: verifies 엣지는 있고, 그 아래 PASS 자리는 비어 있다 */}
      {pic(2) > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: pic(2), translate: "0px 40px" }}>
          <svg {...fullSvg}>
            <Trace pts={[[1130, 410], [1130, 300]]} stroke={color.human} width={5} at={t3 + 6} />
            <Trace pts={[[1130, 440], [1130, 500]]} stroke={color.problem} dash="7 6" at={emptyAt} />
            <NodeShape shape="doc" cx={1130} cy={266} w={130} h={68} c={color.human} p={vis(frame, t3 + 2)} />
            <NodeShape shape="assert" cx={1130} cy={440} w={150} h={60} c={color.agent} p={vis(frame, t3 + 2)} />
            <circle cx={1130} cy={546} r={46} fill="none" stroke={color.problem} strokeWidth={stroke.thin} strokeDasharray="7 6" opacity={vis(frame, emptyAt + 6)} />
          </svg>
          <T x={1130} y={252} px={22} weight={700} c={color.human} align="center" at={t3 + 6} code>#full</T>
          <T x={1152} y={340} px={22} weight={700} c={color.human} at={t3 + 10} code>verifies</T>
          <T x={1130} y={532} px={22} weight={700} c={color.problem} align="center" at={emptyAt + 8} code>PASS</T>
        </div>
      ) : null}

      {/* ④ 충족 판정은 사람 */}
      {pic(3) > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: pic(3), translate: "0px 40px" }}>
          <Box x={1410} y={400} w={120} h={60} radius={30} c={color.ink} at={t4 + 2}><span style={{ ...sans(30, 700) }}>{TX.approved}</span></Box>
          <Box x={1626} y={400} w={180} h={60} radius={30} c={color.human} at={judgeAt + 6}><span style={{ ...sans(30, 700), color: color.human }}>{TX.satisfied}</span></Box>
          <svg {...fullSvg}>
            <Trace pts={[[1530, 430], [1626, 430]]} stroke={color.human} arrow at={judgeAt} />
            <line x1={1578} x2={1578} y1={372} y2={372 + 50 * progress(frame, judgeAt, 12)} stroke={color.human} strokeWidth={stroke.thin} />
          </svg>
          <div style={{ position: "absolute", left: 1546, top: 300, opacity: vis(frame, t4 + 8) }}><HumanIcon size={64} color={color.human} /></div>
        </div>
      ) : null}

      {/* ── 마무리: 끊어지지 않은 연결 ── */}
      <svg {...fullSvg}>
        <Trace pts={[[960, 214], [960, 262]]} stroke={color.ink} at={jiraAt + 6} />
        <Trace pts={[[960, 306], [960, 356]]} stroke={color.agent} at={graphAt} />
        <Trace pts={left} stroke={color.human} width={stroke.bold} at={graphAt + 8} duration={22} />
        <Trace pts={right} stroke={color.human} width={stroke.bold} at={graphAt + 10} duration={22} />
        <Trace pts={[[1300, 532], [1300, 576]]} stroke={color.agent} at={graphAt + 24} />
        <Trace pts={[[620, 532], [620, 574], [298, 574], [298, 620]]} stroke={color.agent} at={graphAt + 28} duration={22} />
        <Trace pts={[[1440, 602], [1622, 602], [1622, 620]]} stroke={color.agent} at={graphAt + 32} duration={22} />
      </svg>
      <Box x={660} y={150} w={600} h={64} c={blink > 0 ? color.human : color.lineStrong} fill={withAlpha(blink > 0 ? color.human : color.panel, blink > 0 ? 0.1 + 0.2 * blink : 0.92)} at={f0} style={{ justifyContent: "flex-start", padding: "0 20px", gap: 22 }}>
        <span style={{ ...mono(30, 700), color: color.ink }}>{TX.reqId}</span>
        <span style={{ ...mono(28, 500), color: blink > 0.3 ? color.human : color.inkSoft }}>{TX.reqText}</span>
      </Box>
      <GNode shape="chip" cx={1350} cy={182} w={150} h={44} c={color.ink} label={TX.reqKey} px={24} at={f0 + 4} />
      <svg {...fullSvg}>
        <line x1={1260} x2={1275} y1={182} y2={182} stroke={color.ink} strokeWidth={stroke.thin} opacity={vis(frame, f0 + 4)} />
      </svg>
      <GNode shape="chip" cx={960} cy={284} w={170} h={44} c={color.ink} label={TX.feat} px={24} at={jiraAt + 12} hot={hot(0)} />
      <T x={988} y={219} px={30} weight={700} at={jiraAt + 8}>{TX.jira}</T>
      <T x={988} y={311} px={30} weight={700} c={color.agent} at={graphAt + 2}>{TX.graph}</T>
      <GNode shape="doc" cx={960} cy={384} w={360} h={56} c={color.human} label={TX.clause} px={28} at={graphAt + 6} hot={hot(1)} />
      <GNode shape="assert" cx={620} cy={506} w={290} h={52} c={color.agent} label={TX.assertion} px={28} at={graphAt + 18} hot={hot(2)} />
      <GNode shape="field" cx={1300} cy={506} w={420} h={52} c={color.agent} label={TX.field} px={28} at={graphAt + 20} hot={hot(2)} />
      <GNode shape="func" cx={1300} cy={602} w={300} h={52} c={color.agent} label={TX.func} px={28} at={graphAt + 28} hot={hot(3)} />
      <StripePanel x={96} y={620} w={404} h={216} title={TX.rtlFile} c={color.agent} p={vis(frame, f0 + 8)} hot={hot(4)} hotRow={1} />
      <StripePanel x={1420} y={620} w={404} h={216} title={TX.fwFile} c={color.agent} p={vis(frame, f0 + 10)} hot={hot(4)} hotRow={3} />

      <T x={960} y={690} px={52} weight={800} align="center" at={closeAt}>{TX.closing}</T>
      <T x={960} y={786} px={22} weight={700} c={color.agent} align="center" at={closeAt + 14} code>{TX.series}</T>
      <T x={96} y={860} px={22} weight={500} c={color.inkDim} at={closeAt + 20} code>{TX.footer}</T>
    </ShiftSheet>
  );
};
