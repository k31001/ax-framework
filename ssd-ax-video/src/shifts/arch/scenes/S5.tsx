import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, ease, lerp, progress } from "../../../video/anim";
import { AgentIcon, HumanIcon } from "../../../video/components/Icons";
import { Trace } from "../../../video/components/Trace";
import { color, fullSvg, stroke, withAlpha } from "../../../video/theme";
import { ShiftSheet } from "../../lib";
import { At, TrackRow, mx, tx, useCues } from "./kitA";

// S5 모델 먼저로 가면: 여섯 단계와 두 레인(에이전트 · 사람).

const T = {
  title: "경로 ② 모델 먼저",
  rtl: "RTL 먼저",
  model: "모델 먼저",
  steps: ["목표 · 제약", "후보", "모델 · 보정", "평가", "선택 · 기록", "인계"],
  agent: "에이전트",
  human: "사람",
  jira: ["FEAT-330", "read 오류 복구 구조", "담당 arch-agent"],
} as const;

type Card = { col: number; row?: number; who: string; what: string; line: string; t: number };
const HUMAN: Card[] = [
  { col: 0, who: "아키텍트", what: "목표와 제약", line: "s5.3", t: 0.08 },
  { col: 4, who: "아키텍트", what: "선택", line: "s5.3", t: 0.6 },
  { col: 1, who: "RTL 설계자", what: "면적 · timing · 재사용 추정", line: "s5.4", t: 0.05 },
  { col: 1, row: 1, who: "FW 담당", what: "HW/FW 분담 · FW 왕복 시간", line: "s5.4", t: 0.28 },
  { col: 5, who: "RTL 설계자", what: "예산과 계약을 받음", line: "s5.4", t: 0.62 },
];
const AGENT: Card[] = [
  { col: 2, who: "arch-agent", what: "모델 생성 · 보정", line: "s5.5", t: 0.2 },
  { col: 3, who: "arch-agent", what: "216 구성 실행 · 보고", line: "s5.5", t: 0.62 },
];

const COL = { x: 324, pitch: 250, w: 226 } as const;
const STEPS = { y: 236, h: 76 } as const;
const LANE_A = { y: 344, h: 164 } as const;
const LANE_H = { y: 520, h: 318 } as const;
const CARD_H = 140;
const colX = (i: number): number => COL.x + i * COL.pitch;

const Lane: React.FC<{ y: number; h: number; c: string; name: string; tag: string; Icon: typeof AgentIcon; p: number }> = ({ y, h, c, name, tag, Icon, p }) =>
  p <= 0 ? null : (
    <div style={{ position: "absolute", left: 96, top: y, width: 1728, height: h, opacity: p }}>
      <div style={{ position: "absolute", inset: 0, backgroundColor: withAlpha(c, 0.04), borderTop: `${stroke.hair}px dashed ${withAlpha(c, 0.45)}` }} />
      <div style={{ position: "absolute", left: 0, top: 0, width: 4, height: h * p, backgroundColor: c }} />
      <div style={{ position: "absolute", left: 24, top: 18 }}>
        <Icon size={36} color={c} />
        <div style={{ ...tx(34, 800, c), marginTop: 6 }}>{name}</div>
        <div style={{ ...mx(22, 700, color.inkDim), marginTop: 2 }}>{tag}</div>
      </div>
    </div>
  );

export const S5: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, within } = useCues();
  const c1 = cue("s5.1");
  const c2 = cue("s5.2");

  // 아래 줄이 가운데로 올라온다
  const rise = progress(frame, c1 + 2, 30, ease.inOut);
  const rowY = lerp(848, STEPS.y, rise);
  const rowH = lerp(42, STEPS.h, rise);
  const stepAt = [0.0, 0.3, 0.42, 0.55, 0.68, 0.88].map((t) => within("s5.2", t));
  const loopAt = within("s5.2", 0.62);
  const lanes = progress(frame, c2 + 6, 20);
  const jiraAt = within("s5.5", 0.05);

  const card = (k: Card, c: string, laneY: number, i: number): React.ReactNode => {
    const at = within(k.line, k.t);
    const p = progress(frame, at, DUR.enter);
    if (p <= 0) return null;
    const y = laneY + 14 + (k.row ?? 0) * (CARD_H + 10);
    return (
      <div
        key={`${k.col}-${i}`}
        style={{
          position: "absolute",
          left: colX(k.col),
          top: y,
          width: COL.w,
          height: CARD_H,
          boxSizing: "border-box",
          borderLeft: `5px solid ${c}`,
          border: `${stroke.thin}px solid ${withAlpha(c, 0.55)}`,
          borderLeftWidth: 5,
          borderLeftColor: c,
          backgroundColor: withAlpha(c, 0.1),
          padding: "8px 12px 8px 14px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          opacity: p,
          translate: `0px ${(1 - p) * 12}px`,
        }}
      >
        <div style={c === color.agent ? { ...mx(28, 700, c), lineHeight: "38px" } : { ...tx(30, 800, c), lineHeight: "38px" }}>{k.who}</div>
        <div style={{ ...tx(30, 600), whiteSpace: "normal", lineHeight: "38px" }}>{k.what}</div>
      </div>
    );
  };

  return (
    <ShiftSheet>
      <At x={96} y={68} p={progress(frame, c1, DUR.enter)} style={tx(48, 800)}>
        {T.title}
      </At>

      {/* 위 줄: RTL 먼저 (흐리게) */}
      <div style={{ opacity: lerp(0.8, 0.45, progress(frame, c1, 24)) }}>
        <At x={96} y={156} style={tx(30, 700, color.inkDim)}>
          {T.rtl}
        </At>
        <TrackRow x={COL.x} y={150} h={48} pitch={COL.pitch} cellW={COL.w} cells={Array.from({ length: 6 }, (_, i) => ({ c: i === 4 ? color.problem : color.human, lit: 0.5 }))} />
      </div>

      {/* 여섯 단계 */}
      <At x={96} y={rowY + rowH / 2 - 21} dy={0} style={tx(32, 800, color.agent)}>
        {T.model}
      </At>
      <TrackRow
        x={COL.x}
        y={rowY}
        h={rowH}
        pitch={COL.pitch}
        cellW={COL.w}
        cells={T.steps.map((label, i) => {
          const lit = progress(frame, stepAt[i], 12);
          return lit > 0 ? { label, no: `0${i + 1}`, c: color.agent, lit: 0.45 + 0.55 * lit } : { c: color.agent, lit: 0.45 };
        })}
        dashEmpty
      />
      <svg {...fullSvg}>
        {/* 04 → 02: 문제를 찾으면 후보를 고친다 */}
        <Trace pts={[[colX(3) + COL.w / 2, STEPS.y - 3], [colX(3) + COL.w / 2, STEPS.y - 24], [colX(1) + COL.w / 2, STEPS.y - 24], [colX(1) + COL.w / 2, STEPS.y - 3]]} stroke={color.agent} width={stroke.thin} dash="7 7" arrow at={loopAt} duration={26} easing={ease.inOut} />
      </svg>

      {/* 두 레인 */}
      <Lane y={LANE_A.y} h={LANE_A.h} c={color.agent} name={T.agent} tag="AGENT" Icon={AgentIcon} p={lanes} />
      <Lane y={LANE_H.y} h={LANE_H.h} c={color.human} name={T.human} tag="HUMAN" Icon={HumanIcon} p={lanes} />
      <svg {...fullSvg}>
        {[...HUMAN.filter((k) => !k.row).map((k) => ({ k, c: color.human, y: LANE_H.y + 14 })), ...AGENT.map((k) => ({ k, c: color.agent, y: LANE_A.y + 14 }))].map(({ k, c, y }, i) => (
          <Trace key={i} pts={[[colX(k.col) + COL.w / 2, y], [colX(k.col) + COL.w / 2, STEPS.y + STEPS.h + 2]]} stroke={withAlpha(c, 0.8)} width={stroke.thin} at={within(k.line, k.t) + 6} />
        ))}
      </svg>
      {HUMAN.map((k, i) => card(k, color.human, LANE_H.y, i))}
      {AGENT.map((k, i) => card(k, color.agent, LANE_A.y, i))}

      {/* Jira 이슈 머리 */}
      {progress(frame, jiraAt, DUR.enter) > 0 ? (
        <div
          style={{
            position: "absolute",
            right: 96,
            top: 70,
            height: 60,
            boxSizing: "border-box",
            border: `${stroke.thin}px solid ${color.lineStrong}`,
            borderLeft: `5px solid ${color.agent}`,
            backgroundColor: withAlpha(color.panel, 0.95),
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "0 20px",
            opacity: progress(frame, jiraAt, DUR.enter),
          }}
        >
          <div style={mx(22, 700, color.inkDim)}>JIRA</div>
          <div style={mx(28, 700, color.agent)}>{T.jira[0]}</div>
          <div style={tx(30, 700)}>{T.jira[1]}</div>
          <div style={tx(30, 500, color.inkSoft)}>· {T.jira[2]}</div>
        </div>
      ) : null}
    </ShiftSheet>
  );
};
