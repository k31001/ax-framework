import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, ease, enter, progress } from "../../../video/anim";
import { AgentIcon } from "../../../video/components/Icons";
import { hash } from "../../../video/scenes/s5_4/field";
import { color, fullSvg, mono, sans, stroke, withAlpha } from "../../../video/theme";
import { ShiftSheet } from "../../lib";
import { GROUPS, LIMIT, ScatterMarks, T, Table, blend, groupLabel, sx, sy, useCues } from "./kitB";
import type { PlotRect } from "./kitB";

// s10 여러 관점으로 돌리기.
// 왼쪽: 216 구성의 산점도(면적 증가 대 host P99.99)와 제약선. 오른쪽: 여섯 관점, 전력 막대, 구조별 최선 표.

const R: PlotRect = { x: 200, y: 130, w: 780, h: 560 };
const COL = { x: 1040, w: 784 } as const;
const LIST = { y0: 84, pitch: 44 } as const;
const VIEWS = ["지연 꼬리", "전력", "면적", "FW 복잡도", "검증 가능성", "재사용"];
const VALUES = ["정책 · table · parity 복구만", "formal + sim, 지연은 emulation", "70% · 신규 블록 셋"];
const PW = { x0: 1190, y0: 384, pitch: 28, per: 30 } as const;
const POWER = [0, 1, 5, 14];
const TABLE_Y = 536;

export const S10: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, within } = useCues();
  const t1 = cue("s10.1");
  const t3 = cue("s10.3");
  const t4 = cue("s10.4");
  const t5 = cue("s10.5");
  const t6 = cue("s10.6");
  const viewAt = [0.1, 0.3, 0.42, 0.55, 0.72, 0.9].map((k) => within("s10.2", k));

  const axes = progress(frame, t1, DUR.draw + 6);
  const hLine = progress(frame, t3 + 2, 22, ease.inOut);
  const powerAt = within("s10.3", 0.22);
  const vLineAt = within("s10.3", 0.38);
  const vLine = progress(frame, vLineAt, 22, ease.inOut);
  const shade = progress(frame, within("s10.3", 0.64), 16);
  const outAB = progress(frame, t4 + 2, DUR.enter);
  const dAt = within("s10.4", 0.5);
  const outD = progress(frame, dAt, DUR.enter);
  const focus = progress(frame, t6, 18);
  const paretoAt = within("s10.6", 0.4);
  const limited = progress(frame, t3, DUR.enter);

  const ly = sy(R, LIMIT.p);
  const lx = sx(R, LIMIT.a);
  const strike = progress(frame, within("s10.5", 0.28), 18, ease.inOut);

  return (
    <ShiftSheet>
      {/* ── 산점도 ── */}
      <T x={R.x} y={72} text="216 구성 · eol_mixed" px={36} weight={800} at={t1} />
      <div style={{ position: "absolute", left: R.x + 380, top: 72, height: 46, boxSizing: "border-box", display: "flex", alignItems: "center", gap: 10, padding: "0 14px", border: `${stroke.thin}px solid ${color.agent}`, backgroundColor: withAlpha(color.agent, 0.1), ...enter(frame, t1 + 6) }}>
        <AgentIcon size={28} color={color.agent} />
        <div style={{ ...mono(26, 700), letterSpacing: "0", color: color.agent }}>arch-agent</div>
      </div>
      <svg {...fullSvg}>
        <ScatterMarks r={R} axes={axes} shown={(i, g) => progress(frame, t1 + 12 + g * 16 + hash(i + 9) * 22, 8)} hLine={hLine} vLine={vLine} shade={shade} outAB={outAB} outD={outD} focus={focus} pareto={progress(frame, paretoAt, 24, ease.inOut)} />
      </svg>
      {[1.5, 2, 3, 4].map((p) => (
        <T key={p} x={R.x - 16} y={sy(R, p) - 14} text={`${p}`} px={22} code c={color.inkDim} align="right" opacity={axes} />
      ))}
      {[0, 10, 20, 30, 40].map((a) => (
        <T key={a} x={sx(R, a)} y={R.y + R.h + 12} text={a === 0 ? "0" : `+${a}%`} px={22} code c={color.inkDim} align="center" opacity={axes} />
      ))}
      <div style={{ position: "absolute", left: 124 - 200, top: R.y + R.h / 2 - 20, width: 400, textAlign: "center", rotate: "-90deg", ...sans(30, 500), color: color.inkDim, whiteSpace: "nowrap", opacity: axes }}>host P99.99 (ms)</div>
      <T x={R.x + R.w / 2} y={R.y + R.h + 46} text="면적 증가 (ECC · 복구 블록, 이전 세대 대비)" px={30} weight={500} c={color.inkDim} align="center" at={t1 + 4} />
      {GROUPS.map((n, g) => {
        const [x, y] = groupLabel(R, g);
        const red = g === 3 ? outD : g < 2 ? outAB : 0;
        return <T key={n} x={x} y={y - 26} text={n} px={42} code weight={700} c={blend(g === 2 ? color.agent : color.ink, color.problem, red)} align="center" at={t1 + 22 + g * 16} />;
      })}
      <T x={sx(R, 29.5)} y={ly - 44} text="P99.99 ≤ 1.78 ms" px={28} code weight={700} c={color.human} align="center" at={t3 + 14} />
      <T x={lx + 14} y={R.y + 4} text="면적 ≤ +15%" px={30} weight={700} c={color.human} at={vLineAt + 12} />
      <T x={sx(R, 5.2)} y={sy(R, 3.72) - 20} text="지연 초과" px={30} weight={700} c={color.problem} at={t4 + 8} />
      <T x={sx(R, 43.6)} y={sy(R, 2.5) - 20} text="면적 · 전력 초과" px={30} weight={700} c={color.problem} align="right" at={dAt + 6} />

      {/* ── 여섯 관점 ── */}
      {VIEWS.map((v, i) => {
        const y = LIST.y0 + i * LIST.pitch;
        const isLimit = i < 3;
        const mark = isLimit ? blend(color.agent, color.human, limited) : color.agent;
        return (
          <React.Fragment key={v}>
            <div style={{ position: "absolute", left: COL.x, top: y + 13, width: 12, height: 12, backgroundColor: mark, opacity: progress(frame, viewAt[i], 10) }} />
            <T x={COL.x + 28} y={y} text={v} px={30} weight={700} at={viewAt[i]} />
            {i >= 3 ? <T x={COL.x + 226} y={y} text={VALUES[i - 3]} px={30} weight={500} c={color.agent} at={within("s10.6", 0.3) + (i - 3) * 9} /> : null}
          </React.Fragment>
        );
      })}

      {/* ── 전력 막대와 한도 ── */}
      <T x={COL.x + 28} y={PW.y0 + 36} text="전력" px={30} weight={700} at={powerAt} />
      {POWER.map((v, i) => {
        const p = progress(frame, powerAt + 4 + i * 4, 16, ease.out);
        const over = i === 3 ? outD : 0;
        const y = PW.y0 + i * PW.pitch;
        return (
          <React.Fragment key={i}>
            <T x={PW.x0 - 14} y={y - 3} text={GROUPS[i]} px={24} code weight={700} c={color.inkSoft} align="right" at={powerAt + 4 + i * 4} />
            <div style={{ position: "absolute", left: PW.x0, top: y + 4, width: Math.max(3, v * PW.per * p), height: 18, backgroundColor: blend(i === 2 ? color.agent : color.inkSoft, color.problem, over), opacity: p }} />
            <T x={PW.x0 + Math.max(3, v * PW.per) + 12} y={y - 3} text={`+${v}%`} px={24} code weight={700} c={blend(color.inkSoft, color.problem, over)} at={powerAt + 14 + i * 4} />
          </React.Fragment>
        );
      })}
      <svg {...fullSvg}>
        <line x1={PW.x0 + 6 * PW.per} x2={PW.x0 + 6 * PW.per} y1={PW.y0 - 8} y2={PW.y0 - 8 + (4 * PW.pitch + 12) * progress(frame, powerAt + 10, 16)} stroke={color.human} strokeWidth={stroke.thin} strokeDasharray="8 6" />
      </svg>
      <T x={PW.x0 + 6 * PW.per + 10} y={PW.y0 + 4 * PW.pitch - 2} text="+6%" px={26} code weight={700} c={color.human} at={powerAt + 16} />

      {/* ── 구조별 최선 ── */}
      <Table
        x={COL.x}
        y={TABLE_Y}
        w={COL.w}
        title="구조별 최선 (예시)"
        at={t4}
        rowH={44}
        cols={[{ w: 90, code: true }, { w: 170, code: true }, { w: 110, code: true }, { w: 110, code: true }, { w: 250 }]}
        head={["구조", "P99.99", "면적", "전력", "판정"]}
        rows={[
          { cells: [{ t: "A", weight: 700 }, "3.41 ms", "+0%", "+0%", { t: "지연 초과", c: color.problem, weight: 700 }], at: t4 + 8 },
          { cells: [{ t: "B", weight: 700 }, "2.27 ms", "+3%", "+1%", { t: "지연 초과", c: color.problem, weight: 700 }], at: t4 + 12 },
          { cells: [{ t: "C", weight: 700, c: color.agent }, "1.52 ms", "+14%", "+5%", { t: "통과", c: color.agent, weight: 700 }], at: within("s10.4", 0.34), mark: t6 },
          { cells: [{ t: "D", weight: 700 }, "1.38 ms", "+38%", "+14%", { t: "면적 · 전력 초과", c: color.problem, weight: 700 }], at: dAt },
        ]}
      />

      {/* ── 가중합 대신 제약과 목적 ── */}
      <T x={R.x} y={792} text="가중합: 0.4 × 지연 + 0.3 × 면적 + …" px={30} weight={500} c={color.inkDim} at={t5} strike={strike} />
      <T x={R.x} y={838} text="제약 (넘으면 탈락) | 목적 (작을수록 좋음)" px={36} weight={800} c={color.human} at={within("s10.5", 0.5)} />
    </ShiftSheet>
  );
};
