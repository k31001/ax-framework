import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, ease, progress } from "../../../video/anim";
import { HumanIcon } from "../../../video/components/Icons";
import { Trace } from "../../../video/components/Trace";
import { color, fullSvg, mono, sans, stroke, withAlpha } from "../../../video/theme";
import { ShiftSheet } from "../../lib";
import { BarsMark, CurvePair, Hourglass, ScatterMark, T, useCues } from "./kitC";

// S16 실행 순서(계단 셋)와 지키는 선(호박색 선 위의 세 항목).

const TX = {
  order: "실행 순서",
  steps: [
    { lines: ["이전 세대 모델을 실측에 보정"], who: ["아키텍트", "에이전트"] },
    { lines: ["블록 하나(rcv_ctrl)의 예산을", "commit마다 검사"], who: ["RTL 설계자"] },
    { lines: ["다음 구조 변경에서 기간을 정해", "후보 비교 · 든 시간 측정"], who: [] },
  ],
  maturity: [
    ["성능 모델", "오픈소스 + 직접 구축"],
    ["가상 플랫폼", "상용 (블록 모델은 직접 구축)"],
    ["탐색 에이전트", "논문 (CPU · 가속기 대상) → 직접 구축"],
    ["결정 기록", "직접 구축"],
  ],
  guard: "지키는 선",
  g1: "모델은 적어 둔 범위 안에서만",
  out: "범위 밖",
  outWhat: "고온 방치 직후 전원 인가",
  noData: "(데이터 없음)",
  g2: ["모델의 판정은 emulation ·", "제품 테스트로 재확인"],
  main: ["본편: 고온 방치 뒤 문제는", "제품 테스트가 찾음"],
  g3: "구조의 선택과 책임은 사람",
  waiting: "검토 대기",
  building: "구현 중",
} as const;

const SX = [96, 672, 1248, 1824] as const;
const TOP = [292, 216, 140] as const;
const BASE = 448;
const LINE_Y = 872;
const GX = [96, 680, 1264] as const;

export const S16: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, within } = useCues();
  const t = [cue("s16.1"), cue("s16.2"), cue("s16.3")];
  const t4 = cue("s16.4");
  const t5 = cue("s16.5");
  const t6 = cue("s16.6");
  const g = [t4, t5, t6];

  const topDim = 1 - 0.5 * progress(frame, t4 - 4, 16, ease.inOut);
  const tagAt = within("s16.3", 0.62);
  const lineP = progress(frame, t4, 30, ease.inOut);
  const outAt = within("s16.4", 0.55);
  const stageAt = within("s16.5", 0.4);
  const signAt = t6 + 14;
  const sign = progress(frame, signAt, 26, ease.inOut);
  const flip = progress(frame, within("s16.6", 0.6), 14);

  return (
    <ShiftSheet>
      {/* ── 실행 순서 ── */}
      <div style={{ opacity: topDim }}>
        <T x={96} y={84} px={34} weight={800} c={color.inkSoft} at={t[0] - 8}>{TX.order}</T>
        <svg {...fullSvg}>
          <line x1={96} x2={1824} y1={BASE} y2={BASE} stroke={color.line} strokeWidth={stroke.hair} opacity={progress(frame, t[0], 12)} />
          {[0, 1, 2].map((i) => {
            const on = progress(frame, t[i], 12);
            return (
              <g key={i}>
                <rect x={SX[i]} y={TOP[i]} width={SX[i + 1] - SX[i]} height={BASE - TOP[i]} fill={withAlpha(color.agent, 0.07)} opacity={on} />
                <Trace pts={i === 0 ? [[SX[0], BASE], [SX[0], TOP[0]], [SX[1], TOP[0]]] : i === 1 ? [[SX[1], TOP[0]], [SX[1], TOP[1]], [SX[2], TOP[1]]] : [[SX[2], TOP[1]], [SX[2], TOP[2]], [SX[3], TOP[2]], [SX[3], BASE]]} stroke={color.agent} width={stroke.bold} chamfer={0} at={t[i]} duration={24} easing={ease.inOut} />
              </g>
            );
          })}
          <CurvePair x={520} y={432} w={140} h={50} p={progress(frame, t[0] + 18, DUR.enter)} />
          <BarsMark x={1150} y={432} s={1.2} p={progress(frame, t[1] + 18, DUR.enter)} />
          <ScatterMark x={1290} y={316} s={100} p={progress(frame, within("s16.3", 0.5), DUR.enter)} />
          <Hourglass x={1490} y={326} s={84} p={progress(frame, within("s16.3", 0.32), DUR.enter)} />
        </svg>
        {TX.steps.map((s, i) => {
          const x = SX[i] + 28;
          const y = TOP[i] + 14;
          return (
            <React.Fragment key={i}>
              <T x={x} y={y} px={32} weight={700} code c={color.agent} at={t[i] + 6}>{`0${i + 1}`}</T>
              {s.lines.map((text, k) => (
                <T key={text} x={x} y={y + 42 + k * 42} px={32} weight={700} at={t[i] + 10 + k * 4}>{text}</T>
              ))}
              {s.who.length > 0 ? (
                <div style={{ position: "absolute", left: x, top: y + 46 + s.lines.length * 42, display: "flex", gap: 12, ...sans(30, 600), whiteSpace: "nowrap", opacity: progress(frame, t[i] + 20, DUR.enter) }}>
                  {s.who.map((w, k) => (
                    <React.Fragment key={w}>
                      {k > 0 ? <span style={{ color: color.inkDim }}>·</span> : null}
                      <span style={{ color: w === "에이전트" ? color.agent : color.human }}>{w}</span>
                    </React.Fragment>
                  ))}
                </div>
              ) : null}
            </React.Fragment>
          );
        })}
        {/* 성숙도 꼬리표 */}
        {TX.maturity.map(([name, value], i) => {
          const x = i < 2 ? 96 : 960;
          const y = 464 + (i % 2) * 42;
          return (
            <div key={name} style={{ position: "absolute", left: x, top: y, display: "flex", ...sans(30, 500), whiteSpace: "nowrap", opacity: 0.8 * progress(frame, tagAt + i * 4, DUR.enter) }}>
              <div style={{ width: 196, color: color.inkSoft }}>{name}</div>
              <div style={{ color: color.inkDim }}>{value}</div>
            </div>
          );
        })}
      </div>

      {/* ── 지키는 선 ── */}
      <T x={96} y={566} px={34} weight={800} c={color.human} at={t4 - 4}>{TX.guard}</T>
      <svg {...fullSvg}>
        <line x1={96} x2={96 + 1728 * lineP} y1={LINE_Y} y2={LINE_Y} stroke={color.human} strokeWidth={6} />
        {GX.map((x, i) => (
          <line key={x} x1={x + 3} x2={x + 3} y1={LINE_Y} y2={LINE_Y - 244 * progress(frame, g[i], 18)} stroke={color.human} strokeWidth={stroke.bold} />
        ))}
        {/* 범위 밖: 붉은 점선 밑줄 */}
        <line x1={GX[0] + 28} x2={GX[0] + 28 + 440 * progress(frame, outAt + 8, 18)} y1={746} y2={746} stroke={color.problem} strokeWidth={stroke.trace} strokeDasharray="8 6" opacity={frame >= outAt + 8 ? 1 : 0} />

        {/* 본편 7단계 선 */}
        {frame >= stageAt ? (
          <g>
            <line x1={GX[1] + 40} x2={GX[1] + 40 + 480 * progress(frame, stageAt, 20, ease.inOut)} y1={748} y2={748} stroke={color.lineStrong} strokeWidth={stroke.thin} />
            {[0, 1, 2, 3, 4, 5, 6].map((i) => {
              const hit = i === 4 || i === 6;
              const p = progress(frame, stageAt + 4 + i * 3, 10);
              return <circle key={i} cx={GX[1] + 40 + i * 80} cy={748} r={(hit ? 11 : 6) * p} fill={hit ? color.agent : color.bg} stroke={hit ? color.agent : color.inkDim} strokeWidth={stroke.thin} />;
            })}
          </g>
        ) : null}

        {/* 서명 */}
        <path d={`M ${GX[2] + 120} 740 c 14 -44 30 -44 26 -6 c -4 30 16 -30 34 -30 c 16 0 -6 40 12 36 c 16 -4 22 -34 38 -32 c 14 2 0 30 16 30 c 20 0 30 -20 60 -18`} fill="none" stroke={color.human} strokeWidth={stroke.bold} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - sign} opacity={sign > 0 ? 1 : 0} />
        <line x1={GX[2] + 110} x2={GX[2] + 110 + 240 * progress(frame, signAt - 6, 14)} y1={756} y2={756} stroke={color.lineStrong} strokeWidth={stroke.hair} />
        <Trace pts={[[GX[2] + 190, 812], [GX[2] + 236, 812]]} stroke={color.human} arrow at={within("s16.6", 0.55)} duration={10} />
      </svg>

      <T x={GX[0] + 28} y={622} px={34} weight={800} at={t4 + 6}>{TX.g1}</T>
      <div style={{ position: "absolute", left: GX[0] + 28, top: 700, display: "flex", gap: 18, ...sans(30, 600), whiteSpace: "nowrap", opacity: progress(frame, outAt, DUR.enter) }}>
        <span style={{ color: color.problem, fontWeight: 800 }}>{TX.out}</span>
        <span>{TX.outWhat}</span>
      </div>
      <T x={GX[0] + 28 + 106} y={758} px={30} weight={500} c={color.inkDim} at={outAt + 6}>{TX.noData}</T>

      {TX.g2.map((text, i) => (
        <T key={text} x={GX[1] + 28} y={622 + i * 44} px={34} weight={800} at={t5 + 6 + i * 4}>{text}</T>
      ))}
      <T x={GX[1] + 40 + 320} y={708} px={22} weight={700} code c={color.agent} align="center" at={stageAt + 16}>EMUL</T>
      <T x={GX[1] + 40 + 480} y={708} px={22} weight={700} code c={color.agent} align="center" at={stageAt + 22}>QUAL</T>
      {TX.main.map((text, i) => (
        <T key={text} x={GX[1] + 28} y={774 + i * 38} px={30} weight={500} c={color.inkSoft} at={within("s16.5", 0.7) + i * 4}>{text}</T>
      ))}

      <T x={GX[2] + 28} y={622} px={34} weight={800} c={color.human} at={t6 + 6}>{TX.g3}</T>
      <div style={{ position: "absolute", left: GX[2] + 28, top: 690, opacity: progress(frame, t6 + 10, DUR.enter) }}>
        <HumanIcon size={64} color={color.human} />
      </div>
      <div style={{ position: "absolute", left: GX[2] + 28, top: 790, width: 156, height: 44, boxSizing: "border-box", border: `${stroke.thin}px solid ${color.agent}`, display: "flex", alignItems: "center", justifyContent: "center", ...sans(30, 700), color: color.agent, whiteSpace: "nowrap", opacity: progress(frame, within("s16.6", 0.45), DUR.enter) * (1 - 0.5 * flip) }}>{TX.waiting}</div>
      <div style={{ position: "absolute", left: GX[2] + 246, top: 790, width: 140, height: 44, boxSizing: "border-box", border: `${stroke.bold}px solid ${color.human}`, backgroundColor: withAlpha(color.human, 0.14), display: "flex", alignItems: "center", justifyContent: "center", ...sans(30, 700), color: color.human, whiteSpace: "nowrap", opacity: flip }}>{TX.building}</div>
      <div style={{ position: "absolute", left: GX[2] + 402, top: 800, ...mono(22, 700), color: color.human, opacity: flip }}>HUMAN ONLY</div>
    </ShiftSheet>
  );
};
