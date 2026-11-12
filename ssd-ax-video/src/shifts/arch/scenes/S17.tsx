import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, ease, enter, lerp, progress } from "../../../video/anim";
import { Trace, Via } from "../../../video/components/Trace";
import { color, fullSvg, mono, sans, stroke, withAlpha } from "../../../video/theme";
import { ShiftSheet } from "../../lib";
import { T, tailCurve, useCues } from "./kitC";

// S17 마무리: 갈림길이 다시 나오고(모델을 먼저 지나 RTL 로), 두 상자가 고리를 이룬 뒤, 마무리 문구.

const TX = {
  req: "REQ-QOS-07",
  criterion: "P99.99 ≤ 2 ms (예시)",
  fw: "FW",
  row: ["Host interface", "nand_if", "hard LDPC ×8", "host로 반환"],
  added: ["rcv_ctrl", "복구 요청 큐", "soft LDPC ×3"],
  model: "모델",
  rtl: "RTL",
  small: "작은 변경",
  down: "예산 · 계약",
  up: "측정 · 변경 요청",
  closing: "맞는 구조를 빨리 찾는 것",
  footer: "SSD CONTROLLER SOC · AX",
} as const;

const ROW = [
  { x: 510, w: 220 },
  { x: 760, w: 170 },
  { x: 960, w: 230 },
  { x: 1220, w: 190 },
] as const;
const ADD = [
  { x: 700, w: 190 },
  { x: 920, w: 220 },
  { x: 1170, w: 230 },
] as const;
const Y = { req: 84, fw: 176, row: 256, add: 366, h: 72, fork: 540, box: 600 } as const;
// 고리(모델 ↔ RTL): 자기 좌표계(0,0)~(1120,180) 안에 그린다
const LOOP = { x: 400, y: 572, w: 1120, bw: 320, bh: 120 } as const;

export const S17: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, within, script } = useCues();
  const t1 = cue("s17.1");
  const t2 = cue("s17.2");
  const t3 = cue("s17.3");

  const modelAt = within("s17.1", 0.42);
  const rtlAt = within("s17.1", 0.66);
  const smallAt = within("s17.1", 0.86);
  const downAt = t2 + 4;
  const upAt = within("s17.2", 0.5);
  const ring = progress(frame, t2, 14);

  // 3부: 고리는 작아져 위로, 나머지는 물러난다
  const away = progress(frame, t3 - 4, DUR.move, ease.inOut);
  const rest = 1 - progress(frame, t3 - 4, 12, ease.in);
  const s = lerp(1, 0.75, away);
  const loopX = lerp(LOOP.x, 960 - (LOOP.w * 0.75) / 2, away);
  const loopY = lerp(LOOP.y, 150, away);

  const boxStyle = (c: string): React.CSSProperties => ({
    position: "absolute",
    top: 28,
    width: LOOP.bw,
    height: LOOP.bh,
    boxSizing: "border-box",
    border: `${stroke.bold}px solid ${c}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
  });

  return (
    <ShiftSheet hold>
      {/* ── 요구사항 카드와 구조 C ── */}
      {rest > 0 ? (
        <div style={{ opacity: rest }}>
          <div style={{ position: "absolute", left: 640, top: Y.req, width: 640, height: 64, boxSizing: "border-box", border: `${stroke.thin}px solid ${color.inkSoft}`, backgroundColor: withAlpha(color.panel, 0.92), display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", ...enter(frame, t1 - 8) }}>
            <div style={{ ...mono(30, 700), color: color.ink }}>{TX.req}</div>
            <div style={{ ...mono(30, 500), color: color.inkSoft }}>{TX.criterion}</div>
          </div>
          <svg {...fullSvg}>
            <Trace pts={[[960, Y.req + 64], [960, Y.fw - 3]]} stroke={color.inkSoft} at={t1 - 4} duration={10} />
            {/* FW */}
            <rect x={510} y={Y.fw} width={900} height={56} fill="none" stroke={color.human} strokeWidth={stroke.thin} strokeDasharray="9 7" opacity={progress(frame, t1, 12)} />
            <Trace pts={[[745, Y.fw + 56], [745, Y.add - 3]]} stroke={color.human} width={stroke.hair} dash="5 6" at={t1 + 20} />
            {ROW.map((b, i) => (
              <g key={i} opacity={progress(frame, t1 + 2 + i * 3, 12)}>
                <rect x={b.x} y={Y.row} width={b.w} height={Y.h} fill={withAlpha(color.panel, 0.92)} stroke={color.lineStrong} strokeWidth={stroke.thin} />
                {i < 3 ? <Trace pts={[[b.x + b.w, Y.row + Y.h / 2], [ROW[i + 1].x - 3, Y.row + Y.h / 2]]} stroke={color.inkSoft} width={stroke.thin} arrow /> : null}
              </g>
            ))}
            {/* C 의 새 블록: 안정된 모습 */}
            {ADD.map((b, i) => (
              <g key={i} opacity={progress(frame, t1 + 12 + i * 4, 12)}>
                <rect x={b.x} y={Y.add} width={b.w} height={Y.h} fill={withAlpha(color.agent, 0.12)} stroke={color.agent} strokeWidth={stroke.trace} />
                {i < 2 ? <Trace pts={[[b.x + b.w, Y.add + Y.h / 2], [ADD[i + 1].x - 3, Y.add + Y.h / 2]]} stroke={color.agent} width={stroke.thin} arrow /> : null}
              </g>
            ))}
            <Trace pts={[[975, Y.row + Y.h], [975, 347], [860, 347], [860, Y.add - 3]]} stroke={color.agent} width={stroke.thin} arrow at={t1 + 16} />
            <Trace pts={[[790, Y.add], [790, Y.row + Y.h + 3]]} stroke={color.agent} width={stroke.thin} arrow at={t1 + 20} />
            <Trace pts={[[1300, Y.add], [1300, Y.row + Y.h + 3]]} stroke={color.agent} width={stroke.thin} arrow at={t1 + 24} />

            {/* 갈림길: 모델을 먼저 지나 RTL 로. 작은 변경은 곧바로 RTL */}
            <Trace pts={[[960, Y.add + Y.h + 2], [960, Y.fork], [560, Y.fork], [560, Y.box - 3]]} stroke={color.agent} width={stroke.bold} arrow at={modelAt - 12} duration={24} easing={ease.inOut} />
            <Trace pts={[[960, Y.fork], [1360, Y.fork], [1360, Y.box - 3]]} stroke={color.inkDim} width={stroke.thin} dash="7 7" arrow at={smallAt - 8} duration={20} />
            <Via x={960} y={Y.fork} stroke={color.agent} p={progress(frame, modelAt - 2, 8)} />
          </svg>
          <T x={530} y={Y.fw + 8} px={30} weight={700} c={color.human} at={t1}>{TX.fw}</T>
          {ROW.map((b, i) => (
            <T key={i} x={b.x + b.w / 2} y={Y.row + 17} px={30} weight={600} c={color.inkSoft} align="center" at={t1 + 2 + i * 3}>{TX.row[i]}</T>
          ))}
          {ADD.map((b, i) => (
            <T key={i} x={b.x + b.w / 2} y={Y.add + 17} px={30} weight={700} c={color.agent} align="center" at={t1 + 12 + i * 4}>{TX.added[i]}</T>
          ))}
          <T x={1378} y={Y.fork - 50} px={30} weight={600} c={color.inkDim} at={smallAt}>{TX.small}</T>
        </div>
      ) : null}

      {/* ── 모델 ↔ RTL 고리 ── */}
      <div style={{ position: "absolute", left: loopX, top: loopY, width: LOOP.w, height: 180, transformOrigin: "0 0", transform: `scale(${s})` }}>
        <div style={{ ...boxStyle(color.agent), left: 0, backgroundColor: withAlpha(color.agent, 0.12), ...enter(frame, modelAt) }}>
          <svg width={84} height={44} style={{ flex: "none", overflow: "visible" }}>
            <path d={tailCurve(0, 42, 84, 38)} fill="none" stroke={color.agent} strokeWidth={stroke.trace} />
          </svg>
          <div style={{ ...sans(48, 800), color: color.agent }}>{TX.model}</div>
        </div>
        <div style={{ ...boxStyle(color.ink), left: LOOP.w - LOOP.bw, backgroundColor: withAlpha(color.panel, 0.92), ...enter(frame, rtlAt) }}>
          <svg width={64} height={44} style={{ flex: "none" }}>
            {[4, 16, 28, 40].map((y, i) => (
              <line key={y} x1={0} x2={[58, 40, 50, 30][i]} y1={y} y2={y} stroke={color.inkSoft} strokeWidth={4} />
            ))}
          </svg>
          <div style={{ ...sans(48, 800) }}>{TX.rtl}</div>
        </div>
        <svg width={LOOP.w} height={180} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {/* s17.1: 모델 다음에 RTL */}
          <Trace pts={[[LOOP.bw, 88], [LOOP.w - LOOP.bw - 3, 88]]} stroke={color.agent} width={stroke.bold} arrow at={rtlAt - 12} duration={22} opacity={1 - ring} />
          {/* s17.2: 고리 */}
          <Trace pts={[[LOOP.bw, 58], [LOOP.w - LOOP.bw - 3, 58]]} stroke={color.human} width={stroke.bold + 1} arrow at={downAt} duration={24} easing={ease.inOut} />
          <Trace pts={[[LOOP.w - LOOP.bw, 118], [LOOP.bw + 3, 118]]} stroke={color.agent} width={stroke.bold + 1} arrow at={upAt} duration={24} easing={ease.inOut} />
        </svg>
        <div style={{ position: "absolute", left: 0, width: LOOP.w, top: 0, textAlign: "center", ...sans(40, 700), color: color.human, whiteSpace: "nowrap", ...enter(frame, downAt + 6, { distance: 8 }) }}>{TX.down}</div>
        <div style={{ position: "absolute", left: 0, width: LOOP.w, top: 128, textAlign: "center", ...sans(40, 700), color: color.agent, whiteSpace: "nowrap", ...enter(frame, upAt + 6, { distance: 8 }) }}>{TX.up}</div>
      </div>

      {/* ── 마무리 문구 ── */}
      <div style={{ position: "absolute", left: 0, width: 1920, top: 420, textAlign: "center", ...sans(112, 800), letterSpacing: "-0.03em", whiteSpace: "nowrap", ...enter(frame, t3 + 12, { distance: 20, duration: 18 }) }}>{TX.closing}</div>
      <div style={{ position: "absolute", left: 0, width: 1920, top: 600, textAlign: "center", ...sans(36, 700), color: color.agent, whiteSpace: "nowrap", ...enter(frame, t3 + 28) }}>{`${script.series ?? ""} · ${script.seriesNo ?? ""}`}</div>
      <div style={{ position: "absolute", left: 96, top: 856, ...mono(22, 500), color: color.inkDim, opacity: progress(frame, t3 + 34, 12) }}>{TX.footer}</div>
    </ShiftSheet>
  );
};
