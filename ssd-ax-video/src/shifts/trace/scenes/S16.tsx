import React from "react";
import { useCurrentFrame } from "remotion";
import { ease, progress } from "../../../video/anim";
import { color, fullSvg, mono, stroke, withAlpha } from "../../../video/theme";
import { ShiftSheet } from "../../lib";
import { Grid, MINI, MiniGraph, T, useCues, vis } from "./kitC";

// S16 실행 순서와 측정: 블록 하나 → 계단 넷(단계가 오를수록 작은 그래프가 채워진다) → 측정 카드.

const TX = {
  block: "read 오류 복구 · rcv_ctrl · prio_q",
  steps: [
    { no: "01", name: ["도구 추출"] },
    { no: "02", name: ["태그 관례", "+ trace-lint"] },
    { no: "03", name: ["에이전트", "링크 제안"] },
    { no: "04", name: ["블록 확대"] },
  ],
  noLlm: "LLM 없음",
  warnOnly: "처음에는 경고만 · 새 코드부터",
  measure: "측정 (블록 하나에서)",
  rows: [
    ["링크 정밀도", "확정 엣지 표본을 담당이 확인"],
    ["링크 재현율", "담당이 적은 정답 목록과 대조"],
    ["영향 분석 시간", "같은 변경을 두 방식으로"],
    ["빈틈의 추이", "검증 없는 조항 · 태그 없는 접근"],
  ],
  maturity: [
    ["SystemRDL · SystemVerilog · C++ 파서", "오픈소스"],
    ["Jira · R4J · Xray REST", "상용 + 연결 구축"],
    ["태그 스캐너 · CI 검사", "직접 구축"],
    ["그래프 DB", "오픈소스 · 상용"],
  ],
} as const;

const X0 = 96;
const SW = 432;
const BASE = 780;
const TREAD = [650, 520, 390, 260] as const;
const GS = 1.25;
const STEP_C = [color.agent, color.human, color.agent, color.lineStrong] as const;
const CARD = { x: 1084, y: 84, w: 740 } as const;

export const S16: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, within } = useCues();
  const t1 = cue("s16.1");
  const t2 = cue("s16.2");
  const t3 = cue("s16.3");
  const t4 = cue("s16.4");
  const t5 = cue("s16.5");
  const stepAt = [t2, t3, t4, within("s16.4", 0.62)];
  // 측정 카드가 나오면 계단은 왼쪽으로 작게 물러난다
  const back = progress(frame, t5 - 10, 22, ease.inOut);
  const dim = 1 - 0.15 * back;
  const shrink = 1 - 0.44 * back;

  const gx = (i: number): number => X0 + i * SW + (SW - MINI.w * GS) / 2;
  const gy = (i: number): number => TREAD[i] - MINI.h * GS - 12;

  const rowAt = [t5 + 4, within("s16.5", 0.24), within("s16.5", 0.6), within("s16.5", 0.82)];
  const matAt = within("s16.5", 0.94);

  return (
    <ShiftSheet>
      <div style={{ position: "absolute", inset: 0, opacity: dim, transformOrigin: "96px 894px", transform: `scale(${shrink})` }}>
        {/* 블록 하나 */}
        <svg {...fullSvg}>
          <rect x={X0} y={790} width={4 * SW} height={104} fill={withAlpha(color.panel, 0.9)} stroke={color.inkSoft} strokeWidth={stroke.thin} strokeDasharray="10 7" opacity={vis(frame, t1 - 4)} />
          {/* 계단 */}
          {TREAD.map((ty, i) => {
            const p = progress(frame, stepAt[i], 20, ease.inOut);
            if (p <= 0) return null;
            const x = X0 + i * SW;
            const from = i === 0 ? BASE : TREAD[i - 1];
            const rise = from - ty;
            const len = rise + SW;
            const shown = len * p;
            const last = i === 3;
            return (
              <g key={i} opacity={last ? 0.55 : 1}>
                <rect x={x} y={ty} width={SW} height={BASE - ty} fill={withAlpha(STEP_C[i], 0.07 * p)} />
                <path
                  d={`M ${x} ${from} V ${from - Math.min(rise, shown)}${shown > rise ? ` H ${x + (shown - rise)}` : ""}`}
                  fill="none"
                  stroke={STEP_C[i]}
                  strokeWidth={stroke.bold}
                  strokeDasharray={last ? "9 7" : undefined}
                />
              </g>
            );
          })}
          <line x1={X0} x2={X0 + 4 * SW * progress(frame, t1, 24, ease.inOut)} y1={BASE} y2={BASE} stroke={color.lineStrong} strokeWidth={stroke.thin} />
          <line x1={X0 + 4 * SW} x2={X0 + 4 * SW} y1={BASE} y2={BASE - (BASE - TREAD[3]) * progress(frame, stepAt[3] + 16, 14)} stroke={color.lineStrong} strokeWidth={stroke.thin} strokeDasharray="9 7" opacity={0.55} />
        </svg>
        <T x={X0 + 28} y={820} px={36} weight={700} at={t1}>{TX.block}</T>
        <MiniGraph x={X0 + 4 * SW - 190} y={796} s={0.58} nodes={progress(frame, t1 + 8, 24)} mute={false} opacity={vis(frame, t1 + 8)} />

        {/* 계단의 이름 */}
        {TX.steps.map((st, i) => {
          const x = X0 + i * SW + 18;
          const last = i === 3;
          return (
            <div key={st.no} style={{ opacity: last ? 0.55 : 1 }}>
              <T x={x} y={TREAD[i] + 14} px={24} weight={700} c={last ? color.inkDim : STEP_C[i]} at={stepAt[i] + 8} code>{st.no}</T>
              {st.name.map((n, k) => (
                <T key={k} x={x} y={TREAD[i] + 44 + k * 42} px={34} weight={700} at={stepAt[i] + 10 + k * 3}>{n}</T>
              ))}
            </div>
          );
        })}

        {/* 계단 위의 작은 그래프 */}
        <MiniGraph x={gx(0)} y={gy(0)} s={GS} nodes={progress(frame, t2 + 6, 18)} extract={progress(frame, within("s16.2", 0.3), 34, ease.inOut)} opacity={vis(frame, t2 + 6)} />
        <MiniGraph x={gx(1)} y={gy(1)} s={GS} nodes={progress(frame, t3 + 6, 18)} extract={progress(frame, t3 + 8, 14)} tag={progress(frame, within("s16.3", 0.3), 34, ease.inOut)} opacity={vis(frame, t3 + 6)} />
        <MiniGraph
          x={gx(2)}
          y={gy(2)}
          s={GS}
          nodes={progress(frame, t4 + 6, 18)}
          extract={progress(frame, t4 + 8, 14)}
          tag={progress(frame, t4 + 10, 14)}
          prop={progress(frame, within("s16.4", 0.22), 24, ease.inOut)}
          confirm={progress(frame, within("s16.4", 0.5), 16, ease.inOut)}
          opacity={vis(frame, t4 + 6)}
        />
        {[0, 1, 2].map((k) => (
          <MiniGraph key={k} x={X0 + 3 * SW + 70 + k * 52} y={TREAD[3] - 150 + (1 - k) * 18} s={0.78} nodes={1} extract={1} tag={1} mute opacity={0.75 * vis(frame, stepAt[3] + 10 + k * 5)} />
        ))}

        {/* 꼬리표 */}
        <T x={X0 + 18} y={gy(0) - 52} px={32} weight={700} c={color.agent} at={within("s16.2", 0.55)}>{TX.noLlm}</T>
        <T x={X0 + SW + 18} y={gy(1) - 52} px={32} weight={700} c={color.human} at={within("s16.3", 0.6)}>{TX.warnOnly}</T>
      </div>

      {/* 측정 카드 */}
      <svg {...fullSvg}>
        <rect x={CARD.x} y={CARD.y} width={CARD.w} height={312} fill={withAlpha(color.panel, 0.92)} stroke={color.lineStrong} strokeWidth={stroke.thin} opacity={vis(frame, t5 - 2)} />
        <rect x={CARD.x} y={CARD.y} width={5} height={312 * progress(frame, t5 - 2, 18)} fill={color.human} />
        <line x1={CARD.x} x2={CARD.x + CARD.w * progress(frame, t5, 20, ease.inOut)} y1={CARD.y + 68} y2={CARD.y + 68} stroke={color.line} strokeWidth={stroke.hair} />
      </svg>
      <T x={CARD.x + 28} y={CARD.y + 16} px={32} weight={700} at={t5}>{TX.measure}</T>
      <div style={{ position: "absolute", left: CARD.x + 28, top: CARD.y + 30, ...mono(22, 700), color: color.human, width: CARD.w - 56, textAlign: "right", opacity: vis(frame, t5 + 4) }}>MEASURE</div>
      <Grid
        x={CARD.x + 28}
        y={CARD.y + 80}
        cols={[226, 460]}
        rows={TX.rows.map(([a, b]) => [{ text: a, c: color.human, weight: 700 }, { text: b, weight: 500 }])}
        rowH={56}
        px={30}
        at={t5}
        rowAt={(r) => rowAt[r]}
        noHead
      />
      <T x={CARD.x} y={428} px={22} weight={700} c={color.inkDim} at={matAt} code>TOOLING</T>
      <Grid
        x={CARD.x}
        y={462}
        cols={[536, 204]}
        rows={TX.maturity.map(([a, b]) => [{ text: a, c: color.inkDim, weight: 500 }, { text: b, c: color.inkDim, weight: 500 }])}
        rowH={50}
        px={28}
        at={matAt}
        rowAt={(r) => matAt + 4 + r * 5}
        noHead
      />
    </ShiftSheet>
  );
};
