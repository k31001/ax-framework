import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, countUp, draw, ease, enter, progress, sub } from "../../../video/anim";
import { AgentIcon, HumanIcon } from "../../../video/components/Icons";
import { Source, Title } from "../../../video/components/Text";
import { Trace } from "../../../video/components/Trace";
import { color, fullSvg, mono, pad2, sans, stroke, withAlpha } from "../../../video/theme";
import { ShiftSheet } from "../../lib";
import { EdgeTag, LockIcon, blend, useCues } from "./kit";
import { TX } from "./text";

// S7 지키는 선과 마무리. 사내망 경계 안에 세 가지 선(데이터 등급, 권한, 예산), 이어서 44% → 94%, 마지막 한 줄.

const BOUND = { x: 96, y: 216, w: 1560, h: 664 } as const;
const G = { x: 190, y: 244, rowH: 60 } as const; // 등급 표
const DENY = { x: 190, y: 530 } as const;
const DENY_TEXT = ["deny: [", "git.push", ", ", "waiver.write", ", ", "signoff", ", ", "jira.approve", "]"];
const CH = 20.4; // 34px mono 한 글자 폭
const METER = { y: 730, w: 600, xs: [190, 880] } as const;
const AX = { x0: 300, x1: 1620, y: 590 } as const;
const px = (v: number): number => AX.x0 + ((AX.x1 - AX.x0) * v) / 100;

export const S7: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, within } = useCues();
  const t1 = cue("s7.1");
  const t2 = cue("s7.2");
  const t3 = cue("s7.3");
  const t4 = cue("s7.4");
  const t5 = cue("s7.5");
  const t6 = cue("s7.6");

  const stageA = 1 - progress(frame, t5 - 8, DUR.exit, ease.in);
  const stageB = 1 - progress(frame, t6 - 8, DUR.exit, ease.in);
  const bound = progress(frame, t1 + 6, 34, ease.inOut);

  const c3 = within("s7.2", 0.12);
  const block = within("s7.2", 0.62);
  const blockP = progress(frame, block, DUR.draw);
  const locks = [within("s7.3", 0.45), within("s7.3", 0.52), within("s7.3", 0.62), within("s7.3", 0.76)];
  const fills = [0.62, 0.48];

  const m44 = within("s7.5", 0.5);
  const m94 = within("s7.5", 0.66);
  const rise = progress(frame, m94, 26, ease.inOut);

  // deny 줄의 낱말 자리
  let col = 0;
  const words = DENY_TEXT.map((w) => {
    const x = DENY.x + col * CH;
    col += w.length;
    return { w, x };
  });
  const items = [words[1], words[3], words[5], words[7]];
  const c3y = G.y + 2 * G.rowH + G.rowH / 2;

  return (
    <ShiftSheet hold>
      {/* ── 지키는 선 ── */}
      {stageA > 0 ? (
        <div style={{ opacity: stageA }}>
          <Title text={TX.guard} label="GUARDRAILS" x={96} y={76} at={t1} px={72} />
          <svg {...fullSvg}>
            <rect x={BOUND.x} y={BOUND.y} width={BOUND.w} height={BOUND.h} fill="none" stroke={color.inkSoft} strokeWidth={stroke.bold} pathLength={1} {...draw(bound)} />
            <rect x={BOUND.x + 10} y={BOUND.y + 10} width={BOUND.w - 20} height={BOUND.h - 20} fill="none" stroke={color.lineStrong} strokeWidth={stroke.hair} pathLength={1} {...draw(sub(bound, 0.1, 1))} />
            {/* 구분선 */}
            <line x1={BOUND.x + 30} x2={BOUND.x + 30 + (BOUND.w - 60) * progress(frame, t3, DUR.draw)} y1={476} y2={476} stroke={color.line} strokeWidth={stroke.hair} />
            <line x1={BOUND.x + 30} x2={BOUND.x + 30 + (BOUND.w - 60) * progress(frame, t4, DUR.draw)} y1={660} y2={660} stroke={color.line} strokeWidth={stroke.hair} />
            {/* C3 → 사내 모델 */}
            <Trace pts={[[1000, c3y], [1110, c3y], [1110, 306], [1196, 306]]} stroke={color.agent} width={stroke.bold} arrow at={c3 + 10} duration={DUR.draw + 6} />
            {/* 밖으로 나가려는 길은 경계에서 막힌다 */}
            <Trace pts={[[1110, c3y], [BOUND.x + BOUND.w - 22, c3y]]} stroke={color.lineStrong} dash="4 8" width={stroke.thin} progress={blockP} />
            <Trace pts={[[BOUND.x + BOUND.w + 22, c3y], [1800, c3y]]} stroke={color.line} dash="4 8" width={stroke.thin} arrow progress={sub(blockP, 0.7, 1)} />
            <g opacity={sub(blockP, 0.6, 1)}>
              <line x1={BOUND.x + BOUND.w} x2={BOUND.x + BOUND.w} y1={c3y - 40} y2={c3y + 40} stroke={color.problem} strokeWidth={8} />
              <path d={`M ${BOUND.x + BOUND.w - 18} ${c3y - 18} l 36 36 M ${BOUND.x + BOUND.w + 18} ${c3y - 18} l -36 36`} stroke={color.problem} strokeWidth={stroke.bold} />
            </g>
            {/* 계기판 */}
            {METER.xs.map((x, i) => {
              const p = progress(frame, t4 + 6 + i * 6, DUR.draw);
              const fill = progress(frame, t4 + 18 + i * 6, 40, ease.out) * fills[i];
              const limit = x + METER.w * 0.8;
              return (
                <g key={x} opacity={p}>
                  <rect x={x} y={METER.y + 56} width={METER.w * p} height={30} fill={withAlpha(color.panel, 0.9)} stroke={color.lineStrong} strokeWidth={stroke.thin} />
                  <rect x={x} y={METER.y + 56} width={METER.w * fill} height={30} fill={withAlpha(color.agent, 0.55)} />
                  <line x1={x + METER.w * fill} x2={x + METER.w * fill} y1={METER.y + 46} y2={METER.y + 96} stroke={color.agent} strokeWidth={stroke.bold} />
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((k) => (
                    <line key={k} x1={x + (METER.w * k) / 10} x2={x + (METER.w * k) / 10} y1={METER.y + 86} y2={METER.y + 98} stroke={color.lineStrong} strokeWidth={stroke.hair} />
                  ))}
                  <line x1={limit} x2={limit} y1={METER.y + 30} y2={METER.y + 106} stroke={color.human} strokeWidth={stroke.bold} strokeDasharray="8 5" />
                </g>
              );
            })}
          </svg>
          <EdgeTag x={BOUND.x + BOUND.w - 190} y={BOUND.y} text={TX.intranet} px={30} c={color.ink} p={progress(frame, t1 + 26, DUR.enter)} />

          {/* 01 데이터 등급 */}
          {[t2, t3, t4].map((t, i) => (
            <div key={i} style={{ position: "absolute", left: 126, top: [G.y + 14, 500, 684][i], ...mono(22, 700), color: color.agent, ...enter(frame, t, { distance: 0 }) }}>{pad2(i + 1)}</div>
          ))}
          {TX.grades.map((g, i) => {
            const hot = i === 2 ? progress(frame, c3, DUR.enter) : 0;
            return (
              <div key={g[0]} style={{ position: "absolute", left: G.x, top: G.y + i * G.rowH, width: 810, height: G.rowH - 6, boxSizing: "border-box", display: "flex", alignItems: "center", gap: 20, padding: "0 16px", backgroundColor: withAlpha(color.agent, 0.14 * hot), borderLeft: `4px solid ${blend(color.line, color.agent, hot)}`, ...enter(frame, t2 + 4 + i * 5) }}>
                <div style={{ ...mono(32, 700), color: blend(color.inkSoft, color.agent, hot), width: 56 }}>{g[0]}</div>
                <div style={{ ...sans(32, 600), color: i === 2 ? color.ink : color.inkSoft, width: 320, whiteSpace: "nowrap" }}>{g[1]}</div>
                <svg width={44} height={16} style={{ flex: "none" }}>
                  <path d="M 0 8 H 38 M 31 2 L 38 8 L 31 14" fill="none" stroke={color.inkDim} strokeWidth={stroke.thin} />
                </svg>
                <div style={{ ...sans(32, 600), color: i === 2 ? color.ink : color.inkSoft, whiteSpace: "nowrap" }}>{g[2]}</div>
              </div>
            );
          })}
          <div style={{ position: "absolute", left: G.x + 16, top: G.y + 3 * G.rowH + 2, ...sans(30, 500), color: color.inkDim, whiteSpace: "nowrap", ...enter(frame, t2 + 24) }}>{TX.gradeNote}</div>
          <div style={{ position: "absolute", left: 1200, top: 266, width: 260, height: 80, boxSizing: "border-box", border: `${stroke.trace}px solid ${color.agent}`, backgroundColor: color.panel, display: "flex", alignItems: "center", justifyContent: "center", gap: 14, ...enter(frame, c3 + 4) }}>
            <AgentIcon size={36} color={color.agent} />
            <div style={{ ...sans(32, 700), whiteSpace: "nowrap" }}>{TX.model}</div>
          </div>

          {/* 02 권한 최소화 */}
          <div style={{ position: "absolute", left: DENY.x, top: DENY.y, display: "flex", ...mono(34, 700), whiteSpace: "pre", ...enter(frame, t3 + 4) }}>
            {words.map(({ w }, i) => {
              const k = [1, 3, 5, 7].indexOf(i);
              const on = k < 0 ? 0 : progress(frame, locks[k], 10);
              return (
                <span key={i} style={{ color: k < 0 ? color.inkSoft : blend(color.ink, color.problem, on) }}>
                  {w}
                </span>
              );
            })}
          </div>
          {items.map((it, k) => {
            const on = progress(frame, locks[k], 12);
            return (
              <div key={k} style={{ position: "absolute", left: it.x + (it.w.length * CH) / 2 - 20, top: DENY.y + 58, opacity: on, translate: `0px ${(1 - on) * -10}px` }}>
                <LockIcon size={40} color={color.problem} />
              </div>
            );
          })}
          <div style={{ position: "absolute", left: 1300, top: DENY.y - 10, display: "flex", alignItems: "center", gap: 18, ...enter(frame, locks[3] + 6, { from: "left" }) }}>
            <HumanIcon size={56} color={color.human} />
            <div style={{ ...sans(32, 700), color: color.human, whiteSpace: "nowrap" }}>{TX.signoff}</div>
          </div>

          {/* 03 예산 */}
          {METER.xs.map((x, i) => (
            <div key={x} style={{ ...enter(frame, t4 + 6 + i * 6) }}>
              <div style={{ position: "absolute", left: x, top: METER.y - 2, ...sans(32, 600), whiteSpace: "nowrap" }}>{TX.meters[i]}</div>
              <div style={{ position: "absolute", left: x + METER.w * 0.8 - 44, top: METER.y - 2, width: 88, textAlign: "center", ...mono(22, 700), color: color.human }}>LIMIT</div>
            </div>
          ))}
        </div>
      ) : null}

      {/* ── 44% → 94% ── */}
      {frame >= t5 - 2 && stageB > 0 ? (
        <div style={{ opacity: stageB }}>
          <div style={{ position: "absolute", left: AX.x0, top: 250, ...sans(56, 700), whiteSpace: "nowrap", ...enter(frame, t5) }}>{TX.passRate}</div>
          <Source text={TX.passSource} x={AX.x0} y={336} at={t5 + 8} />
          <svg {...fullSvg}>
            <line x1={AX.x0} x2={AX.x0 + (AX.x1 - AX.x0) * progress(frame, t5 + 10, 24, ease.inOut)} y1={AX.y} y2={AX.y} stroke={color.lineStrong} strokeWidth={stroke.thin} />
            {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((v) => (
              <line key={v} x1={px(v)} x2={px(v)} y1={AX.y} y2={AX.y + 14} stroke={color.lineStrong} strokeWidth={stroke.hair} opacity={progress(frame, t5 + 12 + v / 5, 8)} />
            ))}
            <line x1={px(44)} x2={px(44)} y1={AX.y - 22} y2={AX.y + 22} stroke={color.inkSoft} strokeWidth={stroke.trace} opacity={progress(frame, m44, 8)} />
            <Trace pts={[[px(44), AX.y - 12], [px(44 + 50 * rise), AX.y - 12]]} stroke={color.agent} width={stroke.bold} arrow progress={rise > 0 ? 1 : 0} />
            <line x1={px(94)} x2={px(94)} y1={AX.y - 34} y2={AX.y + 22} stroke={color.agent} strokeWidth={stroke.bold} opacity={sub(rise, 0.9, 1)} />
          </svg>
          <div style={{ position: "absolute", left: AX.x0 - 36, top: AX.y - 16, ...mono(26, 500), color: color.inkDim, opacity: progress(frame, t5 + 14, 10) }}>0</div>
          <div style={{ position: "absolute", left: AX.x1 + 16, top: AX.y - 16, ...mono(26, 500), color: color.inkDim, opacity: progress(frame, t5 + 30, 10) }}>100</div>
          <div style={{ position: "absolute", left: px(44) - 200, width: 400, top: AX.y - 110, textAlign: "center", ...mono(64, 700), color: color.inkDim, ...enter(frame, m44) }}>44%</div>
          <div style={{ position: "absolute", left: px(44) - 200, width: 400, top: AX.y + 36, textAlign: "center", ...sans(34, 600), color: color.inkSoft, ...enter(frame, m44 + 4) }}>{TX.alone}</div>
          <div style={{ position: "absolute", left: px(94) - 300, width: 600, top: AX.y - 196, textAlign: "center", ...mono(136, 700), color: color.agent, opacity: progress(frame, m94 + 4, 12) }}>{`${countUp(rise, 44, 94)}%`}</div>
          <div style={{ position: "absolute", left: px(94) - 300, width: 600, top: AX.y + 36, textAlign: "center", ...sans(34, 700), color: color.agent, whiteSpace: "nowrap", ...enter(frame, m94 + 22) }}>{TX.loop}</div>
        </div>
      ) : null}

      {/* ── 마무리 ── */}
      <div style={{ position: "absolute", left: 0, width: 1920, top: 356, textAlign: "center", ...sans(104, 800), letterSpacing: "-0.03em", ...enter(frame, t6, { distance: 20, duration: 18 }) }}>{TX.closing}</div>
      <div style={{ position: "absolute", left: 0, width: 1920, top: 540, display: "flex", justifyContent: "center", alignItems: "center", gap: 24, ...enter(frame, t6 + 16) }}>
        <div style={{ ...sans(40, 500), color: color.inkDim }}>{TX_FROM}</div>
        <svg width={90} height={20}>
          <path d="M 0 10 H 76 M 76 3 L 88 10 L 76 17 Z" fill={color.agent} stroke={color.agent} strokeWidth={stroke.trace} />
        </svg>
        <div style={{ ...sans(40, 700) }}>{TX_TO}</div>
      </div>
      <div style={{ position: "absolute", left: 96, top: 856, ...mono(22, 500), color: color.inkDim, opacity: progress(frame, t6 + 24, 12) }}>SSD CONTROLLER SOC · AX</div>
    </ShiftSheet>
  );
};

const TX_FROM = "개인별 챗봇";
const TX_TO = "통합 AI 플랫폼";
