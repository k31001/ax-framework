import React from "react";
import { useCurrentFrame } from "remotion";
import { draw, ease, enter, enterExit, progress } from "../../../video/anim";
import { AgentIcon, HumanIcon } from "../../../video/components/Icons";
import { Source } from "../../../video/components/Text";
import { color, fullSvg, mono, sans, size, stroke, withAlpha } from "../../../video/theme";
import { ShiftSheet, useScene } from "../../lib";
import { LockIcon, Stamp, mix, split } from "./kit";

// s9 지키는 선.
//   s9.1  청록 말풍선 셋: 모두 'sign-off'
//   s9.2  점 806개 중 약 21% 가 붉게 남는다 · 20.8% · 출처
//   s9.3  호박색 서명란: '#2 승인' 도장, 서명 선, 사람
//   s9.4  A 띠(데이터 무결성 경로)와 사람 소유 세 가지
//   s9.5  쓰는 사람 → 정의하고 판단하는 사람

const SAY = "sign-off";
const NOTE = "세 모델 모두 자체 목표 100% 달성 후 선언";
const SOURCE = "SemiEngineering, 2026-11 · Arm 소속 엔지니어의 실험 · 설계 25개";
const SIGN = "sign-off는 사람 명의";
const BAND = "데이터 무결성 경로 — 사람이 직접 확인";
const OWNED = ["ref_model/", "통과 기준", "bug 세트"];
const WRITER = "쓰는 사람";
const JUDGE = "정의하고 판단하는 사람";

// 점 806개 = 62 × 13. 그중 168개(20.8%)가 붉다.
const COLS = 62;
const TOTAL = 806;
const MISS = 168;
const PITCH = 20;
const GRID = { x: 96, y: 396 };
const rank = Array.from({ length: TOTAL }, (_, i) => ({ i, h: (Math.imul(i + 11, 2654435761) >>> 0) % 100003 }))
  .sort((a, b) => a.h - b.h)
  .slice(0, MISS)
  .map((d) => d.i);
const missed = new Set(rank);

export const S9: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, end, script } = useScene();
  const c1 = cue("s9.1");
  const c2 = cue("s9.2");
  const c3 = cue("s9.3");
  const c4 = cue("s9.4");
  const c5 = cue("s9.5");
  const e1 = end("s9.1");
  const e2 = end("s9.2");
  const e4 = end("s9.4");
  const e5 = end("s9.5");
  const out1 = c3 - 10;
  const out2 = c5 - 10;
  const missAt = split(c2, e2, 1, 2);
  const red = progress(frame, missAt, 16, ease.inOut);
  const sweep = progress(frame, c2, split(c2, e2, 1, 3) - c2, ease.linear);
  const sign = progress(frame, c3 + 14, 26, ease.inOut);

  return (
    <ShiftSheet hold>
      {/* ── 실험: 완료 선언과 누락 ─────────────────────────────────── */}
      {[0, 1, 2].map((k) => (
        <div key={k} style={{ position: "absolute", left: 96 + k * 440, top: 200, display: "flex", alignItems: "center", gap: 18, ...enterExit(frame, c1 + k * 8, out1), opacity: (frame < out1 ? progress(frame, c1 + k * 8) : 1 - progress(frame, out1, 8)) * (1 - 0.5 * red) }}>
          <AgentIcon size={72} color={color.agent} />
          <div style={{ height: 84, padding: "0 26px", display: "flex", alignItems: "center", border: `${stroke.trace}px solid ${color.agent}`, backgroundColor: withAlpha(color.agent, 0.12), ...mono(size.sub, 700), color: color.agent }}>{SAY}</div>
        </div>
      ))}
      <div style={{ position: "absolute", left: 96, top: 312, ...sans(size.small, 600), color: color.inkSoft, whiteSpace: "nowrap", ...enterExit(frame, split(c1, e1, 1, 2), out1) }}>{NOTE}</div>

      {frame >= c2 && frame < out1 + 10 ? (
        <svg {...fullSvg} opacity={1 - progress(frame, out1, 8)}>
          {Array.from({ length: TOTAL }, (_, i) => {
            const col = i % COLS;
            if (col / COLS > sweep) return null;
            const m = missed.has(i);
            return <circle key={i} cx={GRID.x + col * PITCH + 10} cy={GRID.y + Math.floor(i / COLS) * PITCH + 10} r={m ? 6 + red : 6} fill={m ? mix(red, color.agent, color.problem) : color.agent} opacity={m ? 1 : 1 - 0.55 * red} />;
          })}
        </svg>
      ) : null}
      <div style={{ position: "absolute", left: 1400, top: 452, ...mono(size.display, 700), lineHeight: 1, color: color.problem, ...enterExit(frame, missAt, out1, { distance: 16 }) }}>20.8%</div>
      <Source text={SOURCE} x={96} y={692} at={missAt + 10} out={out1} />

      {/* ── 서명란 ─────────────────────────────────────────────────── */}
      <Stamp text="#2 승인" c={color.human} x={120} y={326} at={c3} out={out2} px={76} />
      {frame >= c3 && frame < out2 + 10 ? (
        <svg {...fullSvg} opacity={1 - progress(frame, out2, 8)}>
          <line x1={96} y1={610} x2={96 + 700 * progress(frame, c3 + 6, 18, ease.out)} y2={610} stroke={color.human} strokeWidth={stroke.bold} />
          <path transform="translate(0 90)" d="M 150 496 C 190 420, 220 420, 214 478 S 250 520, 290 452 S 330 430, 344 486 S 400 500, 430 456 S 500 440, 560 486" fill="none" stroke={color.human} strokeWidth={stroke.bold} pathLength={1} {...draw(sign)} />
        </svg>
      ) : null}
      <div style={{ position: "absolute", left: 700, top: 510, ...enterExit(frame, c3 + 6, out2) }}>
        <HumanIcon size={88} color={color.human} />
      </div>
      <div style={{ position: "absolute", left: 96, top: 642, ...sans(size.head, 800), whiteSpace: "nowrap", ...enterExit(frame, c3 + 16, out2) }}>{SIGN}</div>

      {/* ── 사람이 직접 지키는 것 ──────────────────────────────────── */}
      <div style={{ position: "absolute", left: 920, top: 340, width: 904, height: 112, boxSizing: "border-box", display: "flex", alignItems: "center", border: `${stroke.bold}px solid ${color.human}`, backgroundColor: withAlpha(color.human, 0.18), ...enterExit(frame, c4, out2) }}>
        <div style={{ width: 96, textAlign: "center", ...mono(size.head, 700), color: color.human }}>A</div>
        <div style={{ ...sans(size.body, 800), whiteSpace: "nowrap" }}>{BAND}</div>
      </div>
      {OWNED.map((t, i) => (
        <div key={t} style={{ position: "absolute", left: 920 + i * 308, top: 500, width: 288, height: 190, boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, border: `${stroke.thin}px solid ${withAlpha(color.human, 0.6)}`, backgroundColor: withAlpha(color.panel, 0.9), ...enterExit(frame, split(c4, e4, i + 1, 4), out2) }}>
          <LockIcon size={64} color={color.human} />
          <div style={{ ...(i === 0 ? mono(size.small, 700) : sans(size.small, 700)), color: color.human, whiteSpace: "nowrap" }}>{t}</div>
        </div>
      ))}

      {/* ── 맺음 ───────────────────────────────────────────────────── */}
      <div style={{ position: "absolute", left: 0, width: 1920, top: 360, display: "flex", alignItems: "center", justifyContent: "center", gap: 44 }}>
        <div style={{ ...sans(size.head, 500), color: color.inkDim, whiteSpace: "nowrap", ...enter(frame, c5) }}>{WRITER}</div>
        <svg width={170} height={30} style={{ flex: "none" }}>
          <line x1={0} y1={15} x2={148 * progress(frame, c5 + 10, 18, ease.inOut)} y2={15} stroke={color.human} strokeWidth={stroke.bold} />
          <path d="M 148 5 L 168 15 L 148 25 Z" fill={color.human} opacity={progress(frame, c5 + 26, 4)} />
        </svg>
        <div style={{ ...sans(84, 800), color: color.human, whiteSpace: "nowrap", ...enter(frame, split(c5, e5, 1, 2), { distance: 20, duration: 18 }) }}>{JUDGE}</div>
      </div>
      <div style={{ position: "absolute", left: 0, width: 1920, top: 540, textAlign: "center", ...sans(size.body, 600), color: color.inkSoft, ...enter(frame, e5 - 10) }}>{`${script.axis} · ${script.from} → ${script.to}`}</div>
    </ShiftSheet>
  );
};
