// 사례 구간의 장면을 작게 다시 보여 주는 소품 창. S6에서 다섯 축 옆에 하나씩 정리된다.
// 글자 없이 그림만으로 읽히게 그린다(머리줄의 mono 글자는 장식).

import { C } from "../theme";
import { Avatar } from "./Avatar";
import { CheckIcon } from "./Icons";
import { RegressionClusters } from "./Props";
import { WindowPanel } from "./WindowPanel";

type SceneProps = { w: number; h: number };

/** 산출물: 계약 하나에서 RTL, header, assertion이 갈라져 나온다 (S5-3). */
const SpecFanout: React.FC<SceneProps> = ({ w, h }) => {
  const docW = 50;
  const x0 = 6;
  const ys = [10, h / 2, h - 10];
  const bx = w - 92;
  return (
    <svg width={w} height={h}>
      <rect x={x0} y={4} width={docW} height={h - 8} rx={7} fill={C.agentSoft} stroke={C.agent} strokeWidth={2.5} />
      {[0.3, 0.5, 0.7].map((t) => (
        <line key={t} x1={x0 + 11} x2={x0 + docW - 11} y1={h * t} y2={h * t} stroke={C.agent} strokeWidth={3} strokeLinecap="round" />
      ))}
      {ys.map((y, i) => (
        <g key={i}>
          <path
            d={`M ${x0 + docW + 4} ${h / 2} C ${x0 + docW + 60} ${h / 2}, ${bx - 60} ${y}, ${bx - 6} ${y}`}
            fill="none"
            stroke={C.ink4}
            strokeWidth={2.5}
          />
          <rect x={bx} y={y - 8} width={86} height={16} rx={5} fill={C.panel} stroke={C.ink4} strokeWidth={2.5} />
          <line x1={bx + 12} x2={bx + 44 + i * 10} y1={y} y2={y} stroke={C.ink3} strokeWidth={2.5} strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
};

/** 프로세스: 7단계가 닫힌 고리가 된다 (S5-7). */
const LoopScene: React.FC<SceneProps> = ({ w, h }) => {
  const r = h / 2 - 8;
  const xl = 12 + r;
  const xr = w - 12 - r;
  const cy = h / 2;
  // 경기장 모양 고리 위에 점 7개
  const top = [0.12, 0.5, 0.88].map((t) => ({ x: xl + (xr - xl) * t, y: cy - r }));
  const bottom = [0.88, 0.5, 0.12].map((t) => ({ x: xl + (xr - xl) * t, y: cy + r }));
  const nodes = [...top, { x: xr + r, y: cy }, ...bottom];
  return (
    <svg width={w} height={h}>
      <path
        d={`M ${xl} ${cy - r} H ${xr} A ${r} ${r} 0 0 1 ${xr} ${cy + r} H ${xl} A ${r} ${r} 0 0 1 ${xl} ${cy - r} Z`}
        fill="none"
        stroke={C.agent}
        strokeWidth={3}
      />
      <path
        d={`M ${xl - r - 7} ${cy + 6} L ${xl - r} ${cy - 3} L ${xl - r + 7} ${cy + 6}`}
        fill="none"
        stroke={C.agent}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {nodes.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={7} fill={C.panel} stroke={C.agent} strokeWidth={3} />
      ))}
    </svg>
  );
};

/** 업무 방식: 묶인 증거를 보고 사람이 판단한다 (S5-4). */
const EvidenceScene: React.FC<SceneProps> = ({ w, h }) => (
  <div style={{ position: "relative", width: w, height: h }}>
    <RegressionClusters width={w - 96} height={h} counts={[36, 22, 13, 7]} labels={false} spacing={3} dot={1.8} />
    <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
      <path d={`M ${w - 92} ${h / 2} H ${w - 68}`} stroke={C.ink4} strokeWidth={2.5} strokeDasharray="5 5" />
    </svg>
    <div style={{ position: "absolute", left: w - 58, top: h / 2 - 22 }}>
      <Avatar role="human" size={44} />
    </div>
    <div
      style={{
        position: "absolute",
        left: w - 24,
        top: h / 2 - 32,
        width: 24,
        height: 24,
        borderRadius: "50%",
        backgroundColor: C.resolved,
        border: `2.5px solid ${C.panel}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <CheckIcon size={14} color="#FFFFFF" stroke={3.6} />
    </div>
  </div>
);

/** 시스템: 흩어진 도구가 하나의 플랫폼에 붙는다. */
const HubScene: React.FC<SceneProps> = ({ w, h }) => {
  const cx = w / 2;
  const cy = h / 2;
  const sats = [
    { x: 22, y: 14 },
    { x: 14, y: h - 14 },
    { x: w * 0.3, y: h / 2 + 4 },
    { x: w * 0.7, y: h / 2 - 4 },
    { x: w - 14, y: 14 },
    { x: w - 22, y: h - 14 },
  ];
  return (
    <svg width={w} height={h}>
      {sats.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={C.ink4} strokeWidth={2.5} />
      ))}
      {sats.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={9} fill={C.panel} stroke={C.ink3} strokeWidth={2.5} />
      ))}
      <rect x={cx - 24} y={cy - 24} width={48} height={48} rx={13} fill={C.agent} />
      <path
        d={`M ${cx} ${cy - 13} C ${cx + 1} ${cy - 4}, ${cx + 4} ${cy - 1}, ${cx + 13} ${cy} C ${cx + 4} ${cy + 1}, ${cx + 1} ${cy + 4}, ${cx} ${cy + 13} C ${cx - 1} ${cy + 4}, ${cx - 4} ${cy + 1}, ${cx - 13} ${cy} C ${cx - 4} ${cy - 1}, ${cx - 1} ${cy - 4}, ${cx} ${cy - 13} Z`}
        fill="#FFFFFF"
      />
    </svg>
  );
};

/** 문화: 측정한 값이 쌓이며 올라간다. */
const MetricsScene: React.FC<SceneProps> = ({ w, h }) => {
  const vals = [0.2, 0.26, 0.24, 0.4, 0.5, 0.62, 0.86];
  const pts = vals.map((v, i) => ({ x: 10 + (i * (w - 20)) / (vals.length - 1), y: h - 8 - v * (h - 18) }));
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  return (
    <svg width={w} height={h}>
      {[0.25, 0.5, 0.75].map((t) => (
        <line key={t} x1={4} x2={w - 4} y1={h * t} y2={h * t} stroke={C.lineSoft} strokeWidth={2} />
      ))}
      <path d={`${d} L ${w - 10} ${h - 4} L 10 ${h - 4} Z`} fill={C.resolvedSoft} opacity={0.8} />
      <path d={d} fill="none" stroke={C.resolved} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 7 : 4.5} fill={C.panel} stroke={C.resolved} strokeWidth={3} />
      ))}
    </svg>
  );
};

const SCENES = [
  { title: "spec", accent: C.agent, Scene: SpecFanout },
  { title: "loop", accent: C.agent, Scene: LoopScene },
  { title: "evidence", accent: C.problem, Scene: EvidenceScene },
  { title: "platform", accent: C.agent, Scene: HubScene },
  { title: "metrics", accent: C.resolved, Scene: MetricsScene },
] as const;

export const MINI_SCENE_COUNT = SCENES.length;

export const MiniScene: React.FC<{ index: number; left: number; top: number; width: number; height: number }> = ({
  index,
  left,
  top,
  width,
  height,
}) => {
  const { title, accent, Scene } = SCENES[index % SCENES.length];
  const padX = 18;
  const padY = 9;
  const head = 32;
  return (
    <WindowPanel title={title} accent={accent} headHeight={head} elevation="card" style={{ left, top, width, height }}>
      <div style={{ position: "absolute", left: padX, top: padY }}>
        <Scene w={width - padX * 2 - 2} h={height - head - padY * 2 - 3} />
      </div>
    </WindowPanel>
  );
};
