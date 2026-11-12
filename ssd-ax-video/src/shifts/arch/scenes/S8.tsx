import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, clamp01, ease, enter, lerp, progress } from "../../../video/anim";
import { AgentIcon, CheckIcon, WarnIcon } from "../../../video/components/Icons";
import { Trace } from "../../../video/components/Trace";
import { color, fullSvg, mono, sans, stroke, withAlpha } from "../../../video/theme";
import { CodePanel, ShiftSheet } from "../../lib";
import { Box, EdgeTag, Frame, T, blend, cw, useCues } from "./kitB";

// s8 모델은 여럿, 구조 기술은 하나.
// 1부: 모델 카드 다섯 장이 차례로 켜진다(스택과 추상화).
// 2부: 카드가 아래로 내려가고, 위에 구조 기술 파일 하나가 열려 trace 다섯 줄이 동시에 내려간다.

const CARD = { w: 310, h: 250, pitch: 354.5, y1: 330, y2: 640 } as const;
const cardX = (i: number): number => 96 + i * CARD.pitch;
const cardCx = (i: number): number => cardX(i) + CARD.w / 2;
const PANEL = { x: 96, y: 112, w: 920, px: 26 } as const;
const LINE_H = Math.round(PANEL.px * 1.5);
const PANEL_H = 44 + 20 + 10 * LINE_H + 16;
const TRUNK = { x: 556, y: PANEL.y + PANEL_H, bus: 611 } as const;
const LOG = { x: 1050, y: 170, w: 774, h: 178 } as const;
const AGENT = { x: 1015, y: 587, w: 250, h: 48 } as const;
const RTLP = { x: 1584, y: 488, w: 240, h: 60 } as const;

const YAML = [
  "structure: C",
  "blocks:",
  "  nand_if:   {reuse: prev_gen, add: retry_fsm}",
  "  hard_ldpc: {n: 8, reuse: prev_gen}",
  "  rcv_ctrl:  {new: true, owner: hw}",
  '  prio_q:    {depth: 64, order: "host 4 : gc 1"}',
  "  soft_ldpc: {n: 3, reuse: ldpc_ip(soft)}",
  "flow: [nand_if, hard_ldpc, rcv_ctrl, prio_q, soft_ldpc]",
  "fw_role: [policy, retry_table, parity_recovery]",
  "workload: [eol_mixed, gc_degraded]",
];
const SOFT_LINE = 6;

type Card = { name: string; lines: string[]; tag?: string };
const CARDS: Card[] = [
  { name: "perf", lines: ["이산 사건, trace 기반", "C++"] },
  { name: "area", lines: ["기존 IP 합성 실측", "+ 식"] },
  { name: "func", lines: ["C++ 동작 모델"] },
  { name: "vp", lines: ["SystemC/TLM", "실제 FW"], tag: "고른 구조만" },
  { name: "formal", lines: ["추상 상태 기계", "+ 속성"] },
];

/** 짧게 번쩍이는 값 (0~1) */
const flash = (frame: number, at: number): number => {
  const d = frame - at;
  if (d < 0) return 0;
  return d < 4 ? d / 4 : clamp01(1 - (d - 4) / 9);
};

export const S8: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, end, within } = useCues();
  const t4 = cue("s8.4");
  const t5 = cue("s8.5");
  const litAt = [cue("s8.1"), within("s8.2", 0.52), within("s8.1", 0.42), within("s8.1", 0.58), cue("s8.3")];
  const powerAt = cue("s8.2");

  const move = progress(frame, t4 - 12, DUR.move, ease.inOut);
  const y = lerp(CARD.y1, CARD.y2, move);
  const fanAt = t4 + 14;
  const fanned = progress(frame, fanAt + 18, 10);
  const blinkAt = within("s8.4", 0.62);
  const blink = Math.max(flash(frame, blinkAt), flash(frame, blinkAt + 17));
  const misAt = within("s8.5", 0.3);
  const fixAt = within("s8.5", 0.88);
  const wrong = progress(frame, misAt, 8) * (1 - progress(frame, fixAt, 12));
  const fixed = progress(frame, fixAt, 12);
  const agent = progress(frame, t5, DUR.enter);
  const logAt = within("s8.5", 0.46);

  return (
    <ShiftSheet>
      <T x={96} y={CARD.y1 - 56} text="MODELS  01 - 05" px={22} code weight={700} c={color.agent} at={8} out={t4 - 16} />

      {/* ── 구조 기술: 원본 파일 하나 ── */}
      <CodePanel
        x={PANEL.x}
        y={PANEL.y}
        w={PANEL.w}
        title="arch/struct/rcv.arch.yaml · 구조 기술 (예시)"
        px={PANEL.px}
        at={t4}
        owner="human"
        step={2}
        lines={YAML.map((text, i) => (i === SOFT_LINE ? { text, mark: blinkAt - 4 } : i === 1 ? { text, tone: "dim" as const } : { text }))}
      />
      <EdgeTag x={PANEL.x + 640} y={PANEL.y} text="구조 기술 · 원본 하나" c={color.human} px={30} p={progress(frame, t4 + 6, DUR.enter)} />
      {/* 패널의 n: 3 */}
      <div style={{ position: "absolute", left: PANEL.x + 24 + 14 * cw(PANEL.px) - 6, top: PANEL.y + 64 + SOFT_LINE * LINE_H + 3, width: 4 * cw(PANEL.px) + 12, height: LINE_H - 6, boxSizing: "border-box", border: `${stroke.thin}px solid ${color.human}`, backgroundColor: withAlpha(color.human, 0.35 * blink), opacity: progress(frame, blinkAt - 4, 8) }} />

      <svg {...fullSvg}>
        {/* 여섯째: RTL parameter */}
        <Trace pts={[[TRUNK.x, TRUNK.y], [TRUNK.x, TRUNK.bus], [RTLP.x + 190, TRUNK.bus], [RTLP.x + 190, RTLP.y + RTLP.h]]} stroke={color.lineStrong} width={stroke.thin} dash="6 7" arrow at={fanAt} duration={22} />
        {/* 다섯 모델로 동시에 */}
        {CARDS.map((c, i) => (
          <Trace key={c.name} pts={[[TRUNK.x, TRUNK.y], [TRUNK.x, TRUNK.bus], [cardCx(i), TRUNK.bus], [cardCx(i), CARD.y2 - 2]]} stroke={i === 1 && wrong > 0.5 ? color.problem : color.agent} width={stroke.trace} arrow at={fanAt} duration={22} easing={ease.inOut} />
        ))}
        {/* 에이전트 → 불일치 검사 */}
        <Trace pts={[[AGENT.x + AGENT.w / 2, AGENT.y], [AGENT.x + AGENT.w / 2, LOG.y + LOG.h + 2]]} stroke={color.agent} width={stroke.thin} dash="5 6" arrow at={logAt - 8} />
      </svg>
      <Box x={RTLP.x} y={RTLP.y} w={RTLP.w} h={RTLP.h} c={color.lineStrong} dash p={progress(frame, fanAt + 16, DUR.enter) * 0.8}>
        <div style={{ ...mono(26, 500), letterSpacing: "0", color: color.inkDim }}>RTL parameter</div>
      </Box>

      {/* ── 모델 카드 ── */}
      {CARDS.map((c, i) => {
        const lit = progress(frame, litAt[i], DUR.enter);
        const bad = i === 1 ? wrong : 0;
        const edge = blend(blend(color.line, color.agent, lit), color.problem, bad);
        const pulse = i === 1 ? Math.max(blink, flash(frame, fixAt + 6)) : blink;
        return (
          <div key={c.name} style={{ position: "absolute", left: cardX(i), top: y, width: CARD.w, height: CARD.h, boxSizing: "border-box", border: `${stroke.thin}px solid ${edge}`, backgroundColor: blend(color.panel, color.agent, 0.05 * lit), opacity: progress(frame, 4 + i * 3, DUR.enter) }}>
            <div style={{ position: "absolute", left: 20, top: 8, ...mono(38, 700), letterSpacing: "0", color: blend(color.inkDim, color.ink, lit) }}>{c.name}</div>
            <div style={{ position: "absolute", right: 14, top: 12, padding: "2px 10px", ...mono(28, 700), letterSpacing: "0", color: bad > 0.5 ? color.problem : color.agent, backgroundColor: withAlpha(bad > 0.5 ? color.problem : color.agent, 0.12 + 0.4 * pulse), opacity: fanned }}>{bad > 0.5 ? "n: 2" : "n: 3"}</div>
            <div style={{ position: "absolute", left: 0, right: 0, top: 60, height: stroke.hair, backgroundColor: edge, opacity: 0.6 }} />
            {c.lines.map((t, k) => (
              <div key={t} style={{ position: "absolute", left: 20, top: 70 + k * 40, ...sans(30, 500), whiteSpace: "nowrap", ...enter(frame, litAt[i] + 4 + k * 4) }}>
                {t}
              </div>
            ))}
            {c.tag ? (
              <div style={{ position: "absolute", left: 20, top: 164, height: 46, boxSizing: "border-box", display: "flex", alignItems: "center", padding: "0 14px", border: `${stroke.thin}px solid ${color.human}`, ...sans(30, 700), color: color.human, whiteSpace: "nowrap", ...enter(frame, litAt[i] + 12) }}>{c.tag}</div>
            ) : null}
            {i === 0 ? (
              <div style={{ position: "absolute", left: 14, right: 14, top: 152, height: 86, boxSizing: "border-box", border: `${stroke.hair}px dashed ${color.agent}`, padding: "4px 12px", ...enter(frame, powerAt, { from: "down" }) }}>
                <div style={{ ...sans(30, 600), color: color.agent, whiteSpace: "nowrap", lineHeight: "38px" }}>전력 = 활동률</div>
                <div style={{ ...sans(30, 600), color: color.agent, whiteSpace: "nowrap", lineHeight: "38px" }}>× 상태별 전력 표</div>
              </div>
            ) : null}
          </div>
        );
      })}

      {/* ── 에이전트: 생성 · 갱신, 불일치 검사 ── */}
      <Box x={AGENT.x} y={AGENT.y} w={AGENT.w} h={AGENT.h} c={color.agent} fill={blend(color.bg, color.agent, 0.14)} p={agent} style={{ gap: 12 }}>
        <AgentIcon size={30} color={color.agent} />
        <div style={{ ...mono(28, 700), letterSpacing: "0", color: color.agent }}>arch-agent</div>
      </Box>
      <T x={AGENT.x + AGENT.w + 18} y={AGENT.y - 40} text="생성 · 갱신" px={30} weight={700} c={color.agent} at={t5 + 8} />

      <Frame x={LOG.x} y={LOG.y} w={LOG.w} h={LOG.h} title="불일치 검사 · rcv.arch.yaml @ 4c1e9f2" titlePx={28} at={logAt} owner="agent">
        <div style={{ padding: "10px 22px 0 24px" }}>
          <div style={{ height: 52, display: "flex", alignItems: "center", gap: 14, opacity: progress(frame, logAt + 8, 10) }}>
            <CheckIcon size={28} color={color.agent} />
            <div style={{ ...mono(26, 500), letterSpacing: "0", color: color.ink, flex: 1 }}>perf · func · vp · formal</div>
            <div style={{ ...sans(30, 600), color: color.agent, whiteSpace: "nowrap" }}>구조 hash 일치</div>
          </div>
          <div style={{ height: 52, display: "flex", alignItems: "center", gap: 14, opacity: progress(frame, logAt + 16, 10) }}>
            {fixed > 0.5 ? <CheckIcon size={28} color={color.agent} /> : <WarnIcon size={28} color={color.problem} />}
            <div style={{ ...mono(26, 700), letterSpacing: "0", color: blend(color.problem, color.agent, fixed), flex: 1 }}>area</div>
            <div style={{ ...sans(30, 600), color: blend(color.problem, color.agent, fixed), whiteSpace: "nowrap" }}>soft_ldpc n 불일치 → 재생성</div>
          </div>
        </div>
      </Frame>

      <T x={1824} y={76} text="모델은 여럿, 구조 기술은 하나" px={44} weight={800} align="right" at={end("s8.5") + 2} />
    </ShiftSheet>
  );
};
