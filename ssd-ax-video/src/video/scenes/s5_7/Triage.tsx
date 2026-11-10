import React from "react";
import { interpolateColors, useCurrentFrame } from "remotion";
import { clamp01, draw, ease, lerp, progress, sub } from "../../anim";
import { FIG } from "../../content";
import { HumanIcon } from "../../components/Icons";
import { Trace, Via, pointOnTrace, traceLength } from "../../components/Trace";
import type { Pt } from "../../components/Trace";
import type { IllustrationProps } from "../../stage/StageScene";
import { color, mono, sans, size, stroke, withAlpha } from "../../theme";
import { At, hash } from "./util";

// S5-7 전반: 쏟아지는 로그 → 깔때기 → 묶음.
//
//   0 ~         테스트 로그 줄들이 위에서 떨어져 쌓인다("현재"의 수동 분석과도 맞는다).
//   문제        붉은 줄(특정 lot 의 지연 초과)이 섞여 떨어지기 시작한다. 머리 오른쪽에 붉은 꼬리표.
//   에이전트    깔때기가 그려지고 쌓인 줄이 빠져나가 세 칸(기존 불량)으로 정리된다.
//               붉은 줄은 오른쪽으로 갈라져 카드 한 장(신규 불량 후보)이 되고, 사람 색 테두리의 자리로 간다.
//   사람        카드에 처분 표시가 찍히고, 수정안 하나가 골라지고, 붉은색이 빠진다.
//   강조 문구   움직임이 모두 끝난 채로 흐려진다.

const L = FIG["S5-7"];

// ── 자리 (그림 자리 536×616) ───────────────────────────────────────────
const CX = 268;
const RAIN_TOP = 54;
const FLOOR_Y = 204;
const HEAP_PITCH = 11;
const HEAP_COLS = [112, 268, 424] as const;
const FUNNEL = { top: 216, shoulder: 286, neck: 304, topHalf: 256, neckHalf: 26 } as const;
const BUS_Y = 328;
const BIN = { xs: [34, 106, 178], w: 60, top: 352, base: 466 } as const;
const SLOT = { x: 262, y: 478, w: 274, h: 118 } as const;
const CARD = { w: 262, h: 106 } as const;
const RIGHT_X = SLOT.x + SLOT.w / 2;
const CARD_FROM_Y = 374;

// ── 줄 ─────────────────────────────────────────────────────────────────
const COUNT = 46;
const STEP = 4; // 줄이 떨어지기 시작하는 간격
const FALL = 18;
const RATE = 1; // 깔때기로 빠져나가는 속도 (줄/프레임)
const PASS = 8; // 깔때기를 지나는 시간
const TRAVEL = 10; // 깔때기 아래에서 제자리까지
/** 문제 시점 뒤에 떨어지는 줄 가운데 붉은 줄의 순서 */
const RED_OFFSETS = [0, 1, 3, 4, 6];

type LogLine = {
  i: number;
  spawn: number;
  /** 깔때기로 빠져나가기 시작하는 프레임 */
  leave: number;
  red: boolean;
  x: number;
  len: number;
  rot: number;
  bin: number;
  /** 칸 안에서 아래부터의 순서 */
  slot: number;
  dash: string;
};

const buildLines = (tRain: number, tProblem: number, tDrain: number): { lines: LogLine[]; most: number } => {
  const firstRed = Math.max(0, Math.ceil((tProblem - tRain) / STEP));
  const counts = [0, 0, 0];
  const lines: LogLine[] = [];
  for (let i = 0; i < COUNT; i++) {
    const spawn = tRain + i * STEP;
    const red = RED_OFFSETS.indexOf(i - firstRed) >= 0;
    const pick = hash(i * 3.7 + 1.3);
    const bin = pick < 0.44 ? 0 : pick < 0.78 ? 1 : 2;
    const len = 56 + hash(i * 7.1 + 2.9) * 84;
    const a = 0.2 + hash(i * 1.9 + 5.1) * 0.25;
    const b = 0.15 + hash(i * 2.3 + 0.7) * 0.2;
    lines.push({
      i,
      spawn,
      leave: Math.max(tDrain + i / RATE, spawn + FALL + 2),
      red,
      x: HEAP_COLS[i % 3] + (hash(i * 5.3 + 0.4) - 0.5) * 70,
      len,
      rot: (hash(i * 4.1 + 8.2) - 0.5) * 10,
      bin,
      slot: red ? 0 : counts[bin]++,
      dash: `${len * a} 6 ${len * b} 6 ${len}`,
    });
  }
  return { lines, most: Math.max(counts[0], counts[1], counts[2]) };
};

type LineState = { x: number; y: number; len: number; rot: number; alpha: number; loose: boolean };

const stateOf = (l: LogLine, frame: number, binPitch: number): LineState => {
  let x: number;
  let y: number;
  let len: number;
  let rot: number;
  let alpha = 1;
  let loose = true;
  if (frame < l.leave) {
    // 쌓여 있다. 아래 줄이 빠져나가면 그만큼 내려앉는다.
    const below = Math.min(l.i, (l.leave - frame) * RATE);
    x = l.x;
    y = FLOOR_Y - (below / 3) * HEAP_PITCH;
    len = l.len;
    rot = l.rot;
  } else if (frame < l.leave + PASS) {
    const u = (frame - l.leave) / PASS;
    x = lerp(l.x, CX, Math.pow(u, 0.8));
    y = lerp(FLOOR_Y, FUNNEL.neck, u);
    len = lerp(l.len, 24, u);
    rot = l.rot * (1 - u);
    loose = u < 0.4;
  } else {
    const v = clamp01((frame - l.leave - PASS) / TRAVEL);
    const end: Pt = l.red ? [RIGHT_X, CARD_FROM_Y] : [BIN.xs[l.bin], BIN.base - 8 - l.slot * binPitch];
    const pts: Pt[] = [[CX, FUNNEL.neck], [CX, BUS_Y], [end[0], BUS_Y], end];
    const at = pointOnTrace(pts, traceLength(pts) * v);
    x = at.x;
    y = at.y;
    len = l.red ? 24 : lerp(24, BIN.w - 18, v);
    rot = 0;
    loose = false;
    if (l.red) alpha = 1 - sub(v, 0.7, 1);
  }
  const fall = clamp01((frame - l.spawn) / FALL);
  if (fall < 1) {
    y = lerp(RAIN_TOP, y, Math.pow(fall, 1.6));
    alpha *= Math.min(1, fall * 5);
  }
  return { x, y, len, rot, alpha, loose };
};

const OPTIONS = ["A", "B", "C"] as const;
const CHOSEN = 1;

export const Triage: React.FC<IllustrationProps> = ({ width, height, beats, frames }) => {
  const frame = useCurrentFrame();
  const agents = beats.filter((b) => b.kind === "agent");
  const humans = beats.filter((b) => b.kind === "human");
  const tRain = frames.before + 12;
  const tProblem = frames.problem ?? tRain + 48;
  const tAgent = agents[0].frame;
  const tHuman = humans[0].frame;
  const tNote = frames.note ?? tHuman + 66;
  const tNext = agents[1].frame;
  const tDrain = tAgent + 10;

  // 강조 문구가 나오면 흐려지고, 후반 장면이 시작되기 전에 자리를 비운다.
  const dim = progress(frame, tNote - 8, 14, ease.inOut);
  const gone = progress(frame, tNext - 14, 12, ease.in);
  const whole = lerp(1, 0.34, dim) * (1 - gone);
  if (whole <= 0) return null;

  const { lines, most } = buildLines(tRain, tProblem, tDrain);
  const binPitch = Math.min(6, (BIN.base - BIN.top - 14) / Math.max(1, most));

  const headP = progress(frame, tRain - 6, 14);
  const tagP = progress(frame, tProblem, 14);
  const tagFlash = frame < tProblem ? 0 : 1 - progress(frame, tProblem + 6, 30, ease.linear);
  const floorP = progress(frame, tRain, 16) * (1 - progress(frame, tDrain - 4, 10));

  const funnelP = progress(frame, tAgent, 18, ease.inOut);
  const pipesP = progress(frame, tAgent + 8, 18, ease.inOut);
  const binsP = progress(frame, tAgent + 12, 16, ease.inOut);
  const knownP = progress(frame, tDrain + 14, 14);
  const slotP = progress(frame, tAgent + 16, 16);

  // 카드: 첫 붉은 줄이 닿을 때 생겨 사람의 자리로 미끄러져 간다.
  const firstRed = lines.filter((l) => l.red)[0];
  const tCard = (firstRed ? firstRed.leave : tDrain + 12) + PASS + TRAVEL - 2;
  const cardP = progress(frame, tCard, 10);
  const slide = progress(frame, tCard + 6, 18, ease.inOut);
  const cardX = RIGHT_X;
  const cardY = lerp(CARD_FROM_Y, SLOT.y + SLOT.h / 2, slide);
  const cardScale = lerp(0.34, 1, slide);

  // 처분
  const tStamp = tHuman + 4;
  const stampP = progress(frame, tStamp, 12);
  const decided = progress(frame, tStamp + 2, 14);
  const drained = progress(frame, tStamp + 8, 22, ease.inOut);
  const cardTint = interpolateColors(drained, [0, 1], [color.problem, color.inkSoft]);
  const cardText = interpolateColors(drained, [0, 1], [color.problem, color.ink]);

  const funnelPath = `M ${CX - FUNNEL.topHalf} ${FUNNEL.top} L ${CX - FUNNEL.neckHalf} ${FUNNEL.shoulder} V ${FUNNEL.neck}`;
  const funnelPathR = `M ${CX + FUNNEL.topHalf} ${FUNNEL.top} L ${CX + FUNNEL.neckHalf} ${FUNNEL.shoulder} V ${FUNNEL.neck}`;
  const slotOutline = 2 * (SLOT.w + SLOT.h);

  return (
    <div style={{ position: "absolute", inset: 0, opacity: whole }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
        fill="none"
      >
        {/* 쌓이는 자리의 바닥. 깔때기가 오면 열린다. */}
        <line
          x1={CX - FUNNEL.topHalf}
          x2={CX + FUNNEL.topHalf}
          y1={FLOOR_Y + 8}
          y2={FLOOR_Y + 8}
          stroke={color.lineStrong}
          strokeWidth={stroke.hair}
          strokeDasharray="4 8"
          opacity={floorP}
        />

        {/* 깔때기 */}
        {funnelP > 0 ? (
          <g stroke={color.agent} strokeWidth={stroke.trace}>
            <path d={funnelPath} pathLength={1} {...draw(funnelP)} />
            <path d={funnelPathR} pathLength={1} {...draw(funnelP)} />
          </g>
        ) : null}

        {/* 갈래: 왼쪽 세 칸, 오른쪽 사람의 자리 */}
        <Trace
          pts={[
            [CX, FUNNEL.neck],
            [CX, BUS_Y],
            [BIN.xs[0], BUS_Y],
            [BIN.xs[0], BIN.top - 4],
          ]}
          stroke={color.lineStrong}
          arrow
          progress={pipesP}
        />
        {[1, 2].map((b) => (
          <Trace
            key={b}
            pts={[
              [BIN.xs[b], BUS_Y],
              [BIN.xs[b], BIN.top - 4],
            ]}
            stroke={color.lineStrong}
            arrow
            progress={sub(pipesP, 0.5, 1)}
          />
        ))}
        <Trace
          pts={[
            [CX, BUS_Y],
            [RIGHT_X, BUS_Y],
            [RIGHT_X, SLOT.y - 4],
          ]}
          stroke={color.lineStrong}
          arrow
          progress={sub(pipesP, 0.2, 1)}
        />
        <Via x={CX} y={BUS_Y} stroke={color.lineStrong} p={sub(pipesP, 0.1, 0.4)} />

        {/* 기존 불량의 세 칸 */}
        {binsP > 0
          ? BIN.xs.map((x, b) => (
              <path
                key={b}
                d={`M ${x - BIN.w / 2} ${BIN.top + 6} V ${BIN.base} H ${x + BIN.w / 2} V ${BIN.top + 6}`}
                stroke={color.lineStrong}
                strokeWidth={stroke.hair}
                pathLength={1}
                {...draw(sub(binsP, b * 0.15, 0.7 + b * 0.15))}
              />
            ))
          : null}

        {/* 사람의 자리 */}
        {slotP > 0 ? (
          <>
            <rect
              x={SLOT.x + 1}
              y={SLOT.y + 1}
              width={SLOT.w - 2}
              height={SLOT.h - 2}
              stroke={color.human}
              strokeWidth={stroke.thin}
              strokeDasharray="8 7"
              opacity={slotP * (1 - decided) * 0.9}
            />
            {decided > 0 ? (
              <rect
                x={SLOT.x + 1}
                y={SLOT.y + 1}
                width={SLOT.w - 2}
                height={SLOT.h - 2}
                stroke={color.human}
                strokeWidth={stroke.trace}
                {...draw(decided, slotOutline)}
              />
            ) : null}
          </>
        ) : null}

        {/* 로그 줄 */}
        {lines.map((l) => {
          if (frame < l.spawn) return null;
          const s = stateOf(l, frame, binPitch);
          if (s.alpha <= 0) return null;
          return (
            <line
              key={l.i}
              x1={-s.len / 2}
              x2={s.len / 2}
              y1={0}
              y2={0}
              transform={`translate(${s.x} ${s.y}) rotate(${s.rot})`}
              stroke={l.red ? color.problem : color.inkDim}
              strokeWidth={l.red ? 3.5 : 3}
              strokeDasharray={s.loose ? l.dash : undefined}
              opacity={s.alpha * (l.red ? 1 : s.loose ? 0.7 : 0.85)}
            />
          );
        })}
      </svg>

      {/* 머리: 이름과 문제 꼬리표 */}
      <At x={0} y={20} align="left" opacity={headP} dy={(1 - headP) * 8}>
        <span style={{ ...sans(size.small, 600), color: color.inkSoft }}>{L.logs}</span>
      </At>
      <At x={width} y={20} align="right" opacity={tagP} dy={(1 - tagP) * -8}>
        <div
          style={{
            ...mono(size.label, 700),
            color: color.problem,
            border: `${stroke.hair}px solid ${color.problem}`,
            backgroundColor: withAlpha(color.problem, 0.08 + 0.2 * tagFlash),
            padding: "3px 10px",
          }}
        >
          LOT C · &gt;2 ms
        </div>
      </At>

      <At x={BIN.xs[1]} y={BIN.base + 30} opacity={knownP} dy={(1 - knownP) * 8}>
        <span style={{ ...sans(size.small, 600), color: color.inkSoft }}>{L.known}</span>
      </At>

      {/* 사람 표식 */}
      <div style={{ position: "absolute", left: SLOT.x, top: SLOT.y - 36, opacity: slotP }}>
        <HumanIcon size={26} color={color.human} width={2.5} />
      </div>

      {/* 카드 */}
      {cardP > 0 ? (
        <div
          style={{
            position: "absolute",
            left: cardX - CARD.w / 2,
            top: cardY - CARD.h / 2,
            width: CARD.w,
            height: CARD.h,
            boxSizing: "border-box",
            transform: `scale(${cardScale})`,
            opacity: cardP,
            backgroundColor: color.panel,
            border: `${stroke.trace}px solid ${cardTint}`,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: withAlpha(color.problem, 0.14 * (1 - drained)),
            }}
          />
          <div
            style={{
              position: "relative",
              height: "100%",
              boxSizing: "border-box",
              padding: "8px 16px 0 16px",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <div style={{ ...sans(size.small, 700), lineHeight: "40px", whiteSpace: "nowrap", color: cardText }}>
              {L.fresh}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, opacity: sub(slide, 0.5, 1) }}>
              <div style={{ ...mono(size.label, 500), color: color.inkDim, marginRight: 4 }}>FIX</div>
              {OPTIONS.map((name, i) => {
                const on = i === CHOSEN ? decided : 0;
                return (
                  <div
                    key={name}
                    style={{
                      width: 44,
                      height: 32,
                      boxSizing: "border-box",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      ...mono(size.label, 700),
                      letterSpacing: "0",
                      color: interpolateColors(on, [0, 1], [color.inkSoft, color.human]),
                      border: `${stroke.hair}px solid ${interpolateColors(on, [0, 1], [color.lineStrong, color.human])}`,
                      backgroundColor: withAlpha(color.human, 0.16 * on),
                      opacity: i === CHOSEN ? 1 : lerp(1, 0.5, decided),
                    }}
                  >
                    {name}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {/* 처분 표시 */}
      {stampP > 0 ? (
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{ position: "absolute", inset: 0, overflow: "visible" }}
          fill="none"
        >
          <g
            opacity={stampP}
            transform={`translate(${SLOT.x + SLOT.w - 36} ${SLOT.y + 36}) scale(${lerp(1.35, 1, stampP)})`}
            stroke={color.human}
          >
            <circle r={23} fill={color.panel} strokeWidth={stroke.trace} />
            <circle r={23} fill={withAlpha(color.human, 0.14)} stroke="none" />
            <path d="M -11 1 L -3 9 L 12 -8" strokeWidth={stroke.bold} pathLength={1} {...draw(sub(stampP, 0.3, 1))} />
          </g>
        </svg>
      ) : null}
    </div>
  );
};
