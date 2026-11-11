import React from "react";
import { useCurrentFrame } from "remotion";
import { ease, lerp, progress } from "../../../video/anim";
import { AgentIcon, HumanIcon, WarnIcon } from "../../../video/components/Icons";
import { Trace } from "../../../video/components/Trace";
import { color, mono, size, stroke, withAlpha } from "../../../video/theme";
import { CodePanel, ShiftSheet, useScene } from "../../lib";
import { At, Box, Dots, Svg, Txt, WeekHeader, useAt, vis } from "./kit";

// s4 예제 ①: 4주 타임라인, regression triage 실험, 1주 기준선(실험 카드 · 기준선 카드), 2주 오분류 → 실패 기록 F-007.

const STRIP_Y = 312;
const CLUSTER_X = [1190, 1340, 1490, 1640];
// 2주차 그림
const MX = 340;
const MY = 640;

export const S4: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue } = useScene();
  const at = useAt();
  const t1 = cue("s4.1");
  const t2 = cue("s4.2");
  const t3 = cue("s4.3");
  const t4 = cue("s4.4");
  const t5 = cue("s4.5");
  const t6 = cue("s4.6");
  const t47 = cue("s4.7");
  const t8 = cue("s4.8");
  const picO = 1 - progress(frame, t8 - 8, 10, ease.in);

  // 에이전트 블록: s4.2 에 살아 있고, 1주에는 꺼졌다가, 2주에 다시 켜진다
  const agentIn = progress(frame, at("s4.2", 0.35), 16);
  const agentOn = 1 - progress(frame, t3, 14, ease.inOut) + progress(frame, t5, 14, ease.inOut);
  const agentC = agentOn > 0.5 ? color.agent : color.lineStrong;
  const clusters = progress(frame, at("s4.2", 0.6), 24) * lerp(0.14, 1, agentOn);
  const flow = progress(frame, t2 + 10, 30, ease.inOut);

  // 2주: 두 무리가 한 묶음으로
  const groups = progress(frame, t5 + 4, 16);
  const merge = progress(frame, at("s4.5", 0.42), 26, ease.inOut);
  const split = progress(frame, t6 + 14, 22, ease.inOut);
  const gap = lerp(lerp(150, 62, merge), 120, split);
  const ring = progress(frame, at("s4.5", 0.5), 20, ease.inOut) * (1 - split);
  const warnAt = at("s4.5", 0.7);
  const docAt = at("s4.6", 0.38);
  const warnMove = progress(frame, docAt - 14, 18, ease.inOut);
  const warnO = progress(frame, warnAt, 10) * (1 - progress(frame, docAt + 2, 8));
  const cut = progress(frame, t6 + 6, 16, ease.inOut);
  const logsOut = t6 - 6;

  return (
    <ShiftSheet>
      <WeekHeader at={t1 + 16} titleAt={t1} on={[t3, t5, Infinity, Infinity]} dy={lerp(330, 0, progress(frame, t2 - 18, 24, ease.inOut))} />

      {/* s4.2 본편 S5-4 의 장면: 실패 무리 → 에이전트 → 묶음 넷 */}
      <Svg>
        <Dots cx={200} cy={STRIP_Y} r={78} n={150} c={color.problem} p={progress(frame, t2, 26, ease.linear)} />
        <line x1={300} y1={STRIP_Y} x2={300 + 470 * flow} y2={STRIP_Y} stroke={withAlpha(color.problem, 0.7)} strokeWidth={stroke.thin} />
        <line x1={1020} y1={STRIP_Y} x2={1020 + 690 * clusters} y2={STRIP_Y} stroke={color.lineStrong} strokeWidth={stroke.thin} opacity={clusters} />
        <Box x={770} y={STRIP_Y - 50} w={250} h={100} p={agentIn} c={color.line} fill={withAlpha(agentC, 0.08)} />
        <rect x={770} y={STRIP_Y - 50} width={5} height={100 * agentIn} fill={agentC} />
        {CLUSTER_X.map((x, i) => (
          <Dots key={i} cx={x} cy={STRIP_Y} r={[40, 30, 36, 44][i]} n={[44, 26, 36, 52][i]} c={color.problem} o={clusters} p={progress(frame, at("s4.2", 0.6) + i * 5, 14)} />
        ))}
      </Svg>
      <Txt x={300} y={STRIP_Y - 58} at={t2 + 6} px={size.small} weight={600} c={color.problem}>
        야간 regression 실패
      </Txt>
      <At x={818} y={STRIP_Y} o={agentIn}>
        <AgentIcon size={48} color={agentC} />
      </At>
      <Txt x={856} y={STRIP_Y - 24} at={at("s4.2", 0.35) + 4} px={size.body} weight={700} c={agentOn > 0.5 ? color.agent : color.inkDim}>
        에이전트
      </Txt>
      {frame >= t3 && frame < t5 + 14 ? (
        <div style={{ position: "absolute", left: 1040, top: STRIP_Y - 44, ...mono(size.label, 700), color: color.inkDim, opacity: vis(frame, t3 + 6, t5) }}>OFF</div>
      ) : null}

      {/* s4.3 실험 카드 */}
      <CodePanel
        x={96}
        y={440}
        w={800}
        title="experiments/triage-agent.yaml (예시)"
        owner="human"
        px={26}
        at={t3 + 8}
        dimAt={t47 - 4}
        out={t5 - 12}
        lines={[
          { text: "speed_metric: triage 소요 (분/일)", mark: at("s4.3", 0.55), markTone: "agent" },
          { text: "guardrail:", mark: at("s4.3", 0.55) + 6, markTone: "human" },
          { text: "  - 오분류율 = 사람이 고친 묶음 / 전체 묶음", mark: at("s4.3", 0.55) + 6, markTone: "human" },
          { text: "  - 신규 실패 누락 = 0", mark: at("s4.3", 0.55) + 6, markTone: "human" },
          "stop_if: guardrail 악화 2주 지속",
          "unit: 팀 단위 집계 (개인별 수집 없음)",
        ]}
      />
      {/* s4.4 기준선 카드 */}
      <CodePanel
        x={940}
        y={440}
        w={884}
        title="metrics/triage-baseline.md (예시)"
        owner="human"
        px={28}
        at={t47}
        out={t5 - 12}
        lines={[
          { text: "야간 regression 10회 기준", tone: "dim" },
          { text: "출처  Jira 변경 이력 (사람이 고친 묶음)", mark: at("s4.7", 0.3), unmark: t4 - 4, markTone: "human" },
          { text: "아침 triage 소요    95분/일 (2명 합계)", at: at("s4.4", 0.08), mark: at("s4.4", 0.2) },
          { text: "실패 → 담당 배정     중앙값 3.5시간", at: at("s4.4", 0.3), tone: "dim" },
          { text: "오분류              묶음 41개 중 6개 (15%)", at: at("s4.4", 0.42), mark: at("s4.4", 0.5), markTone: "human" },
        ]}
      />

      {frame >= t47 ? (
        <div style={{ position: "absolute", left: 1824 - 86, top: 451, ...mono(size.label, 700), color: color.human, opacity: vis(frame, t47 + 4, t5 - 12) }}>JIRA</div>
      ) : null}

      {/* s4.5 원인이 다른 두 무리가 한 묶음으로 */}
      <div style={{ opacity: picO }}>
      <Svg>
        <Dots cx={MX - gap} cy={MY} r={54} n={46} c={color.problem} p={groups} o={groups} dot={3.5} />
        <Dots cx={MX + gap} cy={MY} r={54} n={46} c={color.inkSoft} p={groups} o={groups} dot={3.5} />
        {ring > 0 ? (
          <circle cx={MX} cy={MY} r={140} fill={withAlpha(color.problem, 0.06)} stroke={color.agent} strokeWidth={stroke.trace} pathLength={1} strokeDasharray={`${ring} 1`} transform={`rotate(-90 ${MX} ${MY})`} />
        ) : null}
        {split > 0
          ? [-1, 1].map((s) => <circle key={s} cx={MX + s * gap} cy={MY} r={78} fill="none" stroke={color.inkSoft} strokeWidth={stroke.thin} opacity={split} />)
          : null}
        {/* 설계자가 묶음을 가른다 */}
        {cut > 0 ? <line x1={MX} y1={MY + 160} x2={MX} y2={MY + 160 - 320 * cut} stroke={color.human} strokeWidth={stroke.bold} /> : null}
      </Svg>
      {(["A", "B"] as const).map((k, i) => (
        <Txt key={k} x={MX + (i ? gap : -gap)} y={MY - 124} at={t5 + 8} px={size.small} weight={700} font="mono" c={i ? color.inkSoft : color.problem} align="center">
          {k}
        </Txt>
      ))}
      </div>
      <At x={lerp(MX, 640, warnMove)} y={lerp(MY - 190, 470, warnMove)} o={warnO}>
        <WarnIcon size={64} color={color.problem} />
      </At>
      {(["A", "B"] as const).map((k, i) => (
        <CodePanel
          key={k}
          x={640}
          y={480 + i * 170}
          w={760}
          title={`SEED ${k} · sim.log`}
          px={28}
          at={at("s4.5", 0.3) + i * 8}
          out={logsOut}
          lines={[{ text: "UVM_ERROR scoreboard: data mismatch", tone: "problem", mark: at("s4.5", 0.62), markTone: "problem" }]}
        />
      ))}

      {/* s4.6 설계자, 그리고 실패 기록 한 건 */}
      <At x={MX - 60} y={842} o={progress(frame, t6, 14)}>
        <HumanIcon size={56} color={color.human} />
      </At>
      <Txt x={MX - 20} y={822} at={t6 + 4} px={size.small} weight={700} c={color.human}>
        설계자
      </Txt>
      <CodePanel
        x={620}
        y={436}
        w={880}
        title="failures/F-007.yaml (예시)"
        owner="human"
        px={26}
        at={docAt}
        step={4}
        lines={[
          { text: "what: 원인이 다른 실패 2종을 한 묶음으로 합침", mark: docAt + 14, markTone: "problem" },
          "why: UVM_ERROR 문구가 같음",
          "     A는 RTL FSM의 완료 누락",
          "     B는 TB sequence의 대기 누락",
          { text: "found_by: 설계자의 티켓 검토", tone: "human" },
          "cost: B의 담당 배정이 반나절 지연",
          "fix: playbook 규칙 4 추가",
          "eval_case: evals/triage/case-023",
        ]}
      />
      {/* s4.8 원본은 git, Jira 버그 이슈에는 댓글로 잇는다 */}
      <CodePanel
        x={96}
        y={470}
        w={480}
        title="JIRA · BUG-2268"
        owner="agent"
        px={26}
        at={t8}
        step={4}
        lines={[
          { text: "상태  초안 · triage-agent", tone: "agent" },
          { text: "라벨  ai-authored", tone: "agent" },
          { text: "댓글 · 설계자", tone: "human" },
          "  묶음에 원인 2종, B를 분리",
          { text: "  기록: failures/F-007.yaml", mark: at("s4.8", 0.55), markTone: "human" },
        ]}
      />
      <Svg>
        <Trace pts={[[576, 709], [620, 709]]} at={at("s4.8", 0.6)} stroke={color.human} width={stroke.bold} arrow />
        {frame >= at("s4.6", 0.85) ? (
          <path
            d="M 1520 590 H 1536 V 660 H 1520"
            fill="none"
            stroke={color.human}
            strokeWidth={stroke.thin}
            opacity={progress(frame, at("s4.6", 0.85), 12)}
          />
        ) : null}
      </Svg>
      <Txt x={1552} y={606} at={at("s4.6", 0.85)} px={size.small} weight={700} c={color.human}>
        사람 이름 칸 없음
      </Txt>
    </ShiftSheet>
  );
};
