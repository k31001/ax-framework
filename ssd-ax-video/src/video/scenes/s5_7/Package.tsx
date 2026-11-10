import React from "react";
import { interpolateColors, useCurrentFrame } from "remotion";
import { clamp01, draw, ease, lerp, progress, sub } from "../../anim";
import { CARD, FIG, S5 } from "../../content";
import { TRACK_LOOP_DROP } from "../../components/StageTrack";
import { Trace, Via, traceLength } from "../../components/Trace";
import type { Pt } from "../../components/Trace";
import { TRACK_Y } from "../../stage/layout";
import type { IllustrationProps } from "../../stage/StageScene";
import { color, mono, pad2, sans, size, stroke, withAlpha } from "../../theme";
import { At, hash } from "./util";

// S5-7 후반: 증빙을 꿰어 퀄 패키지로.
//
//   에이전트    위(요구사항 카드 쪽)에서 내려온 한 줄의 trace 에 기록 표식 7개가 구슬처럼 꿰이고,
//               그 줄이 둘레를 한 바퀴 돌아 닫히면서 퀄 패키지의 테두리가 된다. (청록 = 에이전트가 조립)
//   사람        비어 있던 서명 줄에 사람 색으로 서명이 그어진다.
//   기록        카드에 "퀄 증빙"이 붙는 순간 일곱 번째 표식과 패키지가 함께 밝아진다.
//   마무리      패키지에서 위로 짧은 점선이 올라가, 진행 표시가 그리는 닫히는 고리에 닿는다.

const L = FIG["S5-7"];
const RECORDS = S5.length; // 요구사항 카드의 기록 슬롯 수

// ── 자리 (그림 자리 536×616) ───────────────────────────────────────────
const PK = { x: 40, y: 64, w: 456, h: 508 } as const;
const RIGHT = PK.x + PK.w;
const BOTTOM = PK.y + PK.h;
const THREAD_X = 100;
const BEAD = { y0: 110, pitch: 46, s: 28 } as const;
const TIE_Y = 430;
const SIGN = { x: 64, y: 528, x0: 152, x1: 470, base: 548 } as const;
const RETURN_X = 420;

const THREAD: Pt[] = [
  [THREAD_X, 0],
  [THREAD_X, TIE_Y],
  [PK.x, TIE_Y],
  [PK.x, BOTTOM],
  [RIGHT, BOTTOM],
  [RIGHT, PK.y],
  [PK.x, PK.y],
  [PK.x, TIE_Y],
];
const THREAD_LEN = traceLength(THREAD, 10);
const STEM = TIE_Y / THREAD_LEN; // 구슬을 꿰는 세로 구간이 전체에서 차지하는 몫

// 사람이 긋는 서명
const SIGNATURE =
  "M 172 540 C 180 514, 194 500, 202 506 C 211 513, 200 540, 191 546 C 184 550, 192 528, 210 525 " +
  "C 224 523, 221 543, 232 541 C 243 539, 244 521, 255 523 C 264 525, 259 543, 270 541 " +
  "C 281 539, 284 519, 295 523 C 304 526, 299 543, 312 540 C 332 535, 348 514, 376 510 " +
  "C 406 506, 436 516, 456 528";

export const Package: React.FC<IllustrationProps> = ({ width, height, origin, beats, frames }) => {
  const frame = useCurrentFrame();
  const agents = beats.filter((b) => b.kind === "agent");
  const humans = beats.filter((b) => b.kind === "human");
  const tPack = agents[1].frame;
  const tSign = humans[1].frame;
  const tRecord = frames.record;
  const tClose = frames.closing;
  if (frame < tPack) return null;

  // 한 줄: 먼저 구슬을 꿰며 내려오고, 이어서 둘레를 돌아 닫힌다.
  const stem = progress(frame, tPack, 22, ease.inOut);
  const wrap = progress(frame, tPack + 20, 24, ease.inOut);
  const thread = STEM * stem + (1 - STEM) * wrap;
  const headY = THREAD_LEN * thread;
  const closed = sub(wrap, 0.85, 1);

  const nameP = progress(frame, tPack + 34, 14);
  const signLineP = progress(frame, tPack + 38, 14);
  const signed = progress(frame, tSign + 2, 28, ease.inOut);
  const signTint = interpolateColors(progress(frame, tSign, 12), [0, 1], [color.inkDim, color.human]);

  const flash = frame < tRecord ? 0 : 1 - progress(frame, tRecord + 14, 40, ease.linear);
  const flashIn = progress(frame, tRecord, 14);
  const glow = Math.min(flash, flashIn);

  // 닫히는 고리(진행 표시 아래의 점선)의 높이. 그림 자리 좌표.
  const loopY = TRACK_Y + TRACK_LOOP_DROP - origin.y;
  const back = tClose === null ? 0 : progress(frame, tClose + 6, 18, ease.inOut);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
        fill="none"
      >
        {/* 패키지의 면 */}
        <rect
          x={PK.x}
          y={PK.y}
          width={PK.w}
          height={PK.h}
          fill={interpolateColors(glow, [0, 1], [withAlpha(color.panel, 0.7), withAlpha(color.agent, 0.1)])}
          opacity={closed}
        />
        <line
          x1={THREAD_X}
          x2={RIGHT}
          y1={TIE_Y}
          y2={TIE_Y}
          stroke={color.line}
          strokeWidth={stroke.hair}
          opacity={closed}
        />

        {/* 기록마다 이어진 근거 */}
        {Array.from({ length: RECORDS }, (_, i) => {
          const y = BEAD.y0 + i * BEAD.pitch;
          const p = ease.out(clamp01((headY - y + 10) / 60));
          const len = 150 + hash(i * 2.7 + 4.1) * 130;
          const a = 0.25 + hash(i * 1.3 + 0.9) * 0.2;
          const b = 0.2 + hash(i * 3.1 + 2.2) * 0.2;
          const last = i === RECORDS - 1 ? glow : 0;
          return (
            <line
              key={i}
              x1={184}
              x2={184 + len * p}
              y1={y}
              y2={y}
              stroke={interpolateColors(last, [0, 1], [color.lineStrong, color.agent])}
              strokeWidth={3}
              strokeDasharray={`${len * a} 6 ${len * b} 6 ${len}`}
              opacity={p * 0.9}
            />
          );
        })}

        {/* 한 줄의 trace: 꿰고, 돌아서, 닫힌다 */}
        <Trace pts={THREAD} stroke={color.agent} chamfer={10} progress={thread} />
        <Via x={THREAD_X} y={PK.y} stroke={color.agent} p={closed} />

        {/* 구슬: 요구사항 카드의 기록 슬롯과 같은 모양 */}
        {Array.from({ length: RECORDS }, (_, i) => {
          const y = BEAD.y0 + i * BEAD.pitch;
          const p = ease.out(clamp01((headY - y + 14) / 36));
          if (p <= 0) return null;
          const last = i === RECORDS - 1 ? glow : 0;
          const tint = interpolateColors(last, [0, 1], [color.inkSoft, color.agent]);
          const s = BEAD.s * (0.5 + 0.5 * p);
          return (
            <g key={i} opacity={p}>
              <rect
                x={THREAD_X - s / 2}
                y={y - s / 2}
                width={s}
                height={s}
                fill={color.panel}
                stroke={tint}
                strokeWidth={stroke.thin}
              />
              <rect x={THREAD_X - s / 2} y={y - s / 2} width={s} height={s} fill={withAlpha(color.agent, 0.24 * last)} />
              <path
                d={`M ${THREAD_X - 7} ${y + 0.5} L ${THREAD_X - 2.5} ${y + 5} L ${THREAD_X + 7} ${y - 6}`}
                stroke={tint}
                strokeWidth={stroke.trace}
                pathLength={1}
                {...draw(sub(p, 0.4, 1))}
              />
            </g>
          );
        })}

        {/* 서명 줄 */}
        <line
          x1={SIGN.x0}
          x2={lerp(SIGN.x0, SIGN.x1, signLineP)}
          y1={SIGN.base}
          y2={SIGN.base}
          stroke={color.lineStrong}
          strokeWidth={stroke.thin}
          strokeDasharray="3 7"
          opacity={signLineP}
        />
        {signed > 0 ? (
          <path
            d={SIGNATURE}
            stroke={color.human}
            strokeWidth={stroke.bold}
            strokeLinejoin="round"
            pathLength={1}
            {...draw(signed)}
          />
        ) : null}

        {/* 마무리: 패키지에서 닫히는 고리로 */}
        {back > 0 ? (
          <>
            <Trace
              pts={[
                [RETURN_X, PK.y],
                [RETURN_X, loopY + 4],
              ]}
              stroke={color.agent}
              dash="10 8"
              arrow
              progress={back}
            />
            <Via x={RETURN_X} y={PK.y} stroke={color.agent} p={sub(back, 0, 0.4)} />
          </>
        ) : null}
      </svg>

      {/* 이 줄이 어느 요구사항의 것인지 */}
      <At x={THREAD_X + 18} y={26} align="left" opacity={sub(stem, 0.1, 0.5)}>
        <span style={{ ...mono(size.label, 700), color: color.inkDim }}>{CARD.id}</span>
      </At>

      {/* 구슬의 번호 */}
      {Array.from({ length: RECORDS }, (_, i) => {
        const y = BEAD.y0 + i * BEAD.pitch;
        const p = ease.out(clamp01((headY - y + 6) / 44));
        const last = i === RECORDS - 1 ? glow : 0;
        return (
          <At key={i} x={THREAD_X + 28} y={y} align="left" opacity={p} dx={(1 - p) * -8}>
            <span
              style={{
                ...mono(size.label, 700),
                color: interpolateColors(last, [0, 1], [color.inkDim, color.agent]),
              }}
            >
              {pad2(i + 1)}
            </span>
          </At>
        );
      })}

      {/* 패키지 이름 */}
      <At x={SIGN.x} y={472} align="left" opacity={nameP} dy={(1 - nameP) * 10}>
        <span style={{ ...sans(size.body, 700), color: color.ink }}>{L.pack}</span>
      </At>

      {/* 서명 */}
      <At x={SIGN.x} y={SIGN.y} align="left" opacity={signLineP} dy={(1 - signLineP) * 8}>
        <span style={{ ...sans(size.small, 700), color: signTint }}>{L.sign}</span>
      </At>
    </div>
  );
};
