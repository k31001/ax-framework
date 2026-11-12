import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, ease, enter, lerp, progress } from "../../../video/anim";
import { AgentIcon } from "../../../video/components/Icons";
import { Trace } from "../../../video/components/Trace";
import { color, fullSvg, mono, sans, stroke, withAlpha } from "../../../video/theme";
import { ShiftSheet } from "../../lib";
import { Box, T, useCues, vis } from "./kitC";

// S15 AX 가 바꾸는 손익 계산과 판단 기준: 두 경로 비교표 → 손익분기점 그래프 → 판단 기준 → 병행.

const TX = {
  tableTitle: "같은 변경, 두 경로 (예시 · 단계 기준)",
  rtlFirst: "RTL 먼저",
  modelFirst: "모델 먼저",
  rows: [
    ["P99.99 첫 확인", "emulation", "RTL 쓰기 전"],
    ["지연 초과 발견", "emulation", "모델 (A · B 탈락)"],
    ["GC 경쟁 발견", "emulation 2회차", "모델 (C 수정)"],
    ["되돌아가는 범위", "RTL · HSI · FW", "모델 설정 · 결정 기록"],
  ],
  xAxis: "구조 변경의 크기 (작음 → 큼)",
  yAxis: "드는 비용",
  concept: "개념도 · 수치 없음",
  fixed: "고정비",
  breakEven: "손익분기점",
  agent: "에이전트:",
  agentWork: "모델 생성 · 보정 · 탐색",
  unknown: ["SSD 공개 사례 없음", "팀이 직접 측정"],
  modelIf: "모델 먼저 — 하나라도 해당하면",
  modelItems: ["HW/FW 경계가 움직인다", "새 공유 자원 · 경쟁 경로가 생긴다", "판정 지표가 시스템 통계다 (P99.99)", "interface 계약이 두 블록 이상에서 바뀐다"],
  rtlIf: "RTL 먼저 — 모두 해당하면",
  rtlItems: ["구조와 경계가 그대로다", "변경이 블록 안에 머문다", "블록 검증으로 판정된다"],
  common: "공통 블록 RTL (retry FSM)",
  model: "모델",
  give: "면적 · timing 수치",
  budget: "예산",
  together: "병행",
} as const;

// ── 표 ──
const TB = { x: 96, y: 84, c1: 96, c2: 500, c3: 1130, headY: 132, headH: 92, rowH: 54 } as const;
const STAGES_RTL = ["ARCH", "RTL", "VERIF", "EMUL"] as const;
const STAGES_MODEL = ["ARCH", "MODEL", "RTL", "VERIF", "EMUL"] as const;

// ── 그래프 ──
const G = { x0: 200, x1: 930, y0: 830, y1: 490 } as const;
const gx = (u: number): number => G.x0 + u * (G.x1 - G.x0);
const gy = (v: number): number => G.y0 - v * (G.y0 - G.y1);
const rtlCost = (u: number): number => 0.08 + 0.9 * Math.pow(u, 2.2);
const SLOPE = 0.22;
const F0 = 0.5;
const F1 = 0.17;
const crossing = (fixed: number): number => {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (rtlCost(mid) < fixed + SLOPE * mid) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
};

// ── 판단 기준 카드 ──
const CARD = { x: 1160, y: 96, w: 664 } as const;
const ITEM_H = 66;

const MiniLine: React.FC<{ x: number; y: number; stages: readonly string[]; hit: number; c: string; p: number }> = ({ x, y, stages, hit, c, p }) => {
  const step = 420 / (stages.length - 1);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 460, height: 70, opacity: p }}>
      <svg width={460} height={70} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <line x1={20} x2={20 + 420 * p} y1={22} y2={22} stroke={color.lineStrong} strokeWidth={stroke.thin} />
        {stages.map((s, i) => (
          <g key={s}>
            <circle cx={20 + i * step} cy={22} r={i === hit ? 9 : 6} fill={i === hit ? c : color.bg} stroke={i === hit ? c : color.inkDim} strokeWidth={stroke.thin} />
            {i === hit ? <circle cx={20 + i * step} cy={22} r={17} fill="none" stroke={c} strokeWidth={stroke.thin} /> : null}
          </g>
        ))}
      </svg>
      {stages.map((s, i) => (
        <div key={s} style={{ position: "absolute", left: 20 + i * step - 60, width: 120, top: 44, textAlign: "center", ...mono(22, 700), color: i === hit ? c : color.inkDim }}>{s}</div>
      ))}
    </div>
  );
};

export const S15: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, within } = useCues();
  const t1 = cue("s15.1");
  const t2 = cue("s15.2");
  const t4 = cue("s15.4");
  const t5 = cue("s15.5");
  const t6 = cue("s15.6");
  const t7 = cue("s15.7");
  const t8 = cue("s15.8");

  // 표: 그래프가 나오면 흐려지고, 판단 기준이 나오기 전에 나간다
  const tableOut = t5 - 12;
  const table = vis(frame, t1 - 6, tableOut) * (1 - 0.5 * progress(frame, t2 - 4, 16, ease.inOut));
  const rowAt = (r: number): number => t1 + 16 + r * 9;

  // 그래프
  const graph = progress(frame, t2 - 4, DUR.enter) * (1 - 0.45 * progress(frame, t5 - 6, 16, ease.inOut));
  const axes = progress(frame, t2, 22, ease.inOut);
  const rtlP = progress(frame, t2 + 10, 34, ease.inOut);
  const modelAt = within("s15.2", 0.18);
  const modelP = progress(frame, modelAt, 30, ease.inOut);
  const fixedAt = within("s15.2", 0.58);
  const fixedP = progress(frame, fixedAt, 16);
  const crossAt = within("s15.2", 0.86);
  const crossP = progress(frame, crossAt, 14);
  const lowerAt = within("s15.3", 0.26);
  const lower = progress(frame, lowerAt, 44, ease.inOut);
  const F = lerp(F0, F1, lower);
  const u = crossing(F);
  const dot = { x: gx(u), y: gy(rtlCost(u)) };
  const agentAt = within("s15.3", 0.04);
  const askAt = t4;
  const ask = progress(frame, askAt, 14);
  const measureAt = within("s15.4", 0.52);

  const rtlPts: string[] = [];
  const N = 60;
  for (let i = 0; i <= Math.round(N * rtlP); i++) rtlPts.push(`${gx(i / N).toFixed(1)},${gy(rtlCost(i / N)).toFixed(1)}`);

  // 판단 기준
  const itemAt = [t5 + 6, within("s15.5", 0.42), t6 + 2, within("s15.6", 0.72)];
  const rtlItemAt = [t7 + 6, within("s15.7", 0.36), within("s15.7", 0.7)];
  const cardH = 28 + 56 + 4 * ITEM_H + 36 + 56 + 3 * ITEM_H + 24;
  const modelTop = CARD.y + 28;
  const rtlTop = modelTop + 56 + 4 * ITEM_H + 36;

  // 병행 고리
  const loopAt = t8 + 2;
  const giveAt = within("s15.8", 0.45);

  return (
    <ShiftSheet>
      {/* ── 두 경로 비교표 ── */}
      {table > 0 ? (
        <div style={{ opacity: table }}>
          <T x={TB.x} y={TB.y} px={30} weight={600} c={color.inkSoft} at={t1 - 6}>{TX.tableTitle}</T>
          <svg {...fullSvg}>
            <line x1={TB.x} x2={lerp(TB.x, 1824, progress(frame, t1, 24, ease.inOut))} y1={TB.headY + TB.headH} y2={TB.headY + TB.headH} stroke={color.lineStrong} strokeWidth={stroke.thin} />
            {TX.rows.map((_, r) => (
              <line key={r} x1={TB.x} x2={1824} y1={TB.headY + TB.headH + (r + 1) * TB.rowH} y2={TB.headY + TB.headH + (r + 1) * TB.rowH} stroke={color.line} strokeWidth={stroke.hair} opacity={progress(frame, rowAt(r), 10)} />
            ))}
            <rect x={TB.c3 - 24} y={TB.headY} width={1824 - TB.c3 + 24} height={TB.headH + 4 * TB.rowH} fill={withAlpha(color.agent, 0.07)} opacity={progress(frame, t1 + 8, 14)} />
            <rect x={TB.c3 - 24} y={TB.headY} width={5} height={(TB.headH + 4 * TB.rowH) * progress(frame, t1 + 8, 20)} fill={color.agent} />
          </svg>
          <T x={TB.c2} y={TB.headY + 22} px={38} weight={800} at={t1 + 4}>{TX.rtlFirst}</T>
          <T x={TB.c3} y={TB.headY + 22} px={38} weight={800} c={color.agent} at={t1 + 8}>{TX.modelFirst}</T>
          <MiniLine x={TB.c2 + 180} y={TB.headY + 12} stages={STAGES_RTL} hit={3} c={color.problem} p={progress(frame, t1 + 12, 18)} />
          <MiniLine x={TB.c3 + 210} y={TB.headY + 12} stages={STAGES_MODEL} hit={1} c={color.agent} p={progress(frame, t1 + 16, 18)} />
          {TX.rows.map((row, r) => {
            const y = TB.headY + TB.headH + r * TB.rowH + 7;
            return (
              <React.Fragment key={r}>
                <T x={TB.c1} y={y} px={32} weight={600} c={color.inkSoft} at={rowAt(r)}>{row[0]}</T>
                <T x={TB.c2} y={y} px={32} weight={700} c={color.problem} at={rowAt(r) + 2}>{row[1]}</T>
                <T x={TB.c3} y={y} px={32} weight={700} c={color.agent} at={rowAt(r) + 4}>{row[2]}</T>
              </React.Fragment>
            );
          })}
        </div>
      ) : null}

      {/* ── 손익분기점 그래프 ── */}
      {graph > 0 ? (
        <div style={{ opacity: graph }}>
          <svg {...fullSvg}>
            {/* 축 */}
            <Trace pts={[[G.x0, G.y1 - 24], [G.x0, G.y0], [G.x1 + 20, G.y0]]} stroke={color.inkSoft} width={stroke.thin} chamfer={0} progress={axes} />
            <path d={`M ${G.x0 - 8} ${G.y1 - 12} L ${G.x0} ${G.y1 - 28} L ${G.x0 + 8} ${G.y1 - 12} Z M ${G.x1 + 8} ${G.y0 - 8} L ${G.x1 + 24} ${G.y0} L ${G.x1 + 8} ${G.y0 + 8} Z`} fill={color.inkSoft} opacity={axes >= 1 ? 1 : 0} />

            {/* 낮추기 전의 자리 */}
            {lower > 0 ? <line x1={gx(0)} y1={gy(F0)} x2={gx(1)} y2={gy(F0 + SLOPE)} stroke={color.agent} strokeWidth={stroke.thin} strokeDasharray="5 9" opacity={0.4 * lower} /> : null}

            {/* 고정비 막대 */}
            {fixedP > 0 ? <rect x={G.x0 + 2} y={gy(F)} width={30} height={(gy(0) - gy(F)) * fixedP} fill={withAlpha(color.agent, 0.4)} stroke={color.agent} strokeWidth={stroke.thin} opacity={fixedP} /> : null}
            {fixedP > 0 ? <path d={`M ${G.x0 - 14} ${gy(F)} H ${G.x0 - 4} M ${G.x0 - 9} ${gy(F)} V ${gy(0)} M ${G.x0 - 14} ${gy(0)} H ${G.x0 - 4}`} fill="none" stroke={color.agent} strokeWidth={stroke.hair} opacity={fixedP} /> : null}

            {/* RTL 먼저: 낮게 시작해 가파르게 */}
            {rtlPts.length > 1 ? <polyline points={rtlPts.join(" ")} fill="none" stroke={color.ink} strokeWidth={5} strokeLinejoin="round" /> : null}
            {/* 모델 먼저: 고정비에서 시작해 완만하게 */}
            {modelP > 0 ? <line x1={gx(0)} y1={gy(F)} x2={gx(modelP)} y2={gy(F + SLOPE * modelP)} stroke={color.agent} strokeWidth={5} /> : null}

            {/* 에이전트가 고정비를 낮춘다 */}
            <Trace pts={[[gx(0.085), gy(F0) + 6], [gx(0.085), gy(F1) - 10]]} stroke={color.agent} width={stroke.bold} arrow progress={lower} />

            {/* 손익분기점 */}
            {crossP > 0 ? (
              <g opacity={crossP}>
                <line x1={dot.x} x2={dot.x} y1={dot.y} y2={G.y0} stroke={color.human} strokeWidth={stroke.thin} strokeDasharray="6 6" />
                <path d={`M ${dot.x - 11} ${G.y0 + 14} L ${dot.x} ${G.y0 + 1} L ${dot.x + 11} ${G.y0 + 14} Z`} fill={color.human} />
                <circle cx={dot.x} cy={dot.y} r={11} fill={color.human} stroke={color.bg} strokeWidth={stroke.thin} />
              </g>
            ) : null}
            {/* 얼마나 옮겨 가는지는 모른다 */}
            {ask > 0 ? (
              <g opacity={ask}>
                <circle cx={dot.x} cy={dot.y} r={30} fill="none" stroke={color.problem} strokeWidth={stroke.bold} strokeDasharray="7 6" />
                <Trace pts={[[dot.x + 30, dot.y + 4], [gx(0.76), dot.y + 4], [gx(0.76), gy(0.24)]]} stroke={color.problem} dash="7 6" at={measureAt - 6} />
              </g>
            ) : null}
          </svg>

          <T x={96} y={G.y1 - 62} px={30} weight={600} c={color.inkSoft} at={t2}>{TX.yAxis}</T>
          <T x={G.x0} y={G.y0 + 20} px={30} weight={600} c={color.inkSoft} at={t2 + 8}>{TX.xAxis}</T>
          <div style={{ position: "absolute", left: 866, top: G.y0 + 18, width: 244, height: 42, boxSizing: "border-box", border: `${stroke.hair}px solid ${color.lineStrong}`, display: "flex", alignItems: "center", justifyContent: "center", ...sans(30, 500), color: color.inkDim, whiteSpace: "nowrap", opacity: progress(frame, t2 + 14, DUR.enter) }}>{TX.concept}</div>

          <T x={G.x1 + 16} y={gy(rtlCost(1)) - 6} px={32} weight={800} at={t2 + 40}>{TX.rtlFirst}</T>
          <T x={G.x1 + 16} y={gy(F + SLOPE) - 20} px={32} weight={800} c={color.agent} at={modelAt + 26}>{TX.modelFirst}</T>
          <T x={G.x0 - 20} y={gy(F / 2) - 19} px={30} weight={700} c={color.agent} align="right" at={fixedAt + 4}>{TX.fixed}</T>
          <T x={dot.x + 16} y={G.y0 - 46} px={32} weight={800} c={color.human} at={crossAt + 4}>{TX.breakEven}</T>

          <div style={{ position: "absolute", left: gx(0.03), top: gy(0.79), display: "flex", alignItems: "center", gap: 10, ...enter(frame, agentAt) }}>
            <AgentIcon size={34} color={color.agent} />
            <div style={{ ...sans(30, 700), color: color.agent, whiteSpace: "nowrap" }}>{`${TX.agent} ${TX.agentWork}`}</div>
          </div>

          <T x={dot.x + 30} y={dot.y - 86} px={48} weight={800} code c={color.problem} at={askAt}>?</T>
          {TX.unknown.map((text, i) => (
            <T key={text} x={gx(0.76) + 14} y={gy(0.24) + 2 + i * 38} px={30} weight={700} c={color.problem} at={measureAt + (i === 0 ? -18 : 0)}>{text}</T>
          ))}
        </div>
      ) : null}

      {/* ── 판단 기준 ── */}
      <Box x={CARD.x} y={CARD.y} w={CARD.w} h={cardH} at={t5} />
      {frame >= t5 ? (
        <>
          <svg {...fullSvg}>
            <rect x={CARD.x} y={CARD.y} width={6} height={(rtlTop - 18 - CARD.y) * progress(frame, t5, 20)} fill={color.agent} />
            <rect x={CARD.x} y={rtlTop - 18} width={6} height={(CARD.y + cardH - rtlTop + 18) * progress(frame, t7, 20)} fill={color.ink} />
            <line x1={CARD.x + 28} x2={CARD.x + CARD.w - 28} y1={rtlTop - 18} y2={rtlTop - 18} stroke={color.line} strokeWidth={stroke.hair} />
          </svg>
          <T x={CARD.x + 32} y={modelTop} px={34} weight={800} c={color.agent} at={t5 + 2}>{TX.modelIf}</T>
          {TX.modelItems.map((text, i) => (
            <Item key={text} x={CARD.x + 32} y={modelTop + 56 + i * ITEM_H} text={text} at={itemAt[i]} c={color.agent} />
          ))}
          <div style={{ position: "absolute", left: CARD.x + 32, top: rtlTop, ...sans(34, 800), whiteSpace: "nowrap", opacity: progress(frame, t5 + 2, DUR.enter) * (0.22 + 0.78 * progress(frame, t7, DUR.enter)) }}>{TX.rtlIf}</div>
          {TX.rtlItems.map((text, i) => (
            <Item key={text} x={CARD.x + 32} y={rtlTop + 56 + i * ITEM_H} text={text} at={rtlItemAt[i]} c={color.ink} />
          ))}
        </>
      ) : null}

      {/* ── 병행: 공통 블록 RTL ↔ 모델 ── */}
      <Box x={110} y={176} w={440} h={150} at={loopAt} c={color.ink} bw={stroke.bold}>
        <div style={{ ...sans(32, 700), whiteSpace: "nowrap" }}>{TX.common}</div>
      </Box>
      <Box x={900} y={176} w={200} h={150} at={loopAt + 6} c={color.agent} bw={stroke.bold} fill={withAlpha(color.agent, 0.1)}>
        <div style={{ ...sans(36, 800), color: color.agent }}>{TX.model}</div>
      </Box>
      <svg {...fullSvg}>
        <Trace pts={[[550, 212], [897, 212]]} stroke={color.ink} width={stroke.bold} arrow at={giveAt} duration={22} />
        <Trace pts={[[900, 290], [553, 290]]} stroke={color.agent} width={stroke.bold} arrow at={loopAt + 16} duration={22} />
      </svg>
      <T x={725} y={162} px={32} weight={700} align="center" at={giveAt + 4}>{TX.give}</T>
      <T x={725} y={300} px={32} weight={700} c={color.agent} align="center" at={loopAt + 22}>{TX.budget}</T>
      <T x={725} y={229} px={36} weight={800} c={color.human} align="center" at={loopAt + 10}>{TX.together}</T>
    </ShiftSheet>
  );
};

const Item: React.FC<{ x: number; y: number; text: string; at: number; c: string }> = ({ x, y, text, at, c }) => {
  const frame = useCurrentFrame();
  const p = progress(frame, at, DUR.enter);
  const tick = progress(frame, at + 4, 12);
  return (
    <div style={{ position: "absolute", left: x, top: y, height: ITEM_H, display: "flex", alignItems: "center", gap: 18, opacity: 0.22 + 0.78 * p }}>
      <svg width={30} height={30} style={{ flex: "none" }}>
        <rect x={2} y={2} width={26} height={26} fill={withAlpha(c, 0.14 * p)} stroke={p > 0 ? c : color.lineStrong} strokeWidth={stroke.thin} />
        <path d="M 8 15 L 13.5 21 L 23 9" fill="none" stroke={c} strokeWidth={3.5} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - tick} opacity={tick > 0 ? 1 : 0} />
      </svg>
      <div style={{ ...sans(32, 600), whiteSpace: "nowrap" }}>{text}</div>
    </div>
  );
};
