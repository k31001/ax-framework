import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, ease, progress } from "../../../video/anim";
import { STAGES } from "../../../video/content";
import { StageTrack } from "../../../video/components/StageTrack";
import { Trace } from "../../../video/components/Trace";
import type { Pt } from "../../../video/components/Trace";
import { color, fullSvg, stroke, withAlpha } from "../../../video/theme";
import { ShiftSheet } from "../../lib";
import { At, Box, MiniReqCard, along, blend, mx, tx, useCues } from "./kitA";

// S3 요구사항이 크게 바뀐 날: 바뀐 것의 표, 이전 세대의 FW 순차 복구, soft 진입 확률의 눈금자.

const T = {
  status: "승인",
  stage: "아키텍처 설계",
  head: ["항목", "이전 세대", "이번 과제 (예시)"],
  rows: [
    ["NAND", "TLC", "차세대 QLC", 1],
    ["최대 용량", "30.72 TB", "122.88 TB", 1],
    ["Host interface", "PCIe Gen4", "PCIe Gen5", 1],
    ["전력 한도", "25 W", "25 W (그대로)", 0],
    ["read 지연 기준", "P99.99 ≤ 2 ms", "P99.99 ≤ 2 ms", 0],
    ["측정 조건", "수명 말기 없음", "수명 말기 포함", 1],
  ] as const,
  fw: "FW · 복구 제어",
  nand: "NAND interface",
  ldpc: "LDPC decoder",
  fail: "decode 실패",
  reread: "재read 명령",
  steps: ["read retry", "soft read", "soft decode"],
  trip: "FW 왕복",
  ruler: "read 1건이 soft decoding까지 갈 확률",
  gate: "P99.99의 문턱 (1만 건에 1건)",
  tlc: "TLC (예시)",
  qlc: "QLC 수명 말기 (예시)",
  big: "P99.99 = soft 경로의 지연",
} as const;

const TABLE = { x: 96, y: 206, cols: [0, 268, 520], w: 830, headH: 46, rowH: 46 } as const;
const FW = { x: 980, y: 206, w: 440, h: 60 } as const;
const NAND = { x: 950, y: 400, w: 236, h: 64 } as const;
const LDPC = { x: 1260, y: 400, w: 216, h: 64 } as const;
const UP_X = 1394;
const DOWN_X = 1046;
const STEP = { x: 1496, y: 244, pitch: 70 } as const;
const AX = { y: 716, x0: 240, x1: 1700 } as const;
const logX = (v: number): number => 960 + 660 * (Math.log10(v) + 4);

export const S3: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, within, end } = useCues();
  const c1 = cue("s3.1");
  const c2 = cue("s3.2");
  const c3 = cue("s3.3");
  const c4 = cue("s3.4");
  const c5 = cue("s3.5");
  const c7 = cue("s3.7");

  // 7단계 선: 잠깐 보였다가 위로 물러난다
  const trackIn = progress(frame, c1 + 24, 40, ease.inOut);
  const trackOut = progress(frame, c2 - 16, 12, ease.in);
  const rowAt = [c2 + 4, within("s3.2", 0.42), within("s3.2", 0.72), c3 + 4, within("s3.3", 0.4), within("s3.3", 0.62)];

  // 왕복 세 번
  const span = Math.max(30, Math.floor((end("s3.4") + 10 - (c4 + 26)) / 3));
  const tripAt = (i: number): number => c4 + 26 + i * span;
  const loop: Pt[] = [[UP_X, LDPC.y], [UP_X, FW.y + FW.h], [DOWN_X, FW.y + FW.h], [DOWN_X, NAND.y], [DOWN_X, NAND.y + 32], [LDPC.x + 108, NAND.y + 32]];
  const k = Math.floor((frame - tripAt(0)) / span);
  const dotT = frame >= tripAt(0) && k < 3 ? (frame - tripAt(k)) / (span - 4) : -1;
  const dot = dotT >= 0 && dotT <= 1 ? along(loop, dotT) : null;
  const hot = progress(frame, c7 + 6, 14);
  const flow = progress(frame, c4, 14);
  const tripC = blend(color.inkSoft, color.problem, hot);

  const gateAt = within("s3.5", 0.25);
  const tlcAt = within("s3.5", 0.5);
  const qlcAt = within("s3.6", 0.3);
  const xT = logX(2e-5);
  const xQ = logX(3e-4);

  return (
    <ShiftSheet>
      <MiniReqCard x={96} y={76} p={progress(frame, c1, DUR.enter)} status={T.status} statusP={progress(frame, c1 + 14, 12)} />

      {/* STAGE 02 / 07 */}
      {trackOut < 1 ? (
        <div style={{ position: "absolute", inset: 0, opacity: 1 - trackOut, translate: `0px ${-40 * trackOut}px` }}>
          <StageTrack stages={STAGES} position={1} y={360} appear={trackIn} />
          <At x={96} y={470} p={progress(frame, c1 + 44, DUR.enter)}>
            <div style={mx(22, 700, color.agent)}>STAGE 02 / 07</div>
            <div style={{ ...tx(72, 800), marginTop: 6 }}>{T.stage}</div>
          </At>
        </div>
      ) : null}

      {/* 바뀐 것의 표 */}
      <div style={{ position: "absolute", left: TABLE.x, top: TABLE.y, width: TABLE.w, opacity: progress(frame, c2 - 2, 12) }}>
        <div style={{ position: "relative", height: TABLE.headH, borderBottom: `${stroke.thin}px solid ${color.lineStrong}` }}>
          {T.head.map((h, i) => (
            <div key={h} style={{ position: "absolute", left: TABLE.cols[i] + 12, top: 2, ...tx(30, 600, color.inkDim) }}>
              {h}
            </div>
          ))}
        </div>
        {T.rows.map((r, i) => {
          const p = progress(frame, rowAt[i], DUR.enter);
          return (
            <div key={r[0]} style={{ position: "relative", height: TABLE.rowH, borderBottom: `${stroke.hair}px solid ${color.line}`, opacity: p, translate: `${(1 - p) * -12}px 0px` }}>
              <div style={{ position: "absolute", left: 12, top: 4, ...tx(30, 600, color.inkSoft) }}>{r[0]}</div>
              <div style={{ position: "absolute", left: TABLE.cols[1] + 12, top: 4, ...tx(30, 500, color.inkDim) }}>{r[1]}</div>
              <div style={{ position: "absolute", left: TABLE.cols[2] + 12, top: 4, ...tx(30, 700, r[3] ? color.agent : color.ink) }}>{r[2]}</div>
            </div>
          );
        })}
      </div>

      {/* 이전 세대의 복구 흐름 */}
      <Box x={FW.x} y={FW.y} w={FW.w} h={FW.h} c={color.human} dash bg={withAlpha(color.human, 0.06)} p={flow}>
        <div style={tx(32, 700, color.human)}>{T.fw}</div>
      </Box>
      <Box x={NAND.x} y={NAND.y} w={NAND.w} h={NAND.h} p={progress(frame, c4 + 4, 14)}>
        <div style={tx(30, 600)}>{T.nand}</div>
      </Box>
      <Box x={LDPC.x} y={LDPC.y} w={LDPC.w} h={LDPC.h} p={progress(frame, c4 + 8, 14)}>
        <div style={tx(30, 600)}>{T.ldpc}</div>
      </Box>
      <svg {...fullSvg}>
        <Trace pts={[[NAND.x + NAND.w, NAND.y + 32], [LDPC.x, NAND.y + 32]]} stroke={color.inkSoft} arrow at={c4 + 10} />
        <Trace pts={[[UP_X, LDPC.y], [UP_X, FW.y + FW.h]]} stroke={tripC} arrow at={c4 + 16} />
        <Trace pts={[[DOWN_X, FW.y + FW.h], [DOWN_X, NAND.y]]} stroke={tripC} arrow at={c4 + 22} />
        {dot ? <rect x={dot[0] - 8} y={dot[1] - 8} width={16} height={16} fill={k > 0 && hot > 0 ? color.problem : color.human} /> : null}
      </svg>
      <At x={DOWN_X + 18} y={290} p={progress(frame, c4 + 24, 12)} style={tx(30, 500, color.inkSoft)}>
        {T.reread}
      </At>
      <At x={UP_X - 18} y={338} right p={progress(frame, c4 + 18, 12)} style={tx(30, 500, color.inkSoft)}>
        {T.fail}
      </At>
      {/* 단계 이름과 FW 왕복 표시 */}
      {T.steps.map((s, i) => {
        const on = progress(frame, tripAt(i), 12);
        const h = i > 0 ? hot : 0;
        return (
          <React.Fragment key={s}>
            <At x={STEP.x} y={STEP.y + i * STEP.pitch} p={progress(frame, c4 + 12 + i * 4, 12)} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 10, height: 10, backgroundColor: blend(blend(color.lineStrong, color.human, on), color.problem, h) }} />
              <div style={tx(30, 700, blend(blend(color.inkDim, color.ink, on), color.problem, h))}>{s}</div>
            </At>
            <At x={1824} y={STEP.y - 2 + i * STEP.pitch} right p={progress(frame, tripAt(i) + Math.round(span * 0.45), 12)}>
              <div style={{ ...tx(26, 700, blend(color.human, color.problem, h)), border: `${stroke.thin}px solid ${blend(color.human, color.problem, h)}`, padding: "2px 9px" }}>{T.trip}</div>
            </At>
          </React.Fragment>
        );
      })}

      {/* 확률의 눈금자 (로그 축) */}
      <At x={96} y={566} p={progress(frame, c5, DUR.enter)} style={tx(30, 600, color.inkSoft)}>
        {T.ruler}
      </At>
      <svg {...fullSvg}>
        <rect x={960} y={AX.y - 34} width={(AX.x1 - 960) * hot} height={34} fill={withAlpha(color.problem, 0.22)} />
        <line x1={AX.x0} x2={AX.x0 + (AX.x1 - AX.x0) * progress(frame, c5 + 2, 24, ease.inOut)} y1={AX.y} y2={AX.y} stroke={color.inkSoft} strokeWidth={stroke.thin} />
        {[1e-5, 1e-4, 1e-3].map((v, i) => (
          <line key={v} x1={logX(v)} x2={logX(v)} y1={AX.y - 12} y2={AX.y + 12} stroke={color.inkSoft} strokeWidth={stroke.thin} opacity={progress(frame, c5 + 8 + i * 6, 10)} />
        ))}
        {[2, 3, 4, 5, 6, 7, 8, 9, 20, 30, 40, 50, 60, 70, 80, 90].map((m) => (
          <line key={m} x1={logX(m * 1e-5)} x2={logX(m * 1e-5)} y1={AX.y - 6} y2={AX.y} stroke={color.lineStrong} strokeWidth={stroke.hair} opacity={progress(frame, c5 + 12, 14)} />
        ))}
        <Trace pts={[[960, AX.y + 30], [960, 646]]} stroke={blend(color.ink, color.problem, hot)} width={stroke.thin} dash="7 7" at={gateAt} />
        <circle cx={xT} cy={AX.y} r={11 * progress(frame, tlcAt, 12)} fill={color.ink} />
        <circle cx={xQ} cy={AX.y} r={12 * progress(frame, qlcAt, 12)} fill={color.problem} />
        <Trace pts={[[xT, AX.y + 20], [xT, AX.y + 34], [xQ, AX.y + 34], [xQ, AX.y + 18]]} stroke={color.problem} width={stroke.thin} arrow at={qlcAt + 4} duration={24} easing={ease.inOut} />
      </svg>
      {["1e-5", "1e-4", "1e-3"].map((s, i) => (
        <At key={s} x={logX(10 ** (i - 5))} y={AX.y + 44} center p={progress(frame, c5 + 8 + i * 6, 10)} style={mx(26, 600, color.inkSoft)}>
          {s}
        </At>
      ))}
      <At x={960} y={600} center p={progress(frame, gateAt + 6, DUR.enter)} style={tx(30, 700, blend(color.ink, color.problem, hot))}>
        {T.gate}
      </At>
      <At x={xT} y={AX.y - 62} center p={progress(frame, tlcAt + 4, DUR.enter)} style={tx(30, 700)}>
        {T.tlc}
      </At>
      <At x={xQ} y={AX.y - 66} center p={progress(frame, qlcAt + 4, DUR.enter)} style={tx(30, 700, color.problem)}>
        {T.qlc}
      </At>
      <At x={AX.x1} y={AX.y + 86} right p={progress(frame, within("s3.7", 0.3), 16)} style={tx(56, 800, color.problem)}>
        {T.big}
      </At>
    </ShiftSheet>
  );
};
