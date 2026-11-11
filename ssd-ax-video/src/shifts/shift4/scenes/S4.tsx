import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, draw, ease, enter, enterExit, lerp, progress } from "../../../video/anim";
import { WarnIcon } from "../../../video/components/Icons";
import { Trace, pointOnTrace, traceLength } from "../../../video/components/Trace";
import type { Pt } from "../../../video/components/Trace";
import { hash } from "../../../video/scenes/s5_4/field";
import { Wave } from "../../../video/scenes/s5_4/Wave";
import { color, fullSvg, mono, sans, stroke, withAlpha } from "../../../video/theme";
import { CodePanel, ShiftSheet } from "../../lib";
import { AREA, CallLog } from "./CallLog";
import { EdgeTag, useCues } from "./kit";
import { RTL, TX, WAVE_TABLE } from "./text";

// S4 예제 1: 에이전트가 부르는 도구. 왼쪽에 호출 기록이 쌓이고 오른쪽에 호출의 결과가 바뀌어 나타난다.

// ── 실패 312건의 점 ─────────────────────────────────────────────────────
const COUNTS = [118, 97, 58, 39];
const SPACING = 8.5;
const CY = 492;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));
type Dot = { c: number; k: number; sx: number; sy: number; tx: number; ty: number };
const clusters = (() => {
  const rs = COUNTS.map((n) => SPACING * Math.sqrt(n));
  const gap = 70;
  const total = rs.reduce((s, r) => s + 2 * r, 0) + gap * (rs.length - 1);
  let x = AREA.x + (AREA.w - total) / 2;
  return rs.map((r) => {
    const cx = x + r;
    x += 2 * r + gap;
    return { cx, r };
  });
})();
const dots: Dot[] = (() => {
  const out: Dot[] = [];
  let n = 0;
  COUNTS.forEach((count, c) => {
    for (let k = 0; k < count; k++, n++) {
      const r = SPACING * Math.sqrt(k + 0.5);
      const a = k * GOLDEN + c * 1.3;
      out.push({ c, k, sx: AREA.x + 20 + hash(n * 2 + 1) * (AREA.w - 40), sy: 372 + hash(n * 2 + 2) * 250, tx: clusters[c].cx + r * Math.cos(a), ty: CY + r * Math.sin(a) });
    }
  });
  return out;
})();
const C2 = clusters[1];

const SAND = { x: 880, y: 690, w: 820, h: 160 } as const;
const TABLE = { x: AREA.x, y: 566, w: 800 } as const;
const ZOOM = { x: 896, y: 384, w: 808, h: 150 } as const;
const BAND = { y: 252, h: 76, wx: 1560, ww: 84 } as const;

export const S4: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, within } = useCues();
  const t1 = cue("s4.1");
  const t2 = cue("s4.2");
  const t3 = within("s4.2", 0.5);
  const t4 = cue("s4.3");
  const t5 = cue("s4.4");
  const t6 = cue("s4.6");
  const e1 = cue("s4.5");

  // 1부: 실패 점과 묶음, sandbox
  const part1 = 1 - progress(frame, t5 - 6, DUR.exit, ease.in);
  const gather = progress(frame, t2 + 6, 34, ease.inOut);
  const pick = progress(frame, t3 + 6, DUR.enter);
  const sand = progress(frame, t4 + 4, DUR.enter);
  const path: Pt[] = [[C2.cx, CY + C2.r + 10], [C2.cx, 640], [SAND.x + 60, 640], [SAND.x + 60, SAND.y + 86]];
  const travel = progress(frame, t4 + 14, 30, ease.inOut);
  const runAt = t4 + 46;
  const run = progress(frame, runAt, 34, ease.linear);
  const failAt = runAt + 36;

  // 2부: 파형 구간과 표
  const part2 = progress(frame, t5, DUR.enter) * (1 - progress(frame, t6 - 6, DUR.exit, ease.in));
  const bandDraw = progress(frame, t5 + 4, 30, ease.linear);
  const cut = progress(frame, within("s4.4", 0.4), DUR.draw);
  const zoom = progress(frame, within("s4.4", 0.4) + 10, DUR.draw);
  const tableAt = within("s4.4", 0.62);
  const marks = [e1 + 2, within("s4.5", 0.55), within("s4.5", 0.86)];
  const notes = [TX.sameCycle, TX.lost, "timeout"];

  // 3부: 코드
  const branchAt = within("s4.6", 0.42);
  const fsm = progress(frame, t6 + 16, DUR.enter);
  const hot = progress(frame, branchAt, DUR.draw);

  return (
    <ShiftSheet>
      <CallLog at={[t1, t2, t3, t4, t5, t6]} />

      {/* ── 1부 ── */}
      {part1 > 0 ? (
        <div style={{ opacity: part1 }}>
          <div style={{ position: "absolute", left: AREA.x, top: AREA.y + 6, height: 68, boxSizing: "border-box", border: `${stroke.thin}px solid ${color.problem}`, backgroundColor: withAlpha(color.problem, 0.08), display: "flex", alignItems: "center", gap: 16, padding: "0 24px", ...enter(frame, t1 + 22) }}>
            <WarnIcon size={36} color={color.problem} />
            <div style={{ ...sans(36, 700), color: color.problem, whiteSpace: "nowrap" }}>{TX.failBox}</div>
          </div>
          <svg {...fullSvg}>
            {dots.map((d, n) => {
              const p = progress(frame, t1 + 26 + hash(n + 7) * 40, 8);
              if (p <= 0) return null;
              const fade = d.c === 1 ? 1 : 1 - 0.72 * pick;
              return <circle key={n} cx={lerp(d.sx, d.tx, gather)} cy={lerp(d.sy, d.ty, gather)} r={3.4} fill={color.problem} opacity={p * fade} />;
            })}
            <circle cx={C2.cx} cy={CY} r={C2.r + 12} fill="none" stroke={color.ink} strokeWidth={stroke.thin} pathLength={1} {...draw(pick)} />
            {/* 대표 seed 가 sandbox 로 */}
            <Trace pts={path} stroke={color.agent} dash="6 7" width={stroke.thin} at={t4 + 6} duration={24} />
            {sand > 0 ? <rect x={SAND.x} y={SAND.y} width={SAND.w} height={SAND.h} fill={withAlpha(color.panel, 0.7)} stroke={color.agent} strokeWidth={stroke.thin} strokeDasharray="10 8" opacity={sand} /> : null}
            {travel > 0
              ? (() => {
                  const at = pointOnTrace(path, traceLength(path) * travel);
                  return <circle cx={at.x} cy={at.y} r={9} fill={color.problem} stroke={color.bg} strokeWidth={2} />;
                })()
              : null}
            {run > 0 ? (
              <g>
                <line x1={SAND.x + 100} x2={SAND.x + 440} y1={SAND.y + 86} y2={SAND.y + 86} stroke={color.line} strokeWidth={8} />
                <line x1={SAND.x + 100} x2={SAND.x + 100 + 340 * run} y1={SAND.y + 86} y2={SAND.y + 86} stroke={run >= 1 ? color.problem : color.agent} strokeWidth={8} />
              </g>
            ) : null}
          </svg>
          <div style={{ position: "absolute", left: C2.cx - 300, width: 600, top: 342, textAlign: "center", ...sans(32, 700), ...enter(frame, t3 + 10) }}>{TX.c2}</div>
          <EdgeTag x={SAND.x + 24} y={SAND.y} text="sandbox · queue=agent-short" c={color.agent} p={sand} px={26} />
          <div style={{ position: "absolute", left: SAND.x + 100, top: SAND.y + 34, ...mono(22, 500), color: color.inkSoft, opacity: progress(frame, runAt - 6, 10) }}>recov_retry_burst seed=48213</div>
          <div style={{ position: "absolute", left: SAND.x + 480, top: SAND.y + 60, ...mono(36, 700), color: color.problem, ...enter(frame, failAt, { from: "left" }) }}>FAIL @ 2.04 ms</div>
        </div>
      ) : null}

      {/* ── 2부 ── */}
      {part2 > 0 ? (
        <div style={{ opacity: part2 }}>
          <svg {...fullSvg}>
            {/* 긴 파형 띠 */}
            <rect x={AREA.x} y={BAND.y} width={AREA.w} height={BAND.h} fill={withAlpha(color.panel, 0.7)} stroke={color.line} strokeWidth={stroke.hair} />
            {[0, 1, 2].map((row) => {
              const base = BAND.y + 22 + row * 22;
              let d = `M ${AREA.x + 8} ${base}`;
              let level = 0;
              for (let c = 0; c < 64; c++) {
                const want = hash(row * 97 + c * 3 + 5) > 0.62 ? 1 : 0;
                const x = AREA.x + 8 + c * 16.1;
                if (want !== level) {
                  d += ` H ${x} V ${base - want * 13}`;
                  level = want;
                }
              }
              d += ` H ${AREA.x + AREA.w - 8}`;
              return <path key={row} d={d} fill="none" stroke={color.lineStrong} strokeWidth={stroke.hair} pathLength={1} {...draw(bandDraw)} />;
            })}
            {/* 멈추기 직전 구간 */}
            <rect x={BAND.wx} y={BAND.y - 8} width={BAND.ww} height={BAND.h + 16} fill={withAlpha(color.problem, 0.1 * cut)} stroke={color.problem} strokeWidth={stroke.trace} pathLength={1} {...draw(cut)} />
            <path d={`M ${BAND.wx} ${BAND.y + BAND.h + 8} L ${ZOOM.x} ${ZOOM.y} M ${BAND.wx + BAND.ww} ${BAND.y + BAND.h + 8} L ${ZOOM.x + ZOOM.w} ${ZOOM.y}`} fill="none" stroke={color.problem} strokeWidth={stroke.hair} strokeDasharray="5 6" opacity={zoom * 0.8} />
            <rect x={ZOOM.x} y={ZOOM.y} width={ZOOM.w} height={ZOOM.h} fill={withAlpha(color.panel, 0.6)} stroke={color.problem} strokeWidth={stroke.thin} pathLength={1} opacity={zoom} {...draw(zoom)} />
          </svg>
          <Wave x={ZOOM.x + 24} y={ZOOM.y + 16} w={ZOOM.w - 48} h={ZOOM.h - 32} labelW={86} signals={[{ name: "REQ", high: [1, 5] }, { name: "DONE", high: [3, 5] }]} cycles={8} overlap={5} appear={zoom} drawn={progress(frame, within("s4.4", 0.4) + 16, 26, ease.linear)} hot={progress(frame, marks[0], DUR.draw)} cleared={0} />
          {notes.map((t, i) => (
            <div key={t} style={{ position: "absolute", left: TABLE.x + TABLE.w + 20, top: TABLE.y + 64 + (i + 2) * 39, height: 39, display: "flex", alignItems: "center", gap: 12, ...enter(frame, marks[i] + 4, { from: "left" }) }}>
              <svg width={28} height={16} style={{ flex: "none" }}>
                <path d="M 28 8 H 3 M 10 2 L 3 8 L 10 14" fill="none" stroke={color.problem} strokeWidth={stroke.trace} />
              </svg>
              <div style={{ ...(i === 2 ? mono(30, 700) : sans(30, 700)), color: color.problem, whiteSpace: "nowrap" }}>{t}</div>
            </div>
          ))}
        </div>
      ) : null}
      <CodePanel
        x={TABLE.x}
        y={TABLE.y}
        w={TABLE.w}
        title="wave.query · 1,839,990 ~ 2,040,000 ns"
        px={26}
        at={tableAt}
        out={t6 - 6}
        owner="agent"
        lines={WAVE_TABLE.map((text, i) => (i === 0 ? { text, tone: "dim" as const } : i >= 2 ? { text, mark: marks[i - 2], markTone: "problem" as const } : { text }))}
      />

      {/* ── 3부 ── */}
      <CodePanel x={AREA.x} y={AREA.y + 26} w={AREA.w} title="rd_recov_ctrl.sv:212-240" px={26} at={t6 + 4} owner="none" lines={RTL.map((text, i) => (i === 1 ? { text, mark: branchAt, markTone: "problem" as const } : i === 2 ? { text, tone: "dim" as const } : { text }))} />
      <svg {...fullSvg}>
        {/* 첫 분기 줄의 붉은 밑줄 */}
        <line x1={AREA.x + 24 + 2 * 15.6} x2={AREA.x + 24 + 2 * 15.6 + 39 * 15.6 * hot} y1={AREA.y + 26 + 64 + 2 * 39 - 3} y2={AREA.y + 26 + 64 + 2 * 39 - 3} stroke={color.problem} strokeWidth={stroke.bold} opacity={hot > 0 ? 1 : 0} />
        {/* 상태 천이 */}
        <g opacity={fsm}>
          <rect x={860} y={676} width={250} height={76} fill={color.panel} stroke={color.inkSoft} strokeWidth={stroke.thin} />
          <rect x={1440} y={596} width={270} height={76} fill={color.panel} stroke={blend3(hot)} strokeWidth={stroke.trace} />
          <rect x={1440} y={756} width={270} height={76} fill={color.panel} stroke={color.lineStrong} strokeWidth={stroke.thin} strokeDasharray="8 7" />
        </g>
        <Trace pts={[[1110, 700], [1280, 700], [1280, 634], [1436, 634]]} stroke={color.problem} width={stroke.bold} arrow at={branchAt} duration={DUR.draw + 6} />
        <Trace pts={[[1110, 728], [1280, 728], [1280, 794], [1436, 794]]} stroke={color.lineStrong} dash="5 7" width={stroke.thin} at={t6 + 22} />
        <path d="M 1344 780 l 28 28 M 1372 780 l -28 28" stroke={color.problem} strokeWidth={stroke.bold} opacity={progress(frame, branchAt + 18, 10)} />
      </svg>
      {[
        { x: 860, y: 676, w: 250, t: "WAIT_DEC", c: color.ink },
        { x: 1440, y: 596, w: 270, t: "RETRY_REQ", c: color.problem },
        { x: 1440, y: 756, w: 270, t: "DONE", c: color.inkDim },
      ].map((b) => (
        <div key={b.t} style={{ position: "absolute", left: b.x, top: b.y, width: b.w, height: 76, display: "flex", alignItems: "center", justifyContent: "center", ...mono(30, 700), color: b.t === "RETRY_REQ" ? (hot > 0.5 ? color.problem : color.ink) : b.c, opacity: fsm }}>
          {b.t}
        </div>
      ))}
      <div style={{ position: "absolute", left: 1130, top: 656, ...mono(26, 700), color: color.problem, ...enterExit(frame, branchAt + 6) }}>recov_req</div>
      <div style={{ position: "absolute", left: 1130, top: 738, ...mono(26, 500), color: color.inkDim, opacity: fsm }}>dec_done</div>
    </ShiftSheet>
  );
};

const blend3 = (hot: number): string => (hot > 0.5 ? color.problem : color.inkSoft);
