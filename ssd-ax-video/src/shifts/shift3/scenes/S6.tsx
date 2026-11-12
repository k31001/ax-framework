import React from "react";
import { useCurrentFrame } from "remotion";
import { ease, enter, enterExit, progress } from "../../../video/anim";
import { AgentIcon, HumanIcon } from "../../../video/components/Icons";
import { Trace } from "../../../video/components/Trace";
import { color, fullSvg, mono, sans, size, stroke, withAlpha } from "../../../video/theme";
import { ShiftSheet, useScene } from "../../lib";
import { CodeRow, HEAD, LockIcon, Pane, Stamp, StatusChip, Steps, Tag, mix, paneH, split } from "./kit";

// s6 예제 ③: RTL 설계자의 작업 지시와 증거. (docs/06-architecture-exploration.md 5.7, 6장의 soft 경로)
//   [1] 작업 지시
//   s6.1  블록도 한 장(흐림, 사선) → 예산 BUD-RCV-001 · 계약 HSI-RCV-010
//   s6.2  호박색 지시서 tasks/RTL-RCV-021.yaml: uarch 구역
//   s6.3  invariant 구역 → pass · forbid · stop
//   s6.4  Jira 설계 기능 FEAT-352 를 rtl-agent 에 할당 → 구현 중
//   [2] 실행과 증거
//   s6.5  RTL 생성 → lint → CDC → formal → 합성 (반복) · 검토 대기까지
//   s6.6  증거 묶음(formal 두 줄) + 예산 대비 표
//   s6.7  흐린 RTL diff 에서 CDC · reset · 큐 경계만 밝다
//   [3] 예산 초과와 구조 변경 요청
//   s6.8  표에 ECC 블록 면적 +17% (예산 +15%) 가 붉게
//   s6.9  Jira 댓글: 구조 변경 요청 · soft decoder 3기 → 2기
//   s6.10 구조 모델 재실행 1.74 ms → 표와 막대가 예산 안으로 → ADR 개정
//   s6.11 예산 · 계약 → RTL 설계자(지키는 방법과 책임) → rtl-agent → 증거로 판단

const PX = 30;
const LEFT = { x: 96, w: 940 };
const RIGHT = { x: 1068, w: 756 };
const TOP = 164;

const TITLE = "RTL 설계자 · soft 경로 (예시)";
const OLD_DOC = "구조 문서 · 블록도 한 장";

const BUDGET = ["tail_path_ms:", "  soft_queue: 0.15", "  soft_decode: 0.25"];
const CONTRACT = ["order: host 먼저. gc는 host 4건당 1건 이상", "verify: [sva:a_host_first, sva:a_gc_no_starve]"];

const YAML = [
  "task: RTL-RCV-021   jira: FEAT-352   # 예시",
  "inputs: [BUD-RCV-001, HSI-RCV-010]",
  "intent: soft 경로는 host 우선, 예산 안에서 처리",
  "uarch:                   # 설계자가 정함",
  "  - 상태: IDLE·RETRY·SOFT_RD·SOFT_DEC·DONE",
  "  - 큐 깊이 64 · decoder 앞 pipeline 1단",
  "invariant:",
  "  - host 요청이 gc 요청보다 먼저",
  "  - gc는 host 4건당 1건 이상 (기아 없음)",
  "pass: formal 증명, 계약 assertion, 예산 표",
  "forbid: 예산, 계약, sva/ 완화, 신규 waiver",
  "stop: 예산을 못 지키면 멈추고 보고",
];

const LOOP = ["RTL 생성", "lint", "CDC", "formal", "합성"];
const LOOP_BOX = { x: 330, y: 172, w: 150, h: 64, gap: 28 };

const EVIDENCE = [
  "task: RTL-RCV-021  rtl: 8d2e5b7      # 예시",
  "lint:    신규 경고 0",
  "cdc:     신규 경고 0 · 신규 waiver 0",
  "formal:  a_host_first     proven",
  "         a_gc_no_starve   proven",
  "changed: rtl/soft_path/ 만 변경. 금지 경로 0건",
  'agent:   "구현 완료"   # 판정 근거 아님',
];
const EVI = { x: 96, y: 300, w: 880 };

const TABLE = { x: 1008, y: 300, w: 816, rowH: 46 };
const COLS = [24, 380, 536, 700];
const TABLE_HEAD = ["항목", "예산", "측정", "판정"];
const TABLE_ROWS = [
  ["rcv_ctrl 단계 전환", "2 µs", "1.4 µs", "통과"],
  ["soft decode (최대)", "250 µs", "236 µs", "통과"],
  ["timing slack", "≥ 0 ns", "+0.06 ns", "통과"],
];
const ECC = { name: "ECC 블록 면적", budget: "+15%", over: "+17%", fixed: "+13%", fail: "초과", pass: "통과" };
const TABLE_H = HEAD + 16 + 5 * TABLE.rowH + 14;

const DIFF = { x: 1008, y: TABLE.y + TABLE_H + 20, w: 816, h: 252 };
const RISKS = ["CDC", "reset", "큐 경계"];
const DIFF_BARS = [300, 380, 340, 220, 260, 400, 360, 180, 310, 390, 350, 240];

const GAUGE = { x: 1032, y: DIFF.y + 20, perPct: 34 };

const COMMENT = ["RTL 설계자  [구조 변경 요청]      (예시)", "ECC 블록 면적 +17% (예산 +15%)", "soft_dec 3 → 2 검토 요청"];
const RERUN = ["구조 모델 재실행: soft_dec 3 → 2", "  host P99.99 1.74 ms (판정선 1.78) · 통과", "  ECC 블록 면적 +13%"];
const DEC_LABEL = "soft decoder";
const ADR = "아키텍트 · ADR-RCV-003 개정 2 승인";

const END_BOXES = [
  { head: "예산 · 계약", sub: "", w: 300, c: color.human, strong: false },
  { head: "RTL 설계자", sub: "지키는 방법과 책임", w: 520, c: color.human, strong: true },
  { head: "rtl-agent", sub: "실행", w: 300, c: color.agent, strong: false },
  { head: "증거로 판단", sub: "", w: 320, c: color.human, strong: false },
];

/** '#' 뒤는 흐린 주석으로 */
const Code: React.FC<{ text: string }> = ({ text }) => {
  const [code, note] = text.split("#");
  return (
    <>
      {code}
      {note !== undefined ? <span style={{ color: color.inkDim }}>{`#${note}`}</span> : null}
    </>
  );
};

export const S6: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, end } = useScene();
  const c = (n: number): number => cue(`s6.${n}`);
  const e = (n: number): number => end(`s6.${n}`);
  const [c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(c);

  // ── [1] 작업 지시 ──
  const outA = c5 - 12;
  const budgetAt = split(c1, e(1), 2, 5);
  const contractAt = split(c1, e(1), 7, 10);
  const uarchAt = split(c2, e(2), 1, 4);
  const restAt = split(c3, e(3), 7, 10);
  const show = [c2 + 10, c2 + 14, c2 + 18, uarchAt, uarchAt + 8, split(c2, e(2), 3, 5), c3, split(c3, e(3), 1, 3), split(c3, e(3), 5, 9), restAt, restAt + 6, restAt + 12];
  const band = (i: number): number => {
    const on = (a: number, b: number): number => progress(frame, a, 10, ease.out) * (1 - progress(frame, b, 10, ease.in));
    if (i >= 3 && i <= 5) return on(uarchAt, c3 - 8);
    if (i >= 6 && i <= 8) return on(c3, restAt - 4);
    return 0;
  };
  const assign = split(c4, e(4), 1, 2);
  const assigned = progress(frame, assign, 12, ease.out);
  const budgetH = paneH(BUDGET.length, 26);
  const contractY = TOP + budgetH + 16;
  const issueY = contractY + paneH(CONTRACT.length, 26) + 16;
  const issueH = paneH(4, 26);

  const outC = c11 - 10;

  // ── [2] 실행과 증거 ──
  const outLoop = outC;
  const loopLit = (i: number): number => progress(frame, split(c5, e(5), i + 1, 7), 10, ease.out);
  const loopBack = split(c5, e(5), 6, 7);
  const cycling = frame >= loopBack + 14 && frame < c6 - 4 ? Math.floor((frame - loopBack - 14) / 7) % LOOP.length : -1;
  const reviewAt = e(5) - 8;
  const tableAt = split(c6, e(6), 1, 2);
  const formalBand = progress(frame, split(c6, e(6), 1, 6), 10, ease.out) * (1 - progress(frame, c7 - 8, 10, ease.in));
  const riskAt = [split(c7, e(7), 3, 8), split(c7, e(7), 5, 8), split(c7, e(7), 13, 16)];

  // ── [3] 예산 초과와 구조 변경 요청 ──
  const over = progress(frame, c8 + 4, 14, ease.out);
  const fixAt = split(c10, e(10), 2, 5);
  const fixed = progress(frame, fixAt, 18, ease.inOut);
  const adrAt = split(c10, e(10), 3, 5);
  const dropAt = split(c9, e(9), 3, 5);
  const dropped = progress(frame, dropAt, 14, ease.inOut);
  const eccColor = mix(fixed, color.problem, color.agent);
  const pct = 17 - 4 * fixed;
  const gone = progress(frame, outC, 8, ease.in);

  const loopX = (i: number): number => LOOP_BOX.x + i * (LOOP_BOX.w + LOOP_BOX.gap);
  const endTotal = END_BOXES.reduce((s, b) => s + b.w, 0) + 56 * (END_BOXES.length - 1);
  let endX = (1920 - endTotal) / 2;

  return (
    <ShiftSheet>
      <Steps
        activeAt={[
          { index: 0, at: 0 },
          { index: 1, at: c5 },
          { index: 2, at: c6 },
        ]}
      />
      <Tag text={TITLE} c={color.inkSoft} x={96} y={80} at={c1 - 10} out={outC} dashed />

      {/* s6.1: 블록도 한 장이 아니다 */}
      <div style={{ position: "absolute", left: 160, top: 250, width: 720, height: 420, ...enterExit(frame, c1 - 6, c2 - 12) }}>
        <svg width={720} height={420} style={{ opacity: 0.7 }}>
          <rect x={1} y={1} width={718} height={418} fill={withAlpha(color.panel, 0.6)} stroke={color.lineStrong} strokeWidth={stroke.thin} strokeDasharray="8 8" />
          {[
            [70, 120],
            [410, 120],
            [70, 270],
            [410, 270],
          ].map(([x, y], i) => (
            <rect key={i} x={x} y={y} width={240} height={90} fill="none" stroke={color.lineStrong} strokeWidth={stroke.thin} />
          ))}
          <path d="M 310 165 H 410 M 190 210 V 270 M 530 210 V 270 M 310 315 H 410" fill="none" stroke={color.lineStrong} strokeWidth={stroke.thin} />
          <line x1={40} y1={390} x2={40 + 640 * progress(frame, split(c1, e(1), 1, 4), 14, ease.out)} y2={70} stroke={color.problem} strokeWidth={stroke.bold} />
        </svg>
        <div style={{ position: "absolute", left: 28, top: 22, ...sans(size.small, 700), color: color.inkDim }}>{OLD_DOC}</div>
      </div>

      {/* s6.1: 받는 것 = 예산과 계약 */}
      <div style={{ position: "absolute", left: RIGHT.x, top: 134, ...mono(size.label, 700), color: color.inkDim, ...enterExit(frame, budgetAt, outA) }}>FROM ARCH</div>
      <Pane x={RIGHT.x} y={TOP} w={RIGHT.w} h={budgetH} title="arch/budget/BUD-RCV-001.yaml" edge={color.human} border={withAlpha(color.human, 0.55)} at={budgetAt} out={outA}>
        {BUDGET.map((l, i) => (
          <CodeRow key={i} i={i} px={26} o={progress(frame, budgetAt + 8 + i * 4, 10)}>
            {l}
          </CodeRow>
        ))}
      </Pane>
      <Pane x={RIGHT.x} y={contractY} w={RIGHT.w} h={paneH(CONTRACT.length, 26)} title="arch/hsi/HSI-RCV-010.yaml" edge={color.human} border={withAlpha(color.human, 0.55)} at={contractAt} out={outA}>
        {CONTRACT.map((l, i) => (
          <CodeRow key={i} i={i} px={26} o={progress(frame, contractAt + 8 + i * 4, 10)}>
            {l}
          </CodeRow>
        ))}
      </Pane>

      {/* s6.2 ~ s6.3: 작업 지시서 */}
      <Pane x={LEFT.x} y={TOP} w={LEFT.w} h={paneH(YAML.length, PX)} title="tasks/RTL-RCV-021.yaml" edge={color.human} border={withAlpha(color.human, 0.55)} at={c2} out={outA}>
        {YAML.map((l, i) => (
          <CodeRow key={i} i={i} px={PX} c={i === 11 ? color.human : color.ink} o={progress(frame, show[i], 10)} mark={band(i)} markColor={color.human}>
            <Code text={l} />
            {i === 10 ? (
              <span style={{ display: "inline-block", verticalAlign: "middle", marginLeft: 20, marginTop: -6, opacity: progress(frame, show[i] + 8, 12) }}>
                <LockIcon size={36} color={color.human} />
              </span>
            ) : null}
          </CodeRow>
        ))}
      </Pane>

      {/* s6.4: Jira 설계 기능 이슈를 에이전트 계정에 할당 */}
      <Pane x={RIGHT.x} y={issueY} w={RIGHT.w} h={issueH} title="JIRA · 설계 기능" edge={color.human} border={withAlpha(color.human, 0.55)} at={c4} out={outA}>
        <CodeRow i={0} px={26} o={progress(frame, c4 + 6, 10)}>
          <span style={{ fontWeight: 700 }}>FEAT-352</span>
        </CodeRow>
        <CodeRow i={1} px={26} o={progress(frame, c4 + 10, 10)}>
          soft 경로
        </CodeRow>
        <CodeRow i={2} px={26} c={color.inkSoft} o={progress(frame, c4 + 14, 10)} mark={assigned} markColor={color.human}>
          {"담당: "}
          <span style={{ color: color.agent, fontWeight: 700, opacity: assigned }}>rtl-agent</span>
        </CodeRow>
        <CodeRow i={3} px={26} c={color.inkSoft} o={progress(frame, c4 + 18, 10)}>
          지시서: tasks/RTL-RCV-021.yaml
        </CodeRow>
        <div style={{ position: "absolute", right: 16, top: 56, opacity: progress(frame, c4 + 6, 10) }}>
          <StatusChip text={assigned > 0.5 ? "구현 중" : "정의 중"} c={mix(assigned, color.inkDim, color.human)} />
        </div>
      </Pane>
      {frame < outA + 10 ? (
        <>
          <svg {...fullSvg} opacity={1 - progress(frame, outA, 8)}>
            <Trace pts={[[RIGHT.x + 110, issueY + issueH], [RIGHT.x + 110, issueY + issueH + 50], [RIGHT.x + 176, issueY + issueH + 50]]} stroke={color.agent} width={stroke.bold} arrow at={assign + 8} duration={18} />
          </svg>
          <div style={{ position: "absolute", left: RIGHT.x + 190, top: issueY + issueH + 14, display: "flex", alignItems: "center", gap: 16, ...enterExit(frame, assign + 20, outA, { from: "right" }) }}>
            <AgentIcon size={72} color={color.agent} />
            <div style={{ ...mono(size.small, 700), color: color.agent }}>rtl-agent</div>
          </div>
        </>
      ) : null}

      {/* s6.5: 에이전트의 반복 */}
      <div style={{ position: "absolute", left: 96, top: 168, display: "flex", alignItems: "center", gap: 14, ...enterExit(frame, c5, outLoop) }}>
        <AgentIcon size={72} color={color.agent} />
        <div style={{ ...mono(26, 700), color: color.agent }}>rtl-agent</div>
      </div>
      {LOOP.map((word, i) => {
        const lit = loopLit(i);
        const hot = cycling === i ? 1 : 0;
        return (
          <div
            key={word}
            style={{
              position: "absolute",
              left: loopX(i),
              top: LOOP_BOX.y,
              width: LOOP_BOX.w,
              height: LOOP_BOX.h,
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `${stroke.thin}px solid ${mix(lit, color.lineStrong, color.agent)}`,
              backgroundColor: withAlpha(color.agent, 0.1 * lit + 0.22 * hot),
              ...sans(size.small, 700),
              color: mix(lit, color.inkDim, color.agent),
              whiteSpace: "nowrap",
              ...enterExit(frame, c5 + 4 + i * 3, outLoop),
            }}
          >
            {word}
          </div>
        );
      })}
      {frame >= c5 && frame < outLoop + 10 ? (
        <svg {...fullSvg} opacity={1 - progress(frame, outLoop, 8)}>
          {LOOP.slice(1).map((_, i) => (
            <Trace key={i} pts={[[loopX(i) + LOOP_BOX.w + 3, LOOP_BOX.y + LOOP_BOX.h / 2], [loopX(i + 1) - 4, LOOP_BOX.y + LOOP_BOX.h / 2]]} stroke={color.agent} arrow at={split(c5, e(5), i + 2, 7) - 6} duration={10} />
          ))}
          <Trace
            pts={[
              [loopX(4) + LOOP_BOX.w / 2, LOOP_BOX.y + LOOP_BOX.h + 3],
              [loopX(4) + LOOP_BOX.w / 2, LOOP_BOX.y + LOOP_BOX.h + 26],
              [loopX(0) + LOOP_BOX.w / 2, LOOP_BOX.y + LOOP_BOX.h + 26],
              [loopX(0) + LOOP_BOX.w / 2, LOOP_BOX.y + LOOP_BOX.h + 5],
            ]}
            stroke={color.agent}
            dash="10 8"
            arrow
            at={loopBack}
            duration={22}
          />
        </svg>
      ) : null}
      {/* Jira 상태 띠: 에이전트는 검토 대기까지 */}
      <div style={{ position: "absolute", left: 1290, top: 138, ...enterExit(frame, split(c5, e(5), 1, 2), outC) }}>
        <div style={{ ...mono(size.label, 700), color: color.inkDim, marginBottom: 8 }}>JIRA · FEAT-352 · WORKFLOW</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <StatusChip text="구현 중" c={color.human} />
          <div style={{ width: 24, height: 2, backgroundColor: color.lineStrong }} />
          <StatusChip text="검토 대기" c={color.agent} lit={progress(frame, reviewAt, 12, ease.out)} />
          <div style={{ width: 10, height: 2, backgroundColor: color.lineStrong }} />
          <LockIcon size={34} color={color.inkDim} />
          <div style={{ width: 10, height: 2, backgroundColor: color.lineStrong }} />
          <StatusChip text="승인" c={color.human} lit={0} />
        </div>
      </div>

      {/* s6.6: 증거 묶음 */}
      <Pane x={EVI.x} y={EVI.y} w={EVI.w} h={paneH(EVIDENCE.length, 28)} title="evidence/RTL-RCV-021/summary.yaml" edge={color.agent} border={withAlpha(color.agent, 0.55)} at={c6} out={c9 - 10}>
        {EVIDENCE.map((l, i) => (
          <CodeRow key={i} i={i} px={28} c={i === 6 ? color.inkDim : i === 3 || i === 4 ? mix(formalBand, color.ink, color.agent) : color.ink} o={progress(frame, c6 + 8 + i * 4, 10)} mark={i === 3 || i === 4 ? formalBand : 0}>
            <Code text={l} />
          </CodeRow>
        ))}
      </Pane>
      <Tag text="출처: tool 출력" c={color.agent} x={EVI.x + EVI.w - 14} y={EVI.y + 1} right at={c6 + 10} out={c9 - 10} px={26} fill />

      {/* s6.6 ~ s6.10: 예산 대비 표 */}
      <Pane x={TABLE.x} y={TABLE.y} w={TABLE.w} h={TABLE_H} title="MR !2207 · FEAT-352 soft 경로 · 예산 검사 (예시)" edge={mix(over, color.agent, eccColor)} border={mix(over, withAlpha(color.agent, 0.55), eccColor)} at={tableAt} out={outC}>
        {[TABLE_HEAD, ...TABLE_ROWS].map((row, r) => (
          <div key={r} style={{ position: "absolute", left: 0, right: 0, top: HEAD + 16 + r * TABLE.rowH, height: TABLE.rowH, opacity: progress(frame, tableAt + 8 + r * 5, 10) }}>
            {row.map((cell, k) => (
              <div key={k} style={{ position: "absolute", left: COLS[k], top: 0, lineHeight: `${TABLE.rowH}px`, ...mono(28, r === 0 ? 700 : 500), letterSpacing: "0", color: r === 0 ? color.inkDim : k === 3 ? color.agent : color.ink }}>
                {cell}
              </div>
            ))}
          </div>
        ))}
        {over > 0 ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: HEAD + 16 + 4 * TABLE.rowH, height: TABLE.rowH, opacity: over }}>
            <div style={{ position: "absolute", left: 6, right: 2, top: 1, bottom: 1, backgroundColor: eccColor, opacity: 0.16 }} />
            <div style={{ position: "absolute", left: 6, top: 1, bottom: 1, width: 3, backgroundColor: eccColor }} />
            {[ECC.name, ECC.budget, fixed > 0.5 ? ECC.fixed : ECC.over, fixed > 0.5 ? ECC.pass : ECC.fail].map((cell, k) => (
              <div key={k} style={{ position: "absolute", left: COLS[k], top: 0, lineHeight: `${TABLE.rowH}px`, ...mono(28, k >= 2 ? 700 : 500), letterSpacing: "0", color: k >= 2 ? eccColor : color.ink }}>
                {cell}
              </div>
            ))}
          </div>
        ) : null}
      </Pane>

      {/* s6.7: 전부 읽는 대신 위험한 곳 */}
      <Pane x={DIFF.x} y={DIFF.y} w={DIFF.w} h={DIFF.h} title="rtl/soft_path/ · diff" at={c7} out={c8 - 10}>
        {DIFF_BARS.map((w, i) => {
          const g = i % 4 === 1 || i % 4 === 2 ? Math.floor(i / 4) : -1;
          const lit = g < 0 ? 0 : progress(frame, riskAt[g], 12, ease.out);
          return <div key={i} style={{ position: "absolute", left: 60, top: 56 + i * 16, width: w, height: 7, backgroundColor: mix(lit, color.line, color.human), opacity: progress(frame, c7 + 6 + i, 8) }} />;
        })}
        {RISKS.map((r, g) => {
          const lit = progress(frame, riskAt[g], 12, ease.out);
          const y = 52 + 16 * (4 * g + 1.5) - 22;
          return (
            <React.Fragment key={r}>
              <div style={{ position: "absolute", left: 44, top: y + 2, width: 440, height: 44, boxSizing: "border-box", border: `${stroke.thin}px solid ${color.human}`, opacity: lit }} />
              <div style={{ position: "absolute", left: 20, top: y + 16, width: 14, height: 14, borderRadius: 7, backgroundColor: color.human, opacity: lit }} />
              <div style={{ position: "absolute", left: 520, top: y, height: 48, display: "flex", alignItems: "center", ...sans(size.small, 800), color: color.human, whiteSpace: "nowrap", ...enter(frame, riskAt[g], { from: "right" }) }}>{r}</div>
            </React.Fragment>
          );
        })}
      </Pane>

      {/* s6.8: 예산선을 넘은 막대 → s6.10: 예산 안으로 */}
      {frame >= c8 ? (
        <div style={{ position: "absolute", left: GAUGE.x, top: GAUGE.y, width: 780, height: 150, opacity: over * (1 - gone) }}>
          <div style={{ position: "absolute", left: 0, top: 0, ...sans(size.small, 700), color: color.inkSoft, whiteSpace: "nowrap" }}>{ECC.name}</div>
          <div style={{ position: "absolute", left: 0, top: 62, width: 20 * GAUGE.perPct, height: 36, boxSizing: "border-box", border: `${stroke.hair}px solid ${color.lineStrong}` }} />
          <div style={{ position: "absolute", left: 0, top: 62, width: pct * GAUGE.perPct * over, height: 36, backgroundColor: eccColor, opacity: 0.85 }} />
          <div style={{ position: "absolute", left: 15 * GAUGE.perPct - 2, top: 46, width: 4, height: 68, backgroundColor: color.human }} />
          <div style={{ position: "absolute", left: 15 * GAUGE.perPct - 120, top: 4, width: 240, textAlign: "center", ...mono(size.small, 700), color: color.human }}>{`예산 ${ECC.budget}`}</div>
          <div style={{ position: "absolute", left: pct * GAUGE.perPct - 110, top: 116, width: 110, textAlign: "right", ...mono(size.body, 700), color: eccColor }}>{fixed > 0.5 ? ECC.fixed : ECC.over}</div>
        </div>
      ) : null}

      {/* s6.9: 구조 변경 요청 */}
      <Pane x={EVI.x} y={EVI.y} w={EVI.w} h={paneH(COMMENT.length, 28)} title="JIRA · FEAT-330 · 댓글" edge={color.human} border={withAlpha(color.human, 0.55)} at={c9} out={outC}>
        {COMMENT.map((l, i) => (
          <CodeRow key={i} i={i} px={28} c={i === 0 ? color.human : color.ink} o={progress(frame, c9 + 8 + i * 6, 10)} mark={i === 2 ? progress(frame, dropAt - 8, 10) : 0} markColor={color.human}>
            {l}
          </CodeRow>
        ))}
      </Pane>
      <div style={{ position: "absolute", left: EVI.x, top: EVI.y + paneH(COMMENT.length, 28) + 22, height: 72, display: "flex", alignItems: "center", gap: 20, ...enterExit(frame, split(c9, e(9), 2, 5), outC) }}>
        <div style={{ ...sans(size.small, 700), color: color.inkSoft, whiteSpace: "nowrap", marginRight: 8 }}>{DEC_LABEL}</div>
        {[1, 2, 3].map((n) => {
          const off = n === 3 ? dropped : 0;
          return (
            <div
              key={n}
              style={{
                width: 150,
                height: 72,
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `${stroke.thin}px ${off > 0.5 ? "dashed" : "solid"} ${mix(off, color.inkSoft, color.lineStrong)}`,
                backgroundColor: withAlpha(color.panel, 0.9),
                ...mono(26, 700),
                color: mix(off, color.ink, color.inkDim),
                opacity: 1 - 0.55 * off,
              }}
            >
              {`DEC ${n}`}
            </div>
          );
        })}
        <div style={{ ...mono(size.body, 700), color: color.human, marginLeft: 12, opacity: dropped }}>3 → 2</div>
      </div>

      {/* s6.10: 구조 모델 재실행 → 결정 기록 개정 */}
      <Pane x={EVI.x} y={EVI.y + paneH(COMMENT.length, 28) + 116} w={EVI.w} h={paneH(RERUN.length, 28)} title="FEAT-330 · arch-agent" edge={color.agent} border={withAlpha(color.agent, 0.55)} at={c10} out={outC}>
        {RERUN.map((l, i) => (
          <CodeRow key={i} i={i} px={28} c={i === 1 ? color.agent : color.ink} o={progress(frame, c10 + 8 + i * 6, 10)} mark={i === 1 ? progress(frame, split(c10, e(10), 1, 5), 10) : 0}>
            {l}
          </CodeRow>
        ))}
      </Pane>
      <Stamp text={ADR} c={color.human} x={1080} y={GAUGE.y + 168} at={adrAt} out={outC} px={36} rotate={-2} />

      {/* s6.11: 지키는 방법과 책임 */}
      {frame >= c11 - 4 ? (
        <>
          {END_BOXES.map((b, i) => {
            const x = endX;
            endX += b.w + 56;
            const at = c11 + i * 6;
            return (
              <React.Fragment key={b.head}>
                {i > 0 ? (
                  <svg {...fullSvg}>
                    <Trace pts={[[x - 52, 470], [x - 6, 470]]} stroke={color.inkSoft} width={stroke.bold} arrow at={at - 4} duration={10} />
                  </svg>
                ) : null}
                <div
                  style={{
                    position: "absolute",
                    left: x,
                    top: 380,
                    width: b.w,
                    height: 180,
                    boxSizing: "border-box",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 20,
                    border: `${b.strong ? stroke.bold : stroke.thin}px solid ${b.strong ? b.c : withAlpha(b.c, 0.6)}`,
                    backgroundColor: b.strong ? withAlpha(b.c, 0.2) : withAlpha(color.panel, 0.9),
                    ...enter(frame, at),
                  }}
                >
                  {b.strong ? <HumanIcon size={84} color={b.c} /> : null}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: b.strong ? "flex-start" : "center", gap: 6 }}>
                    <div style={{ ...(b.head === "rtl-agent" ? mono(size.body, 700) : sans(b.strong ? size.sub : size.body, 800)), color: b.strong ? color.ink : b.c, whiteSpace: "nowrap" }}>{b.head}</div>
                    {b.sub ? <div style={{ ...sans(size.small, 700), color: b.c, whiteSpace: "nowrap" }}>{b.sub}</div> : null}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </>
      ) : null}
    </ShiftSheet>
  );
};
