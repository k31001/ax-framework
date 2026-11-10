import React from "react";
import { useCurrentFrame } from "remotion";
import { ease, lerp, progress } from "../../anim";
import { DimLine } from "../../components/Trace";
import { color, fullSvg } from "../../theme";
import { FAST, ROW, T, stageX } from "./layout";

// 개인 작업이 빨라진다: 몇몇 단계 위에서 작은 점 다섯 개가 차례로 켜졌다 꺼지기를 되풀이한다.
// 되풀이가 점점 빨라지고, 그 위의 작은 치수선(작업 하나에 걸리는 시간)이 줄어든다.
// 아래쪽의 큰 치수선(전체 일정)은 그대로다.

const DOTS = 5;
const DOT_PITCH = 16;
const DOT_Y = ROW.y - 34;
const MINI_Y = ROW.y - 66;
const MINI_W = [156, 68] as const; // 줄어들기 전 / 후
const SLOW = 1 / 36; // 한 프레임에 도는 바퀴 수
const QUICK = 1 / 9;

/** frame 까지 돈 바퀴 수. 속도가 프레임마다 달라 하나씩 더한다. */
const turns = (frame: number, start: number): number => {
  let total = 0;
  for (let t = start; t < frame; t++) {
    total += lerp(SLOW, QUICK, progress(t, T.speedup, T.speedupDur, ease.inOut));
  }
  return total;
};

export const Speedup: React.FC = () => {
  const frame = useCurrentFrame();
  // 수치가 나오면 물러난다.
  const rest = progress(frame, T.stat - 6, 16, ease.inOut);

  return (
    <svg {...fullSvg}>
      {FAST.map((stage, n) => {
        const start = T.blink + n * 4;
        const on = progress(frame, start, 12);
        if (on <= 0) return null;
        const x = stageX(stage);
        const phase = turns(frame, start) + n * 0.27;
        const lit = Math.floor((phase % 1) * (DOTS + 1)); // 0~5개가 켜져 있다
        const quick = progress(frame, T.speedup + n * 3, T.speedupDur, ease.inOut);
        const half = lerp(MINI_W[0], MINI_W[1], quick) / 2;
        return (
          <g key={stage} opacity={on * lerp(1, 0.3, rest)}>
            <DimLine from={[x - half, MINI_Y]} to={[x + half, MINI_Y]} stroke={color.agent} tick={6} />
            {Array.from({ length: DOTS }, (_, j) => (
              <circle
                key={j}
                cx={x + (j - (DOTS - 1) / 2) * DOT_PITCH}
                cy={DOT_Y}
                r={4.5}
                fill={color.agent}
                opacity={j < lit ? 1 : 0.22}
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
};
