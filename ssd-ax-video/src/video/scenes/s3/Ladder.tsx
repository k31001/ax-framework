import React from "react";
import { useCurrentFrame } from "remotion";
import { ease, enter, lerp, progress, sub } from "../../anim";
import { Pad, Trace, Via } from "../../components/Trace";
import { color, fullSvg, mono, pad2, sans, size, stroke, withAlpha } from "../../theme";
import { FLOOR, RISE_X, STEP_SPAN, STEP_X, T, TREAD_Y, UNDER_X0, UNDER_Y } from "./layout";

// 3단 계단(단면도)과 청록 trace.
//   - 단이 왼쪽부터 하나씩 바닥에서 올라온다. 빗금 친 단면과 윗선이 함께 올라온다.
//   - 청록 trace 는 핵심 문구의 "재설계" 밑에서 시작해 오른쪽으로, 아래로 내려가 세 번째 단에 닿는다.
//   - 첫 단에 "현재" 표시가 붙는다.

const RISE = 18; // 단 하나가 올라오는 시간

export const Ladder: React.FC<{ steps: readonly string[]; nowLabel: string }> = ({ steps, nowLabel }) => {
  const frame = useCurrentFrame();

  // 각 단의 윗선 높이
  const rise = steps.map((_, k) => progress(frame, T.step(k), RISE, ease.out));
  const top = rise.map((p, k) => lerp(FLOOR, TREAD_Y[k], p));
  const started = rise.filter((p) => p > 0).length;

  // 올라온 단까지만 이은 윗선
  let profile = "";
  for (let k = 0; k < started; k++) {
    const [x0, x1] = STEP_SPAN[k];
    profile += k === 0 ? `M ${x0} ${top[k]}` : ` V ${top[k]}`;
    profile += ` H ${x1}`;
  }
  if (started > 0 && started < steps.length) profile += ` V ${FLOOR}`;

  const trace = progress(frame, T.trace, T.traceDur, ease.inOut);
  // trace 가 세 번째 단의 노드에 닿는 순간
  const landed = sub(trace, 0.94, 1);

  return (
    <>
      <svg {...fullSvg}>
        <defs>
          <pattern id="s3-hatch" width={16} height={16} patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
            <line x1={0} y1={0.5} x2={16} y2={0.5} stroke={withAlpha(color.inkSoft, 0.2)} strokeWidth={stroke.hair} />
          </pattern>
        </defs>

        {/* 단면 */}
        {STEP_SPAN.map(([x0, x1], k) =>
          rise[k] <= 0 ? null : (
            <rect key={k} x={x0} y={top[k]} width={x1 - x0} height={FLOOR - top[k]} fill="url(#s3-hatch)" />
          ),
        )}
        {profile ? <path d={profile} fill="none" stroke={color.inkSoft} strokeWidth={stroke.trace} /> : null}

        {/* 핵심 문구 → 세 번째 단 */}
        <Trace
          pts={[
            [UNDER_X0, UNDER_Y],
            [RISE_X, UNDER_Y],
            [RISE_X, TREAD_Y[2]],
            [STEP_X[2], TREAD_Y[2]],
          ]}
          stroke={color.agent}
          width={stroke.bold}
          chamfer={14}
          progress={trace}
        />
        <Pad x={UNDER_X0} y={UNDER_Y} fill={color.agent} s={12} p={progress(frame, T.trace - 2, 8)} />

        {/* 각 단의 노드. 첫 단이 지금 있는 자리 */}
        {rise[0] > 0 ? (
          <g opacity={sub(rise[0], 0.3, 1)}>
            <circle cx={STEP_X[0]} cy={top[0]} r={17} fill="none" stroke={color.ink} strokeWidth={stroke.thin} />
            <circle cx={STEP_X[0]} cy={top[0]} r={9} fill={color.ink} />
          </g>
        ) : null}
        <Via x={STEP_X[1]} y={top[1]} r={8} p={sub(rise[1], 0.3, 1)} />
        <Via
          x={STEP_X[2]}
          y={top[2]}
          r={8}
          stroke={landed > 0 ? color.agent : color.inkSoft}
          p={sub(rise[2], 0.3, 1)}
        />
      </svg>

      {steps.map((label, k) => {
        const at = T.step(k) + 6;
        return (
          <div
            key={label}
            style={{
              position: "absolute",
              left: STEP_X[k] + 28,
              top: TREAD_Y[k] - 96,
              display: "flex",
              alignItems: "center",
              gap: 22,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: -30,
                ...mono(size.label, 500),
                color: color.inkDim,
                opacity: progress(frame, at, 12),
              }}
            >
              STEP {pad2(k + 1)}
            </div>
            <div
              style={{
                ...sans(size.head, 700),
                lineHeight: "70px",
                whiteSpace: "nowrap",
                ...enter(frame, at, { distance: 18, duration: 16 }),
              }}
            >
              {label}
            </div>
            {k === 0 ? (
              <div
                style={{
                  ...sans(size.small, 700),
                  lineHeight: "44px",
                  padding: "0 14px",
                  color: color.bg,
                  backgroundColor: color.ink,
                  whiteSpace: "nowrap",
                  ...enter(frame, at + 12, { from: "left", distance: 14 }),
                }}
              >
                {nowLabel}
              </div>
            ) : null}
          </div>
        );
      })}
    </>
  );
};
