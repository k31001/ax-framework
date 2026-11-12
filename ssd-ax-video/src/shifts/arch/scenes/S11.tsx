import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, clamp01, ease, enter, lerp, progress } from "../../../video/anim";
import { AgentIcon, CheckIcon, HumanIcon, WarnIcon } from "../../../video/components/Icons";
import { Trace } from "../../../video/components/Trace";
import { color, fullSvg, mono, sans, stroke, withAlpha } from "../../../video/theme";
import { ShiftSheet } from "../../lib";
import { Box, EdgeTag, T, Table, blend, useCues } from "./kitB";

// s11 모델이 찾은 문제와 수정.
// 위: C 의 복구 경로(rcv_ctrl → 복구 요청 큐 → soft LDPC ×3 → host로 반환). GC 요청이 몰려 host 요청이 뒤에 선다.
// 수정: 큐를 host 우선 / GC 로 가르고 중재한다. 아래: 표, 재실행 결과, formal 속성, 타임라인.

const HOST_Y = 234;
const GC_Y = 308;
const MID_Y = 255;
const X0 = 404; // 요청이 들어오는 자리
const RC = { x: 440, y: 180, w: 190, h: 150 } as const;
const Q = { x: 730, y: 180, w: 400, h: 150 } as const;
const ARB = { x: 1152, y: 204, w: 56, h: 102 } as const;
const SD = { x: 1240, y: 180, w: 240, h: 150 } as const;
const RET = { x: 1590, y: 215, w: 210, h: 80 } as const;
const slotX = (k: number): number => 1108 - k * 32;
const GRAY = 11;
const TABLE = { x: 96, y: 430, w: 760 } as const;
const FIXBOX = { x: 880, y: 430, w: 200, h: 70 } as const;
const RESULT = { x: 1104, y: 430, w: 720, h: 70 } as const;
const TL = { x: 250, y: 744, w: 206, h: 56, pitch: 216 } as const;
const STAGES = ["목표 · 제약", "후보", "모델 · 보정", "평가", "선택 · 기록", "인계"];

const Dot: React.FC<{ x: number; y: number; c: string; o?: number; r?: number }> = ({ x, y, c, o = 1, r = 10 }) => (o <= 0 ? null : <circle cx={x} cy={y} r={r} fill={c} stroke={color.bg} strokeWidth={2} opacity={o} />);

export const S11: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, end, within } = useCues();
  const t1 = cue("s11.1");
  const t2 = cue("s11.2");
  const t3 = cue("s11.3");
  const t4 = cue("s11.4");
  const t6 = cue("s11.6");
  const t7 = cue("s11.7");

  const tB = t2 + 8; // GC 요청이 몰리기 시작
  const tH = t3 + 2; // host 요청이 도착
  const redAt = within("s11.3", 0.3);
  const tF = within("s11.4", 0.3); // 큐를 가른다
  const split = progress(frame, tF, DUR.move, ease.inOut);
  const tL = tF + 30;
  const red = progress(frame, redAt, 12) * (1 - split);
  const wait = progress(frame, redAt, Math.max(20, end("s11.3") - redAt), ease.linear);
  const boxes = progress(frame, 4, DUR.enter);
  const busy = progress(frame, tB + 30, 12);
  const pass = progress(frame, within("s11.5", 0.2), 14);
  const formal = progress(frame, t6, DUR.draw);
  const now = progress(frame, t7, DUR.enter);
  const warnAt = within("s11.3", 0.62);

  // ── 점 ──
  const dots: React.ReactNode[] = [];
  // 평상시: 드문드문 지나간다
  for (let n = 0; n < 12; n++) {
    const host = n % 2 === 0;
    const spawn = t1 - 20 + n * 30;
    if (spawn + 96 > tB) continue;
    const x = X0 + 11 * (frame - spawn);
    const stop = host ? RET.x : SD.x + 60;
    if (frame < spawn || x > stop) continue;
    const y = lerp(host ? HOST_Y : GC_Y, MID_Y, clamp01((x - Q.x) / 60));
    dots.push(<Dot key={`n${n}`} x={x} y={y} c={host ? color.ink : color.inkDim} o={clamp01((stop - x) / 30)} />);
  }
  // GC 요청이 몰린다
  for (let k = 0; k < GRAY + 3; k++) {
    const s = tB + k * 6;
    if (frame < s) continue;
    const inQueue = k < GRAY;
    const tx = inQueue ? slotX(k) : 706 - (k - GRAY) * 26;
    const u = clamp01((frame - s) / ((tx - X0) / 16));
    let x = lerp(X0, tx, u);
    let y = inQueue ? lerp(GC_Y, MID_Y, clamp01((x - Q.x) / 40)) : GC_Y;
    let o = 1;
    if (inQueue && k < 7) {
      x = lerp(x, slotX(k), split);
      y = lerp(y, GC_Y, split);
    } else o = 1 - split;
    dots.push(<Dot key={`g${k}`} x={x} y={y} c={color.inkDim} o={o} />);
  }
  // 뒤에 선 host 요청
  if (frame >= tH) {
    const u = clamp01((frame - tH) / 30);
    let x = lerp(X0, slotX(GRAY), u);
    let y = lerp(HOST_Y, MID_Y, clamp01((x - Q.x) / 26));
    x = lerp(x, slotX(0), split);
    y = lerp(y, HOST_Y, split);
    let o = 1;
    if (frame > tL) {
      x = slotX(0) + 10 * (frame - tL);
      y = lerp(HOST_Y, MID_Y, clamp01((x - ARB.x) / 50));
      o = clamp01((RET.x - x) / 30);
    }
    dots.push(<Dot key="h" x={x} y={y} c={blend(color.ink, color.problem, red)} o={o} r={11} />);
  }
  // 수정 뒤: host 요청은 먼저 빠져나간다
  let hostInSd = 0;
  for (let n = 0; n < 12; n++) {
    const spawn = tL + 26 + n * 44;
    const x = X0 + 11 * (frame - spawn);
    if (frame < spawn || x > RET.x) continue;
    const y = lerp(HOST_Y, MID_Y, clamp01((x - ARB.x) / 50));
    if (x > SD.x && x < SD.x + SD.w) hostInSd = 1;
    dots.push(<Dot key={`a${n}`} x={x} y={y} c={color.ink} o={clamp01((RET.x - x) / 30)} />);
  }

  return (
    <ShiftSheet>
      <div style={{ position: "absolute", left: 96, top: 74, display: "flex", alignItems: "baseline", gap: 14, ...enter(frame, within("s11.1", 0.45)) }}>
        <div style={{ ...sans(36, 800) }}>시나리오</div>
        <div style={{ ...mono(34, 700), letterSpacing: "0", color: color.ink }}>gc_degraded</div>
      </div>
      <Box x={1444} y={72} w={380} h={52} c={color.agent} fill={withAlpha(color.agent, 0.1)} p={progress(frame, t1, DUR.enter)} style={{ gap: 12 }}>
        <CheckIcon size={28} color={color.agent} />
        <div style={{ ...mono(28, 700), letterSpacing: "0", color: color.agent }}>eol_mixed 1.52 ms</div>
      </Box>

      {/* ── 복구 경로 ── */}
      <svg {...fullSvg}>
        <g opacity={boxes}>
          <line x1={X0 - 4} x2={RC.x} y1={HOST_Y} y2={HOST_Y} stroke={color.inkSoft} strokeWidth={stroke.trace} />
          <line x1={X0 - 4} x2={RC.x} y1={GC_Y} y2={GC_Y} stroke={color.lineStrong} strokeWidth={stroke.trace} />
          <line x1={RC.x + RC.w} x2={Q.x} y1={HOST_Y} y2={HOST_Y} stroke={color.inkSoft} strokeWidth={stroke.trace} />
          <line x1={RC.x + RC.w} x2={Q.x} y1={GC_Y} y2={GC_Y} stroke={color.lineStrong} strokeWidth={stroke.trace} />
          <line x1={Q.x + Q.w} x2={SD.x} y1={MID_Y} y2={MID_Y} stroke={color.inkSoft} strokeWidth={stroke.trace} opacity={1 - split} />
          <line x1={SD.x + SD.w} x2={RET.x} y1={MID_Y} y2={MID_Y} stroke={color.inkSoft} strokeWidth={stroke.trace} />
          <path d={`M ${RET.x - 14} ${MID_Y - 8} L ${RET.x - 2} ${MID_Y} L ${RET.x - 14} ${MID_Y + 8}`} fill="none" stroke={color.inkSoft} strokeWidth={stroke.trace} />
          <rect x={RC.x} y={RC.y} width={RC.w} height={RC.h} fill={withAlpha(color.panel, 0.9)} stroke={color.agent} strokeWidth={stroke.thin} />
          <rect x={Q.x} y={Q.y} width={Q.w} height={Q.h} fill={withAlpha(color.panel, 0.9)} stroke={blend(color.agent, color.problem, red)} strokeWidth={stroke.trace} />
          <rect x={SD.x} y={SD.y} width={SD.w} height={SD.h} fill={withAlpha(color.panel, 0.9)} stroke={color.agent} strokeWidth={stroke.thin} />
          <rect x={RET.x} y={RET.y} width={RET.w} height={RET.h} fill={withAlpha(color.panel, 0.9)} stroke={color.inkSoft} strokeWidth={stroke.thin} />
          {[0, 1, 2].map((j) => (
            <rect key={j} x={SD.x + 22 + j * 68} y={SD.y + 86} width={56} height={40} fill={j === 0 && split >= 1 ? withAlpha(color.ink, 0.25 + 0.6 * hostInSd) : withAlpha(color.inkDim, 0.55 * busy)} stroke={color.lineStrong} strokeWidth={stroke.hair} />
          ))}
        </g>
        {/* 수정안: 큐를 가르고 중재한다 */}
        {split > 0 ? (
          <g opacity={split}>
            <line x1={Q.x} x2={Q.x + Q.w} y1={MID_Y} y2={MID_Y} stroke={color.agent} strokeWidth={stroke.thin} />
            <path d={`M ${Q.x + Q.w} ${HOST_Y} H ${ARB.x} M ${Q.x + Q.w} ${GC_Y} H ${ARB.x} M ${ARB.x + ARB.w} ${MID_Y} H ${SD.x}`} fill="none" stroke={color.agent} strokeWidth={stroke.trace} />
            <path d={`M ${ARB.x} ${ARB.y} L ${ARB.x + ARB.w} ${ARB.y + 26} V ${ARB.y + ARB.h - 26} L ${ARB.x} ${ARB.y + ARB.h} Z`} fill={blend(color.panel, color.agent, 0.2)} stroke={color.agent} strokeWidth={stroke.thin} />
          </g>
        ) : null}
        {/* 대기 시간 눈금 */}
        {wait > 0 && split < 1 ? (
          <g opacity={1 - split}>
            <line x1={slotX(GRAY)} x2={slotX(GRAY)} y1={MID_Y - 14} y2={Q.y + 22} stroke={color.problem} strokeWidth={stroke.thin} />
            <rect x={slotX(GRAY)} y={Q.y + 16} width={6 + 190 * wait} height={12} fill={color.problem} />
          </g>
        ) : null}
        {dots}
        {/* formal 모델의 테두리 */}
        <rect x={Q.x - 16} y={Q.y - 34} width={ARB.x + ARB.w + 16 - (Q.x - 16)} height={Q.h + 46} fill="none" stroke={color.human} strokeWidth={stroke.thin} strokeDasharray="10 8" opacity={formal} />
        {/* 에이전트의 수정안 → 큐 */}
        <Trace pts={[[FIXBOX.x + 100, FIXBOX.y], [FIXBOX.x + 100, Q.y + Q.h + 4]]} stroke={color.agent} width={stroke.trace} arrow at={t4 + 10} />
        {/* 타임라인 */}
        <g opacity={0.55 + 0.45 * now}>
          {STAGES.map((_, i) => (i < 5 ? <line key={i} x1={TL.x + i * TL.pitch + TL.w} x2={TL.x + (i + 1) * TL.pitch} y1={TL.y + TL.h / 2} y2={TL.y + TL.h / 2} stroke={color.lineStrong} strokeWidth={stroke.thin} opacity={progress(frame, t1 + 6, 12)} /> : null))}
          <line x1={TL.x + 5 * TL.pitch + TL.w} x2={TL.x + 6 * TL.pitch} y1={TL.y + TL.h / 2} y2={TL.y + TL.h / 2} stroke={color.lineStrong} strokeWidth={stroke.thin} strokeDasharray="5 5" opacity={progress(frame, t1 + 6, 12)} />
        </g>
      </svg>

      <div style={{ opacity: boxes }}>
        <div style={{ position: "absolute", left: 96, top: HOST_Y - 20, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: color.ink }} />
          <div style={{ ...sans(30, 600), whiteSpace: "nowrap" }}>host read 복구 요청</div>
        </div>
        <div style={{ position: "absolute", left: 96, top: GC_Y - 20, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: color.inkDim }} />
          <div style={{ ...sans(30, 600), whiteSpace: "nowrap", color: color.inkSoft }}>GC read 복구 요청</div>
        </div>
        <T x={RC.x + RC.w / 2} y={RC.y - 44} text="rcv_ctrl" px={30} code weight={700} align="center" />
        <EdgeTag x={Q.x + 16} y={Q.y} text="복구 요청 큐" c={color.ink} px={30} />
        <T x={SD.x + SD.w / 2} y={SD.y + 22} text="soft LDPC ×3" px={30} weight={700} align="center" />
        <T x={RET.x + RET.w / 2} y={RET.y + 21} text="host로 반환" px={30} weight={700} align="center" />
      </div>
      <T x={96} y={GC_Y + 24} text="GC · 열화된 block" px={30} weight={700} c={color.problem} at={t2} out={tF + 20} />
      <T x={slotX(GRAY) + 14 + 190 * wait} y={Q.y + 6} text={`${lerp(0.06, 1.9, wait).toFixed(wait >= 1 ? 1 : 2)} ms`} px={26} code weight={700} c={color.problem} at={redAt} out={tF} />
      <T x={Q.x + 14} y={Q.y + 3} text="host 우선" px={30} weight={700} c={color.agent} at={tF + 10} />
      <T x={Q.x + 14} y={MID_Y + 3} text="GC" px={30} weight={700} c={color.inkSoft} at={tF + 10} />
      <T x={1040} y={Q.y + Q.h + 14} text="host 4 : GC 1 · GC 최소 처리량 보장" px={30} weight={700} c={color.agent} at={within("s11.4", 0.6)} />
      <EdgeTag x={ARB.x + ARB.w - 190} y={Q.y - 34} text="formal 모델" c={color.human} px={30} p={formal} />

      {/* ── 표 ── */}
      <Table
        x={TABLE.x}
        y={TABLE.y}
        w={TABLE.w}
        title="gc_degraded · 구조 C · soft_dec 3 (예시)"
        at={within("s11.3", 0.2)}
        owner="agent"
        cols={[{ w: 270 }, { w: 150, code: true }, { w: 170, code: true }, { w: 130 }]}
        head={["", "평상시", "GC 구간", ""]}
        rows={[
          { cells: ["soft 요청 / 초", "310", "10,400", ""], at: within("s11.3", 0.2) + 8 },
          { cells: ["soft 큐 대기 P99", "0.06 ms", { t: "1.9 ms", c: color.problem, weight: 700 }, ""], at: within("s11.3", 0.4) },
          { cells: [{ t: "host P99.99", weight: 700 }, "1.52 ms", { t: "2.61 ms", c: color.problem, weight: 700 }, { t: "← 초과", c: color.problem, weight: 700 }], at: warnAt, mark: warnAt, unmark: within("s11.5", 0.2), markC: color.problem },
        ]}
      />

      {/* ── 에이전트의 수정안 ── */}
      <Box x={FIXBOX.x} y={FIXBOX.y} w={FIXBOX.w} h={FIXBOX.h} c={color.agent} fill={withAlpha(color.agent, 0.12)} p={progress(frame, t4, DUR.enter)} style={{ gap: 12 }}>
        <AgentIcon size={34} color={color.agent} />
        <div style={{ ...sans(32, 800), color: color.agent }}>수정안</div>
      </Box>

      {/* ── 초과 → 재실행 통과 ── */}
      <Box x={RESULT.x} y={RESULT.y} w={RESULT.w} h={RESULT.h} c={blend(color.problem, color.agent, pass)} fill={withAlpha(pass > 0.5 ? color.agent : color.problem, 0.1)} p={progress(frame, warnAt, DUR.enter)} center={false} style={{ gap: 14, paddingLeft: 22 }}>
        {pass > 0.5 ? <CheckIcon size={34} color={color.agent} /> : <WarnIcon size={34} color={color.problem} />}
        <div style={{ ...sans(30, 700), whiteSpace: "nowrap", color: pass > 0.5 ? color.agent : color.problem, opacity: Math.abs(pass - 0.5) * 2 }}>{pass > 0.5 ? "재실행  host P99.99 1.63 ms · GC 처리량 −3%" : "host P99.99 2.61 ms · 초과 (예시)"}</div>
      </Box>

      {/* ── formal 속성 ── */}
      {[
        ["a_host_first", "host 요청이 GC 요청보다 먼저"],
        ["a_gc_no_starve", "모든 요청은 유한 시간 안에 처리"],
      ].map(([name, desc], i) => (
        <div key={name} style={{ position: "absolute", left: FIXBOX.x, top: 540 + i * 56, height: 48, display: "flex", alignItems: "center", gap: 16, ...enter(frame, within("s11.6", 0.3 + i * 0.3)) }}>
          <CheckIcon size={30} color={color.human} />
          <div style={{ ...mono(28, 700), letterSpacing: "0", color: color.ink, width: 260 }}>{name}</div>
          <div style={{ ...sans(30, 500), whiteSpace: "nowrap" }}>{desc}</div>
        </div>
      ))}

      {/* ── 타임라인: 지금은 04 평가, RTL 은 아직 비어 있다 ── */}
      <div style={{ opacity: (0.55 + 0.45 * now) * progress(frame, t1 + 6, DUR.enter) }}>
        <T x={96} y={TL.y + 8} text="모델 먼저" px={30} weight={800} c={color.agent} />
        {STAGES.map((s, i) => {
          const cur = i === 3;
          return (
            <Box key={s} x={TL.x + i * TL.pitch} y={TL.y} w={TL.w} h={TL.h} c={cur ? color.agent : i < 3 ? color.lineStrong : color.line} bw={cur ? stroke.trace : stroke.thin} fill={cur ? blend(color.panel, color.agent, 0.18) : withAlpha(color.panel, 0.9)} style={{ gap: 10 }}>
              <div style={{ ...mono(24, 700), letterSpacing: "0", color: cur ? color.agent : color.inkDim }}>{`0${i + 1}`}</div>
              <div style={{ ...sans(30, cur ? 800 : 500), whiteSpace: "nowrap", color: cur ? color.ink : i < 3 ? color.inkSoft : color.inkDim }}>{s}</div>
            </Box>
          );
        })}
        <Box x={TL.x + 6 * TL.pitch} y={TL.y} w={TL.w} h={TL.h} c={blend(color.lineStrong, color.ink, now)} dash fill="transparent">
          <div style={{ ...mono(30, 700), letterSpacing: "0", color: blend(color.inkDim, color.ink, now) }}>RTL</div>
        </Box>
      </div>
      <Box x={TL.x + 3 * TL.pitch} y={TL.y + TL.h + 24} w={380} h={62} c={color.human} fill={withAlpha(color.human, 0.08)} p={progress(frame, t7 + 10, DUR.enter)} style={{ gap: 12 }}>
        <HumanIcon size={32} color={color.human} />
        <div style={{ ...sans(30, 700), whiteSpace: "nowrap" }}>아키텍트 · 수정안 승인</div>
      </Box>
    </ShiftSheet>
  );
};
