import React from "react";
import { useCurrentFrame } from "remotion";
import { draw, ease, enterExit, lerp, progress, sub } from "../../anim";
import { Trace } from "../../components/Trace";
import { FIG } from "../../content";
import { color, mono, sans, size, stroke, withAlpha } from "../../theme";
import { CUT_ENDS } from "./LongRun";
import { X, Y, ZOOM, mix } from "./layout";

// 확대 창: 고장 시점을 시간축으로 늘려 본 모습. 줄의 높이는 왼쪽의 두 줄과 같다.
//
//   IRQ     HW 의 완료 펄스 두 개가 짧은 간격으로 온다
//   STATUS  HW 와 FW 사이의 status 비트 하나. 두 완료가 같은 칸에 겹친다  →  뒤에 큐 네 칸으로 바뀐다
//   ISR     FW 가 처리한 완료. 비트를 읽고 지우는 것은 두 번째 펄스보다 뒤다. 한 건만 처리되고 한 건은 빈칸으로 남는다
//
//   교차 분석   창이 열리고 IRQ 두 개와 ISR 한 칸이 보인다 (관찰)
//   원인 가설   두 펄스가 비트 하나로 들어가 겹치고, 빈칸에 "1건 유실" (설명)
//   사람의 결정 비트가 큐 네 칸으로 바뀌고, 겹쳐 있던 두 완료가 각자의 칸으로 갈라진다
//   해결        둘 다 FW 로 전달된다. 붉은색이 빠진다

const LABELS = FIG["S5-5"];
const PITCH = 40; // 완료 펄스의 간격 = 큐 한 칸의 폭
const CELL_H = 40;
const BIT = 18; // 칸에 들어간 완료 한 건
const MARK = { w: 32, h: 24 } as const;

export const Zoom: React.FC<{
  /** 창의 왼쪽 끝 */
  x: number;
  crossAt: number;
  hypothesisAt: number;
  decisionAt: number;
  resolvedAt: number;
}> = ({ x, crossAt, hypothesisAt, decisionAt, resolvedAt }) => {
  const frame = useCurrentFrame();
  if (frame < crossAt) return null;

  // ── 자리 ──
  const labelX = x + 14;
  const x0 = x + 116; // 줄이 시작하는 곳
  const x1 = x + ZOOM.w - 14;
  const p1 = x0 + 38; // 첫 완료 펄스의 중심
  const p2 = p1 + PITCH;
  const boxX = p1 - PITCH / 2;
  const boxMid = boxX + PITCH;
  const r1 = boxX + PITCH * 4 + 22; // FW 가 처리한 첫 건
  const r2 = r1 + 44; // 두 번째 건의 자리
  const irqLow = Y.hw + 10;
  const irqHigh = Y.hw - 14;
  const cellTop = Y.mid - CELL_H / 2;
  const markTop = Y.fw - MARK.h / 2;

  // ── 시점 ──
  const fan = progress(frame, crossAt + 6, 12);
  const open = progress(frame, crossAt + 10, 16, ease.inOut);
  const rows = progress(frame, crossAt + 24, 16, ease.inOut);
  const mark1 = progress(frame, crossAt + 36, 10);

  const box = progress(frame, hypothesisAt, 12);
  const arrow1 = progress(frame, hypothesisAt + 8, 8);
  const bitA = progress(frame, hypothesisAt + 14, 8);
  const arrow2 = progress(frame, hypothesisAt + 16, 8);
  const bitB = progress(frame, hypothesisAt + 22, 8);
  const clash = progress(frame, hypothesisAt + 22, 20);
  const read = progress(frame, hypothesisAt + 28, 12);
  const ghost = progress(frame, hypothesisAt + 36, 10);

  const queue = progress(frame, decisionAt, 20, ease.inOut);
  const split = progress(frame, decisionAt + 14, 16, ease.inOut); // 두 건이 각자의 칸으로

  const calm = progress(frame, resolvedAt, 14); // 붉은색이 빠진다
  const read2 = progress(frame, resolvedAt + 12, 12);
  const delivered = progress(frame, resolvedAt + 22, 10);

  const boxW = lerp(PITCH * 2, PITCH * 4, queue);
  const boxStroke = queue > 0 ? mix(color.ink, color.human, sub(queue, 0, 0.5)) : color.ink;
  const secondStroke = calm > 0 ? mix(color.problem, color.inkSoft, calm) : color.problem;
  const aX = lerp(boxMid - 5, p1, split);
  const bX = lerp(boxMid + 5, p2, split);

  const irq = `M ${x0} ${irqLow} H ${p1 - 10} V ${irqHigh} H ${p1 + 10} V ${irqLow} H ${p2 - 10} V ${irqHigh} H ${
    p2 + 10
  } V ${irqLow} H ${x1}`;

  const rowLabel = (y: number, p: number): React.CSSProperties => ({
    position: "absolute",
    left: labelX,
    top: y - 14,
    lineHeight: "28px",
    ...mono(size.label, 500),
    color: color.inkDim,
    opacity: p,
  });

  return (
    <>
      <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {/* 세로선에서 창으로 벌어지는 선 */}
        {fan > 0 ? (
          <g stroke={color.lineStrong} strokeWidth={stroke.hair}>
            <line
              x1={X.cut}
              y1={CUT_ENDS.top}
              x2={lerp(X.cut, x, fan)}
              y2={lerp(CUT_ENDS.top, ZOOM.y, fan)}
            />
            <line
              x1={X.cut}
              y1={CUT_ENDS.bottom}
              x2={lerp(X.cut, x, fan)}
              y2={lerp(CUT_ENDS.bottom, ZOOM.y + ZOOM.h, fan)}
            />
          </g>
        ) : null}

        {/* 창 */}
        {open > 0 ? (
          <rect
            x={x}
            y={ZOOM.y}
            width={ZOOM.w * open}
            height={ZOOM.h}
            fill={withAlpha(color.panel, 0.7)}
            stroke={color.lineStrong}
            strokeWidth={stroke.thin}
          />
        ) : null}

        {/* FW 쪽 줄 */}
        {rows > 0 ? (
          <line
            x1={x0}
            x2={lerp(x0, x1, rows)}
            y1={Y.fw}
            y2={Y.fw}
            stroke={color.lineStrong}
            strokeWidth={stroke.hair}
          />
        ) : null}

        {/* HW 쪽 줄: 완료 펄스 두 개 */}
        <path
          d={irq}
          fill="none"
          stroke={color.inkSoft}
          strokeWidth={stroke.trace}
          strokeLinejoin="miter"
          pathLength={1}
          {...draw(rows)}
        />

        {/* 비트 → 큐 */}
        {box > 0 ? (
          <g fill="none" stroke={boxStroke} strokeWidth={stroke.thin}>
            <rect
              x={boxX}
              y={cellTop}
              width={boxW}
              height={CELL_H}
              fill={withAlpha(color.bg, 0.6)}
              {...(box < 1 ? draw(box, 2 * (boxW + CELL_H)) : {})}
            />
            {queue > 0
              ? [1, 2, 3].map((n) => {
                  const dx = boxX + PITCH * n;
                  if (dx > boxX + boxW - 2) return null;
                  const grow = n === 1 ? sub(queue, 0, 0.5) : 1;
                  return (
                    <line
                      key={n}
                      x1={dx}
                      x2={dx}
                      y1={Y.mid - (CELL_H / 2) * grow}
                      y2={Y.mid + (CELL_H / 2) * grow}
                    />
                  );
                })
              : null}
          </g>
        ) : null}

        {/* 완료 → 칸 */}
        <Trace
          pts={[
            [p1, irqLow + 5],
            [p1, cellTop - 1],
          ]}
          stroke={color.inkSoft}
          width={stroke.thin}
          arrow
          progress={arrow1}
        />
        <Trace
          pts={[
            [p2, irqLow + 5],
            [p2, cellTop - 1],
          ]}
          stroke={secondStroke}
          width={stroke.thin}
          arrow
          progress={arrow2}
        />

        {/* 칸에 들어간 완료 두 건. 비트 하나일 때는 같은 자리에 겹친다. */}
        {bitA > 0 ? (
          <rect
            x={aX - BIT / 2}
            y={Y.mid - BIT / 2}
            width={BIT}
            height={BIT}
            fill={color.inkSoft}
            opacity={bitA}
          />
        ) : null}
        {bitB > 0 ? (
          <g>
            <rect
              x={bX - BIT / 2}
              y={Y.mid - BIT / 2}
              width={BIT}
              height={BIT}
              fill={color.inkSoft}
              opacity={calm}
            />
            <rect
              x={bX - BIT / 2}
              y={Y.mid - BIT / 2}
              width={BIT}
              height={BIT}
              fill={withAlpha(color.problem, 0.4)}
              stroke={color.problem}
              strokeWidth={stroke.thin}
              opacity={bitB * (1 - calm)}
            />
          </g>
        ) : null}
        {clash > 0 && clash < 1 ? (
          <circle
            cx={boxMid}
            cy={Y.mid}
            r={lerp(14, 34, clash)}
            fill="none"
            stroke={color.problem}
            strokeWidth={stroke.thin}
            opacity={0.8 * (1 - clash)}
          />
        ) : null}

        {/* 칸 → FW */}
        <Trace
          pts={[
            [boxX + boxW, Y.mid],
            [r1, Y.mid],
            [r1, markTop - 2],
          ]}
          stroke={color.inkSoft}
          width={stroke.thin}
          arrow
          progress={read}
        />
        <Trace
          pts={[
            [r1 - 10, Y.mid],
            [r2, Y.mid],
            [r2, markTop - 2],
          ]}
          stroke={color.inkSoft}
          width={stroke.thin}
          arrow
          progress={read2}
        />

        {/* FW 가 처리한 완료 */}
        {mark1 > 0 ? (
          <g opacity={mark1}>
            <rect x={r1 - MARK.w / 2} y={markTop} width={MARK.w} height={MARK.h} fill={color.panel} />
            <rect
              x={r1 - MARK.w / 2}
              y={markTop}
              width={MARK.w}
              height={MARK.h}
              fill={withAlpha(color.inkSoft, 0.22)}
              stroke={color.ink}
              strokeWidth={stroke.thin}
            />
          </g>
        ) : null}
        {/* 두 번째 건: 처음에는 빈칸(유실), 큐로 바뀐 뒤에는 전달된다 */}
        {ghost > 0 ? (
          <g>
            <rect x={r2 - MARK.w / 2} y={markTop} width={MARK.w} height={MARK.h} fill={color.panel} opacity={ghost} />
            <rect
              x={r2 - MARK.w / 2}
              y={markTop}
              width={MARK.w}
              height={MARK.h}
              fill={withAlpha(color.problem, 0.1)}
              stroke={color.problem}
              strokeWidth={stroke.thin}
              strokeDasharray="5 4"
              opacity={ghost * (1 - delivered)}
            />
            <rect
              x={r2 - MARK.w / 2}
              y={markTop}
              width={MARK.w}
              height={MARK.h}
              fill={withAlpha(color.inkSoft, 0.22)}
              stroke={color.ink}
              strokeWidth={stroke.thin}
              opacity={delivered}
            />
          </g>
        ) : null}
      </svg>

      {/* 줄 이름 (영문 장식 라벨) */}
      <div style={rowLabel(Y.hw, rows)}>IRQ</div>
      <div style={rowLabel(Y.fw, rows)}>ISR</div>
      <div style={rowLabel(Y.mid, box * (1 - sub(queue, 0, 0.4)))}>STATUS</div>
      <div
        style={{
          position: "absolute",
          left: labelX,
          top: Y.mid - 19,
          lineHeight: "38px",
          ...sans(size.small, 700),
          color: color.human,
          opacity: sub(queue, 0.4, 1),
        }}
      >
        {LABELS.queue}
      </div>

      {/* 사라진 한 건 */}
      <div
        style={{
          position: "absolute",
          left: x1 - 200,
          width: 200,
          top: Y.fw + 18,
          textAlign: "right",
          lineHeight: "38px",
          ...sans(size.small, 700),
          whiteSpace: "nowrap",
          color: color.problem,
          ...enterExit(frame, hypothesisAt + 40, resolvedAt + 4, { distance: 8, from: "down" }),
        }}
      >
        {LABELS.lost}
      </div>
    </>
  );
};
