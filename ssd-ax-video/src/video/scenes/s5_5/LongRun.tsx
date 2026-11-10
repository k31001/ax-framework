import React, { useId, useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { clamp01, ease, enter, lerp, progress } from "../../anim";
import { FIG } from "../../content";
import { color, sans, size, stroke, withAlpha } from "../../theme";
import { LEVEL, RESUMED, SPAN_H, X, Y, dayTicks, fwSpans, hwWavePath } from "./layout";

// 장시간 구동: HW 파형과 FW trace 가 같은 시간축 위에서 왼쪽에서 오른쪽으로 그려진다.
//   가상 플랫폼 구간   HW 는 모델(점선)이고 FW 만 먼저 돈다
//   emulator · FPGA   실제 파형이 나오고, 시간축에 매일 구동의 눈금이 찍힌다
//   문제              FW 의 command 한 칸이 닫히지 않고 붉게 늘어나다 timeout 에서 끊긴다
//   교차 분석         완료 두 건이 온 시점에 두 줄을 관통하는 세로선
//   해결              붉은 칸이 풀리고 trace 가 다시 이어진다

const LABELS = FIG["S5-5"];
const STALL = 20; // 멈춘 칸이 timeout 까지 늘어나는 시간
const CUT = { top: 58, bottom: 242 } as const;

export const LongRun: React.FC<{
  width: number;
  height: number;
  /** 첫 에이전트 항목(매일 구동)이 나오는 프레임 */
  runAt: number;
  problemAt: number;
  crossAt: number;
  resolvedAt: number;
}> = ({ width, height, runAt, problemAt, crossAt, resolvedAt }) => {
  const frame = useCurrentFrame();
  const clipId = `s55-run-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const wave = useMemo(hwWavePath, []);
  const spans = useMemo(fwSpans, []);
  const ticks = useMemo(dayTicks, []);

  // 시간은 고른 속도로 흐른다. 문제가 나오는 순간 고장 지점에 닿는다.
  const runStart = runAt + 4;
  const runDur = problemAt - runAt;
  const passAt = (x: number): number => runStart + (runDur * (x - X.start)) / (X.stall - X.start);
  const stallStart = runStart + runDur;
  const run = progress(frame, runStart, runDur, ease.linear);
  const stall = progress(frame, stallStart, STALL, ease.linear);
  const head = stall > 0 ? lerp(X.stall, X.end, stall) : lerp(X.start, X.stall, run);

  const divider = progress(frame, passAt(X.divide) - 4, 12);
  const cap = progress(frame, stallStart + STALL - 2, 10);
  const cut = progress(frame, crossAt, 14);
  const fixed = progress(frame, resolvedAt + 6, 16);

  const low = Y.hw + LEVEL.low;
  const spanTop = Y.fw - SPAN_H / 2;

  return (
    <>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
      >
        <defs>
          <clipPath id={clipId}>
            <rect x={X.start - 2} y={-20} width={Math.max(0, head - X.start + 2)} height={height + 40} />
          </clipPath>
        </defs>

        {/* 두 플랫폼의 경계 */}
        {divider > 0 ? (
          <line
            x1={X.divide}
            x2={X.divide}
            y1={46}
            y2={lerp(46, Y.fw + 22, divider)}
            stroke={color.lineStrong}
            strokeWidth={stroke.hair}
            strokeDasharray="4 6"
          />
        ) : null}

        {/* 그려진 데까지만 보인다 */}
        <g clipPath={`url(#${clipId})`} fill="none">
          {/* HW: 가상 플랫폼에서는 모델, 그 뒤로 실제 파형 */}
          <line
            x1={X.start}
            x2={X.divide}
            y1={low}
            y2={low}
            stroke={color.lineStrong}
            strokeWidth={stroke.thin}
            strokeDasharray="6 6"
          />
          <path d={wave} stroke={color.inkSoft} strokeWidth={stroke.thin} strokeLinejoin="miter" />

          {/* 함께 쓰는 시간축 */}
          <line
            x1={X.start}
            x2={X.divide}
            y1={Y.mid}
            y2={Y.mid}
            stroke={color.lineStrong}
            strokeWidth={stroke.hair}
            strokeDasharray="4 6"
          />
          <line x1={X.divide} x2={X.end} y1={Y.mid} y2={Y.mid} stroke={color.lineStrong} strokeWidth={stroke.hair} />

          {/* FW trace */}
          {spans.map((s, i) => (
            <rect
              key={i}
              x={s.x}
              y={spanTop}
              width={s.w}
              height={SPAN_H}
              fill={withAlpha(color.inkSoft, 0.1)}
              stroke={color.inkSoft}
              strokeWidth={stroke.hair}
            />
          ))}
        </g>

        {/* 매일 구동: 시간이 지나가는 자리마다 눈금이 찍힌다 */}
        {ticks.map((x, i) => {
          if (head < x) return null;
          const settle = ease.out(clamp01((head - x) / 22));
          const half = lerp(13, 7, settle);
          return (
            <line
              key={i}
              x1={x}
              x2={x}
              y1={Y.mid - half}
              y2={Y.mid + half}
              stroke={color.agent}
              strokeWidth={stroke.thin}
              opacity={lerp(1, 0.7, settle)}
            />
          );
        })}

        {/* 지금 시점 */}
        {run > 0 && stall < 1 ? (
          <rect
            x={head - 4}
            y={Y.mid - 4}
            width={8}
            height={8}
            fill={color.agent}
            opacity={Math.min(1, run * 12) * (1 - stall)}
          />
        ) : null}

        {/* 문제: 닫히지 않는 command. timeout 에서 끊긴다. */}
        {stall > 0 && fixed < 1 ? (
          <g opacity={1 - fixed}>
            <rect
              x={X.stall}
              y={spanTop}
              width={head - X.stall}
              height={SPAN_H}
              fill={withAlpha(color.problem, 0.16)}
              stroke={color.problem}
              strokeWidth={stroke.thin}
            />
            {cap > 0 ? (
              <g stroke={color.problem} opacity={cap}>
                <line
                  x1={X.end}
                  x2={X.end}
                  y1={Y.fw - lerp(6, 16, cap)}
                  y2={Y.fw + lerp(6, 16, cap)}
                  strokeWidth={stroke.bold}
                />
                <path
                  d={`M ${X.end + 10} ${Y.fw - 6} l 12 12 m 0 -12 l -12 12`}
                  strokeWidth={stroke.trace}
                  fill="none"
                />
              </g>
            ) : null}
          </g>
        ) : null}

        {/* 해결: trace 가 다시 이어진다 */}
        {fixed > 0
          ? RESUMED.map((s, i) => (
              <rect
                key={i}
                x={s.x}
                y={spanTop}
                width={s.w}
                height={SPAN_H}
                fill={withAlpha(color.inkSoft, 0.1)}
                stroke={color.inkSoft}
                strokeWidth={stroke.hair}
                opacity={progress(frame, resolvedAt + 10 + i * 3, 10)}
              />
            ))
          : null}

        {/* 교차 분석: 두 줄을 관통하는 세로선 */}
        {cut > 0 ? (
          <g>
            <line
              x1={X.cut}
              x2={X.cut}
              y1={CUT.top}
              y2={lerp(CUT.top, CUT.bottom, cut)}
              stroke={color.agent}
              strokeWidth={stroke.thin}
            />
            <path d={`M ${X.cut - 6} ${CUT.top - 8} h 12 l -6 8 Z`} fill={color.agent} opacity={Math.min(1, cut * 3)} />
          </g>
        ) : null}
      </svg>

      {/* 줄 이름 */}
      {(
        [
          [LABELS.rows.hw, Y.hw],
          [LABELS.rows.fw, Y.fw],
        ] as const
      ).map(([name, y], i) => (
        <div
          key={name}
          style={{
            position: "absolute",
            left: 0,
            top: y - 19,
            ...sans(size.small, 600),
            lineHeight: "38px",
            whiteSpace: "nowrap",
            color: color.inkSoft,
            ...enter(frame, runAt + i * 3, { from: "left", distance: 10 }),
          }}
        >
          {name}
        </div>
      ))}

      {/* 플랫폼 이름: 구간이 시작될 때 나온다 */}
      {(
        [
          [LABELS.platforms[0], X.start, runStart],
          [LABELS.platforms[1], X.divide + 12, passAt(X.divide)],
        ] as const
      ).map(([name, x, at]) => (
        <div
          key={name}
          style={{
            position: "absolute",
            left: x,
            top: 0,
            ...sans(size.small, 500),
            lineHeight: "38px",
            whiteSpace: "nowrap",
            color: color.inkDim,
            ...enter(frame, at, { distance: 8 }),
          }}
        >
          {name}
        </div>
      ))}
    </>
  );
};

/** 교차 분석 세로선의 위·아래 끝. 확대 창으로 벌어지는 선이 여기서 시작한다. */
export const CUT_ENDS = CUT;
