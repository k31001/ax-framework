import React from "react";
import { interpolateColors, useCurrentFrame } from "remotion";
import { clamp01, draw, ease, enterSvg, lerp, progress, sub } from "../../anim";
import { Trace } from "../../components";
import { FIG } from "../../content";
import { color, stroke, withAlpha } from "../../theme";
import { Label } from "./Label";

// S5-3 아래쪽: commit 마다 갱신되는 ECC 면적 추정.
//   agent    commit 점이 하나씩 찍히고, 그때마다 면적 막대가 새로 서며 자란다
//   problem  다섯 번째 막대가 예산선을 넘어 붉어진다
//   resolved 화살표가 "구조 모델"로 갔다가(지연 재확인) 돌아오고, 막대가 예산선 아래로 줄어든다

const L = FIG["S5-3"];

const BASE_Y = 540;
const BUDGET_Y = 372;
const SPAN = BASE_Y - BUDGET_Y; // 예산 높이
const COL = { x0: 84, w: 36, pitch: 52 } as const;
const RATIOS = [0.5, 0.63, 0.76, 0.89, 1.24] as const; // 예산 대비 면적
const SETTLED = 0.91; // 축소안
const LAST = RATIOS.length - 1;
const colX = (k: number): number => COL.x0 + k * COL.pitch;
const CHART_RIGHT = colX(LAST) + COL.w + 16;
const COMMIT_Y = BASE_Y + 26;

// "구조 모델" 표식
const MODEL = { x: 436, y: 320, w: 112, h: 64 } as const;
const OUT_Y = 342;
const BACK_Y = 362;
const ARROW = { x0: colX(LAST) + COL.w + 8, x1: MODEL.x - 6 } as const;

export const AreaByCommit: React.FC<{ agentAt: number; problemAt: number; resolvedAt: number }> = ({
  agentAt,
  problemAt,
  resolvedAt,
}) => {
  const frame = useCurrentFrame();
  const chart = progress(frame, agentAt + 10, 16);
  if (chart <= 0) return null;

  // commit 이 찍히는 시점: 마지막 것은 문제가 나오는 순간에 예산선을 넘는다.
  const commitAt = (k: number): number => (k === LAST ? problemAt - 6 : agentAt + 20 + k * 8);

  // 해결
  const model = progress(frame, resolvedAt, 12);
  const out = progress(frame, resolvedAt + 4, 10, ease.inOut);
  const checked = progress(frame, resolvedAt + 14, 8);
  const back = progress(frame, resolvedAt + 20, 10, ease.inOut);
  const shrink = progress(frame, resolvedAt + 28, 16, ease.inOut);

  return (
    <g>
      {/* 축과 예산선 */}
      <g opacity={chart}>
        <g {...enterSvg(frame, agentAt + 10, { distance: 8 })}>
          <Label x={0} y={281} text={L.area} />
        </g>
        <line
          x1={COL.x0 - 16}
          x2={COL.x0 - 16 + (CHART_RIGHT - COL.x0 + 16) * chart}
          y1={BASE_Y}
          y2={BASE_Y}
          stroke={color.lineStrong}
          strokeWidth={stroke.thin}
        />
        <line
          x1={0}
          x2={CHART_RIGHT * chart}
          y1={BUDGET_Y}
          y2={BUDGET_Y}
          stroke={color.ink}
          strokeWidth={stroke.thin}
          strokeDasharray="8 6"
        />
        <Label x={0} y={BUDGET_Y - 21} text={L.budget} />
      </g>

      {/* commit 점: 하나씩 찍힌다 */}
      {RATIOS.map((_, k) => {
        const p = progress(frame, commitAt(k), 8);
        if (p <= 0) return null;
        const cx = colX(k) + COL.w / 2;
        return (
          <g key={k}>
            {k > 0 ? (
              <line
                x1={cx - COL.pitch}
                x2={cx - COL.pitch + COL.pitch * p}
                y1={COMMIT_Y}
                y2={COMMIT_Y}
                stroke={color.lineStrong}
                strokeWidth={stroke.thin}
              />
            ) : null}
            <circle cx={cx} cy={COMMIT_Y} r={6 * (0.4 + 0.6 * p)} fill={color.agent} opacity={p} />
          </g>
        );
      })}
      {RATIOS.map((_, k) =>
        k === 0 ? null : (
          // 앞 commit 의 점이 선에 가려지지 않게 다시 그린다.
          <circle
            key={k}
            cx={colX(k - 1) + COL.w / 2}
            cy={COMMIT_Y}
            r={6}
            fill={color.agent}
            opacity={progress(frame, commitAt(k), 1)}
          />
        ),
      )}
      <g {...enterSvg(frame, commitAt(0), { distance: 6 })}>
        <Label x={CHART_RIGHT + 6} y={COMMIT_Y} text="COMMIT" deco />
      </g>

      {/* 면적 막대 */}
      {RATIOS.map((ratio, k) => {
        const at = commitAt(k);
        const grow = progress(frame, at + 2, k === LAST ? 14 : 10);
        if (grow <= 0) return null;
        const x = colX(k);
        if (k < LAST) {
          // 가장 최근 막대만 밝다.
          const current = 1 - progress(frame, commitAt(k + 1), 8);
          const h = SPAN * ratio * grow;
          return (
            <rect
              key={k}
              x={x}
              y={BASE_Y - h}
              width={COL.w}
              height={h}
              fill={withAlpha(color.inkSoft, lerp(0.08, 0.22, current))}
              stroke={interpolateColors(current, [0, 1], [color.lineStrong, color.inkSoft])}
              strokeWidth={stroke.thin}
            />
          );
        }
        const value = lerp(ratio * grow, SETTLED, shrink);
        const h = SPAN * value;
        const over = clamp01((h - SPAN) / 10);
        const tint = interpolateColors(over, [0, 1], [color.ink, color.problem]);
        return (
          <g key={k}>
            {/* 줄어들기 전의 높이 */}
            {shrink > 0 ? (
              <rect
                x={x}
                y={BASE_Y - SPAN * ratio}
                width={COL.w}
                height={SPAN * (ratio - value)}
                fill="none"
                stroke={color.lineStrong}
                strokeWidth={stroke.hair}
                strokeDasharray="4 4"
                opacity={shrink}
              />
            ) : null}
            <rect
              x={x}
              y={BASE_Y - h}
              width={COL.w}
              height={h}
              fill={tint}
              fillOpacity={0.24}
              stroke={tint}
              strokeWidth={stroke.thin}
            />
            {h > SPAN ? (
              <rect x={x} y={BASE_Y - h} width={COL.w} height={h - SPAN} fill={color.problem} opacity={over} />
            ) : null}
          </g>
        );
      })}

      {/* 구조 모델: 갔다가 돌아온다 */}
      {model > 0 ? (
        <g opacity={model} transform={`translate(${(1 - model) * 10} 0)`}>
          <rect
            x={MODEL.x}
            y={MODEL.y}
            width={MODEL.w}
            height={MODEL.h}
            fill={withAlpha(color.ink, 0.04 + 0.08 * checked * (1 - shrink))}
            stroke={interpolateColors(checked, [0, 1], [color.inkSoft, color.ink])}
            strokeWidth={stroke.thin}
          />
          {/* 작은 구조도: 큐 두 줄이 블록 하나로 들어간다 (S5-2 의 구조) */}
          <g stroke={color.inkSoft} strokeWidth={stroke.hair} fill="none">
            <rect x={MODEL.x + 72} y={MODEL.y + 14} width={28} height={36} />
            <path d={`M ${MODEL.x + 12} ${MODEL.y + 23} H ${MODEL.x + 72} M ${MODEL.x + 12} ${MODEL.y + 41} H ${MODEL.x + 72}`} />
          </g>
          <g fill={color.inkSoft}>
            <rect x={MODEL.x + 36} y={MODEL.y + 18} width={10} height={10} opacity={0.55} />
            <rect x={MODEL.x + 52} y={MODEL.y + 18} width={10} height={10} opacity={0.55} />
            <rect x={MODEL.x + 52} y={MODEL.y + 36} width={10} height={10} />
          </g>
          <Label x={MODEL.x + MODEL.w / 2} y={MODEL.y + MODEL.h + 24} text={L.model} anchor="middle" fill={color.ink} />
          {/* 재확인 통과 */}
          {checked > 0 ? (
            <g opacity={sub(checked, 0, 0.4)}>
              <circle cx={MODEL.x + MODEL.w} cy={MODEL.y} r={13} fill={color.bg} stroke={color.ink} strokeWidth={stroke.thin} />
              <path
                d={`M ${MODEL.x + MODEL.w - 6} ${MODEL.y + 0.5} l 4.5 4.5 l 8 -9.5`}
                fill="none"
                stroke={color.ink}
                strokeWidth={stroke.trace}
                pathLength={1}
                {...draw(sub(checked, 0.3, 1))}
              />
            </g>
          ) : null}
        </g>
      ) : null}
      <Trace
        pts={[
          [ARROW.x0, OUT_Y],
          [ARROW.x1, OUT_Y],
        ]}
        stroke={color.ink}
        arrow
        progress={out}
      />
      <Trace
        pts={[
          [ARROW.x1, BACK_Y],
          [ARROW.x0, BACK_Y],
        ]}
        stroke={color.ink}
        arrow
        progress={back}
      />
    </g>
  );
};
