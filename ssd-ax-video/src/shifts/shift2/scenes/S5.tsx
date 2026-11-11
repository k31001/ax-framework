import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, ease, lerp, progress } from "../../../video/anim";
import { WarnIcon } from "../../../video/components/Icons";
import { Trace } from "../../../video/components/Trace";
import { color, stroke, withAlpha } from "../../../video/theme";
import { ShiftSheet, useScene } from "../../lib";
import { AXIS_X, At, Boxed, DayAxis, Glyph, Header, KVPanel, Layer, MiniLoop, T, TICK, fade } from "./kit";
import type { KVRow } from "./kit";
import { LOOP_STAGES } from "./S3";

// s5 예제 2: 11:20 실패 9건 → 원인 둘로 묶음 → 11:45 원인 가설 티켓.

const PX = 310;
const ROW_Y = 286;
const PITCH = 22;
const TOTAL = 61;
const FAILED = [4, 11, 17, 23, 30, 38, 44, 51, 57];
const IN_B = new Set([3, 7]); // FAILED 안의 순서
const A = { x: 400, y: 412 };
const B = { x: 400, y: 640 };
const A_SPOTS = [
  [0, 0],
  [28, 0],
  [-28, 0],
  [14, -24],
  [-14, -24],
  [14, 24],
  [-14, 24],
];
const B_SPOTS = [
  [-15, 0],
  [15, 0],
];

// 파형
const WX = 1344;
const CW = 68;
const CYC = 7;
const WAVES = [
  { name: "cpl_push", y: 590, lv: [0, 1, 1, 1, 1, 1, 0] },
  { name: "cpl_full", y: 660, lv: [0, 0, 0, 0, 0, 1, 1] },
];
const BUS_Y = 730;
const WH = 34;
const LATE = 4; // full 이 올라갔어야 하는 cycle

const digital = (y: number, lv: number[]): string => {
  let d = `M ${WX} ${y - (lv[0] ? WH : 0)}`;
  lv.forEach((v, i) => {
    const yy = y - (v ? WH : 0);
    if (i > 0 && lv[i - 1] !== v) d += ` V ${yy}`;
    d += ` H ${WX + (i + 1) * CW}`;
  });
  return d;
};
const bus = (): string => {
  let top = `M ${WX} ${BUS_Y - WH}`;
  let bot = `M ${WX} ${BUS_Y}`;
  for (let i = 1; i < CYC; i++) {
    const x = WX + i * CW;
    top += ` H ${x - 7} L ${x + 7} ${BUS_Y} `;
    bot += ` H ${x - 7} L ${x + 7} ${BUS_Y - WH} `;
    // 교차한 뒤 위아래가 바뀐다
    const t = top;
    top = bot;
    bot = t;
  }
  return `${top} H ${WX + CYC * CW} ${bot} H ${WX + CYC * CW}`;
};

export const S5: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue } = useScene();
  const c1 = cue("s5.1");
  const c2 = cue("s5.2");
  const c3 = cue("s5.3");
  const c4 = cue("s5.4");
  const c5 = cue("s5.5");
  const c6 = cue("s5.6");

  const outA = c5 - 8;
  const gone = 1 - progress(frame, outA, DUR.exit, ease.in);
  const failAt = c1 + 62;
  const move = progress(frame, c2 + 4, 28, ease.inOut);
  const witnessAt = c2 + 84;
  const witness = progress(frame, witnessAt, DUR.enter);
  const focusA = progress(frame, c3, 12) * (1 - progress(frame, c4, 12));
  const focusB = progress(frame, c4, 12);
  const dimA = 1 - 0.55 * focusB;
  const dimB = 1 - 0.55 * focusA;
  const waveP = progress(frame, c4 + 30, 40, ease.inOut);
  const lateP = progress(frame, c4 + 80, 16);
  const passDim = 1 - 0.7 * progress(frame, c2, 14);
  const fragAt = c5 + 76;
  const frag = fade(frame, fragAt);

  let a = 0;
  let b = 0;
  const dots = Array.from({ length: TOTAL }, (_, i) => {
    const x = PX + 8 + i * PITCH;
    const order = FAILED.indexOf(i);
    const shown = progress(frame, c1 + 8 + i * 0.5, 10);
    if (order < 0) return <circle key={i} cx={x} cy={ROW_Y} r={6} fill={color.inkSoft} opacity={0.6 * shown * passDim} />;
    const inB = IN_B.has(order);
    const spot = inB ? B_SPOTS[b++] : A_SPOTS[a++];
    const centre = inB ? B : A;
    const lead = spot[0] === (inB ? -15 : 0) && spot[1] === 0;
    const red = progress(frame, failAt + order * 2, 10);
    const cx = lerp(x, centre.x + spot[0], move);
    const cy = lerp(ROW_Y, centre.y + spot[1], move);
    return (
      <g key={i} opacity={shown * (inB ? dimB : dimA)}>
        {lead && witness > 0 ? <circle cx={cx} cy={cy} r={11 + 7 * witness} fill="none" stroke={color.ink} strokeWidth={stroke.trace} opacity={witness} /> : null}
        <circle cx={cx} cy={cy} r={6 + 4 * red + (lead ? 2 * witness : 0)} fill={red > 0 ? color.problem : color.inkSoft} opacity={0.6 + 0.4 * red} />
      </g>
    );
  });

  const ticket: KVRow[] = [
    { v: "BUG-2304  버그   상태: 초안", right: "ai-authored", tone: "agent" },
    { v: "rcv_cpl_fifo: full 직후 push 1건 유실", bold: true },
    { k: "묶음", v: "B, 2건 / 실패 9건", right: "작성: triage-agent" },
    { k: "위반", v: "a_cpl_no_drop (계약 HSI-RCV-013)" },
    { k: "가설", v: "full이 한 cycle 늦어 9번째 완료가 덮어쓴다", mark: c5 + 12 },
    { k: "재현", v: "rcv_cpl_burst_test  seed 0x5A17C3", mark: c5 + 40 },
    { k: "파형", v: "48,210~48,260 ns  cpl_push, cpl_full" },
    { k: "수정안", v: "rcv_cpl_fifo.sv:88  미적용, 승인 대기", mark: c5 + 68, markTone: "human" },
    { k: "연결", v: "VER-514 FAIL @ VER-604 · FEAT-341" },
  ];
  const FRAG_Y = 770;
  const FRAG_TICKS = [
    { x: 520, label: "D+0" },
    { x: 760, label: "D+1" },
    { x: 1000, label: "D+2" },
    { x: 1240, label: "D+3" },
    { x: 1480, label: "다음 장비 차례", sans: true },
  ];

  return (
    <ShiftSheet>
      <Header label="EXAMPLE 02" />
      <MiniLoop names={LOOP_STAGES} lit={[0, 0, c1, undefined]} />
      <DayAxis
        note="시각은 예시"
        marks={[
          { label: "10:12", y: TICK["10:12"], tone: "human" },
          { label: "10:16", y: TICK["10:16"], tone: "agent" },
          { label: "10:20", y: TICK["10:20"], tone: "agent" },
          { label: "11:20", y: TICK["11:20"], tone: "problem", at: c1 },
          { label: "11:45", y: TICK["11:45"], tone: "agent", at: c5 },
          { label: "밤", y: TICK.night, tone: "dim", sans: true },
        ]}
      />

      {/* 묶음 단계 (s5.1 ~ s5.4) */}
      <Layer opacity={gone}>
        {dots}
        {/* 묶음의 테두리 */}
        <circle cx={A.x} cy={A.y} r={62} fill="none" stroke={color.problem} strokeWidth={stroke.thin} strokeDasharray="5 6" opacity={progress(frame, c2 + 30) * dimA} />
        <circle cx={B.x} cy={B.y} r={44} fill="none" stroke={color.problem} strokeWidth={stroke.thin} strokeDasharray="5 6" opacity={progress(frame, c2 + 34) * dimB} />
        <Trace pts={[[A.x + 62, A.y], [476, A.y]]} stroke={color.lineStrong} at={c2 + 36} opacity={dimA} />
        <Trace pts={[[B.x + 44, B.y], [476, B.y]]} stroke={color.lineStrong} at={c2 + 40} opacity={dimB} />

        {/* 파형: full 이 한 cycle 늦다 */}
        {waveP > 0 ? (
          <g>
            <clipPath id="s5wave">
              <rect x={WX - 4} y={540} width={(CYC * CW + 8) * waveP} height={220} />
            </clipPath>
            <rect x={WX + LATE * CW} y={548} width={CW} height={196} fill={withAlpha(color.problem, 0.2 * lateP)} stroke={color.problem} strokeWidth={stroke.thin} opacity={lateP} />
            <g clipPath="url(#s5wave)" fill="none" strokeWidth={stroke.trace}>
              {WAVES.map((w) => (
                <path key={w.name} d={digital(w.y, w.lv)} stroke={color.inkSoft} />
              ))}
              <path d={bus()} stroke={color.inkSoft} />
            </g>
            <path
              d={`M ${WX + LATE * CW} ${WAVES[1].y} V ${WAVES[1].y - WH} H ${WX + (LATE + 1) * CW}`}
              fill="none"
              stroke={color.problem}
              strokeWidth={stroke.trace}
              strokeDasharray="6 6"
              opacity={lateP}
            />
          </g>
        ) : null}
      </Layer>

      <div style={{ opacity: gone }}>
        <T x={PX} y={206} at={c1 + 4} px={36} weight={700}>
          61건 실행 · 통과 52 · <span style={{ color: frame >= failAt ? color.problem : color.ink }}>실패 9</span>
        </T>

        <T x={492} y={A.y - 26} at={c2 + 38} px={40} weight={800} opacity={dimA}>
          A · 7건
        </T>
        <T x={492} y={B.y - 26} at={c2 + 42} px={40} weight={800} opacity={dimB}>
          B · 2건
        </T>
        {[A, B].map((g, i) => (
          <React.Fragment key={i}>
            <At x={726} y={g.y} opacity={fade(frame, witnessAt + i * 5) * (i === 0 ? dimA : dimB)}>
              <Glyph kind="wave" size={40} color={color.inkSoft} />
            </At>
            <T x={760} y={g.y - 20} at={witnessAt + i * 5} color={color.inkSoft} opacity={i === 0 ? dimA : dimB}>
              파형 포함 재실행
            </T>
          </React.Fragment>
        ))}

        {/* s5.3 */}
        <T x={492} y={A.y + 44} at={c3 + 6} weight={700} code>
          <Boxed tone="plain" fill>
            TB
          </Boxed>
        </T>
        <T x={580} y={A.y + 46} at={c3 + 12} weight={600} opacity={dimA}>
          testbench: 없어진 rcv_done을 지우는 sequence
        </T>

        {/* s5.4 */}
        <T x={492} y={B.y + 44} at={c4 + 6} weight={700} code>
          <Boxed tone="problem" fill>
            RTL
          </Boxed>
        </T>
        <T x={596} y={B.y + 46} at={c4 + 12} weight={600}>
          RTL: a_cpl_no_drop 실패
        </T>
        {[...WAVES.map((w) => ({ name: w.name, y: w.y })), { name: "wr_ptr", y: BUS_Y }].map((w, i) => (
          <T key={i} x={WX - 20} y={w.y - 34} at={c4 + 30 + i * 3} px={26} align="right" color={color.inkSoft} code>
            {w.name}
          </T>
        ))}
      </div>

      {/* s5.6 결과는 파이프라인이 Xray 에 올린다 */}
      <KVPanel
        x={PX}
        y={330}
        w={1010}
        title="XRAY · TEST EXECUTION"
        at={c6}
        out={c2 - 8}
        step={5}
        rows={[
          { v: "VER-604  Test Execution   MR !2291 선택 실행", bold: true },
          { v: "revision 9b1d7a4 · 환경 sim · 올린 계정 ci-import", tone: "dim", mark: c6 + 50, markTone: "plain" },
          { v: "run 61건을 Test 14건으로 집계" },
          { v: "PASS 12   FAIL 1   TODO 1" },
          { v: "VER-514  rcv_cpl_burst_test    FAIL", tone: "problem" },
        ]}
      />

      {/* s5.5 Jira 버그 초안 */}
      <Layer>
        <Trace pts={[[AXIS_X + 14, TICK["11:45"]], [PX, TICK["11:45"]]]} stroke={color.agent} at={c5 + 2} />
        {frag > 0 ? (
          <g opacity={frag}>
            <line x1={440} y1={FRAG_Y} x2={1700} y2={FRAG_Y} stroke={color.lineStrong} strokeWidth={stroke.thin} />
            {FRAG_TICKS.map((t, i) => (
              <line key={i} x1={t.x} y1={FRAG_Y - 10} x2={t.x} y2={FRAG_Y + 10} stroke={color.lineStrong} strokeWidth={stroke.thin} />
            ))}
          </g>
        ) : null}
        <Trace pts={[[1740, FRAG_Y - 30], [1740, TICK["11:45"]], [1334, TICK["11:45"]]]} stroke={color.problem} dash="10 9" arrow at={fragAt + 22} duration={34} easing={ease.inOut} />
      </Layer>
      <KVPanel x={PX} y={205} w={1010} title="JIRA · BUG-2304" owner="agent" at={c5 + 2} rows={ticket} keyW={130} step={2} />

      <T x={PX} y={FRAG_Y - 22} at={fragAt} color={color.inkDim}>
        <span style={{ display: "inline-block", padding: "2px 14px", border: `${stroke.hair}px dashed ${color.lineStrong}` }}>현재</span>
      </T>
      {FRAG_TICKS.map((t, i) => (
        <T key={i} x={t.x + 12} y={FRAG_Y - 52} at={fragAt + i * 2} code={!t.sans} color={color.inkDim}>
          {t.label}
        </T>
      ))}
      <At x={1740} y={FRAG_Y} opacity={fade(frame, fragAt + 12)}>
        <div style={{ backgroundColor: color.bg, padding: 4 }}>
          <WarnIcon size={44} color={color.problem} />
        </div>
      </At>
      <T x={1740} y={FRAG_Y + 32} at={fragAt + 12} align="center" weight={700} color={color.problem} code>
        timeout
      </T>
    </ShiftSheet>
  );
};
