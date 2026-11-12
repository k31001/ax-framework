import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, ease, lerp, progress } from "../../../video/anim";
import { AgentIcon, HumanIcon } from "../../../video/components/Icons";
import { Trace } from "../../../video/components/Trace";
import { color, fullSvg, mono, sans, stroke, withAlpha } from "../../../video/theme";
import { CodePanel, ShiftSheet } from "../../lib";
import { Box, CurvePair, Grid, T, useCues, vis } from "./kitC";

// S14 RTL 단계에서 모델이 계속 하는 일: commit 마다 예산 검사, 초과하면 구조로 되돌아가는 길, 실측으로 재보정.

const TX = {
  commit: "RTL commit",
  model: "구조 모델 · 예산",
  legend: ["지연", "면적", "전력"],
  budget: "예산",
  mrTitle: "FEAT-352 soft 경로 · 예산 검사 (예시)",
  request: "RTL 설계자 · 구조에 변경 요청",
  comment: "FEAT-330 · RTL 설계자: soft_dec 3 → 2 검토 요청",
  approve: "아키텍트 · ADR-RCV-003 개정 2 승인",
  back: "RTL → 구조",
  emul: "emulation 실측",
  recal: "재보정",
} as const;

const MR_ROWS = [
  ["항목", "예산", "측정", "판정"],
  ["rcv_ctrl 단계 전환", "2 µs", "1.4 µs", "통과"],
  ["soft decode (최대)", "250 µs", "236 µs", "통과"],
  ["ECC 블록 면적", "+15%", "+17%", "초과"],
] as const;

const RERUN = [
  "구조 모델 재실행: soft_dec 3 → 2",
  "  host P99.99 1.74 ms (판정선 1.78) · 통과",
  "  GC 구간 처리량 −21% · 지속 쓰기 요구 충족",
  "  ECC 블록 면적 +13%",
];

// commit 마다의 막대 셋 (예산선 = 1)
const VALS: readonly (readonly [number, number, number])[] = [
  [0.6, 0.66, 0.48],
  [0.68, 0.74, 0.56],
  [0.76, 0.83, 0.64],
  [0.83, 0.9, 0.7],
  [0.9, 0.96, 0.78],
  [0.92, 17 / 15, 0.82],
];
const cx = (i: number): number => 340 + i * 128;
const LINE_Y = 336;
const BASE = 304;
const UNIT = 96; // 예산선의 높이
const MODEL = { x: 96, y: 404, w: 944, h: 70 } as const;
const RX = 1100;
const RW = 724;
const BACK_Y = 540;

export const S14: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, within } = useCues();
  const t1 = cue("s14.1");
  const t2 = cue("s14.2");
  const t3 = cue("s14.3");
  const t4 = cue("s14.4");
  const t5 = cue("s14.5");
  const t6 = cue("s14.6");
  const t7 = cue("s14.7");

  const dotAt = (i: number): number => (i < 5 ? t1 + 8 + i * 9 : t3);
  const barAt = (i: number): number => (i < 5 ? t2 + 10 + i * 7 : t3 + 6);
  const overAt = within("s14.3", 0.42);
  const mrAt = within("s14.3", 0.3);
  const fixAt = within("s14.5", 0.62);
  const over = progress(frame, overAt, 12) * (1 - progress(frame, fixAt, 16, ease.inOut));
  const areaLast = lerp(VALS[5][1], 13 / 15, progress(frame, fixAt, 20, ease.inOut));
  const lineEnd = lerp(1040, 1470, progress(frame, t7, 22, ease.inOut));
  const lineP = progress(frame, t1, 40, ease.inOut);
  const backAt = within("s14.4", 0.4);
  const backGlow = progress(frame, within("s14.6", 0.5), 14);
  const mrOut = t7 - 8;
  const gap = lerp(30, 0, progress(frame, within("s14.7", 0.5), 40, ease.inOut));
  const mrDim = 1 - 0.5 * progress(frame, t4, 14, ease.inOut);

  return (
    <ShiftSheet>
      <svg {...fullSvg}>
        {/* commit 선 */}
        <line x1={280} x2={lerp(280, lineEnd, lineP)} y1={LINE_Y} y2={LINE_Y} stroke={color.inkSoft} strokeWidth={stroke.trace} />
        {VALS.map((v, i) => {
          const d = progress(frame, dotAt(i), 10);
          if (d <= 0) return null;
          const last = i === 5;
          return (
            <g key={i}>
              <Trace pts={[[cx(i), LINE_Y + 10], [cx(i), MODEL.y - 3]]} stroke={color.agent} arrow at={i < 5 ? t2 + i * 5 : t3 + 4} duration={12} />
              <circle cx={cx(i)} cy={LINE_Y} r={9 * d} fill={color.bg} stroke={last && over > 0.5 ? color.problem : color.ink} strokeWidth={stroke.bold} />
              {v.map((val, k) => {
                const p = progress(frame, barAt(i) + k * 3, 14);
                if (p <= 0) return null;
                const value = last && k === 1 ? areaLast : val;
                const red = last && k === 1 ? over : 0;
                const c = red > 0.5 ? color.problem : color.agent;
                const h = value * UNIT * p;
                return <rect key={k} x={cx(i) - 41 + k * 29} y={BASE - h} width={24} height={h} fill={withAlpha(c, 0.4)} stroke={c} strokeWidth={stroke.thin} />;
              })}
              <line x1={cx(i) - 50} x2={cx(i) - 50 + 100 * progress(frame, barAt(i), 12)} y1={BASE - UNIT} y2={BASE - UNIT} stroke={color.human} strokeWidth={stroke.thin} strokeDasharray="7 5" />
            </g>
          );
        })}
        {/* 범례 */}
        <g opacity={progress(frame, t2 + 4, DUR.enter)}>
          {[0, 1, 2].map((k) => (
            <g key={k}>
              {[0, 1, 2].map((j) => (
                <rect key={j} x={300 + k * 160 + j * 12} y={j === k ? 96 : 110} width={9} height={j === k ? 34 : 20} fill={j === k ? color.agent : withAlpha(color.agent, 0.25)} />
              ))}
            </g>
          ))}
          <line x1={790} x2={846} y1={113} y2={113} stroke={color.human} strokeWidth={stroke.thin} strokeDasharray="7 5" />
        </g>

        {/* 초과한 막대 → MR */}
        <Trace pts={[[cx(5) + 24, BASE - UNIT * 1.1], [RX - 3, BASE - UNIT * 1.1]]} stroke={color.problem} dash="7 6" at={mrAt} opacity={vis(frame, mrAt, t5 - 8)} />

        {/* RTL → 구조: 되돌아가는 길 */}
        <Trace pts={[[RX, BACK_Y], [300, BACK_Y], [300, MODEL.y + MODEL.h + 3]]} stroke={color.agent} width={lerp(stroke.trace, stroke.bold + 1, backGlow)} dash="12 8" arrow at={backAt} duration={34} easing={ease.inOut} />
        {/* 구조 모델 → 재실행 결과 → 아키텍트 */}
        <Trace pts={[[180, MODEL.y + MODEL.h], [180, 600]]} stroke={color.agent} arrow at={t5} />
        <Trace pts={[[1040, 780], [RX - 3, 780]]} stroke={color.human} arrow at={t6 + 2} />

        {/* emulation 실측 → 재보정 */}
        {frame >= t7 ? (
          <g>
            <circle cx={1470} cy={LINE_Y} r={12 * progress(frame, t7 + 18, 10)} fill={color.bg} stroke={color.agent} strokeWidth={stroke.bold} />
            <Trace pts={[[1470, LINE_Y + 14], [1470, MODEL.y + MODEL.h / 2], [MODEL.x + MODEL.w + 3, MODEL.y + MODEL.h / 2]]} stroke={color.agent} width={stroke.bold} arrow at={within("s14.7", 0.45)} duration={26} />
            <CurvePair x={1570} y={300} w={254} h={170} gap={gap} p={progress(frame, t7 + 24, DUR.enter)} />
          </g>
        ) : null}
      </svg>

      <T x={96} y={LINE_Y - 20} px={32} weight={700} at={t1}>{TX.commit}</T>
      {TX.legend.map((text, k) => (
        <T key={text} x={346 + k * 160} y={94} px={30} weight={600} c={color.inkSoft} at={t2 + 4 + k * 3}>{text}</T>
      ))}
      <T x={858} y={94} px={30} weight={600} c={color.human} at={t2 + 14}>{TX.budget}</T>

      {/* 구조 모델: RTL 단계 내내 옆에 있다 */}
      <Box x={MODEL.x} y={MODEL.y} w={MODEL.w} h={MODEL.h} c={color.agent} at={within("s14.1", 0.4)} fill={withAlpha(color.agent, 0.1)} style={{ justifyContent: "flex-start", padding: "0 22px" }}>
        <AgentIcon size={40} color={color.agent} />
        <div style={{ ...sans(34, 700), color: color.agent, whiteSpace: "nowrap" }}>{TX.model}</div>
      </Box>

      {/* MR 카드 */}
      {frame >= mrAt && frame < mrOut + DUR.exit ? (
        <div style={{ opacity: vis(frame, mrAt, mrOut) * mrDim }}>
          <Box x={RX} y={96} w={RW} h={334} c={over > 0 || frame < t5 ? color.problem : color.lineStrong} at={mrAt} />
          <T x={RX + 24} y={110} px={30} weight={700} code c={color.agent} at={mrAt + 2}>MR !2207</T>
          <T x={RX + 24} y={152} px={30} weight={600} c={color.inkSoft} at={mrAt + 4}>{TX.mrTitle}</T>
          <Grid
            x={RX + 24}
            y={204}
            cols={[306, 132, 136, 100]}
            rowH={54}
            px={30}
            at={mrAt + 6}
            rowAt={(r) => (r === 3 ? overAt + 6 : mrAt + 6 + r * 4)}
            rows={MR_ROWS.map((row, r) => row.map((text, i) => (r === 0 ? text : { text, code: i === 1 || i === 2, weight: r === 3 ? 700 : 600, c: r === 3 && i >= 2 ? color.problem : i === 3 ? color.agent : color.ink })))}
          />
        </div>
      ) : null}

      {/* 사람: 구조에 변경 요청 */}
      <Box x={RX} y={BACK_Y - 42} w={RW} h={84} c={color.human} at={t4} fill={withAlpha(color.human, 0.1)} bw={stroke.bold} style={{ justifyContent: "flex-start", padding: "0 22px" }}>
        <HumanIcon size={44} color={color.human} />
        <div style={{ ...sans(34, 700), color: color.human, whiteSpace: "nowrap" }}>{TX.request}</div>
      </Box>
      <Box x={RX} y={606} w={RW} h={104} at={within("s14.4", 0.55)} style={{ flexDirection: "column", alignItems: "flex-start", justifyContent: "center", padding: "0 24px", gap: 4 }}>
        <div style={{ ...mono(22, 700), color: color.inkDim }}>JIRA · COMMENT</div>
        <div style={{ ...sans(30, 600), whiteSpace: "nowrap" }}>{TX.comment}</div>
      </Box>
      <T x={520} y={BACK_Y - 52} px={34} weight={700} c={color.agent} at={within("s14.6", 0.5)}>{TX.back}</T>

      {/* 구조 모델 재실행 */}
      <CodePanel
        x={96}
        y={600}
        w={944}
        title="ARCH MODEL · RERUN"
        px={30}
        at={t5 + 8}
        owner="agent"
        lines={RERUN.map((text, i) => (i === 0 ? { text, tone: "agent" as const } : i === 1 ? { text, at: within("s14.5", 0.3), mark: within("s14.5", 0.34) } : { text, at: within("s14.5", 0.55) + (i - 2) * 6, ...(i === 3 ? { mark: fixAt } : {}) }))}
      />

      {/* 사람: 결정 기록 개정 */}
      <Box x={RX} y={738} w={RW} h={84} c={color.human} at={t6} fill={withAlpha(color.human, 0.1)} bw={stroke.bold} style={{ justifyContent: "flex-start", padding: "0 22px" }}>
        <HumanIcon size={44} color={color.human} />
        <div style={{ ...sans(34, 700), color: color.human, whiteSpace: "nowrap" }}>{TX.approve}</div>
      </Box>

      {/* emulation 실측 */}
      <T x={1484} y={LINE_Y - 66} px={32} weight={700} c={color.agent} align="right" at={t7 + 16}>{TX.emul}</T>
      <T x={1250} y={MODEL.y - 14} px={32} weight={700} c={color.agent} align="center" at={within("s14.7", 0.5)}>{TX.recal}</T>
    </ShiftSheet>
  );
};
