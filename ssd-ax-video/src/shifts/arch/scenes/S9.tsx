import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, clamp01, draw, ease, enter, lerp, progress } from "../../../video/anim";
import { AgentIcon, HumanIcon } from "../../../video/components/Icons";
import { Trace } from "../../../video/components/Trace";
import { color, fullSvg, mono, sans, stroke, withAlpha } from "../../../video/theme";
import { CodePanel, ShiftSheet } from "../../lib";
import { Box, EdgeTag, T, Table, cw, useCues } from "./kitB";

// s9 모델 만들고 보정하기.
// 왼쪽: 구조 기술에서 나온 perf 모델의 실행 설정(에이전트), 그 아래 믿는 범위(사람).
// 오른쪽: 이전 실리콘 실측과 모델의 분포 곡선, 보정 표, 판정선.

const CFGP = { x: 96, y: 170, w: 820, px: 26 } as const;
const LINE_H = Math.round(CFGP.px * 1.5);
const CH = { x: 1010, w: 790, top: 120, base: 430 } as const;
const TABLE = { x: 980, y: 520, w: 844 } as const;
const TRUST = { x: 96, y: 658, w: 820, h: 148 } as const;

// 가로축: read 지연(로그), 40 µs ~ 2.4 ms
const ux = (us: number): number => CH.x + ((Math.log10(us) - Math.log10(40)) / (Math.log10(2400) - Math.log10(40))) * CH.w;
const g = (u: number, m: number, s: number): number => Math.exp(-((u - m) * (u - m)) / (2 * s * s));
const curve = (shift: number): string => {
  let d = "";
  for (let i = 0; i <= 120; i++) {
    const u = i / 120;
    const v = g(u, 0.204 + shift * 0.35, 0.07) + 0.2 * g(u, 0.5 + shift * 0.7, 0.085) + 0.07 * g(u, 0.8 + shift, 0.05);
    d += `${i === 0 ? "M" : "L"} ${(CH.x + u * CH.w).toFixed(1)} ${(CH.base - 2 - v * 280).toFixed(1)} `;
  }
  return d;
};

const flash = (frame: number, at: number): number => {
  const d = frame - at;
  if (d < 0) return 0;
  return d < 3 ? d / 3 : clamp01(1 - (d - 3) / 9);
};

export const S9: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, end, within } = useCues();
  const t1 = cue("s9.1");
  const t2 = cue("s9.2");
  const t3 = cue("s9.3");
  const t4 = cue("s9.4");

  // structure: A → B → C → D, 그리고 C 로 돌아온다
  const steps = [within("s9.1", 0.42), within("s9.1", 0.56), within("s9.1", 0.7), within("s9.1", 0.84), end("s9.1") + 8];
  const letters = ["A", "B", "C", "D", "C"];
  let letter = "C";
  let blink = 0;
  steps.forEach((at, i) => {
    if (frame >= at) letter = letters[i];
    blink = Math.max(blink, flash(frame, at));
  });

  const fit = progress(frame, within("s9.2", 0.35) + 8, 40, ease.inOut);
  const modelIn = progress(frame, within("s9.2", 0.35), DUR.enter);
  const axis = progress(frame, t2, DUR.draw);
  const lowerAt = within("s9.3", 0.58);
  const lower = progress(frame, lowerAt, 22, ease.inOut);
  const lineIn = progress(frame, t3 + 4, DUR.draw);
  const x2 = ux(2000);
  const x178 = ux(1780);
  const xNow = lerp(x2, x178, lower);

  const yaml = [
    { text: "scenario: eol_mixed       # REQ-QOS-07 AC-1 (예시)" },
    { text: "arch: arch/struct/rcv.arch.yaml", mark: t1 + 14, unmark: steps[0] - 4, markTone: "human" as const },
    { text: "workload: {trace: dc_mixed_70r30w, reads: 5e7}" },
    { text: "nand: {type: qlc_next, soft_entry_rate: 3e-4}" },
    { text: `structure: ${letter}              # A | B | C | D`, mark: steps[0] - 4, unmark: t2 + 4 },
    { text: "fw: {round_trip: dist/fw_rt_prev_gen.csv}" },
    { text: "check: {p9999_ms: 1.78}", mark: lowerAt },
  ];
  const trust = progress(frame, t4, DUR.enter);

  return (
    <ShiftSheet>
      {/* ── 구조 기술(앞 씬) → 실행 설정 ── */}
      <Box x={96} y={76} w={440} h={50} c={color.line} center={false} p={progress(frame, 4, DUR.enter)} style={{ borderLeft: `5px solid ${color.human}`, paddingLeft: 18 }}>
        <div style={{ ...mono(22, 700), color: color.inkSoft }}>arch/struct/rcv.arch.yaml</div>
      </Box>
      <Box x={640} y={76} w={250} h={50} c={color.agent} fill={withAlpha(color.agent, 0.12)} p={progress(frame, t1, DUR.enter)} style={{ gap: 12 }}>
        <AgentIcon size={30} color={color.agent} />
        <div style={{ ...mono(28, 700), letterSpacing: "0", color: color.agent }}>arch-agent</div>
      </Box>
      <svg {...fullSvg}>
        <Trace pts={[[220, 126], [220, CFGP.y]]} stroke={color.human} width={stroke.trace} arrow at={t1 + 6} />
        <Trace pts={[[765, 126], [765, CFGP.y]]} stroke={color.agent} width={stroke.trace} arrow at={t1 + 10} />
      </svg>
      <CodePanel x={CFGP.x} y={CFGP.y} w={CFGP.w} title="arch/model/rcv/eol_mixed.yaml" px={CFGP.px} at={t1 + 4} owner="agent" lines={yaml} />
      <div style={{ position: "absolute", left: CFGP.x + 24 + 11 * cw(CFGP.px) - 8, top: CFGP.y + 64 + 4 * LINE_H + 3, width: cw(CFGP.px) + 16, height: LINE_H - 6, boxSizing: "border-box", border: `${stroke.thin}px solid ${color.agent}`, backgroundColor: withAlpha(color.agent, 0.45 * blink), opacity: progress(frame, steps[0] - 4, 8) * (1 - progress(frame, t2 + 4, 10)) }} />

      {/* ── 분포 곡선 ── */}
      <svg {...fullSvg}>
        <line x1={CH.x} x2={CH.x + CH.w * axis} y1={CH.base} y2={CH.base} stroke={color.lineStrong} strokeWidth={stroke.thin} />
        {[92, 410, 1380].map((v) => (
          <line key={v} x1={ux(v)} x2={ux(v)} y1={CH.base} y2={CH.base + 8} stroke={color.lineStrong} strokeWidth={stroke.hair} opacity={axis} />
        ))}
        <path d={curve(0)} fill="none" stroke={color.ink} strokeWidth={stroke.trace} pathLength={1} {...draw(progress(frame, t2 + 6, 34, ease.inOut))} />
        <path d={curve(lerp(0.075, 0.018, fit))} fill="none" stroke={color.agent} strokeWidth={stroke.trace} strokeDasharray="9 7" opacity={modelIn} />
        {/* 판정선: 2 ms → 1.78 ms */}
        <line x1={x2} x2={x2} y1={CH.base} y2={CH.base - (CH.base - CH.top - 30) * lineIn} stroke={color.lineStrong} strokeWidth={stroke.thin} strokeDasharray="6 6" />
        {lower > 0 ? <line x1={xNow} x2={xNow} y1={CH.base} y2={CH.top + 30} stroke={color.agent} strokeWidth={stroke.bold} /> : null}
        {lower > 0 ? <path d={`M ${x2 - 2} ${CH.top + 44} H ${xNow + 4} M ${xNow + 12} ${CH.top + 37} L ${xNow + 4} ${CH.top + 44} L ${xNow + 12} ${CH.top + 51}`} fill="none" stroke={color.agent} strokeWidth={stroke.trace} opacity={lower} /> : null}
        {/* 범례 */}
        <line x1={1250} x2={1304} y1={CH.top + 4} y2={CH.top + 4} stroke={color.ink} strokeWidth={stroke.trace} opacity={progress(frame, t2 + 6, 10)} />
        <line x1={1250} x2={1304} y1={CH.top + 46} y2={CH.top + 46} stroke={color.agent} strokeWidth={stroke.trace} strokeDasharray="9 7" opacity={modelIn} />
      </svg>
      <T x={1318} y={CH.top - 16} text="이전 실리콘 실측" px={30} weight={600} at={t2 + 6} />
      <T x={1318} y={CH.top + 26} text="모델 (이전 세대 설정)" px={30} weight={600} c={color.agent} at={within("s9.2", 0.35)} />
      {[["P50", 92], ["P99", 410], ["P99.99", 1380]].map(([n, v]) => (
        <T key={n} x={ux(v as number)} y={CH.base + 10} text={n} px={22} code c={color.inkDim} align="center" at={t2 + 10} />
      ))}
      <T x={CH.x} y={CH.base + 36} text="read 지연 (로그)" px={30} weight={500} c={color.inkDim} at={t2 + 4} />
      <T x={x2 + 10} y={CH.top + 26} text="2 ms" px={26} code weight={700} c={color.inkDim} at={t3 + 6} opacity={1 - 0.3 * lower} />
      <T x={x178 - 12} y={CH.top + 76} text="1.78 ms" px={30} code weight={700} c={color.agent} align="right" at={lowerAt + 12} />

      {/* ── 보정 표 ── */}
      <Table
        x={TABLE.x}
        y={TABLE.y}
        w={TABLE.w}
        title="보정 · 이전 세대 실측 대 모델 (예시)"
        at={t3}
        owner="agent"
        rowH={44}
        cols={[{ w: 190 }, { w: 200, code: true }, { w: 200, code: true }, { w: 160, code: true }]}
        head={["지표", "실측", "모델", "오차"]}
        rows={[
          { cells: [{ t: "P50", code: true }, "92 µs", "95 µs", "+3%"], at: t3 + 8, c: color.inkSoft },
          { cells: [{ t: "P99", code: true }, "410 µs", "431 µs", "+5%"], at: t3 + 12, c: color.inkSoft },
          { cells: [{ t: "P99.99", code: true, weight: 700 }, "1.38 ms", "1.52 ms", { t: "+10%", c: color.agent, weight: 700 }], at: t3 + 16, mark: within("s9.3", 0.18) },
          { cells: [{ t: "판정선", c: color.agent, weight: 700 }, { t: "P99.99 ≤ 1.78 ms", c: color.agent, weight: 700 }, "", ""], at: lowerAt + 6, mark: lowerAt + 6 },
        ]}
      />

      {/* ── 믿는 범위: 사람이 적는다 ── */}
      <Box x={TRUST.x} y={TRUST.y} w={TRUST.w} h={TRUST.h} c={color.human} fill={withAlpha(color.human, 0.05)} p={trust} center={false} style={{ flexDirection: "column", alignItems: "flex-start", justifyContent: "center", padding: "6px 26px", gap: 10 }}>
        <div style={{ display: "flex", ...enter(frame, t4 + 6) }}>
          <div style={{ ...sans(30, 700), color: color.human, width: 150 }}>믿는 범위</div>
          <div style={{ ...sans(30, 500), whiteSpace: "nowrap" }}>read 50~100% · QD ≤ 256 · 방치 ≤ 3개월</div>
        </div>
        <div style={{ display: "flex", ...enter(frame, within("s9.4", 0.5)) }}>
          <div style={{ ...sans(30, 700), color: color.human, width: 150 }}>범위 밖</div>
          <div style={{ ...sans(30, 500), whiteSpace: "nowrap", borderBottom: `${stroke.trace}px dashed ${color.problem}`, paddingBottom: 2 }}>고온 방치 직후 전원 인가 (데이터 없음)</div>
        </div>
      </Box>
      <EdgeTag x={TRUST.x + 24} y={TRUST.y} text="HUMAN" c={color.human} p={trust} />
      <div style={{ position: "absolute", left: TRUST.x + TRUST.w - 70, top: TRUST.y + 14, opacity: trust }}>
        <HumanIcon size={44} color={color.human} />
      </div>
    </ShiftSheet>
  );
};
