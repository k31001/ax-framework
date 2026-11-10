import React from "react";
import { color, mono, size, stroke, withAlpha } from "../theme";

// 신호 파형 한 조각. 두 신호가 같은 cycle에 겹치는 자리를 붉게 표시한다.
// 영상에서는 왼쪽에서 오른쪽으로 그려지고, 겹치는 cycle에서 띠가 켜진다.

export type Signal = {
  /** 영문 장식 라벨 */
  name: string;
  /** 신호가 올라가 있는 cycle 번호들 */
  high: readonly number[];
};

const LABEL_W = 78;

export const Waveform: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  signals: readonly Signal[];
  cycles: number;
  /** 두 신호가 겹치는 cycle */
  overlap: number;
}> = ({ x, y, w, h, signals, cycles, overlap }) => {
  const plotW = w - LABEL_W;
  const cycleW = plotW / cycles;
  const rowH = h / signals.length;
  const amp = rowH - 22; // 신호의 높이
  const cx = (c: number) => LABEL_W + cycleW * c;

  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {/* 겹치는 cycle */}
        <rect x={cx(overlap)} y={-6} width={cycleW} height={h + 12} fill={withAlpha(color.problem, 0.16)} />
        {/* cycle 눈금 */}
        {Array.from({ length: cycles + 1 }, (_, c) => (
          <line
            key={c}
            x1={cx(c) + 0.5}
            x2={cx(c) + 0.5}
            y1={-6}
            y2={h + 6}
            stroke={color.line}
            strokeWidth={stroke.hair}
          />
        ))}
        {signals.map((signal, row) => {
          const low = rowH * row + rowH - 11;
          const top = low - amp;
          let d = `M ${cx(0)} ${low}`;
          let hot = "";
          for (let c = 0; c < cycles; c++) {
            if (signal.high.indexOf(c) >= 0) {
              const pulse = `H ${cx(c)} V ${top} H ${cx(c + 1)} V ${low}`;
              d += ` ${pulse}`;
              if (c === overlap) hot = `M ${cx(c)} ${low} V ${top} H ${cx(c + 1)} V ${low}`;
            }
          }
          d += ` H ${cx(cycles)}`;
          return (
            <g key={signal.name} fill="none" strokeLinejoin="miter">
              <path d={d} stroke={color.inkSoft} strokeWidth={stroke.trace} />
              {hot ? <path d={hot} stroke={color.problem} strokeWidth={stroke.bold} /> : null}
            </g>
          );
        })}
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
          }}
        >
          {signal.name}
        </div>
      ))}
    </div>
  );
};
