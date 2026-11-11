import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, ease, progress } from "../../../video/anim";
import { Trace } from "../../../video/components/Trace";
import type { Pt } from "../../../video/components/Trace";
import { color, fullSvg, mono, stroke, withAlpha } from "../../../video/theme";
import { CodeIcon, DbIcon, SearchIcon, SimIcon, TicketIcon, WaveIcon, blend } from "./kit";
import type { IconType } from "./kit";
import { CALLS } from "./text";

// 도구 호출 기록(왼쪽)과 도구 띠(오른쪽 위). S4·S5 가 같이 쓴다.
// 호출이 한 건씩 쌓이고, 호출마다 그 도구로 가는 trace 가 그려지며 도구가 켜진다.

export const LOG = { x: 96, y: 96, w: 620, head: 44, top: 154, pitch: 82 } as const;
export const LOG_H = LOG.top - LOG.y + CALLS.length * LOG.pitch + 14;
export const STRIP = { x: 776, y: 96, w: 152, h: 84, pitch: 176, bus: 208 } as const;
/** 오른쪽 결과 자리 */
export const AREA = { x: 776, y: 244, w: 1048, bottom: 880 } as const;

export const rowY = (i: number): number => LOG.top + i * LOG.pitch;
const stripCx = (t: number): number => STRIP.x + t * STRIP.pitch + STRIP.w / 2;

const STRIP_TOOLS: { name: string; Icon: IconType }[] = [
  { name: "regress", Icon: DbIcon },
  { name: "sim", Icon: SimIcon },
  { name: "wave", Icon: WaveIcon },
  { name: "code", Icon: CodeIcon },
  { name: "kb", Icon: SearchIcon },
  { name: "tracker", Icon: TicketIcon },
];

export const CallLog: React.FC<{
  /** 호출 i 가 나타나는 프레임. 없으면 아직 없는 줄 */
  at: (number | undefined)[];
  /** 다시 짚어 주는 줄: [줄, 켜는 프레임, 끄는 프레임] */
  flash?: [number, number, number][];
}> = ({ at, flash = [] }) => {
  const frame = useCurrentFrame();
  const shown = CALLS.map((_, i) => (at[i] === undefined ? 0 : progress(frame, at[i] as number, 12)));
  // 지금 진행 중인 호출: 가장 최근에 나타난 줄
  let active = -1;
  CALLS.forEach((_, i) => {
    if (at[i] !== undefined && frame >= (at[i] as number)) active = i;
  });
  const panelP = progress(frame, 0, DUR.enter);

  return (
    <>
      <svg {...fullSvg}>
        {/* 호출 → 도구 */}
        {CALLS.map((c, i) => {
          if (at[i] === undefined) return null;
          const y = rowY(i) + 18;
          const pts: Pt[] = [
            [LOG.x + LOG.w, y],
            [746, y],
            [746, STRIP.bus],
            [stripCx(c.strip), STRIP.bus],
            [stripCx(c.strip), STRIP.y + STRIP.h + 2],
          ];
          const on = i === active;
          return <Trace key={c.no} pts={pts} stroke={on ? color.agent : color.lineStrong} width={on ? stroke.bold : stroke.hair} opacity={on ? 1 : 0.55} at={at[i]} duration={DUR.draw + 4} easing={ease.inOut} arrow={on} />;
        })}
      </svg>

      {/* 도구 띠 */}
      {STRIP_TOOLS.map((t, k) => {
        let lit = 0;
        let hot = 0;
        CALLS.forEach((c, i) => {
          if (c.strip !== k || at[i] === undefined) return;
          const p = progress(frame, (at[i] as number) + 12, 10);
          lit = Math.max(lit, p);
          if (i === active) hot = p;
        });
        const edge = blend(color.line, color.agent, lit);
        return (
          <div key={t.name} style={{ position: "absolute", left: STRIP.x + k * STRIP.pitch, top: STRIP.y, width: STRIP.w, height: STRIP.h, boxSizing: "border-box", border: `${hot > 0 ? stroke.trace : stroke.thin}px solid ${edge}`, backgroundColor: blend(color.panel, color.agent, 0.18 * hot), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, opacity: panelP }}>
            <t.Icon size={34} color={blend(color.inkDim, color.agent, lit)} />
            <div style={{ ...mono(22, 700), color: blend(color.inkDim, color.ink, lit) }}>{t.name}</div>
          </div>
        );
      })}

      {/* 호출 기록 */}
      <div style={{ position: "absolute", left: LOG.x, top: LOG.y, width: LOG.w, height: LOG_H, boxSizing: "border-box", border: `${stroke.thin}px solid ${color.line}`, borderLeft: `5px solid ${color.agent}`, backgroundColor: withAlpha(color.panel, 0.92), opacity: panelP }}>
        <div style={{ height: LOG.head, boxSizing: "border-box", borderBottom: `${stroke.hair}px solid ${color.line}`, display: "flex", alignItems: "center", padding: "0 20px", ...mono(22, 700), color: color.inkSoft }}>TOOL CALLS · triage-agent</div>
      </div>
      {CALLS.map((c, i) => {
        const p = shown[i];
        if (p <= 0) return null;
        const a = at[i] as number;
        const on = i === active;
        let fl = 0;
        for (const [row, s, e] of flash) if (row === i) fl = Math.max(fl, progress(frame, s, 8) * (1 - progress(frame, e, 8)));
        const band = Math.max(on ? 1 : 0, fl);
        const res = progress(frame, a + 20, 10);
        const resColor = c.resultTone === "problem" ? color.problem : c.resultTone === "human" ? color.human : color.ink;
        return (
          <div key={c.no} style={{ position: "absolute", left: LOG.x + 5, top: rowY(i) - 4, width: LOG.w - 7, height: LOG.pitch - 4, opacity: p, translate: `0px ${(1 - p) * 10}px` }}>
            <div style={{ position: "absolute", inset: 0, backgroundColor: withAlpha(color.agent, 0.13 * band), borderLeft: `3px solid ${withAlpha(color.agent, band)}` }} />
            <div style={{ position: "absolute", left: 18, top: 4, ...mono(26, 700), lineHeight: "36px", color: on || fl > 0 ? color.agent : blend(color.agent, color.inkDim, 0.35), whiteSpace: "pre" }}>
              <span style={{ color: color.inkDim, fontWeight: 500 }}>{c.no} </span>
              {c.tool}
            </div>
            {c.result ? <div style={{ position: "absolute", right: 16, top: 4, ...mono(26, 700), lineHeight: "36px", color: resColor, opacity: res, whiteSpace: "pre" }}>{c.result}</div> : null}
            <div style={{ position: "absolute", left: 18 + 47, top: 39, ...mono(26, 500), lineHeight: "34px", color: on ? color.inkSoft : color.inkDim, whiteSpace: "pre" }}>{c.args}</div>
          </div>
        );
      })}
    </>
  );
};
