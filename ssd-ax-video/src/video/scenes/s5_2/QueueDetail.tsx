import React from "react";
import { interpolateColors, useCurrentFrame } from "remotion";
import { clamp01, draw, ease, enterSvg, lerp, progress, pulse, sub } from "../../anim";
import { Trace } from "../../components";
import { FIG } from "../../content";
import { color, stroke, withAlpha } from "../../theme";
import { Label } from "./Label";

// S5-2 아래쪽: 고른 구조의 한 부분(상세도).
//
//   host read [h][g][g][g][g][g] ─▶ ┌──────────────┐
//                                   │ soft decoder │      문제: host read 가 GC read 뒤에 밀린다
//   host read ──────────── [h] ─▶  └──────────────┘      해결: 우선 큐가 생기고 host read 가 먼저 들어간다
//
//   READ LATENCY ▇▇▇▇▇▇▇▇▇▇┆▇▇▇                          기준선을 넘으면 붉어지고, 해결되면 기준선 아래로 내려온다
//                      P99.99 기준

const L = FIG["S5-2"];

/** 상세도의 테두리. 위쪽 변에 지시선이 닿는다. */
export const DETAIL = { x: 1, y: 298, w: 678, h: 184 } as const;

const DEC = { x: 456, y: 352, w: 216, h: 116 } as const;
const MAIN = DEC.y + DEC.h / 2 - 28; // 기존 큐의 세로 중심
const PRIO = DEC.y + DEC.h / 2 + 28; // 우선 큐
const LANE = { x0: 156, x1: 428, half: 20 } as const;
const TOKEN = { w: 36, h: 28, pitch: 44 } as const;
/** 큐의 k번째 자리(0이 맨 앞)의 왼쪽 x */
const slotX = (k: number): number => LANE.x1 - 8 - TOKEN.w - k * TOKEN.pitch;
const GC_COUNT = 5;
const ENTRY_X = LANE.x0 - 6;
const INSIDE_X = DEC.x + 10;

const BAR = { x: 0, y: 520, h: 24, w: 672 } as const;
const LIMIT = 400; // 기준선
const OVER = 560; // 문제일 때의 지연
const SETTLED = 292; // 해결 뒤의 지연
/** 해결 뒤에 이어서 오는 host read 들 (해결 시점에서의 프레임) */
const LATER = [70, 106] as const;

const Lane: React.FC<{ cy: number; tint: string; p: number }> = ({ cy, tint, p }) =>
  p <= 0 ? null : (
    <g>
      {[cy - LANE.half, cy + LANE.half].map((y) => (
        <line
          key={y}
          x1={LANE.x0}
          x2={LANE.x0 + (LANE.x1 - LANE.x0) * p}
          y1={y}
          y2={y}
          stroke={tint}
          strokeWidth={stroke.thin}
        />
      ))}
      <Trace
        pts={[
          [LANE.x1 + 2, cy],
          [DEC.x - 2, cy],
        ]}
        stroke={tint}
        width={stroke.thin}
        arrow
        progress={sub(p, 0.6, 1)}
      />
    </g>
  );

export const QueueDetail: React.FC<{
  /** 상세도가 그려지기 시작하는 프레임 (문제가 나오기 조금 전) */
  setupAt: number;
  problemAt: number;
  resolvedAt: number;
}> = ({ setupAt, problemAt, resolvedAt }) => {
  const frame = useCurrentFrame();

  const box = progress(frame, setupAt + 6, 18);
  if (box <= 0) return null;
  const decoder = progress(frame, setupAt + 10, 16);
  const lane = progress(frame, setupAt + 14, 14);
  const gauge = progress(frame, setupAt + 16, 16);

  // ── host read ──
  const hostIn = progress(frame, problemAt + 4, 12);
  const drop = progress(frame, resolvedAt + 6, 14, ease.inOut);
  const slide = progress(frame, resolvedAt + 18, 16, ease.inOut);
  const enter = progress(frame, resolvedAt + 34, 8, ease.in);
  const hostX = lerp(lerp(lerp(ENTRY_X, slotX(GC_COUNT), hostIn), slotX(0), slide), INSIDE_X, enter);
  const hostCy = lerp(MAIN, PRIO, drop);
  // 뒤이어 오는 host read 는 우선 큐로 곧장 지나간다.
  const later = LATER.map((delay) => {
    const run = progress(frame, resolvedAt + delay, 18, ease.inOut);
    const inside = progress(frame, resolvedAt + delay + 18, 8, ease.in);
    return { x: lerp(lerp(ENTRY_X, slotX(0), run), INSIDE_X, inside), opacity: sub(run, 0, 0.3) * (1 - inside) };
  });
  // host read 가 들어가는 순간 decoder 가 잠깐 밝아진다.
  const flash = (at: number): number =>
    progress(frame, resolvedAt + at, 8) * (1 - progress(frame, resolvedAt + at + 12, 20, ease.linear));
  const served = Math.max(flash(36), ...LATER.map((delay) => flash(delay + 20)));

  // ── GC read ──
  const busyEnd = resolvedAt + 56;
  const busy = progress(frame, problemAt + 4, busyEnd - problemAt - 4, ease.linear);
  const frontOut = progress(frame, busyEnd, 10, ease.in);
  const shift = progress(frame, busyEnd + 2, 14, ease.inOut);
  const busyNext = progress(frame, busyEnd + 16, 150, ease.linear);

  // ── 지연 막대 ──
  const grow = progress(frame, problemAt - 4, 32, ease.linear);
  const shrink = progress(frame, resolvedAt + 26, 24, ease.inOut);
  const latency = lerp(OVER * grow, SETTLED, shrink);
  const over = clamp01((latency - LIMIT) / 16);
  const calm = interpolateColors(shrink, [0, 1], [color.inkSoft, color.ink]);
  const tint = interpolateColors(over, [0, 1], [calm, color.problem]);
  const stuck = over * (1 - drop);

  const prio = progress(frame, resolvedAt + 2, 14);
  const gcCx = (slotX(GC_COUNT - 1) + slotX(0) + TOKEN.w) / 2;

  return (
    <g>
      {/* 테두리 */}
      <rect
        x={DETAIL.x}
        y={DETAIL.y}
        width={DETAIL.w}
        height={DETAIL.h}
        fill={withAlpha(color.panel, 0.45 * box)}
        stroke={color.line}
        strokeWidth={stroke.thin}
        {...(box < 1 ? draw(box, 2 * (DETAIL.w + DETAIL.h)) : {})}
      />
      <g opacity={sub(box, 0.4, 1)}>
        <rect x={12} y={DETAIL.y - 14} width={106} height={28} fill={color.bg} />
        <Label x={18} y={DETAIL.y} text="DETAIL" deco />
      </g>

      {/* soft decoder */}
      <g opacity={decoder}>
        <rect
          x={DEC.x}
          y={DEC.y}
          width={DEC.w}
          height={DEC.h}
          fill={withAlpha(color.ink, 0.04 + 0.1 * served)}
          stroke={interpolateColors(served, [0, 1], [color.inkSoft, color.ink])}
          strokeWidth={lerp(stroke.thin, stroke.bold, served)}
          {...(decoder < 1 ? draw(decoder, 2 * (DEC.w + DEC.h)) : {})}
        />
        <Label x={DEC.x + DEC.w / 2} y={DEC.y + DEC.h / 2} text={L.queue.decoder} anchor="middle" fill={color.ink} />
      </g>

      {/* 큐 */}
      <Lane cy={MAIN} tint={color.lineStrong} p={lane} />
      <Lane cy={PRIO} tint={color.resolved} p={prio} />

      {/* GC read 요청들 */}
      {Array.from({ length: GC_COUNT }, (_, j) => {
        const arrive = progress(frame, problemAt - 12 + j * 3, 12);
        if (arrive <= 0) return null;
        const home = j === 0 ? lerp(slotX(0), INSIDE_X, frontOut) : lerp(slotX(j), slotX(j - 1), shift);
        const x = lerp(ENTRY_X, home, arrive);
        const fill = j === 0 ? busy : j === 1 ? busyNext : 0;
        return (
          <g key={j} opacity={sub(arrive, 0, 0.4) * (j === 0 ? 1 - frontOut : 1)}>
            <rect
              x={x}
              y={MAIN - TOKEN.h / 2}
              width={TOKEN.w}
              height={TOKEN.h}
              fill={withAlpha(color.inkSoft, 0.1)}
              stroke={color.inkDim}
              strokeWidth={stroke.thin}
            />
            {/* 처리 중: 맨 앞 요청이 천천히 찬다 */}
            {fill > 0 ? (
              <rect
                x={x + 3}
                y={MAIN - TOKEN.h / 2 + 3}
                width={(TOKEN.w - 6) * fill}
                height={TOKEN.h - 6}
                fill={withAlpha(color.inkSoft, 0.5)}
              />
            ) : null}
          </g>
        );
      })}
      <g {...enterSvg(frame, problemAt - 6, { distance: 8 })}>
        <Label x={gcCx} y={DETAIL.y + 34} text={L.queue.gc} anchor="middle" />
      </g>

      {/* host read 요청 */}
      {hostIn > 0 && enter < 1 ? (
        <g opacity={sub(hostIn, 0, 0.4) * (1 - enter)}>
          {stuck > 0 ? (
            (() => {
              const ring = pulse(frame, problemAt + 16, 36);
              const grow2 = 5 + ring * 9;
              return (
                <rect
                  x={hostX - grow2}
                  y={hostCy - TOKEN.h / 2 - grow2}
                  width={TOKEN.w + grow2 * 2}
                  height={TOKEN.h + grow2 * 2}
                  fill="none"
                  stroke={color.problem}
                  strokeWidth={stroke.thin}
                  opacity={stuck * 0.7 * (1 - ring)}
                />
              );
            })()
          ) : null}
          <rect
            x={hostX}
            y={hostCy - TOKEN.h / 2}
            width={TOKEN.w}
            height={TOKEN.h}
            fill={interpolateColors(stuck, [0, 1], [color.ink, color.problem])}
          />
        </g>
      ) : null}
      {later.map((token, i) =>
        token.opacity <= 0 ? null : (
          <rect
            key={i}
            x={token.x}
            y={PRIO - TOKEN.h / 2}
            width={TOKEN.w}
            height={TOKEN.h}
            fill={color.ink}
            opacity={token.opacity}
          />
        ),
      )}
      <g {...enterSvg(frame, problemAt + 6, { from: "right", distance: 8 })}>
        <Label x={LANE.x0 - 12} y={hostCy} text={L.queue.host} anchor="end" fill={color.ink} />
      </g>

      {/* 지연 막대와 기준선 */}
      <g opacity={gauge}>
        <Label x={BAR.x} y={BAR.y - 17} text="READ LATENCY" deco />
        <rect
          x={BAR.x + 1}
          y={BAR.y}
          width={BAR.w - 1}
          height={BAR.h}
          fill="none"
          stroke={color.line}
          strokeWidth={stroke.hair}
        />
        {latency > 0 ? (
          <>
            <rect
              x={BAR.x + 1}
              y={BAR.y}
              width={Math.max(0, latency - 1)}
              height={BAR.h}
              fill={tint}
              fillOpacity={0.3}
              stroke={tint}
              strokeWidth={stroke.thin}
            />
            {latency > LIMIT ? (
              <rect x={LIMIT} y={BAR.y} width={latency - LIMIT} height={BAR.h} fill={color.problem} opacity={over} />
            ) : null}
          </>
        ) : null}
        <line
          x1={LIMIT}
          x2={LIMIT}
          y1={BAR.y - 12}
          y2={BAR.y + BAR.h + 14}
          stroke={color.ink}
          strokeWidth={stroke.thin}
          strokeDasharray="6 5"
        />
        <Label x={LIMIT} y={BAR.y + BAR.h + 40} text={L.limit} anchor="middle" />
      </g>
    </g>
  );
};
