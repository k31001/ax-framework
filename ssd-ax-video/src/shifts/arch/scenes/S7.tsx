import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, countUp, ease, enter, lerp, progress } from "../../../video/anim";
import { CheckIcon, HumanIcon } from "../../../video/components/Icons";
import { Trace } from "../../../video/components/Trace";
import { hash } from "../../../video/scenes/s5_4/field";
import { color, fullSvg, mono, sans, stroke, withAlpha } from "../../../video/theme";
import { ShiftSheet } from "../../lib";
import { Box, EdgeTag, T, blend, useCues } from "./kitB";
import type { PlotRect } from "./kitB";

// s7 모델은 하나인가 여럿인가.
// 왼쪽: 통합 모델. 네 관점의 속도 막대 가운데 가장 긴 것에 통합 모델의 막대가 묶인다.
// 오른쪽: 목적별 모델 다섯 개. 저마다 속도가 따로이고, perf 는 수백 구성을 돌린다.

const U = { x: 96, y: 160, w: 520, h: 190 } as const;
const BAR = { x: 330, y0: 440, pitch: 44, h: 20 } as const;
const VIEWS = [
  { name: "성능", len: 74 },
  { name: "전력", len: 74 },
  { name: "면적", len: 10 },
  { name: "기능(FW 실행)", len: 560 },
];
const LONG = BAR.x + 560;
const UNI_Y = BAR.y0 + 4 * BAR.pitch + 12;
const S = { x: 1000, y: 520, w: 824, h: 360 } as const;
const PLOT: PlotRect = { x: 1070, y: 566, w: 720, h: 270 };

const MODELS = [
  { name: "perf", extra: " (+전력)", answer: "P99.99 · 활동률", time: "약 20분", len: 46, sx: 900, sy: 166 },
  { name: "area", extra: "", answer: "면적", time: "즉시", len: 4, sx: 1330, sy: 160 },
  { name: "func", extra: "", answer: "요청 · 완료 규칙", time: "수 초", len: 12, sx: 1120, sy: 222 },
  { name: "vp", extra: "", answer: "실제 FW · HSI 순서", time: "수 시간", len: 130, sx: 960, sy: 294 },
  { name: "formal", extra: "", answer: "굶는 요청 없음", time: "수 분", len: 28, sx: 1290, sy: 290 },
];
const ROW = { x: 1004, y0: 244, pitch: 50, h: 44, w: 226, ax: 1252, tx: 1556, bx: 1690 } as const;

// 산점도 자리의 점 216개 (면적이 클수록 지연이 작은 구름)
const CLOUD = Array.from({ length: 216 }, (_, i) => {
  const u = hash(i * 2 + 41);
  return { x: PLOT.x + 24 + u * (PLOT.w - 48), y: PLOT.y + PLOT.h - 18 - (Math.pow(1 - u, 1.7) * 0.62 + hash(i * 2 + 42) * 0.3) * (PLOT.h - 30) };
});
const FEW = [0, 1, 2, 3].map((k) => CLOUD.reduce((best, c) => (Math.abs(c.x - (PLOT.x + 60 + k * 200)) < Math.abs(best.x - (PLOT.x + 60 + k * 200)) ? c : best)));

// 큰 상자 안에 얽히는 가는 선
const TANGLE = Array.from({ length: 18 }, (_, i) => {
  const px = (k: number): number => U.x + 16 + hash(i * 11 + k) * (U.w - 32);
  const py = (k: number): number => U.y + 22 + hash(i * 13 + k + 5) * (U.h - 40);
  return `M ${px(1)} ${py(1)} H ${px(2)} V ${py(2)} H ${px(3)} V ${py(3)}`;
});

const RedTag: React.FC<{ y: number; text: string; at: number }> = ({ y, text, at }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: U.x, top: y, height: 48, boxSizing: "border-box", display: "flex", alignItems: "center", padding: "0 18px", border: `${stroke.thin}px solid ${color.problem}`, backgroundColor: withAlpha(color.problem, 0.08), ...sans(30, 700), color: color.problem, whiteSpace: "nowrap", ...enter(frame, at, { from: "left" }) }}>
      {text}
    </div>
  );
};

export const S7: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, within } = useCues();
  const t1 = cue("s7.1");
  const t2 = cue("s7.2");
  const t3 = cue("s7.3");
  const t4 = cue("s7.4");
  const t5 = cue("s7.5");

  const lit = progress(frame, t2, DUR.enter);
  const slowAt = within("s7.3", 0.3);
  const tieAt = within("s7.3", 0.48);
  const fewAt = within("s7.3", 0.72);
  const slow = progress(frame, slowAt, DUR.enter);
  const tie = progress(frame, tieAt, 26, ease.inOut);
  const tied = progress(frame, tieAt + 22, DUR.enter);
  const tangle = progress(frame, t4, 50, ease.linear);
  const split = progress(frame, t5, DUR.move, ease.inOut);
  const leftDim = 1 - 0.72 * split;
  const many = within("s7.5", 0.42);
  const manyP = progress(frame, many, 60, ease.linear);

  const edge = blend(blend(color.lineStrong, color.ink, lit), color.problem, tied);
  const scatter = progress(frame, t3 + 4, DUR.draw);

  return (
    <ShiftSheet>
      <T x={960} y={74} text="모델은 하나인가, 여럿인가" px={52} weight={800} align="center" at={t1} />

      {/* ── 왼쪽: 통합 모델 ── */}
      <div style={{ opacity: leftDim }}>
        <Box x={U.x} y={U.y} w={U.w} h={U.h} c={edge} bw={tied > 0 ? stroke.trace : stroke.thin} fill={withAlpha(color.panel, 0.92)} p={progress(frame, t1 + 12, DUR.enter)}>
          <div style={{ ...sans(38, 800), whiteSpace: "nowrap", color: blend(color.inkSoft, color.ink, lit), letterSpacing: "-0.02em" }}>성능 · 전력 · 면적 · 기능</div>
        </Box>
        <svg {...fullSvg}>
          {tangle > 0
            ? TANGLE.map((d, i) => <path key={i} d={d} fill="none" stroke={color.lineStrong} strokeWidth={stroke.hair} opacity={0.75} pathLength={1} strokeDasharray={`${Math.max(0, Math.min(1, tangle * 2.2 - i / 16))} 1`} />)
            : null}
        </svg>
        <EdgeTag x={U.x + 22} y={U.y} text="통합 모델" c={blend(color.inkSoft, color.ink, lit)} p={progress(frame, t1 + 12, DUR.enter)} px={30} />
        <div style={{ position: "absolute", left: U.x + U.w + 18, top: U.y + 56, display: "flex", alignItems: "center", gap: 8, ...enter(frame, within("s7.4", 0.35), { from: "left" }) }}>
          <HumanIcon size={54} color={color.human} />
          <div style={{ ...sans(64, 800), color: color.human, lineHeight: 1 }}>?</div>
        </div>

        {/* 일관성 */}
        <div style={{ position: "absolute", left: U.x + 30, top: U.y + U.h + 12, display: "flex", alignItems: "center", gap: 12, ...enter(frame, within("s7.2", 0.55)) }}>
          <CheckIcon size={30} color={color.agent} />
          <div style={{ ...sans(30, 600), whiteSpace: "nowrap" }}>일관성: 모든 관점이 같은 구조를 본다</div>
        </div>

        {/* 속도 눈금 */}
        <T x={BAR.x} y={BAR.y0 - 30} text="TIME / CONFIG" px={22} code c={color.inkDim} at={t3} />
        {VIEWS.map((v, i) => {
          const y = BAR.y0 + i * BAR.pitch;
          const at = t3 + 4 + i * 5;
          const p = progress(frame, at, i === 3 ? 30 : 14, ease.out);
          const hot = i === 3 ? slow : 0;
          return (
            <React.Fragment key={v.name}>
              <T x={BAR.x - 16} y={y} text={v.name} px={30} weight={i === 3 ? 700 : 500} align="right" c={blend(color.inkSoft, color.ink, hot)} at={at} opacity={i === 3 ? 1 : 1 - 0.35 * slow} />
              <div style={{ position: "absolute", left: BAR.x, top: y + 10, width: v.len * p, height: BAR.h, backgroundColor: blend(color.inkSoft, color.ink, hot), opacity: i === 3 ? 1 : 1 - 0.45 * slow }} />
            </React.Fragment>
          );
        })}
        <svg {...fullSvg}>
          <line x1={BAR.x} x2={BAR.x} y1={BAR.y0 - 2} y2={UNI_Y + 40} stroke={color.lineStrong} strokeWidth={stroke.hair} opacity={progress(frame, t3, 10)} />
          {/* 가장 긴 막대의 끝에서 통합 모델의 막대로 */}
          <line x1={LONG} x2={LONG} y1={BAR.y0 + 3 * BAR.pitch + 34} y2={BAR.y0 + 3 * BAR.pitch + 34 + (UNI_Y + 6 - (BAR.y0 + 3 * BAR.pitch + 34)) * progress(frame, tieAt, 12)} stroke={color.problem} strokeWidth={stroke.thin} strokeDasharray="6 6" />
          {/* 통합 모델 상자 → 통합 모델 막대 */}
          <Trace pts={[[U.x + 8, U.y + U.h], [U.x + 8, UNI_Y + 20], [U.x + 24, UNI_Y + 20]]} stroke={color.problem} width={stroke.trace} at={tieAt} duration={20} />
          {/* 통합 모델 → 산점도 자리 */}
          <Trace pts={[[LONG + 8, UNI_Y + 20], [S.x - 4, UNI_Y + 20]]} stroke={color.problem} width={stroke.trace} dash="6 7" arrow at={fewAt} />
        </svg>
        <T x={BAR.x - 16} y={UNI_Y} text="통합 모델" px={30} weight={700} align="right" c={color.problem} at={tieAt + 6} />
        <div style={{ position: "absolute", left: BAR.x, top: UNI_Y + 8, width: 560 * tie, height: BAR.h + 4, backgroundColor: color.problem }} />

        <RedTag y={682} text="한 구성에 수 시간 (예시) · 후보 몇 개" at={fewAt} />
        <RedTag y={738} text="변경 하나가 전체에 걸림 · 검증하기 어려움" at={within("s7.4", 0.5)} />
        <T x={U.x} y={800} text="공개 사례: 성능 시뮬레이터에 전력 · 면적 모델을 붙인" px={30} weight={500} c={color.inkDim} at={within("s7.4", 0.8)} />
        <T x={U.x} y={840} text="도구의 오차가 큼 (CPU 대상 논문)" px={30} weight={500} c={color.inkDim} at={within("s7.4", 0.8) + 3} />
      </div>

      {/* ── 가운데 물음표 ── */}
      <T x={748} y={196} text="?" px={104} weight={800} c={color.inkDim} align="center" at={within("s7.1", 0.6)} out={t2 - 6} />

      {/* ── 산점도 자리 ── */}
      <svg {...fullSvg}>
        <rect x={S.x} y={S.y} width={S.w} height={S.h} fill={withAlpha(color.panel, 0.7)} stroke={blend(color.line, color.agent, split * 0.6)} strokeWidth={stroke.thin} opacity={scatter} />
        <path d={`M ${PLOT.x} ${PLOT.y} V ${PLOT.y + PLOT.h} H ${PLOT.x + PLOT.w}`} fill="none" stroke={color.lineStrong} strokeWidth={stroke.thin} opacity={scatter} />
        {/* 통합 모델: 점 서너 개 */}
        {FEW.map((c, i) => {
          const p = progress(frame, fewAt + 10 + i * 9, 10);
          return p > 0 ? <circle key={i} cx={c.x} cy={c.y} r={8 * (0.5 + 0.5 * p)} fill={blend(color.ink, color.agent, split)} opacity={p} /> : null;
        })}
        {/* 목적별 perf: 수백 개 */}
        {manyP > 0
          ? CLOUD.map((c, i) => {
              const p = progress(frame, many + hash(i + 3) * 54, 8);
              return p > 0 ? <circle key={i} cx={c.x} cy={c.y} r={3.6} fill={color.agent} opacity={0.85 * p} /> : null;
            })
          : null}
        {/* perf → 산점도 */}
        <Trace pts={[[ROW.x, ROW.y0 + ROW.h / 2], [ROW.x - 28, ROW.y0 + ROW.h / 2], [ROW.x - 28, S.y + 60], [S.x, S.y + 60]]} stroke={color.agent} width={stroke.trace} arrow at={many - 8} duration={22} />
      </svg>
      <T x={PLOT.x + 12} y={S.y + 12} text="P99.99" px={22} code c={color.inkDim} opacity={scatter} />
      <T x={PLOT.x + PLOT.w} y={PLOT.y + PLOT.h + 8} text="AREA" px={22} code c={color.inkDim} align="right" opacity={scatter} />
      <T x={S.x + S.w - 20} y={S.y + 12} text={`CONFIGS  ${countUp(manyP, 4, 216)}`} px={22} code weight={700} c={blend(color.inkSoft, color.agent, split)} align="right" at={fewAt + 6} />

      {/* ── 오른쪽: 목적별 모델 ── */}
      <T x={1560} y={232} text="목적별 모델" px={36} weight={700} c={color.inkSoft} at={within("s7.1", 0.45)} out={t5 - 4} />
      <T x={ROW.x} y={150} text="목적별 모델 (예시)" px={34} weight={800} at={t5 + 6} />
      {["모델", "답하는 것", "한 구성"].map((h, i) => (
        <T key={h} x={[ROW.x, ROW.ax, ROW.tx][i]} y={200} text={h} px={30} weight={500} c={color.inkDim} at={t5 + 12} />
      ))}
      {MODELS.map((m, i) => {
        const appear = progress(frame, within("s7.1", 0.45) + i * 4, DUR.enter);
        const x = lerp(m.sx, ROW.x, split);
        const y = lerp(m.sy, ROW.y0 + i * ROW.pitch, split);
        const w = lerp(150, ROW.w, split);
        const rowAt = t5 + 22 + i * 7;
        const bar = progress(frame, rowAt + 6, 18, ease.out);
        return (
          <React.Fragment key={m.name}>
            <Box x={x} y={y} w={w} h={lerp(56, ROW.h, split)} c={blend(color.lineStrong, color.agent, split)} p={appear} fill={blend(color.panel, color.agent, 0.1 * split)}>
              <div style={{ ...mono(30, 700), letterSpacing: "0", color: blend(color.inkSoft, color.ink, split) }}>
                {m.name}
                {m.extra && split > 0.6 ? <span style={{ ...sans(30, 600), color: color.agent, opacity: progress(frame, rowAt, 10) }}>{m.extra}</span> : null}
              </div>
            </Box>
            <T x={ROW.ax} y={ROW.y0 + i * ROW.pitch + 3} text={m.answer} px={30} weight={500} at={rowAt} />
            <T x={ROW.tx} y={ROW.y0 + i * ROW.pitch + 3} text={m.time} px={30} weight={700} c={color.agent} at={rowAt + 4} />
            <div style={{ position: "absolute", left: ROW.bx, top: ROW.y0 + i * ROW.pitch + 14, width: Math.max(0, m.len * bar), height: 16, backgroundColor: color.agent, opacity: bar > 0 ? 1 : 0 }} />
          </React.Fragment>
        );
      })}
    </ShiftSheet>
  );
};
