import React from "react";
import type { CSSProperties } from "react";
import { useCurrentFrame } from "remotion";
import { clamp01, lerp, progress } from "../../../video/anim";
import { CARD } from "../../../video/content";
import { Trace } from "../../../video/components/Trace";
import type { Pt } from "../../../video/components/Trace";
import { color, mono, sans, stroke, withAlpha } from "../../../video/theme";
import { useScene } from "../../lib";

// 구조 설계 편 s1~s6 (갑) 의 부품.
//   useCues            cue/end 에 더해 문장 안의 한 지점(0~1)의 프레임
//   Box · tx           테두리 상자, 글자 스타일
//   MiniReqCard        본편 요구사항 카드의 작은 판 (REQ-QOS-07 · REQ-207)
//   BlockRow           상자 넷이 한 줄로 이어진 작은 블록도 (s1, s2)
//   TrackRow           타임라인 한 줄 (s1.4, s4, s5 의 두 경로)
//   CandidateDiagram   후보 구조 A~D 블록도. s6 이 기준 그림이고 s4, s11, s17 에서 다시 쓸 수 있다

/** cue/end 에 더해, 문장 안의 한 지점(0~1)의 프레임을 준다. */
export const useCues = () => {
  const s = useScene();
  const within = (id: string, t: number): number => Math.round(s.cue(id) + (s.end(id) - s.cue(id)) * t);
  return { ...s, within };
};

export const blend = (a: string, b: string, t: number): string => {
  const x = parseInt(a.slice(1), 16);
  const y = parseInt(b.slice(1), 16);
  const k = clamp01(t);
  const ch = (s: number): number => {
    const u = (x >> s) & 255;
    const v = (y >> s) & 255;
    return Math.round(u + (v - u) * k);
  };
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`;
};

/** 글자 스타일: 한 줄, 색 지정 */
export const tx = (px: number, weight = 500, c: string = color.ink): CSSProperties => ({ ...sans(px, weight), color: c, whiteSpace: "nowrap" });
export const mx = (px: number, weight = 500, c: string = color.inkSoft): CSSProperties => ({ ...mono(px, weight), color: c });

/** 테두리 상자. p 는 나타난 정도(0~1). 내용은 가운데에 놓인다. */
export const Box: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  c?: string;
  dash?: boolean;
  bg?: string;
  bw?: number;
  p?: number;
  o?: number;
  align?: "center" | "left";
  style?: CSSProperties;
  children?: React.ReactNode;
}> = ({ x, y, w, h, c = color.lineStrong, dash, bg = withAlpha(color.panel, 0.92), bw = stroke.thin, p = 1, o = 1, align = "center", style, children }) =>
  p <= 0 ? null : (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        boxSizing: "border-box",
        border: `${bw}px ${dash ? "dashed" : "solid"} ${c}`,
        backgroundColor: bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: align === "center" ? "center" : "flex-start",
        textAlign: align,
        opacity: p * o,
        translate: `0px ${(1 - p) * 10}px`,
        ...style,
      }}
    >
      {children}
    </div>
  );

/** 자리 잡은 글자 한 덩이 */
export const At: React.FC<{ x: number; y: number; p?: number; right?: boolean; center?: boolean; dy?: number; style?: CSSProperties; children: React.ReactNode }> = ({
  x,
  y,
  p = 1,
  right,
  center,
  dy = 10,
  style,
  children,
}) =>
  p <= 0 ? null : (
    <div
      style={{
        position: "absolute",
        top: y,
        ...(right ? { right: 1920 - x } : center ? { left: x - 1000, width: 2000, display: "flex", justifyContent: "center" } : { left: x }),
        opacity: p,
        translate: `0px ${(1 - p) * dy}px`,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </div>
  );

// ── 요구사항 카드 (작은 판) ─────────────────────────────────────────────
export const REQ_CARD = { w: 640, h: 110 } as const;

export const MiniReqCard: React.FC<{ x: number; y: number; p?: number; status?: string; statusP?: number }> = ({ x, y, p = 1, status, statusP = 1 }) =>
  p <= 0 ? null : (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: REQ_CARD.w,
        height: REQ_CARD.h,
        boxSizing: "border-box",
        border: `${stroke.thin}px solid ${color.lineStrong}`,
        backgroundColor: withAlpha(color.panel, 0.95),
        opacity: p,
        translate: `0px ${(1 - p) * 12}px`,
      }}
    >
      <div style={{ height: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", borderBottom: `${stroke.hair}px solid ${color.line}` }}>
        <div style={mx(30, 700, color.ink)}>{CARD.id}</div>
        <div style={mx(28, 500, color.inkSoft)}>{CARD.criterion}</div>
      </div>
      <div style={{ height: 56, display: "flex", alignItems: "center", gap: 16, padding: "0 20px" }}>
        <div style={{ ...tx(30, 700), flex: 1 }}>{CARD.title}</div>
        {status ? (
          <div style={{ ...tx(26, 700, color.human), border: `${stroke.thin}px solid ${color.human}`, padding: "1px 10px", opacity: statusP }}>{status}</div>
        ) : null}
        <div style={mx(22, 700, color.inkDim)}>JIRA</div>
        <div style={mx(26, 700, color.agent)}>{CARD.jira}</div>
      </div>
    </div>
  );

// ── 상자 넷이 한 줄로 이어진 작은 블록도 ────────────────────────────────
export const BlockRow: React.FC<{
  x: number;
  y: number;
  bw: number;
  bh: number;
  gap: number;
  n?: number;
  /** 나타난 정도 */
  p?: number;
  /** 상자가 붉은 점선으로 바뀐 정도 */
  broken?: number;
  /** 가로 흔들림(px) */
  shake?: number;
  /** 붉게 켜지는 블록 사이 구간(0부터)과 그 정도 */
  hotGaps?: readonly number[];
  hot?: number;
  /** 고리의 맥박 0~1 */
  ring?: number;
}> = ({ x, y, bw, bh, gap, n = 4, p = 1, broken = 0, shake = 0, hotGaps = [], hot = 0, ring = 0 }) => {
  if (p <= 0) return null;
  const w = n * bw + (n - 1) * gap;
  const edge = blend(color.inkSoft, color.problem, broken);
  return (
    <svg width={w + 80} height={bh + 80} style={{ position: "absolute", left: x - 40, top: y - 40, overflow: "visible", opacity: p }}>
      <g transform={`translate(${40 + shake} 40)`}>
        {Array.from({ length: n - 1 }, (_, i) => {
          const isHot = hotGaps.includes(i) ? hot : 0;
          const x0 = (i + 1) * bw + i * gap;
          const cx = x0 + gap / 2;
          return (
            <g key={`g${i}`}>
              <line x1={x0} x2={x0 + gap} y1={bh / 2} y2={bh / 2} stroke={blend(edge, color.problem, isHot)} strokeWidth={lerp(stroke.trace, stroke.bold + 1, isHot)} strokeDasharray={broken > 0.5 ? "6 6" : undefined} />
              {isHot > 0 ? (
                <>
                  <circle cx={cx} cy={bh / 2} r={7} fill={color.problem} opacity={isHot} />
                  <circle cx={cx} cy={bh / 2} r={10 + ring * 22} fill="none" stroke={color.problem} strokeWidth={stroke.thin} opacity={isHot * (1 - ring)} />
                </>
              ) : null}
            </g>
          );
        })}
        {Array.from({ length: n }, (_, i) => (
          <rect
            key={i}
            x={i * (bw + gap)}
            y={0}
            width={bw}
            height={bh}
            fill={withAlpha(color.panel, 0.92)}
            stroke={edge}
            strokeWidth={stroke.thin}
            strokeDasharray={broken > 0.5 ? "9 7" : undefined}
            opacity={clamp01((p - i * 0.12) / 0.5)}
          />
        ))}
      </g>
    </svg>
  );
};

// ── 타임라인 한 줄 ──────────────────────────────────────────────────────
export type TrackCell = {
  label?: string;
  /** 칸 위 테두리에 얹는 번호 */
  no?: string;
  /** 켜졌을 때의 색 */
  c?: string;
  /** 켜진 정도 0~1 */
  lit?: number;
};

export const TrackRow: React.FC<{
  x: number;
  y: number;
  h: number;
  pitch: number;
  cellW: number;
  cells: readonly TrackCell[];
  /** 나타난 정도. 왼쪽 칸부터 차례로 나타난다 */
  p?: number;
  opacity?: number;
  px?: number;
  /** 빈 칸을 점선으로 */
  dashEmpty?: boolean;
}> = ({ x, y, h, pitch, cellW, cells, p = 1, opacity = 1, px = 30, dashEmpty }) => {
  if (p <= 0) return null;
  const n = cells.length;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: (n - 1) * pitch + cellW, height: h, opacity }}>
      <svg width={(n - 1) * pitch + cellW} height={h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {cells.slice(0, -1).map((_, i) => {
          const q = clamp01(p * (n + 1) - (i + 1));
          const x0 = i * pitch + cellW;
          const x1 = (i + 1) * pitch;
          return q <= 0 ? null : (
            <g key={i} opacity={q}>
              <line x1={x0} x2={x1 - 2} y1={h / 2} y2={h / 2} stroke={color.lineStrong} strokeWidth={stroke.thin} />
              <path d={`M ${x1 - 10} ${h / 2 - 6} L ${x1 - 1} ${h / 2} L ${x1 - 10} ${h / 2 + 6}`} fill="none" stroke={color.lineStrong} strokeWidth={stroke.thin} />
            </g>
          );
        })}
      </svg>
      {cells.map((cell, i) => {
        const q = clamp01(p * (n + 1) - i);
        if (q <= 0) return null;
        const lit = cell.lit ?? 0;
        const c = cell.c ?? color.inkSoft;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: i * pitch,
              top: 0,
              width: cellW,
              height: h,
              boxSizing: "border-box",
              border: `${stroke.thin}px ${dashEmpty && !cell.label ? "dashed" : "solid"} ${blend(color.line, c, lit)}`,
              backgroundColor: blend(color.panel, c, 0.1 * lit),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: q,
              translate: `${(1 - q) * -10}px 0px`,
            }}
          >
            {cell.no ? (
              <div style={{ position: "absolute", left: 12, top: -14, padding: "0 8px", backgroundColor: color.bg, ...mx(22, 700, blend(color.inkDim, c, lit)) }}>{cell.no}</div>
            ) : null}
            {cell.label ? <div style={tx(px, 600, blend(color.inkDim, color.ink, lit))}>{cell.label}</div> : null}
          </div>
        );
      })}
    </div>
  );
};

// ── 후보 구조 블록도 ────────────────────────────────────────────────────
// 네 후보가 같은 뼈대를 쓴다(s6 의 visual 이 기준).
//   맨 위   FW (호박색 점선, 넓은 상자). 안에 복구 제어의 세 단계 RETRY → SOFT READ → SOFT DEC
//   가운데  Host interface → NAND interface (nand_if) → hard LDPC ×8 → host로 반환
//   아래    NAND die 묶음, (C·D) rcv_ctrl → 복구 요청 큐 → soft LDPC ×3
// 뼈대는 회청색 선, 후보마다 다른 부분만 청록이다.
// 좌표는 (0,0)~(CAND_W, CAND_H) 의 설계 좌표이고 scale 로 키우거나 줄인다.
//
//   <CandidateDiagram kind="C" x={96} y={120} />                 다 그려진 상태
//   <CandidateDiagram kind="C" x={96} y={120} scale={0.7} at={cue("s11.1")} />
//   at        뼈대가 그려지기 시작하는 프레임 (없으면 처음부터 그려져 있다)
//   diffAt    그 후보의 다른 부분(FW 왕복, 청록 상자)이 그려지는 프레임 (없으면 뼈대 직후)
//   accentAt  둘째 박자: A 의 read 전압 추적, B 의 soft 모드 공유, C 의 큐 · soft LDPC
//   fromBase  diffAt 전에 이전 세대의 모습(FW 왕복 셋)을 먼저 보여 준다

export type CandKind = "base" | "A" | "B" | "C" | "D";
export const CAND_W = 852;
export const CAND_H = 278;

/** 블록의 자리(설계 좌표). 다른 씬에서 선을 이을 때 쓴다. B 의 nand 는 높이 116, D 의 ldpc 는 높이 164 다. */
export const CAND = {
  fw: { x: 0, y: 0, w: 852, h: 80 },
  host: { x: 0, y: 114, w: 146, h: 72 },
  nand: { x: 176, y: 114, w: 244, h: 72 },
  ldpc: { x: 450, y: 114, w: 206, h: 72 },
  ret: { x: 698, y: 132, w: 154, h: 36 },
  rcv: { x: 250, y: 206, w: 196, h: 72 },
  queue: { x: 464, y: 206, w: 164, h: 72 },
  soft: { x: 646, y: 206, w: 206, h: 72 },
} as const;

/** 후보의 한 줄 설명과 RTL 설계자의 추정 (s6 의 visual) */
export const CAND_INFO: Record<Exclude<CandKind, "base">, { note: string; area: string; reuse: string }> = {
  A: { note: "FW 순차 유지 · RTL 변경 없음", area: "면적 +0%", reuse: "재사용 95%" },
  B: { note: "HW retry", area: "면적 +3%", reuse: "재사용 85%" },
  C: { note: "HW 복구 + soft 전용 경로", area: "면적 +14%", reuse: "재사용 70%" },
  D: { note: "전부 soft 겸용", area: "면적 +38%", reuse: "재사용 55%" },
};

const STEPS = ["RETRY", "SOFT READ", "SOFT DEC"] as const;
const STEP_X = [220, 336, 508] as const;
const STEP_W = [96, 152, 136] as const;
const UP_X = [560, 576, 592] as const; // hard LDPC → FW (decode 실패)
const DOWN_X = [326, 310, 294] as const; // FW → nand_if (재read 명령)

const blockText = (c: string = color.ink): CSSProperties => ({ ...sans(28, 600), color: c, whiteSpace: "nowrap", lineHeight: "32px" });
const subText = (c: string = color.inkDim): CSSProperties => ({ ...sans(26, 500), color: c, whiteSpace: "nowrap", lineHeight: "30px" });

export const CandidateDiagram: React.FC<{
  kind: CandKind;
  x: number;
  y: number;
  scale?: number;
  at?: number;
  diffAt?: number;
  accentAt?: number;
  fromBase?: boolean;
  /** 전체 투명도 */
  opacity?: number;
}> = ({ kind, x, y, scale = 1, at, diffAt, accentAt, fromBase, opacity = 1 }) => {
  const frame = useCurrentFrame();
  const t0 = at ?? -100000;
  const d0 = diffAt ?? (at === undefined ? t0 : t0 + 14);
  const a0 = accentAt ?? (diffAt === undefined && at === undefined ? t0 : d0 + 18);
  const sk = (i: number): number => progress(frame, t0 + i * 3, 14);
  const d = (off = 0, dur = 14): number => progress(frame, d0 + off, dur);
  const a = (off = 0, dur = 14): number => progress(frame, a0 + off, dur);
  if (sk(0) <= 0) return null;

  const isB = kind === "B";
  const isC = kind === "C";
  const isD = kind === "D";
  const hw = isC || isD;

  // FW 왕복: 후보가 남기는 것은 diffAt 에 그려지고, fromBase 이면 셋 다 먼저 있다가 넘어간 것만 빠진다.
  const keeps = (i: number): boolean => kind === "base" || kind === "A" || (isB && i > 0);
  const trip = (i: number): number => {
    const base = fromBase || kind === "base" ? sk(4 + i) : 0;
    if (keeps(i)) return kind === "base" ? base : Math.max(base, d(i * 5));
    return base * (1 - d(0, 12));
  };
  const trips = [trip(0), trip(1), trip(2)];
  const anyTrip = Math.max(...trips);

  const nandH = isB ? lerp(72, 116, d(0, 16)) : 72;
  const dieY = CAND.nand.y + nandH + 5;
  const bigH = isD ? lerp(72, 164, d(0, 18)) : 72;
  const teal = color.agent;
  const rcvW = isD ? 180 : CAND.rcv.w;

  return (
    <div style={{ position: "absolute", left: x, top: y, width: CAND_W, height: CAND_H, transform: `scale(${scale})`, transformOrigin: "0 0", opacity }}>
      {/* FW */}
      <Box x={0} y={0} w={CAND.fw.w} h={CAND.fw.h} c={color.human} dash bg={withAlpha(color.human, 0.05)} p={sk(0)} />
      <At x={18} y={5} p={sk(0)} dy={0} style={tx(30, 800, color.human)}>
        FW
      </At>
      <At x={18} y={42} p={anyTrip} dy={0} style={blockText(color.inkSoft)}>
        복구 제어
      </At>
      {STEPS.map((s, i) => {
        const on = trips[i];
        const gone = !keeps(i) && kind !== "base" ? d(0, 12) : 0;
        const show = Math.max(on, fromBase ? sk(4 + i) * (hw ? 1 - d(0, 12) : 1) : 0);
        if (show <= 0) return null;
        return (
          <div
            key={s}
            style={{
              position: "absolute",
              left: STEP_X[i],
              top: 44,
              width: STEP_W[i],
              height: 30,
              boxSizing: "border-box",
              border: `${stroke.hair}px solid ${blend(color.human, color.line, gone)}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              ...mx(22, 700, blend(color.human, color.inkDim, gone)),
              textDecoration: gone > 0.5 ? "line-through" : undefined,
              opacity: show,
            }}
          >
            {s}
          </div>
        );
      })}
      {kind === "A" ? (
        <div style={{ position: "absolute", right: 18, top: 6, ...blockText(teal), opacity: a() }}>read 전압 추적 강화</div>
      ) : null}
      {hw ? (
        <At x={180} y={42} p={d(12)} dy={0} style={blockText(color.inkSoft)}>
          정책 · table · parity 복구
        </At>
      ) : null}

      <svg width={CAND_W} height={CAND_H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {/* 주 경로 */}
        <Trace pts={[[CAND.host.x + CAND.host.w, 150], [CAND.nand.x, 150]]} stroke={color.inkSoft} width={stroke.thin} arrow progress={sk(2)} />
        <Trace pts={[[CAND.nand.x + CAND.nand.w, 150], [CAND.ldpc.x, 150]]} stroke={color.inkSoft} width={stroke.thin} arrow progress={sk(3)} />
        <Trace pts={[[CAND.ldpc.x + CAND.ldpc.w, 150], [CAND.ret.x - 4, 150]]} stroke={color.inkSoft} width={stroke.thin} arrow progress={sk(4)} />
        {/* NAND die 묶음 */}
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={182 + i * 15} y={dieY} width={10} height={28} fill={withAlpha(color.panel, 0.9)} stroke={color.lineStrong} strokeWidth={stroke.hair} opacity={sk(3)} />
        ))}
        {/* FW 왕복 */}
        {[0, 1, 2].map((i) =>
          trips[i] <= 0 ? null : (
            <g key={i} opacity={trips[i]}>
              <Trace pts={[[UP_X[i], CAND.ldpc.y], [UP_X[i], CAND.fw.h]]} stroke={color.inkSoft} width={stroke.thin} arrow progress={trips[i]} />
              <Trace pts={[[DOWN_X[i], CAND.fw.h], [DOWN_X[i], CAND.nand.y]]} stroke={color.inkSoft} width={stroke.thin} arrow progress={trips[i]} />
            </g>
          ),
        )}
        {/* B: retry 는 HW 안의 짧은 루프 */}
        {isB ? (
          <>
            <Trace pts={[[474, 186], [474, 204], [416, 204]]} stroke={teal} arrow progress={d(8, 16)} />
            <Trace pts={[[416, 216], [498, 216], [498, 186]]} stroke={teal} arrow progress={d(16, 16)} />
          </>
        ) : null}
        {/* C · D: FW 와는 가는 점선 하나 */}
        {hw ? <Trace pts={[[161, CAND.fw.h], [161, 250], [CAND.rcv.x - 2, 250]]} stroke={color.human} width={stroke.hair} dash="5 6" progress={d(10, 18)} /> : null}
        {isC ? (
          <>
            <Trace pts={[[470, 186], [470, 196], [424, 196], [424, 206]]} stroke={teal} arrow chamfer={4} progress={d(4, 14)} />
            <Trace pts={[[310, 206], [310, 186]]} stroke={teal} arrow progress={d(10, 12)} />
            <Trace pts={[[CAND.rcv.x + CAND.rcv.w, 242], [CAND.queue.x, 242]]} stroke={teal} arrow progress={a(2, 10)} />
            <Trace pts={[[CAND.queue.x + CAND.queue.w, 242], [CAND.soft.x, 242]]} stroke={teal} arrow progress={a(8, 10)} />
            <Trace pts={[[760, 206], [760, 172]]} stroke={teal} arrow progress={a(16, 12)} />
          </>
        ) : null}
        {isD ? (
          <>
            <Trace pts={[[CAND.ldpc.x, 228], [CAND.rcv.x + rcvW, 228]]} stroke={teal} arrow progress={d(8, 12)} />
            <Trace pts={[[CAND.rcv.x + rcvW, 256], [CAND.ldpc.x, 256]]} stroke={teal} arrow progress={d(14, 12)} />
            <Trace pts={[[310, 206], [310, 186]]} stroke={teal} arrow progress={d(10, 12)} />
          </>
        ) : null}
      </svg>

      {/* 왕복의 이름 */}
      <At x={338} y={82} p={anyTrip} dy={0} style={subText(color.inkSoft)}>
        재read 명령
      </At>
      <At x={606} y={82} p={anyTrip} dy={0} style={subText(color.inkSoft)}>
        decode 실패
      </At>

      {/* 뼈대 */}
      <Box x={CAND.host.x} y={CAND.host.y} w={CAND.host.w} h={CAND.host.h} p={sk(1)}>
        <div style={blockText()}>Host</div>
        <div style={blockText()}>interface</div>
      </Box>
      <Box x={CAND.nand.x} y={CAND.nand.y} w={CAND.nand.w} h={nandH} p={sk(2)} style={{ justifyContent: "flex-start", paddingTop: 3 }}>
        <div style={blockText()}>NAND interface</div>
        <div style={{ ...mx(26, 500, color.inkDim), lineHeight: "30px" }}>nand_if</div>
      </Box>
      {isB ? (
        <Box x={CAND.nand.x + 6} y={CAND.nand.y + 70} w={CAND.nand.w - 12} h={40} c={teal} bg={withAlpha(teal, 0.1)} p={d(4)}>
          <div style={subText(teal)}>retry FSM + table</div>
        </Box>
      ) : null}
      <At x={34} y={dieY - 1} p={sk(3)} dy={0} style={subText()}>
        NAND die
      </At>
      <Box
        x={CAND.ldpc.x}
        y={CAND.ldpc.y}
        w={CAND.ldpc.w}
        h={bigH}
        c={isD ? blend(color.lineStrong, teal, d(0, 16)) : color.lineStrong}
        bw={isD ? lerp(stroke.thin, stroke.bold, d(0, 16)) : stroke.thin}
        bg={isD ? blend(color.panel, teal, 0.14 * d(0, 16)) : withAlpha(color.panel, 0.92)}
        p={sk(3)}
      >
        {isD ? (
          <>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: 1 - d(0, 10), ...blockText() }}>hard LDPC ×8</div>
            <div style={{ ...sans(34, 800), color: teal, whiteSpace: "nowrap", lineHeight: "42px", opacity: d(8) }}>soft 겸용</div>
            <div style={{ ...sans(34, 800), color: teal, whiteSpace: "nowrap", lineHeight: "42px", opacity: d(8) }}>LDPC ×8</div>
          </>
        ) : (
          <>
            <div style={blockText()}>hard LDPC ×8</div>
            {isB ? <div style={{ ...subText(teal), opacity: a(), height: 30 * a() }}>(soft 모드 공유)</div> : null}
          </>
        )}
      </Box>
      <At x={CAND.ret.x + 2} y={CAND.ret.y} p={sk(4)} dy={0} style={blockText(color.inkSoft)}>
        host로 반환
      </At>

      {/* C · D 의 새 블록 */}
      {hw ? (
        <Box x={CAND.rcv.x} y={CAND.rcv.y} w={rcvW} h={72} c={teal} bg={withAlpha(teal, 0.1)} p={d(0)}>
          <div style={{ ...mx(28, 700, teal), lineHeight: "32px" }}>rcv_ctrl</div>
          <div style={subText(color.ink)}>복구 단계 제어</div>
        </Box>
      ) : null}
      {isC ? (
        <>
          <Box x={CAND.queue.x} y={CAND.queue.y} w={CAND.queue.w} h={72} c={teal} bg={withAlpha(teal, 0.1)} p={a(0)}>
            <div style={blockText(teal)}>복구 요청 큐</div>
          </Box>
          <Box x={CAND.soft.x} y={CAND.soft.y} w={CAND.soft.w} h={72} c={teal} bg={withAlpha(teal, 0.1)} p={a(6)}>
            <div style={blockText(teal)}>soft LDPC ×3</div>
          </Box>
        </>
      ) : null}
    </div>
  );
};

/** 직각 경로를 따라 움직이는 점의 자리 */
export const along = (pts: readonly Pt[], t: number): Pt => {
  let total = 0;
  for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  let left = total * clamp01(t);
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (left <= seg || i === pts.length - 1) {
      const k = seg === 0 ? 0 : Math.min(1, left / seg);
      return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k];
    }
    left -= seg;
  }
  return pts[pts.length - 1];
};
