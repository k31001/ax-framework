import { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { draw, ease, lerp, progress } from "../../anim";
import { FIG } from "../../content";
import type { Illustration } from "../../stage/StageScene";
import { color, stroke, withAlpha } from "../../theme";
import { Wave } from "./Wave";
import { buildField, hash, mix } from "./field";

// S5-4 시뮬레이션 검증의 그림. 흐름도 위쪽 띠(1020×120), 붉은 깃발의 오른쪽.
//
//   문제          실패 312건의 붉은 점이 깃발에서 쏟아져 나와 띠 전체에 흩어진다
//   원인 분류     흩어진 점이 네 묶음으로 모인다 (148 · 87 · 52 · 25)
//   원인 가설     가장 큰 묶음에 고리가 쳐지고, 거기서 선이 오른쪽 파형으로 이어진다.
//                 retry_req 와 dec_done 이 같은 cycle 에 겹치는 자리가 붉은 띠로 켜진다
//   사람의 승인   고리가 사람의 색으로 다시 그려진다
//   해결          전체 regression 을 다시 도는 선이 띠를 훑고 지나가면, 고리 안의 점에서 붉은색이 빠지고
//                 파형의 붉은 띠가 풀린다. 나머지 세 묶음은 흐리게 남는다(원인 넷 중 하나를 따라갔다).

const DOT_R = 2.1;
const SPACING = 4.1; // 묶음 반지름 = SPACING × √건수. 가장 큰 묶음의 고리가 띠 높이에 꼭 맞는다.
const RING_PAD = 8;
const DRAINED = color.inkSoft; // 붉은색이 빠진 점: 선의 색
const DRAINED_OPACITY = 0.72; // 풀린 묶음이 흐름도보다 밝아지지 않게 한다

// 파형: 평소에는 요청과 완료가 따로 오고(cycle 1, 3), cycle 5 에서 둘이 겹친다.
const WAVE = { w: 510, h: 96, labelW: 146, right: 20, cycles: 8, overlap: 5 } as const;
const HIGH = [
  [1, 5],
  [3, 5],
] as const;

const POUR = 18; // 점 하나가 깃발에서 제자리까지 가는 시간
const GATHER = 26; // 점 하나가 묶음으로 모이는 시간
const SWEEP = 30; // 재확인 선이 띠를 훑는 시간

export const S54Illustration: Illustration = ({ width, height, beats, frames }) => {
  const frame = useCurrentFrame();
  const field = useMemo(
    () => buildField(FIG["S5-4"].clusters, { width, height, left: 22, gap: 50, spacing: SPACING, margin: 12 }),
    [width, height],
  );

  // 시점: 문제 → 분류 → 가설 → 승인 → 해결
  const pi = beats.findIndex((b) => b.kind === "problem");
  if (pi < 0 || beats.length < pi + 5) throw new Error("S5-4: 문제 뒤에 항목 4개(분류, 가설, 승인, 해결)가 필요하다");
  const problem = beats[pi];
  const classifyAt = beats[pi + 1].frame;
  const hypothesis = beats[pi + 2];
  const approveAt = beats[pi + 3].frame;
  const resolvedAt = frames.resolved ?? beats[pi + 4].frame;
  if (frame < problem.frame) return null;

  const cy = height / 2;
  const suspect = field.clusters[field.suspect];
  const ringR = suspect.r + RING_PAD;
  const flagRight = problem.flag ? problem.flag.x + problem.flag.w : -20;
  const waveX = width - WAVE.right - WAVE.w;
  const waveY = (height - WAVE.h) / 2;
  const overlapX = waveX + WAVE.labelW + ((WAVE.w - WAVE.labelW) / WAVE.cycles) * (WAVE.overlap + 0.5);

  // 재확인 선: 띠의 왼쪽 끝에서 오른쪽 끝까지 고르게 지나간다.
  const sweep = progress(frame, resolvedAt, SWEEP, ease.linear);
  const sweepX = lerp(0, width, sweep);
  const passAt = (x: number): number => resolvedAt + (SWEEP * x) / width;

  const pourAt = problem.frame + 8;
  const dim = progress(frame, hypothesis.frame, 14); // 가설: 나머지 묶음이 한 걸음 물러난다
  const calm = progress(frame, resolvedAt + SWEEP - 10, 20); // 해결: 한 번 더 물러난다
  const others = lerp(1, 0.62, dim) * lerp(1, 0.68, calm);

  const bus = progress(frame, classifyAt, 24, ease.inOut);
  const ring = progress(frame, hypothesis.frame, 16);
  const stub = progress(frame, hypothesis.frame + 8, 10);
  const link = progress(frame, hypothesis.frame + 10, 12);
  const approved = progress(frame, approveAt, 18, ease.inOut);
  const waveAppear = progress(frame, hypothesis.frame + 14, 12);
  const waveDrawn = progress(frame, hypothesis.frame + 18, 24, ease.inOut);
  const waveHot = progress(frame, hypothesis.frame + 34, 10);
  const waveCleared = progress(frame, passAt(overlapX), 14);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
      >
        {/* 깃발(312건)에서 묶음들로 이어지는 가는 선 */}
        {bus > 0 ? (
          <line
            x1={flagRight}
            x2={lerp(flagRight, suspect.cx, bus)}
            y1={cy}
            y2={cy}
            stroke={withAlpha(color.problem, 0.45 * lerp(1, 0.6, calm))}
            strokeWidth={stroke.hair}
          />
        ) : null}

        {/* 실패 312건 */}
        {field.dots.map((d, i) => {
          const pour = progress(frame, pourAt + (d.sx / width) * 14 + hash(i) * 5, POUR);
          if (pour <= 0) return null;
          const cluster = field.clusters[d.cluster];
          const gather = progress(frame, classifyAt + d.rank * 10 + (cluster.cx / width) * 8, GATHER, ease.inOut);
          const x = lerp(lerp(flagRight + 6, d.sx, pour), d.tx, gather);
          const y = lerp(lerp(lerp(cy, d.sy, 0.3), d.sy, pour), d.ty, gather);
          const own = d.cluster === field.suspect;
          const drained = own ? progress(frame, passAt(d.tx), 12) : 0;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={DOT_R}
              fill={drained > 0 ? mix(color.problem, DRAINED, drained) : color.problem}
              opacity={Math.min(1, pour * 3) * (own ? lerp(1, DRAINED_OPACITY, drained) : others)}
            />
          );
        })}

        {/* 원인 가설로 이어지는 묶음: 고리, 아래의 가설 항목으로 내려가는 선, 파형으로 가는 선 */}
        {ring > 0 ? (
          <g fill="none" transform={`rotate(-90 ${suspect.cx} ${suspect.cy})`}>
            <circle
              cx={suspect.cx}
              cy={suspect.cy}
              r={ringR}
              stroke={color.ink}
              strokeWidth={stroke.thin}
              pathLength={1}
              {...draw(ring)}
            />
            {approved > 0 ? (
              <circle
                cx={suspect.cx}
                cy={suspect.cy}
                r={ringR}
                stroke={color.human}
                strokeWidth={stroke.trace}
                pathLength={1}
                {...draw(approved)}
              />
            ) : null}
          </g>
        ) : null}
        {stub > 0 && hypothesis.rect ? (
          <line
            x1={suspect.cx}
            x2={suspect.cx}
            y1={cy + ringR}
            y2={lerp(cy + ringR, hypothesis.rect.y, stub)}
            stroke={color.ink}
            strokeWidth={stroke.thin}
          />
        ) : null}
        {link > 0 ? (
          <line
            x1={suspect.cx + ringR}
            x2={lerp(suspect.cx + ringR, waveX - 10, link)}
            y1={cy}
            y2={cy}
            stroke={color.ink}
            strokeWidth={stroke.thin}
          />
        ) : null}

        {/* 해결: 전체 regression 재확인 */}
        {sweep > 0 && sweep < 1 ? (
          <line
            x1={sweepX}
            x2={sweepX}
            y1={0}
            y2={height}
            stroke={color.agent}
            strokeWidth={stroke.hair}
            opacity={0.7 * Math.min(1, sweep * 8, (1 - sweep) * 6)}
          />
        ) : null}
      </svg>

      <Wave
        x={waveX}
        y={waveY}
        w={WAVE.w}
        h={WAVE.h}
        labelW={WAVE.labelW}
        cycles={WAVE.cycles}
        overlap={WAVE.overlap}
        signals={FIG["S5-4"].signals.map((name, row) => ({ name, high: HIGH[row] }))}
        appear={waveAppear}
        drawn={waveDrawn}
        hot={waveHot}
        cleared={waveCleared}
      />
    </div>
  );
};
