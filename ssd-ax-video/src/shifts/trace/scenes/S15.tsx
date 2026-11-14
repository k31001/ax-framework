import React from "react";
import { useCurrentFrame } from "remotion";
import { ease, progress } from "../../../video/anim";
import { HumanIcon } from "../../../video/components/Icons";
import { Trace } from "../../../video/components/Trace";
import { color, fullSvg, mono, sans, stroke, withAlpha } from "../../../video/theme";
import { CodePanel, ShiftSheet } from "../../lib";
import { Box, GNode, MiniGraph, T, useCues, vis } from "./kitC";

// S15 Jira와의 관계: 두 층의 단면도. 위층 Jira(사람과 에이전트가 만나는 곳), 아래층 그래프(조항과 코드).
// 그래프의 결과는 위로(댓글 · remote link), Xray 의 판정은 아래로(복사)만 흐른다.

const TX = {
  upper: "Jira · 사람과 에이전트가 만나는 곳",
  lower: "그래프 · 조항과 코드",
  acts: ["지시", "질문", "승인"],
  feat: "FEAT-338",
  includes: ["그래프는 Jira 이슈를", "노드로 포함"],
  issue: [
    "FEAT-338  설계 기능           상태: 구현 중",
    "우선 큐 · 계약 HSI-RCV-010",
    "링크  implements REQ-207 · tested by VER-541 외 2",
    "      추적 그래프에서 보기 ↗",
    "댓글",
    "  req-agent  [에이전트 · req-agent · 영향 분석]",
    "     MR !2334 · 닿는 조항 #order · 다시 볼 것 3건",
    "     근거 graph@9f3c2e1",
  ],
  comment: "댓글",
  remote: "remote link",
  xray: ["VER-631 · PASS 3", "올린 계정 ci-import"],
  copy: "복사",
  verdict: "판정은 Xray · 그래프는 옆에 놓을 뿐",
} as const;

const UP = { y: 72, h: 430 } as const;
const LOW = { y: 552, h: 346 } as const;
const PANEL = { x: 640, y: 92, w: 800 } as const;
const MG = { x: 480, y: 568, s: 2 } as const;
const CHIP_X = MG.x + 20 * MG.s; // 두 층의 FEAT-338 이 같은 세로선에 놓인다
const LOW_CHIP_Y = MG.y + 54 * MG.s;
const PASS = { x: MG.x + 124 * MG.s, y: MG.y + 148 * MG.s } as const;

export const S15: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, within } = useCues();
  const t1 = cue("s15.1");
  const t2 = cue("s15.2");
  const t4 = cue("s15.4");
  const sameAt = within("s15.2", 0.5);
  const linkAt = within("s15.3", 0.12);
  const commentAt = within("s15.3", 0.5);
  const copyAt = within("s15.4", 0.45);
  const lowP = progress(frame, t2 - 2, 20, ease.inOut);
  const upDim = 1;

  return (
    <ShiftSheet>
      {/* ── 두 층 ── */}
      <svg {...fullSvg}>
        <rect x={96} y={UP.y} width={1728} height={UP.h} fill={withAlpha(color.panel, 0.35)} stroke={color.ink} strokeWidth={stroke.thin} opacity={vis(frame, t1 - 6) * upDim} />
        <rect x={96} y={LOW.y} width={1728} height={LOW.h} fill={withAlpha(color.agent, 0.04 * lowP)} stroke={color.agent} strokeWidth={stroke.thin} strokeDasharray="10 7" opacity={0.25 + 0.75 * lowP} />
      </svg>
      <T x={120} y={90} px={30} weight={700} at={t1 - 4}>{TX.upper}</T>
      <T x={120} y={570} px={30} weight={700} c={color.agent} at={t2}>{TX.lower}</T>

      {/* ── 위층: 사람, 이슈 화면 ── */}
      <div style={{ position: "absolute", left: 124, top: 196, opacity: vis(frame, t1 + 4) }}>
        <HumanIcon size={72} color={color.human} />
      </div>
      <div style={{ position: "absolute", left: 110, top: 276, width: 100, textAlign: "center", ...mono(22, 700), color: color.human, opacity: vis(frame, t1 + 4) }}>HUMAN</div>
      {TX.acts.map((a, i) => (
        <React.Fragment key={a}>
          <Box x={236} y={160 + i * 70} w={116} h={52} c={color.human} at={t1 + 10 + i * 6}>
            <span style={{ ...sans(30, 700), color: color.human }}>{a}</span>
          </Box>
        </React.Fragment>
      ))}
      <svg {...fullSvg}>
        {TX.acts.map((a, i) => (
          <Trace key={a} pts={[[352, 186 + i * 70], [PANEL.x - 4, 186 + i * 70]]} stroke={color.human} arrow at={t1 + 16 + i * 6} />
        ))}
        <line x1={CHIP_X + 80} x2={PANEL.x} y1={442} y2={442} stroke={color.ink} strokeWidth={stroke.thin} opacity={vis(frame, t1 + 8)} />
        {/* 같은 이슈: 위층의 칩과 아래층 그래프의 칩 */}
        <Trace pts={[[CHIP_X, 464], [CHIP_X, LOW_CHIP_Y - 22]]} stroke={color.ink} dash="6 7" at={sameAt} duration={20} />
      </svg>
      <GNode shape="chip" cx={CHIP_X} cy={442} w={160} h={44} c={color.ink} label={TX.feat} px={24} at={t1 + 6} hot={progress(frame, sameAt, 12)} />
      <CodePanel
        x={PANEL.x}
        y={PANEL.y}
        w={PANEL.w}
        title="JIRA · FEAT-338"
        px={26}
        at={t1}
        lines={[
          { text: TX.issue[0], at: t1 + 8 },
          { text: TX.issue[1], at: t1 + 11 },
          { text: TX.issue[2], at: t1 + 14, tone: "dim" },
          { text: TX.issue[3], at: linkAt + 14, tone: "agent", mark: linkAt + 14, markTone: "agent" },
          { text: TX.issue[4], at: t1 + 17, tone: "dim" },
          { text: TX.issue[5], at: commentAt + 14, tone: "agent", mark: commentAt + 14, markTone: "agent" },
          { text: TX.issue[6], at: commentAt + 18, mark: commentAt + 14, markTone: "agent" },
          { text: TX.issue[7], at: commentAt + 22, mark: commentAt + 14, markTone: "agent" },
        ]}
      />

      {/* ── 아래층: 그래프 축소판 ── */}
      <MiniGraph x={MG.x} y={MG.y} s={MG.s} nodes={progress(frame, t2 + 2, 22)} extract={progress(frame, t2 + 12, 30, ease.inOut)} tag={progress(frame, t2 + 22, 30, ease.inOut)} opacity={vis(frame, t2 + 2)} />
      <GNode shape="chip" cx={CHIP_X} cy={LOW_CHIP_Y} w={160} h={44} c={color.ink} label={TX.feat} px={24} at={t2 + 8} hot={progress(frame, sameAt + 14, 12)} />
      {TX.includes.map((s, i) => (
        <T key={i} x={120} y={660 + i * 40} px={30} weight={600} c={color.inkSoft} at={sameAt + 8 + i * 3}>{s}</T>
      ))}

      {/* ── 아래에서 위로: remote link, 댓글 ── */}
      <svg {...fullSvg}>
        <Trace pts={[[800, 612], [800, 490]]} stroke={color.agent} width={stroke.bold} arrow at={linkAt} duration={18} />
        <Trace pts={[[1030, 612], [1030, 490]]} stroke={color.agent} width={stroke.bold} arrow at={commentAt} duration={22} />
      </svg>
      <T x={818} y={508} px={30} weight={700} c={color.agent} at={linkAt + 6}>{TX.remote}</T>
      <T x={1048} y={508} px={30} weight={700} c={color.agent} at={commentAt + 6}>{TX.comment}</T>

      {/* ── 위에서 아래로: Xray 의 판정을 복사 ── */}
      <Box x={1470} y={100} w={330} h={150} c={color.ink} at={t4} style={{ flexDirection: "column", alignItems: "flex-start", justifyContent: "center", padding: "0 20px", gap: 6 }}>
        <span style={{ ...mono(22, 700), color: color.inkDim }}>XRAY · TEST EXEC</span>
        <span style={{ ...mono(30, 700), color: color.ink }}>{TX.xray[0]}</span>
        <span style={{ ...sans(28, 500), color: color.inkSoft }}>{TX.xray[1]}</span>
      </Box>
      <svg {...fullSvg}>
        <Trace pts={[[1640, 250], [1640, PASS.y], [PASS.x + 26, PASS.y]]} stroke={color.agent} width={stroke.bold} arrow at={copyAt} duration={34} easing={ease.inOut} />
        <circle cx={PASS.x} cy={PASS.y} r={22} fill={withAlpha(color.agent, 0.3)} stroke={color.agent} strokeWidth={stroke.trace} opacity={vis(frame, copyAt + 30)} />
        <path d={`M ${PASS.x - 9} ${PASS.y} l 7 7 l 12 -14`} fill="none" stroke={color.agent} strokeWidth={stroke.bold} opacity={vis(frame, copyAt + 34)} />
      </svg>
      <T x={PASS.x - 34} y={PASS.y - 14} px={22} weight={700} c={color.agent} align="right" at={copyAt + 32} code>PASS</T>
      <T x={1658} y={508} px={30} weight={700} c={color.agent} at={copyAt + 8}>{TX.copy}</T>
      <T x={1060} y={790} px={30} weight={700} at={within("s15.4", 0.72)}>{TX.verdict}</T>
    </ShiftSheet>
  );
};
