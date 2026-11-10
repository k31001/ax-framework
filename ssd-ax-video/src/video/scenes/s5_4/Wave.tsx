import React from "react";
import { draw, sub } from "../../anim";
import { color, mono, size, stroke, withAlpha } from "../../theme";

// 두 신호의 파형 한 조각(승인 스틸의 Waveform 과 같은 모양).
// 두 펄스가 같은 cycle 에 겹치는 자리를 붉은 띠로 표시한다.
// 왼쪽에서 오른쪽으로 그려지고, 해결되면 붉은 띠가 풀리고 그 cycle 을 지키는 테두리만 남는다.

export type WaveSignal = {
  name: string;
  /** 신호가 올라가 있는 cycle 번호들 */
  high: readonly number[];
};

export const Wave: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  /** 신호 이름이 놓이는 폭 */
  labelW: number;
  signals: readonly WaveSignal[];
  cycles: number;
  /** 두 신호가 겹치는 cycle */
  overlap: number;
  /** 이름과 cycle 눈금이 나타나는 정도 0~1 */
  appear: number;
  /** 파형이 그려진 정도 0~1 */
  drawn: number;
  /** 겹치는 cycle 의 붉은 띠가 켜진 정도 0~1 */
  hot: number;
  /** 해결되어 붉은색이 빠진 정도 0~1 */
  cleared: number;
}> = ({ x, y, w, h, labelW, signals, cycles, overlap, appear, drawn, hot, cleared }) => {
  if (appear <= 0) return null;
  const cycleW = (w - labelW) / cycles;
  const rowH = h / signals.length;
  const amp = rowH - 22; // 신호의 높이
  const cx = (c: number): number => labelW + cycleW * c;
  const bandTop = -6;
  const bandH = h + 12;

  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {/* 겹치는 cycle */}
        <rect
          x={cx(overlap)}
          y={bandTop}
          width={cycleW}
          height={bandH}
          fill={withAlpha(color.problem, 0.16 * hot * (1 - cleared))}
        />
        {/* cycle 눈금 */}
        <g opacity={appear}>
          {Array.from({ length: cycles + 1 }, (_, c) => (
            <line
              key={c}
              x1={cx(c)}
              x2={cx(c)}
              y1={bandTop}
              y2={bandTop + bandH}
              stroke={color.line}
              strokeWidth={stroke.hair}
            />
          ))}
        </g>
        {signals.map((signal, row) => {
          const low = rowH * row + rowH - 11;
          const top = low - amp;
          let d = `M ${cx(0)} ${low}`;
          let hotPath = "";
          for (let c = 0; c < cycles; c++) {
            if (signal.high.indexOf(c) >= 0) {
              d += ` H ${cx(c)} V ${top} H ${cx(c + 1)} V ${low}`;
              if (c === overlap) hotPath = `M ${cx(c)} ${low} V ${top} H ${cx(c + 1)} V ${low}`;
            }
          }
          d += ` H ${cx(cycles)}`;
          return (
            <g key={signal.name} fill="none" strokeLinejoin="miter">
              <path d={d} stroke={color.inkSoft} strokeWidth={stroke.trace} pathLength={1} {...draw(drawn)} />
              {hotPath && hot > 0 && cleared < 1 ? (
                <path
                  d={hotPath}
                  stroke={color.problem}
                  strokeWidth={stroke.bold}
                  pathLength={1}
                  opacity={1 - cleared}
                  {...draw(hot)}
                />
              ) : null}
            </g>
          );
        })}
        {/* 해결 뒤: 이 cycle 을 지키는 테두리와 확인 표시(추가된 assertion) */}
        {cleared > 0 ? (
          <g fill="none" stroke={color.resolved}>
            <rect
              x={cx(overlap)}
              y={bandTop}
              width={cycleW}
              height={bandH}
              strokeWidth={stroke.hair}
              pathLength={1}
              {...draw(cleared)}
            />
            <path
              d={`M ${cx(overlap + 0.5) - 7} ${h / 2} l 5 5 l 9 -10`}
              strokeWidth={stroke.trace}
              pathLength={1}
              {...draw(sub(cleared, 0.5, 1))}
            />
          </g>
        ) : null}
      </svg>
      {signals.map((signal, row) => (
        <div
          key={signal.name}
          style={{
            position: "absolute",
            left: 0,
            top: rowH * row,
            height: rowH,
            display: "flex",
            alignItems: "center",
            ...mono(size.label, 500),
            color: color.inkDim,
            opacity: appear,
          }}
        >
          {signal.name}
        </div>
      ))}
    </div>
  );
};
