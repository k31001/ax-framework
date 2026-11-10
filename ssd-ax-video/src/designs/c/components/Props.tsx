// 도구 화면 소품: regression 묶음, 파형 띠. 분위기와 구체성을 주는 그림이며 읽는 글자가 아니다.
// 소품의 숫자는 본문과 맞춘다(실패 312건, 묶음 4개).

import { C, MONO_TXT, T } from "../theme";

/** 실패 312건을 원인별 묶음 4개로 나눈 건수. 합은 312. */
export const CLUSTER_COUNTS = [148, 87, 52, 25] as const;

const GOLDEN = Math.PI * (3 - Math.sqrt(5));

/** 해바라기 배열로 n개의 점을 원 안에 고르게 채운다. */
const sunflower = (n: number, spacing: number) =>
  Array.from({ length: n }, (_, k) => {
    const r = spacing * Math.sqrt(k + 0.5);
    const a = k * GOLDEN;
    return { x: r * Math.cos(a), y: r * Math.sin(a) };
  });

export const clusterRadius = (n: number, spacing: number) => spacing * Math.sqrt(n) + 3;

/**
 * 실패 건들이 묶음으로 모인 그림. 점 하나가 실패 한 건이다.
 * 영상에서는 흩어진 점이 이 자리로 모인다(점 좌표는 sunflower()가 정한다).
 */
export const RegressionClusters: React.FC<{
  width: number;
  height: number;
  counts?: readonly number[];
  /** 열어 본 묶음. 보라색 고리로 표시한다. */
  selected?: number;
  spacing?: number;
  dot?: number;
  labels?: boolean;
  color?: string;
}> = ({ width, height, counts = CLUSTER_COUNTS, selected, spacing = 3.7, dot = 2.2, labels = true, color = C.problem }) => {
  const radii = counts.map((n) => clusterRadius(n, spacing));
  const total = radii.reduce((a, r) => a + r * 2, 0);
  const gap = (width - total) / (counts.length + 1);
  const labelH = labels ? 26 : 0;
  const cy = (height - labelH) / 2;
  let x = gap;
  return (
    <svg width={width} height={height} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      {counts.map((n, i) => {
        const r = radii[i];
        const cx = x + r;
        x += r * 2 + gap;
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r={r + 5} fill={C.problemSoft} opacity={0.7} />
            {selected === i ? (
              <circle cx={cx} cy={cy} r={r + 9} fill="none" stroke={C.agent} strokeWidth={2.5} strokeDasharray="7 6" />
            ) : null}
            {sunflower(n, spacing).map((p, k) => (
              <circle key={k} cx={cx + p.x} cy={cy + p.y} r={dot} fill={color} />
            ))}
            {labels ? (
              <text
                x={cx}
                y={height - 6}
                textAnchor="middle"
                style={{ ...MONO_TXT, fontSize: T.propSm, fontWeight: 500 }}
                fill={selected === i ? C.agentInk : C.ink3}
              >
                {n}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
};

type Signal = { name: string; /** 반 cycle 단위의 0/1 값 */ bits: number[] };

const bitsFor = (cycles: number, high: number[]) =>
  Array.from({ length: cycles * 2 }, (_, i) => (high.includes(Math.floor(i / 2)) ? 1 : 0));

/** 기본 파형: retry_req와 dec_done이 6번째 cycle에서 겹친다. 앞의 한 쌍은 정상 순서다. */
export const overlapSignals = (cycles: number): Signal[] => [
  { name: "clk", bits: Array.from({ length: cycles * 2 }, (_, i) => (i % 2 === 0 ? 1 : 0)) },
  { name: "retry_req", bits: bitsFor(cycles, [1, 6]) },
  { name: "dec_done", bits: bitsFor(cycles, [3, 6]) },
];

const wavePath = (bits: number[], x0: number, step: number, yLow: number, yHigh: number) => {
  let d = `M ${x0} ${bits[0] ? yHigh : yLow}`;
  bits.forEach((b, i) => {
    const y = b ? yHigh : yLow;
    if (i > 0 && bits[i - 1] !== b) d += ` V ${y}`;
    d += ` H ${x0 + (i + 1) * step}`;
  });
  return d;
};

/**
 * 파형 띠. hit번째 cycle에 겹침 표시(붉은 띠)가 놓인다.
 */
export const Waveform: React.FC<{
  width: number;
  height: number;
  cycles?: number;
  hit?: number;
  labelW?: number;
  labels?: boolean;
}> = ({ width, height, cycles = 9, hit = 6, labelW = 124, labels = true }) => {
  const signals = overlapSignals(cycles);
  const left = labels ? labelW : 0;
  const cw = (width - left) / cycles;
  const rowH = height / signals.length;
  const amp = Math.min(22, rowH * 0.42);
  return (
    <svg width={width} height={height} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      {/* cycle 눈금 */}
      {Array.from({ length: cycles + 1 }, (_, i) => (
        <line key={i} x1={left + i * cw} x2={left + i * cw} y1={0} y2={height} stroke={C.lineSoft} strokeWidth={1.5} />
      ))}
      {/* 겹침 */}
      <rect x={left + hit * cw} y={-4} width={cw} height={height + 8} rx={6} fill={C.problemSoft} />
      <rect
        x={left + hit * cw}
        y={-4}
        width={cw}
        height={height + 8}
        rx={6}
        fill="none"
        stroke={C.problem}
        strokeWidth={2}
        strokeDasharray="6 5"
      />
      {signals.map((s, i) => {
        const mid = rowH * i + rowH / 2;
        const isClk = i === 0;
        return (
          <g key={s.name}>
            {labels ? (
              <text x={0} y={mid + 7} style={{ ...MONO_TXT, fontSize: T.propSm, fontWeight: 500 }} fill={isClk ? C.ink3 : C.ink2}>
                {s.name}
              </text>
            ) : null}
            <path
              d={wavePath(s.bits, left, cw / 2, mid + amp / 2, mid - amp / 2)}
              fill="none"
              stroke={isClk ? C.ink4 : C.ink2}
              strokeWidth={isClk ? 2 : 3}
              strokeLinejoin="round"
            />
          </g>
        );
      })}
    </svg>
  );
};
