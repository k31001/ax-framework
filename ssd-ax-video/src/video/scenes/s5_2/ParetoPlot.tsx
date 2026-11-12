import React from "react";
import { useCurrentFrame } from "remotion";
import { draw, ease, enterSvg, lerp, progress, sub } from "../../anim";
import { Pad, Trace } from "../../components";
import { FIG } from "../../content";
import { color, stroke } from "../../theme";
import { Label } from "./Label";

// S5-2 가운데: 구성 탐색.
// 면적(가로)·지연(세로) 좌표에 후보 수백 개가 찍히고 Pareto 경계가 그려진다. 사람이 그중 하나를 고른다.
// 처음에는 목적별 모델(ModelViews) 아래에 내려와 있다가, 상세도가 나오기 전에 위로 올라가 자리를 내준다.
// 그 뒤 고른 점에서 아래 상세도(QueueDetail)로 지시선이 내려간다.

const L = FIG["S5-2"];

export const PLOT = { x0: 40, x1: 600, y0: 268, y1: 46 } as const;
const px = (area: number): number => PLOT.x0 + area * (PLOT.x1 - PLOT.x0);
const py = (latency: number): number => PLOT.y0 - latency * (PLOT.y0 - PLOT.y1);

/** 0~1 의 결정적 난수 대용 */
const hash = (n: number): number => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** 면적을 더 쓰면 지연이 줄어드는 한계선 */
const limitOf = (area: number): number => 0.25 + 0.7 * Math.pow(1 - area, 2.4);

type Candidate = { area: number; latency: number; x: number; y: number; order: number; pareto: boolean };

const CLOUD = 260;
const EDGE_AREAS = [0.06, 0.14, 0.22, 0.31, 0.4, 0.5, 0.62, 0.74, 0.86, 0.95];
const CHOSEN_AREA = 0.62;

const candidate = (area: number, latency: number, order: number): Candidate => ({
  area,
  latency,
  x: px(area),
  y: py(latency),
  order,
  pareto: false,
});

const CANDIDATES: Candidate[] = [];
for (let i = 0; i < CLOUD; i++) {
  const area = 0.05 + 0.93 * hash(i * 3 + 1);
  const floor = limitOf(area) + 0.035;
  const latency = floor + (0.97 - floor) * Math.pow(hash(i * 3 + 2), 1.35);
  CANDIDATES.push(candidate(area, latency, hash(i * 3 + 3)));
}
EDGE_AREAS.forEach((area, k) => CANDIDATES.push(candidate(area, limitOf(area), 0.2 + 0.07 * k)));

// Pareto 경계: 면적이 더 작으면서 지연도 더 작은 후보가 없는 점들
const FRONT: Candidate[] = [];
CANDIDATES.slice()
  .sort((a, b) => a.area - b.area)
  .forEach((c) => {
    if (FRONT.length === 0 || c.latency < FRONT[FRONT.length - 1].latency) {
      c.pareto = true;
      FRONT.push(c);
    }
  });
const FRONT_PATH = FRONT.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
const FRONT_SPAN = FRONT[FRONT.length - 1].area - FRONT[0].area;

export const CHOSEN = CANDIDATES.filter((c) => c.area === CHOSEN_AREA)[0];

const LABEL_Y = CHOSEN.y + 34;
const RING = 12;

export const ParetoPlot: React.FC<{
  /** 축이 그려지는 프레임. 후보는 그 뒤에 찍힌다. */
  axesAt: number;
  humanAt: number;
  /** 처음에 내려와 있는 거리(px)와, 제자리로 올라가기 시작하는 프레임 */
  drop: number;
  riseAt: number;
  /** 지시선이 상세도로 내려가기 시작하는 프레임 */
  detailAt: number;
  /** 지시선이 닿는 상세도 위쪽 변의 y */
  detailY: number;
}> = ({ axesAt, humanAt, drop, riseAt, detailAt, detailY }) => {
  const frame = useCurrentFrame();

  const cloudAt = axesAt + 12;
  const axes = progress(frame, axesAt, 18);
  const front = progress(frame, cloudAt + 56, 24, ease.inOut);
  const rise = progress(frame, riseAt, 18, ease.inOut);
  const chosen = progress(frame, humanAt + 6, 14);
  const focus = progress(frame, humanAt + 6, 20); // 고른 뒤에는 나머지 후보가 물러난다
  const recede = progress(frame, detailAt, 20); // 아래 상세도가 나오면 한 번 더 물러난다
  const cloud = lerp(lerp(0.62, 0.36, focus), 0.26, recede);

  // 지시선: 고른 점 → (이름표 높이) → 상세도
  const leaderTop = CHOSEN.y + RING + 2;
  const stop = LABEL_Y + 16;
  const split = (stop - leaderTop) / (detailY - leaderTop);
  const leader =
    split * progress(frame, humanAt + 14, 12) + (1 - split) * progress(frame, detailAt, 14, ease.inOut);

  if (axes <= 0) return null;
  return (
    <g transform={`translate(0 ${drop * (1 - rise)})`}>
      {/* 축 */}
      <g opacity={lerp(1, 0.7, recede)}>
        <Trace
          pts={[
            [PLOT.x0, PLOT.y0],
            [PLOT.x0, PLOT.y1 - 6],
          ]}
          stroke={color.inkSoft}
          width={stroke.thin}
          arrow
          progress={axes}
        />
        <Trace
          pts={[
            [PLOT.x0, PLOT.y0],
            [PLOT.x1 + 4, PLOT.y0],
          ]}
          stroke={color.inkSoft}
          width={stroke.thin}
          arrow
          progress={axes}
        />
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => (
          <line
            key={`x${k}`}
            x1={PLOT.x0 + k * 56}
            x2={PLOT.x0 + k * 56}
            y1={PLOT.y0}
            y2={PLOT.y0 + 7}
            stroke={color.lineStrong}
            strokeWidth={stroke.hair}
            opacity={sub(axes, 0.5, 1)}
          />
        ))}
        {[1, 2, 3].map((k) => (
          <line
            key={`y${k}`}
            x1={PLOT.x0 - 7}
            x2={PLOT.x0}
            y1={PLOT.y0 - k * 56}
            y2={PLOT.y0 - k * 56}
            stroke={color.lineStrong}
            strokeWidth={stroke.hair}
            opacity={sub(axes, 0.5, 1)}
          />
        ))}
        <g {...enterSvg(frame, axesAt + 6, { distance: 8 })}>
          <Label x={PLOT.x0} y={20} text={L.axes.y} anchor="middle" />
          <Label x={PLOT.x1 + 16} y={PLOT.y0} text={L.axes.x} />
        </g>
      </g>

      {/* 후보 수백 개 */}
      <g opacity={cloud}>
        {CANDIDATES.map((c, i) => {
          const p = progress(frame, cloudAt + c.order * 50, 8);
          return p <= 0 ? null : <circle key={i} cx={c.x} cy={c.y} r={2.6} fill={color.inkSoft} opacity={p} />;
        })}
      </g>

      {/* Pareto 경계 */}
      {front > 0 ? (
        <g opacity={lerp(1, 0.6, recede)}>
          <path
            d={FRONT_PATH}
            fill="none"
            stroke={color.agent}
            strokeWidth={stroke.trace}
            strokeLinejoin="round"
            pathLength={1}
            {...draw(front)}
          />
          {FRONT.map((c, i) => {
            const reach = (c.area - FRONT[0].area) / FRONT_SPAN;
            const p = sub(front, reach - 0.04, reach + 0.04);
            return p <= 0 ? null : <circle key={i} cx={c.x} cy={c.y} r={4 * p} fill={color.agent} />;
          })}
        </g>
      ) : null}

      {/* 고른 점 */}
      {chosen > 0 ? (
        <>
          <Trace
            pts={[
              [CHOSEN.x, leaderTop],
              [CHOSEN.x, detailY],
            ]}
            stroke={color.inkSoft}
            width={stroke.thin}
            progress={leader}
          />
          <Pad x={CHOSEN.x} y={detailY} p={progress(frame, detailAt + 12, 8)} />
          <circle cx={CHOSEN.x} cy={CHOSEN.y} r={RING + 2} fill={color.bg} opacity={chosen} />
          <circle
            cx={CHOSEN.x}
            cy={CHOSEN.y}
            r={RING}
            fill="none"
            stroke={color.human}
            strokeWidth={stroke.trace}
            pathLength={1}
            transform={`rotate(-90 ${CHOSEN.x} ${CHOSEN.y})`}
            {...draw(chosen)}
          />
          <circle cx={CHOSEN.x} cy={CHOSEN.y} r={5} fill={color.ink} opacity={chosen} />
          <g {...enterSvg(frame, humanAt + 16, { from: "left", distance: 10 })}>
            <Label x={CHOSEN.x - 14} y={LABEL_Y} text={L.chosen} anchor="end" weight={700} fill={color.ink} />
          </g>
        </>
      ) : null}
    </g>
  );
};
