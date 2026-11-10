import React from "react";
import { useCurrentFrame } from "remotion";
import { clamp01, ease, progress } from "../../anim";
import { DimLine, Trace } from "../../components/Trace";
import type { Pt } from "../../components/Trace";
import { color, fullSvg, mono, pad2, size, stroke } from "../../theme";
import { FRUIT_R, FRUIT_STEM, Fruit } from "./Fruit";
import { T } from "./layout";

// 나무: 직각 trace 가 가지처럼 뻗은 선화. 가지 끝마다 열매가 달려 있다.
// 손이 닿는 높이(REACH) 아래의 열매 셋만 수확되어 빈 고리가 되고, 위쪽의 여덟은 그대로 남는다.

const GROUND = 944;
const TRUNK_X = 1090;
/** 나무 전체를 옮기는 거리. 가지의 좌표는 옮기기 전 값으로 적는다 */
const SHIFT_X = -60;
const REACH_Y = 678;

type Branch = {
  pts: readonly Pt[];
  /** 이 가지가 갈라져 나온 가지(BRANCHES 의 순서). 줄기는 -1 */
  from: number;
  /** 가지 끝에 열매가 달리는가 */
  fruit?: boolean;
};

// prettier-ignore
const BRANCHES: readonly Branch[] = [
  /* 0 줄기 */ { from: -1, pts: [[TRUNK_X, GROUND], [TRUNK_X, 262], [1030, 262], [1030, 226], [996, 226]], fruit: true },
  // 낮은 가지 (손이 닿는다)
  /* 1 */ { from: 0, pts: [[TRUNK_X, 860], [906, 860], [906, 800], [846, 800]], fruit: true },
  /* 2 */ { from: 0, pts: [[TRUNK_X, 820], [1262, 820], [1262, 760], [1326, 760]], fruit: true },
  /* 3 */ { from: 0, pts: [[TRUNK_X, 764], [990, 764], [990, 716], [950, 716]], fruit: true },
  // 높은 가지
  /* 4 */ { from: 0, pts: [[TRUNK_X, 640], [1396, 640], [1396, 440], [1350, 440]], fruit: true },
  /* 5 */ { from: 4, pts: [[1396, 524], [1466, 524]], fruit: true },
  /* 6 */ { from: 0, pts: [[TRUNK_X, 606], [800, 606], [800, 410], [846, 410]], fruit: true },
  /* 7 */ { from: 6, pts: [[800, 494], [730, 494]], fruit: true },
  /* 8 */ { from: 0, pts: [[TRUNK_X, 462], [1240, 462], [1240, 346], [1296, 346]], fruit: true },
  /* 9 */ { from: 0, pts: [[TRUNK_X, 492], [950, 492], [950, 362], [900, 362]], fruit: true },
  /* 10 */ { from: 0, pts: [[TRUNK_X, 330], [1160, 330], [1160, 250], [1196, 250]], fruit: true },
];

/**
 * 수확되는 가지(BRANCHES 의 순서)와 번호표가 놓이는 쪽. 낮은 것부터.
 * 번호는 앞에서 끝난 작업 셋(TASK 01~03)과 같다: 그 셋이 낮은 가지의 열매였다.
 */
const PICKED: readonly { branch: number; tag: "left" | "right" }[] = [
  { branch: 1, tag: "left" },
  { branch: 2, tag: "right" },
  { branch: 3, tag: "left" },
];
const TAG_W = 40;

const lengthOf = (pts: readonly Pt[]): number => {
  let total = 0;
  for (let i = 1; i < pts.length; i++)
    total += Math.abs(pts[i][0] - pts[i - 1][0]) + Math.abs(pts[i][1] - pts[i - 1][1]);
  return total;
};

/** 가지 위의 점 pt 까지, 그 가지의 시작점에서 잰 거리 */
const distanceTo = (pts: readonly Pt[], pt: Pt): number => {
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i];
    const onX = ay === by && pt[1] === ay && (pt[0] - ax) * (pt[0] - bx) <= 0;
    const onY = ax === bx && pt[0] === ax && (pt[1] - ay) * (pt[1] - by) <= 0;
    if (onX || onY) return total + Math.abs(pt[0] - ax) + Math.abs(pt[1] - ay);
    total += Math.abs(bx - ax) + Math.abs(by - ay);
  }
  return total;
};

// 뿌리에서 잰 거리로 자라는 순서를 정한다: 줄기가 올라가는 대로 가지가 갈라져 나간다.
const START: number[] = [];
BRANCHES.forEach((b, i) => {
  START[i] = b.from < 0 ? 0 : START[b.from] + distanceTo(BRANCHES[b.from].pts, b.pts[0]);
});
const END = BRANCHES.map((b, i) => START[i] + lengthOf(b.pts));
const REACHED = END.reduce((m, v) => Math.max(m, v), 0);

export const Tree: React.FC = () => {
  const frame = useCurrentFrame();
  const grow = progress(frame, T.grow, T.growDur, ease.inOut);
  if (frame < T.grow - 4) return null;
  const front = grow * REACHED; // 자란 거리
  const ground = progress(frame, T.grow - 4, 16);
  const reach = progress(frame, T.reach, 18, ease.inOut);

  return (
    <>
      <svg {...fullSvg}>
        <g transform={`translate(${SHIFT_X} 0)`}>
          {/* 땅 */}
          <DimLine from={[720, GROUND]} to={[1460, GROUND]} stroke={color.inkSoft} tick={0} p={ground} />
          <g stroke={color.lineStrong} strokeWidth={stroke.hair} opacity={ground}>
            {Array.from({ length: 19 }, (_, i) => {
              const x = 740 + i * 40;
              return <line key={i} x1={x} x2={x - 14} y1={GROUND + 4} y2={GROUND + 18} />;
            })}
          </g>

          {/* 손이 닿는 높이 */}
          {reach > 0 ? (
            <>
              <line
                x1={664}
                x2={664 + (1520 - 664) * reach}
                y1={REACH_Y}
                y2={REACH_Y}
                stroke={color.lineStrong}
                strokeWidth={stroke.thin}
                strokeDasharray="10 8"
              />
              <DimLine from={[640, GROUND]} to={[640, REACH_Y]} stroke={color.lineStrong} p={reach} />
            </>
          ) : null}

          {/* 줄기와 가지 */}
          {BRANCHES.map((b, i) => (
            <Trace
              key={i}
              pts={b.pts}
              stroke={color.inkSoft}
              width={i === 0 ? stroke.bold : stroke.trace}
              chamfer={10}
              progress={clamp01((front - START[i]) / (END[i] - START[i]))}
            />
          ))}

          {/* 열매 */}
          {BRANCHES.map((b, i) => {
            if (!b.fruit) return null;
            const tip = b.pts[b.pts.length - 1];
            // 가지가 끝까지 자란 프레임
            const tipAt = T.grow + T.growDur * tipTime(END[i] / REACHED);
            const order = PICKED.map((pick) => pick.branch).indexOf(i);
            const picked = order < 0 ? 0 : progress(frame, T.harvest + order * T.harvestStep, 14, ease.linear);
            return <Fruit key={i} x={tip[0]} y={tip[1]} p={progress(frame, tipAt, 10)} picked={picked} />;
          })}
        </g>
      </svg>

      <div
        style={{
          position: "absolute",
          left: 664 + SHIFT_X,
          top: REACH_Y - 34,
          ...mono(size.label, 700),
          color: color.inkDim,
          opacity: progress(frame, T.reach + 8, 12),
        }}
      >
        REACH
      </div>

      {/* 낮은 가지의 번호표 */}
      {PICKED.map(({ branch, tag }, order) => {
        const tip = BRANCHES[branch].pts[BRANCHES[branch].pts.length - 1];
        const tipAt = T.grow + T.growDur * tipTime(END[branch] / REACHED);
        const gap = FRUIT_R + 12;
        return (
          <div
            key={branch}
            style={{
              position: "absolute",
              left: tip[0] + SHIFT_X + (tag === "left" ? -gap - TAG_W : gap),
              width: TAG_W,
              top: tip[1] + FRUIT_STEM + FRUIT_R - 13,
              textAlign: tag === "left" ? "right" : "left",
              ...mono(size.label, 700),
              color: color.inkDim,
              opacity: progress(frame, tipAt + 4, 12),
            }}
          >
            {pad2(order + 1)}
          </div>
        );
      })}
    </>
  );
};

/** ease.inOut 으로 자라는 선이 전체의 q 만큼 자란 때(0~1). 열매가 가지 끝에 맞춰 달리도록 거꾸로 푼다. */
function tipTime(q: number): number {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    if (ease.inOut(mid) < q) lo = mid;
    else hi = mid;
  }
  return hi;
}
