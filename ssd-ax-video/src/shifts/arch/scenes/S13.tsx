import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, ease, lerp, progress } from "../../../video/anim";
import { HumanIcon } from "../../../video/components/Icons";
import { DimLine, Trace, Via } from "../../../video/components/Trace";
import { color, fullSvg, mono, sans, stroke, withAlpha } from "../../../video/theme";
import { CodePanel, ShiftSheet } from "../../lib";
import { Box, T, useCues, vis } from "./kitC";

// S13 RTL 설계자에게 넘어가는 것: 블록도 한 장이 아니라 꾸러미 셋(예산, 계약, 출발점).

const TX = {
  doc: "구조 문서 · 블록도 한 장",
  architect: "아키텍트",
  rtl: "RTL 설계자",
  tabs: ["블록별 예산", "interface 계약", "microarchitecture 출발점"],
  margin: "여유 0.12",
  modelMargin: "모델 오차 여유",
  judge: "판정선",
  areaSum: "면적 합 +14%",
  powerLimit: "한도 +6%",
  params: "큐 깊이 64 · soft decoder 3 · retry 최대 3",
  decide: "RTL 설계자 · FSM · datapath · pipeline 결정",
} as const;

const SEGS = [
  { name: "host · FTL", v: 0.1 },
  { name: "첫 read", v: 0.35 },
  { name: "HW retry", v: 0.51 },
  { name: "soft read", v: 0.3 },
  { name: "soft 큐", v: 0.15 },
  { name: "soft decode", v: 0.25 },
] as const;

const BUDGET_FILE = "arch/budget/BUD-RCV-001.yaml";
const BLOCKS = [
  "blocks:                     # 면적 합 +14% (예시)",
  '  rcv_ctrl:  {step_us: 2,  area: "+1%"}',
  '  soft_ldpc: {n: 3, decode_us: 250, area: "+11%"}',
  '  prio_q:    {depth: 64,   area: "+2%"}',
  'power: "+5%"                # 한도 +6%',
];
const CONTRACT = [
  "id: HSI-RCV-010          # 복구 요청 계약 (예시)",
  "jira: FEAT-338",
  "request: {tag, class: host | gc}",
  "order: host 먼저. gc는 host 4건당 1건 이상",
  "full: 큐가 차면 gc 요청부터 backpressure",
  "bound: 모든 요청은 성공 또는 실패로 한 번 종료",
  "verify: [sva:a_host_first, sva:a_gc_no_starve]",
];
const STATES = ["IDLE", "RETRY", "SOFT_RD", "SOFT_DEC", "DONE"] as const;
const JIRA = [
  { key: "FEAT-336", name: "rcv_ctrl 복구 단계 제어" },
  { key: "FEAT-338", name: "우선 큐" },
  { key: "FEAT-352", name: "soft 경로" },
] as const;

const BAR = { x: 96, y: 352, h: 72, px: 864 } as const; // px: 1 ms 의 길이
const TAB = [
  { x: 572, w: 236 },
  { x: 828, w: 290 },
  { x: 1138, w: 450 },
] as const;
const ARROW_Y = 180;
const PANEL_Y = 500;
const ST = { x: 96, y: 330, w: 180, h: 72, step: 226 } as const;
const JX = 1290;
const jiraY = (i: number): number => 330 + i * 120;
const ORDER = "hhhhghhhhg";

export const S13: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, within } = useCues();
  const t1 = cue("s13.1");
  const t2 = cue("s13.2");
  const t3 = cue("s13.3");
  const t4 = cue("s13.4");
  const t5 = cue("s13.5");
  const t6 = cue("s13.6");

  // 블록도 한 장: 잠깐 크게 보였다가 구석으로
  const shrinkAt = within("s13.1", 0.45);
  const shrink = progress(frame, shrinkAt, DUR.move, ease.inOut);
  const docIn = progress(frame, t1 - 6, DUR.enter);
  const doc = { x: lerp(190, 96, shrink), y: lerp(300, 92, shrink), s: lerp(1, 0.34, shrink) };
  const handAt = within("s13.1", 0.55);

  const tabAt = [t2, t4, t5];
  const active = frame >= t6 ? -1 : frame >= t5 ? 2 : frame >= t4 ? 1 : frame >= t2 ? 0 : -2;

  // 1부: 예산 막대와 표
  const part1 = vis(frame, t2, t4 - 8);
  const fill0 = within("s13.2", 0.4);
  const segAt = (i: number): number => fill0 + i * 9;
  let acc = 0;
  const segs = SEGS.map((s, i) => {
    const x = BAR.x + acc * BAR.px;
    acc += s.v;
    return { ...s, x, w: s.v * BAR.px, i };
  });
  const xMargin = BAR.x + 1.66 * BAR.px;
  const xJudge = BAR.x + 1.78 * BAR.px;
  const xEnd = BAR.x + 2 * BAR.px;
  const marginAt = segAt(6) + 4;
  const restAt = marginAt + 10;
  const labelY = (i: number): number => (i % 2 === 0 ? 248 : 294);
  const areaAt = t3 + 14;
  const powerAt = within("s13.3", 0.55);

  // 2부: 계약
  const part2 = vis(frame, t4, t5 - 8);
  const orderAt = within("s13.4", 0.42);
  const starveAt = within("s13.4", 0.74);
  const tokAt = (i: number): number => orderAt + 6 + i * 4;

  // 3부: 출발점
  const part3 = vis(frame, t5);
  const solid = progress(frame, t6, 18, ease.inOut);
  const stateAt = (i: number): number => within("s13.5", 0.3) + i * 5;
  const failAt = stateAt(5) + 4;
  const sx = (i: number): number => ST.x + i * ST.step;
  const stateColor = solid > 0.5 ? color.human : color.inkSoft;
  const busAt = t6 + 22;

  return (
    <ShiftSheet>
      {/* ── 블록도 한 장 ── */}
      <svg {...fullSvg}>
        <defs>
          <pattern id="c13-hatch" width={12} height={12} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1={0} y1={0} x2={0} y2={12} stroke={color.inkSoft} strokeWidth={3} />
          </pattern>
        </defs>
        <g transform={`translate(${doc.x} ${doc.y}) scale(${doc.s})`} opacity={docIn * lerp(1, 0.55, shrink)}>
          <rect x={0} y={0} width={660} height={330} fill={withAlpha(color.panel, 0.9)} stroke={color.lineStrong} strokeWidth={stroke.thin / doc.s} />
          <line x1={36} x2={300} y1={52} y2={52} stroke={color.lineStrong} strokeWidth={6} />
          <line x1={36} x2={200} y1={82} y2={82} stroke={color.line} strokeWidth={6} />
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <rect x={36 + i * 154} y={170} width={110} height={76} fill="none" stroke={color.inkDim} strokeWidth={stroke.thin / doc.s} />
              {i < 3 ? <path d={`M ${146 + i * 154} 208 H ${186 + i * 154} M ${178 + i * 154} 200 L ${190 + i * 154} 208 L ${178 + i * 154} 216`} fill="none" stroke={color.inkDim} strokeWidth={stroke.thin / doc.s} /> : null}
            </g>
          ))}
        </g>
        {/* 아키텍트 → RTL 설계자 */}
        <Trace pts={[[556, ARROW_Y], [1606, ARROW_Y]]} stroke={color.human} width={stroke.bold} arrow at={handAt} duration={26} />
      </svg>
      <T x={190} y={650} px={36} weight={600} c={color.inkDim} at={t1} out={shrinkAt - 2}>{TX.doc}</T>

      <div style={{ position: "absolute", left: 372, top: ARROW_Y - 22, display: "flex", alignItems: "center", gap: 10, opacity: progress(frame, handAt - 4, DUR.enter) }}>
        <HumanIcon size={36} color={color.human} />
        <div style={{ ...sans(32, 700), color: color.human, whiteSpace: "nowrap" }}>{TX.architect}</div>
      </div>
      <div style={{ position: "absolute", left: 1622, top: ARROW_Y - 22, display: "flex", alignItems: "center", gap: 10, opacity: progress(frame, handAt + 18, DUR.enter) }}>
        <HumanIcon size={36} color={color.human} />
        <div style={{ ...sans(32, 700), color: color.human, whiteSpace: "nowrap" }}>{TX.rtl}</div>
      </div>

      {/* 꾸러미 셋의 자리 */}
      {TAB.map((tab, i) => {
        const slot = progress(frame, handAt + 10 + i * 5, DUR.enter);
        const named = progress(frame, tabAt[i], DUR.enter);
        const on = active === i || active === -1;
        const edge = named <= 0 ? color.lineStrong : on ? color.human : color.lineStrong;
        return (
          <div key={i} style={{ position: "absolute", left: tab.x, top: 96, width: tab.w, height: 64, boxSizing: "border-box", border: `${stroke.thin}px ${named > 0 ? "solid" : "dashed"} ${edge}`, backgroundColor: withAlpha(color.panel, 0.92), display: "flex", alignItems: "center", gap: 14, padding: "0 16px", opacity: slot }}>
            <div style={{ ...mono(30, 700), color: named > 0 && on ? color.human : color.inkDim }}>{`0${i + 1}`}</div>
            <div style={{ ...sans(30, 700), color: on ? color.ink : color.inkDim, whiteSpace: "nowrap", opacity: named }}>{TX.tabs[i]}</div>
          </div>
        );
      })}

      {/* ── 1부: 01 블록별 예산 ── */}
      {part1 > 0 ? (
        <div style={{ opacity: part1 }}>
          <svg {...fullSvg}>
            {/* 2 ms 전체 */}
            <rect x={BAR.x} y={BAR.y} width={(xEnd - BAR.x) * progress(frame, t2 + 4, 22, ease.inOut)} height={BAR.h} fill={withAlpha(color.panel, 0.9)} stroke={color.lineStrong} strokeWidth={stroke.thin} />
            <DimLine from={[BAR.x, BAR.y + BAR.h + 62]} to={[xEnd, BAR.y + BAR.h + 62]} p={progress(frame, t2 + 10, 22, ease.inOut)} />
            {segs.map((s) => {
              const p = progress(frame, segAt(s.i), 12, ease.out);
              return p <= 0 ? null : (
                <g key={s.name}>
                  <rect x={s.x} y={BAR.y} width={s.w * p} height={BAR.h} fill={withAlpha(color.agent, s.i % 2 === 0 ? 0.3 : 0.18)} stroke={color.agent} strokeWidth={stroke.thin} />
                  <line x1={s.x + 1} x2={s.x + 1} y1={labelY(s.i) + 6} y2={BAR.y} stroke={color.lineStrong} strokeWidth={stroke.hair} opacity={p} />
                </g>
              );
            })}
            {/* 여유 */}
            {frame >= marginAt ? (
              <g opacity={progress(frame, marginAt, 12)}>
                <rect x={xMargin} y={BAR.y} width={xJudge - xMargin} height={BAR.h} fill="url(#c13-hatch)" opacity={0.5} />
                <rect x={xMargin} y={BAR.y} width={xJudge - xMargin} height={BAR.h} fill="none" stroke={color.inkSoft} strokeWidth={stroke.thin} />
                <line x1={xMargin + 1} x2={xMargin + 1} y1={labelY(6) + 6} y2={BAR.y} stroke={color.lineStrong} strokeWidth={stroke.hair} />
                <line x1={xJudge} x2={xJudge} y1={BAR.y - 14} y2={BAR.y + BAR.h + 30} stroke={color.human} strokeWidth={stroke.bold} />
              </g>
            ) : null}
            {frame >= restAt ? (
              <g opacity={progress(frame, restAt, 12)}>
                <rect x={xJudge + 6} y={BAR.y + 6} width={xEnd - xJudge - 12} height={BAR.h - 12} fill="none" stroke={color.inkDim} strokeWidth={stroke.thin} strokeDasharray="8 7" />
                <line x1={xJudge + 8} x2={xJudge + 8} y1={labelY(7) + 6} y2={BAR.y} stroke={color.lineStrong} strokeWidth={stroke.hair} />
              </g>
            ) : null}
          </svg>
          {segs.map((s) => (
            <React.Fragment key={s.name}>
              <T x={s.x + 12} y={labelY(s.i)} px={30} weight={600} at={segAt(s.i)}>{s.name}</T>
              <T x={s.x + s.w / 2} y={BAR.y + 18} px={28} weight={700} align="center" code c={color.ink} at={segAt(s.i) + 4}>{s.v.toFixed(2)}</T>
            </React.Fragment>
          ))}
          <T x={xMargin + 12} y={labelY(6)} px={30} weight={600} c={color.inkSoft} at={marginAt}>{TX.margin}</T>
          <T x={xJudge + 20} y={labelY(7)} px={30} weight={600} c={color.inkDim} at={restAt}>{TX.modelMargin}</T>
          <T x={xJudge - 14} y={BAR.y + BAR.h + 8} px={30} weight={700} c={color.human} align="right" at={marginAt + 4}>{`${TX.judge} 1.78 ms`}</T>
          <T x={xEnd} y={BAR.y + BAR.h + 8} px={30} weight={700} align="right" code c={color.ink} at={t2 + 16}>2 ms</T>

          <div style={{ position: "absolute", left: 120, top: PANEL_Y, height: 44, display: "flex", alignItems: "center", ...mono(22, 700), color: color.inkSoft, opacity: progress(frame, within("s13.2", 0.82), DUR.enter) * (frame >= t3 ? 0 : 1) }}>{BUDGET_FILE}</div>
          <CodePanel
            x={96}
            y={PANEL_Y}
            w={1000}
            title={BUDGET_FILE}
            px={30}
            at={t3}
            owner="human"
            lines={BLOCKS.map((text, i) => (i === 0 ? { text, tone: "dim" as const } : i === 4 ? { text, mark: powerAt, markTone: "human" as const } : { text, mark: areaAt + (i - 1) * 6, unmark: powerAt - 4 }))}
          />
          {/* 면적 · 전력 예산 */}
          <svg {...fullSvg}>
            {[
              { v: 1, at: areaAt },
              { v: 11, at: areaAt + 6 },
              { v: 2, at: areaAt + 12 },
            ].map((b, i) => {
              const x0 = 1170 + [0, 1, 12][i] * 44;
              const p = progress(frame, b.at, 14);
              return p <= 0 ? null : <rect key={i} x={x0} y={574} width={b.v * 44 * p} height={56} fill={withAlpha(color.agent, i === 1 ? 0.3 : 0.16)} stroke={color.agent} strokeWidth={stroke.thin} />;
            })}
            {frame >= powerAt ? (
              <g>
                <rect x={1170} y={722} width={5 * 44 * progress(frame, powerAt, 16)} height={56} fill={withAlpha(color.agent, 0.3)} stroke={color.agent} strokeWidth={stroke.thin} />
                <line x1={1170 + 6 * 44} x2={1170 + 6 * 44} y1={706} y2={794} stroke={color.human} strokeWidth={stroke.bold} strokeDasharray="8 6" opacity={progress(frame, powerAt + 10, 10)} />
              </g>
            ) : null}
          </svg>
          <T x={1170} y={522} px={32} weight={700} at={areaAt}>{TX.areaSum}</T>
          <T x={1170 + 44 + 220} y={585} px={28} weight={700} align="center" code c={color.ink} at={areaAt + 10}>soft_ldpc +11%</T>
          <T x={1170} y={670} px={32} weight={700} code c={color.ink} at={powerAt}>power +5%</T>
          <T x={1170 + 6 * 44 + 18} y={730} px={30} weight={700} c={color.human} at={powerAt + 10}>{TX.powerLimit}</T>
        </div>
      ) : null}

      {/* ── 2부: 02 interface 계약 ── */}
      <CodePanel
        x={96}
        y={250}
        w={1000}
        title="HSI-RCV-010"
        px={32}
        at={t4 + 4}
        out={t5 - 8}
        owner="human"
        lines={CONTRACT.map((text, i) => (i === 3 ? { text, mark: orderAt, markTone: "human" as const } : i === 6 ? { text, mark: starveAt, markTone: "human" as const } : { text }))}
      />
      {part2 > 0 ? (
        <div style={{ opacity: part2 }}>
          <svg {...fullSvg}>
            {/* 요청 두 줄 → 우선 큐 → 나가는 순서 */}
            {[0, 1, 2, 3, 4].map((i) => (
              <rect key={`h${i}`} x={1280 + i * 52} y={300} width={40} height={40} fill={withAlpha(color.ink, 0.85)} opacity={progress(frame, t4 + 20 + i * 3, 10)} />
            ))}
            {[0, 1, 2].map((i) => (
              <rect key={`g${i}`} x={1384 + i * 52} y={376} width={40} height={40} fill={withAlpha(color.agent, 0.85)} opacity={progress(frame, t4 + 30 + i * 3, 10)} />
            ))}
            <Trace pts={[[1548, 320], [1622, 320]]} stroke={color.inkSoft} arrow at={t4 + 36} />
            <Trace pts={[[1548, 396], [1622, 396]]} stroke={color.agent} arrow at={t4 + 40} />
            <Trace pts={[[1720, 432], [1720, 478], [1124, 478], [1124, 544], [1146, 544]]} stroke={color.inkSoft} arrow at={orderAt - 6} duration={24} />
            {ORDER.split("").map((k, i) => {
              const p = progress(frame, tokAt(i), 10);
              const glow = k === "g" ? progress(frame, starveAt, 12) : 0;
              const x = 1154 + i * 66;
              return p <= 0 ? null : (
                <g key={i} opacity={p}>
                  <rect x={x} y={516} width={56} height={56} fill={k === "h" ? withAlpha(color.ink, 0.85) : withAlpha(color.agent, 0.85)} />
                  {glow > 0 ? <rect x={x - 7} y={509} width={70} height={70} fill="none" stroke={color.agent} strokeWidth={stroke.bold} opacity={glow} /> : null}
                </g>
              );
            })}
            {[0, 5].map((s) => (
              <DimLine key={s} from={[1154 + s * 66, 604]} to={[1154 + s * 66 + 254, 604]} p={progress(frame, tokAt(s + 3) + 6, 14)} />
            ))}
          </svg>
          <T x={1150} y={300} px={30} weight={700} code c={color.ink} at={t4 + 18}>host</T>
          <T x={1150} y={376} px={30} weight={700} code c={color.agent} at={t4 + 28}>gc</T>
          <Box x={1626} y={284} w={188} h={148} c={color.human} at={t4 + 34}>
            <div style={{ ...mono(30, 700), color: color.ink }}>prio_q</div>
          </Box>
          {[0, 5].map((s) => (
            <React.Fragment key={s}>
              <T x={1154 + s * 66 + 127} y={614} px={28} weight={700} align="center" code c={color.ink} at={tokAt(s + 3) + 8}>host ×4</T>
              <T x={1154 + (s + 4) * 66 + 28} y={614} px={28} weight={700} align="center" code c={color.agent} at={starveAt}>gc</T>
            </React.Fragment>
          ))}
        </div>
      ) : null}

      {/* ── 3부: 03 microarchitecture 의 출발점 ── */}
      {part3 > 0 ? (
        <div style={{ opacity: part3 }}>
          <svg {...fullSvg}>
            {STATES.map((s, i) => {
              const p = progress(frame, stateAt(i), 12);
              return p <= 0 ? null : (
                <g key={s} opacity={p}>
                  <rect x={sx(i)} y={ST.y} width={ST.w} height={ST.h} fill={withAlpha(color.panel, 0.92)} stroke={stateColor} strokeWidth={lerp(stroke.thin, stroke.bold, solid)} strokeDasharray={solid > 0.5 ? undefined : "9 7"} />
                </g>
              );
            })}
            {[0, 1, 2, 3].map((i) => (
              <Trace key={i} pts={[[sx(i) + ST.w, ST.y + ST.h / 2], [sx(i + 1) - 3, ST.y + ST.h / 2]]} stroke={stateColor} dash={solid > 0.5 ? undefined : "7 6"} arrow at={stateAt(i + 1) - 2} duration={10} />
            ))}
            {/* 각 단계에서 FAIL 로 */}
            {[1, 2, 3].map((i) => (
              <Trace key={`f${i}`} pts={i === 2 ? [[sx(i) + ST.w / 2, ST.y + ST.h], [sx(2) + ST.w / 2, 517]] : [[sx(i) + ST.w / 2, ST.y + ST.h], [sx(i) + ST.w / 2, 462], [sx(2) + ST.w / 2, 462]]} stroke={color.problem} dash="7 6" arrow={i === 2} at={failAt + (i - 1) * 3} />
            ))}
            {frame >= failAt ? <rect x={sx(2)} y={520} width={ST.w} height={64} fill={withAlpha(color.panel, 0.92)} stroke={color.problem} strokeWidth={stroke.thin} strokeDasharray="9 7" opacity={progress(frame, failAt + 6, 12)} /> : null}

            {/* 세 꾸러미 → Jira 키 셋 */}
            {TAB.map((tab, i) => (
              <Trace key={`t${i}`} pts={[[tab.x + tab.w / 2, 160], [tab.x + tab.w / 2, 226], [1250, 226]]} stroke={color.agent} at={busAt + i * 3} />
            ))}
            {JIRA.map((j, i) => (
              <Trace key={j.key} pts={[[1250, 226], [1250, jiraY(i) + 46], [JX - 3, jiraY(i) + 46]]} stroke={color.agent} arrow at={busAt + 12 + i * 4} duration={20} />
            ))}
            <Via x={1250} y={226} stroke={color.agent} p={progress(frame, busAt + 10, 8)} />
          </svg>
          {STATES.map((s, i) => (
            <T key={s} x={sx(i) + ST.w / 2} y={ST.y + 18} px={28} weight={700} align="center" code c={solid > 0.5 ? color.human : color.ink} at={stateAt(i)}>{s}</T>
          ))}
          <T x={sx(2) + ST.w / 2} y={535} px={28} weight={700} align="center" code c={color.problem} at={failAt + 6}>FAIL</T>
          <T x={96} y={640} px={36} weight={600} at={within("s13.5", 0.62)}>{TX.params}</T>

          <div style={{ position: "absolute", left: 96, top: 740, display: "flex", alignItems: "center", gap: 16, opacity: progress(frame, t6 + 4, DUR.enter) }}>
            <HumanIcon size={52} color={color.human} />
            <div style={{ ...sans(36, 700), color: color.human, whiteSpace: "nowrap" }}>{TX.decide}</div>
          </div>
          {JIRA.map((j, i) => (
            <Box key={j.key} x={JX} y={jiraY(i)} w={534} h={92} c={color.agent} at={busAt + 22 + i * 4} style={{ justifyContent: "flex-start", padding: "0 22px", gap: 18 }}>
              <div style={{ ...mono(28, 700), color: color.agent }}>{j.key}</div>
              <div style={{ ...sans(30, 600), whiteSpace: "nowrap" }}>{j.name}</div>
            </Box>
          ))}
        </div>
      ) : null}
    </ShiftSheet>
  );
};
