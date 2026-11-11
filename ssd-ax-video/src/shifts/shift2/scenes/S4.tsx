import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, progress } from "../../../video/anim";
import { Source } from "../../../video/components/Text";
import { Trace } from "../../../video/components/Trace";
import { color, mono, size, stroke, withAlpha } from "../../../video/theme";
import { CodePanel, ShiftSheet, useScene } from "../../lib";
import { AXIS_X, DayAxis, Header, KVPanel, Layer, MiniLoop, T, TICK, TestGrid, fade } from "./kit";
import type { KVRow } from "./kit";
import { LOOP_STAGES } from "./S3";

// s4 예제 1: 10:12 변경 등록 → 10:16 영향 분석 댓글 → 10:20 선택 실행.

const PX = 310;
const RIGHT = 1300;

const GRAPH = {
  req: { x: 1557, y: 306, w: 204, text: "REQ-207" },
  rtl: [
    { x: 1440, y: 426, w: 172, text: "rcv_ctrl/" },
    { x: 1674, y: 426, w: 158, text: "ecc_top/" },
  ],
  fw: [
    { x: 1414, y: 546, w: 204, text: "rcv_isr.cpp" },
    { x: 1684, y: 546, w: 250, text: "rcv_driver.cpp" },
  ],
};
const BOX_H = 54;

const Node: React.FC<{ n: { x: number; y: number; w: number; text: string }; at: number; lit: number; out: number }> = ({ n, at, lit, out }) => {
  const frame = useCurrentFrame();
  const p = fade(frame, at, out);
  const on = progress(frame, lit, DUR.enter);
  if (p <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: n.x - n.w / 2,
        top: n.y - BOX_H / 2,
        width: n.w,
        height: BOX_H,
        boxSizing: "border-box",
        border: `${stroke.thin}px solid ${on > 0 ? color.agent : color.lineStrong}`,
        backgroundColor: on > 0 ? withAlpha(color.agent, 0.16 * on) : withAlpha(color.panel, 0.92),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...mono(26, 500),
        letterSpacing: "0",
        color: on > 0 ? color.ink : color.inkDim,
        opacity: p,
      }}
    >
      {n.text}
    </div>
  );
};

export const S4: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue } = useScene();
  const c1 = cue("s4.1");
  const c2 = cue("s4.2");
  const c3 = cue("s4.3");
  const c4 = cue("s4.4");
  const c5 = cue("s4.5");

  const rowAt = (i: number) => c3 + 2 + i * 25;
  const rndAt = c4 + 104;
  const graphOut = c4 - 8;
  const rows: KVRow[] = [
    { v: "[에이전트 · req-agent · 영향 분석]", right: "ai-authored", tone: "agent", at: c2 + 12 },
    { k: "변경", v: "MR !2291  rcv_done → RCV_CPL_POP", at: c2 + 24 },
    { k: "요구사항", v: "REQ-207 (REQ-QOS-07)", at: rowAt(0), mark: rowAt(0), unmark: rowAt(1) },
    { k: "계약", v: "HSI-RCV-012 (변경)  HSI-RCV-013 (신규)", at: rowAt(1), mark: rowAt(1), unmark: rowAt(2) },
    { k: "재생성", v: "rcv_ctrl_regs.sv  rcv_ctrl_regs.h", at: rowAt(2), mark: rowAt(2), unmark: rowAt(3) },
    { k: "RTL", v: "rcv_ctrl/  ecc_top/", at: rowAt(3), mark: rowAt(3), unmark: rowAt(4) },
    { k: "FW", v: "rcv_isr.cpp  rcv_driver.cpp", at: rowAt(4), mark: rowAt(4), unmark: c4 },
    { k: "테스트", v: "block 41 / 1,280   SoC 3 / 212   VP 2", at: c4 + 4, mark: c4 + 4, unmark: rndAt },
    { k: "", v: "+ 무작위 20 (선택의 편향 방지)", at: rndAt, mark: rndAt, unmark: c5, markTone: "plain" },
  ];
  const edge = (a: { x: number; y: number }, b: { x: number; y: number }): [number, number][] => [
    [a.x, a.y + BOX_H / 2],
    [a.x, (a.y + b.y) / 2],
    [b.x, (a.y + b.y) / 2],
    [b.x, b.y - BOX_H / 2],
  ];
  const graphFade = 1 - progress(frame, graphOut, 8);
  const tab = fade(frame, c2 - 6);
  const strip = progress(frame, c5, DUR.draw);

  return (
    <ShiftSheet>
      <Header label="EXAMPLE 01" />
      <MiniLoop names={LOOP_STAGES} lit={[c2, c4, undefined, undefined]} />
      <DayAxis
        note="시각은 예시"
        marks={[
          { label: "10:12", y: TICK["10:12"], tone: "human", at: c1 },
          { label: "10:16", y: TICK["10:16"], tone: "agent", at: c2 },
          { label: "10:20", y: TICK["10:20"], tone: "agent", at: c4 },
          { label: "밤", y: TICK.night, tone: "dim", sans: true },
        ]}
        span={{ y0: TICK["10:12"], y1: TICK["10:20"], at: c5 + 4 }}
      />

      <Layer>
        <Trace pts={[[AXIS_X + 14, TICK["10:12"]], [PX, TICK["10:12"]]]} stroke={color.human} at={c1 + 4} opacity={1 - progress(frame, c2 - 10, 8)} />
        <Trace pts={[[AXIS_X + 14, TICK["10:16"]], [PX, TICK["10:16"]]]} stroke={color.agent} at={c2 + 2} />
        {tab > 0 ? (
          <g opacity={tab}>
            <rect x={PX} y={205} width={950} height={46} fill={withAlpha(color.panel, 0.92)} stroke={color.line} strokeWidth={stroke.thin} />
            <rect x={PX} y={205} width={5} height={46} fill={color.human} />
          </g>
        ) : null}

        {/* 추적 그래프: 요구사항 1 → 블록 2 → FW 파일 2 */}
        <g opacity={graphFade}>
          {GRAPH.rtl.map((n, i) => (
            <Trace key={`r${i}`} pts={edge(GRAPH.req, n)} stroke={frame >= rowAt(3) ? color.agent : color.lineStrong} at={c3 + 6} />
          ))}
          {GRAPH.fw.map((n, i) => (
            <Trace key={`f${i}`} pts={edge(GRAPH.rtl[0], n)} stroke={frame >= rowAt(4) ? color.agent : color.lineStrong} at={c3 + 10} />
          ))}
        </g>

        {/* 테스트 1,280개 */}
        <TestGrid x={RIGHT} y={262} pitch={13} p={progress(frame, c4, 24)} sel={progress(frame, c4 + 40, 40)} rnd={progress(frame, rndAt, 24)} />

        {/* 근거 띠 */}
        <line x1={PX} y1={744} x2={PX + (1824 - PX) * strip} y2={744} stroke={color.line} strokeWidth={stroke.thin} />
        <line x1={640} y1={762} x2={640} y2={762 + 116 * strip} stroke={color.line} strokeWidth={stroke.hair} />
      </Layer>

      <CodePanel
        x={PX}
        y={205}
        w={1010}
        title="MR !2291 · FEAT-341 BUG-2291 · rcv_ctrl.rdl"
        owner="human"
        at={c1 + 6}
        out={c2 - 10}
        lines={[
          { text: "-  field { sw=rw; onwrite=woclr; hwset; } rcv_done[3:3];", tone: "del" },
          { text: "+  reg {", tone: "add" },
          { text: "+    field { sw=r; hw=w; swacc; } tag[7:0];", tone: "add" },
          { text: "+    field { sw=r; hw=w; }        result[9:8];", tone: "add" },
          { text: "+    field { sw=r; hw=w; }        valid[31:31];", tone: "add" },
          { text: "+  } RCV_CPL_POP @ 0x48;   // pop on read", tone: "add", mark: c1 + 70 },
        ]}
        step={5}
      />
      <T x={PX + 24} y={215} at={c2 - 6} px={size.label} weight={700} color={color.inkSoft} code>
        <span style={{ letterSpacing: "0.08em" }}>MR !2291 · FEAT-341 BUG-2291 · rcv_ctrl.rdl</span>
      </T>

      <KVPanel x={PX} y={262} w={950} title="JIRA · FEAT-341 · COMMENT" owner="agent" at={c2 + 4} rows={rows} keyW={160} />

      <Node n={GRAPH.req} at={c3 + 2} lit={rowAt(0)} out={graphOut} />
      {GRAPH.rtl.map((n, i) => (
        <Node key={i} n={n} at={c3 + 8 + i * 3} lit={rowAt(3) + i * 5} out={graphOut} />
      ))}
      {GRAPH.fw.map((n, i) => (
        <Node key={i} n={n} at={c3 + 14 + i * 3} lit={rowAt(4) + i * 5} out={graphOut} />
      ))}

      <T x={RIGHT} y={688} at={c4 + 44} px={34} weight={700} color={color.agent} code>
        41 / 1,280
      </T>
      <T x={1820} y={688} at={rndAt} px={34} weight={700} align="right" code>
        + 20
      </T>

      {/* s4.5 */}
      <T x={PX} y={758} at={c5 + 6} color={color.inkDim} code>
        10:12 ~ 10:20
      </T>
      <T x={PX} y={796} at={c5 + 10} px={64} weight={800} color={color.agent}>
        8분
      </T>
      <T x={680} y={758} at={c5 + 16} px={34} weight={600}>
        영향받는 테스트 선별의 수작업 지연
      </T>
      <T x={680} y={796} at={c5 + 22} px={64} weight={800} color={color.problem}>
        2~3일
      </T>
      <Source x={900} y={828} at={c5 + 30} text="Samsung Electronics, DVCon U.S. 2026 (저자 주장)" />
    </ShiftSheet>
  );
};
