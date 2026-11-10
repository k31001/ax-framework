import React from "react";
import { S3 as content } from "../../shared/content";
import { Sheet } from "../components/Sheet";
import { DimLine, Pad, Trace, Via } from "../components/Trace";
import { FRAME, color, mono, pad2, sans, size, space, stroke, withAlpha } from "../theme";

// S3 전환 선언.
// 시선의 중심은 핵심 문구. 아래의 계단(단면도)은 왼쪽 아래 "현재"에서 시작해
// 세 번째 단에서 청록 trace가 되어 핵심 문구의 "재설계" 밑으로 올라간다.

const HEAD_X = 128;
const HEAD_TOP = 182;
const HEAD_SIZE = size.hero;

// 계단 단면: 디딤판 높이와 챌판 위치
const TREAD_Y = [914, 802, 690] as const;
const RISER_X = [660, 1190] as const;
const STEP_X = [136, 704, 1234] as const; // 각 단의 글자가 시작하는 x
const FLOOR = FRAME.h - space.frame;

// 청록 trace: 세 번째 단 → 오른쪽 → 위 → 핵심 문구 밑줄
const RISE_X = 1720;
const UNDER_Y = 482;
const UNDER_X0 = 946; // "재설계"가 시작하는 x

// 도입 문구 옆의 흐린 자국: 7단계 흐름과 덧붙인 조각 셋
const GHOST_Y = 128;
const GHOST_X0 = 520;
const GHOST_X1 = 1500;
const ghostXs = [0, 1, 2, 3, 4, 5, 6].map((i) => GHOST_X0 + 70 + ((GHOST_X1 - GHOST_X0 - 140) / 6) * i);
const GHOST_ADDONS: { at: number; side: 1 | -1 }[] = [
  { at: 1, side: -1 },
  { at: 3, side: 1 },
  { at: 4, side: -1 },
];

const profile = `M ${space.frame} ${TREAD_Y[0]} H ${RISER_X[0]} V ${TREAD_Y[1]} H ${RISER_X[1]} V ${TREAD_Y[2]} H ${
  FRAME.w - space.frame
}`;

export const S3: React.FC = () => {
  return (
    <Sheet sheet="SHEET 03 / 15">
      <svg
        width={FRAME.w}
        height={FRAME.h}
        viewBox={`0 0 ${FRAME.w} ${FRAME.h}`}
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <pattern
            id="a-s3-hatch"
            width={16}
            height={16}
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-45)"
          >
            <line
              x1={0}
              y1={0.5}
              x2={16}
              y2={0.5}
              stroke={withAlpha(color.inkSoft, 0.2)}
              strokeWidth={stroke.hair}
            />
          </pattern>
        </defs>

        {/* 도입 문구 옆: 기존 흐름과 그 위에 덧붙인 조각들이 흐려진 자국 */}
        <g stroke={color.lineStrong} strokeWidth={stroke.thin} fill="none" opacity={0.75}>
          <line x1={GHOST_X0} x2={GHOST_X1} y1={GHOST_Y} y2={GHOST_Y} stroke={color.line} strokeWidth={stroke.trace} />
          {ghostXs.map((x, i) => (
            <circle key={i} cx={x} cy={GHOST_Y} r={5} fill={color.bg} />
          ))}
          {GHOST_ADDONS.map(({ at, side }) => {
            const x = ghostXs[at] + 44;
            const y = GHOST_Y + side * 30;
            return (
              <g key={at} strokeDasharray="4 5">
                <path d={`M ${ghostXs[at] + 8} ${GHOST_Y} H ${x} V ${y - side * 11}`} />
                <rect x={x - 22} y={y - 11} width={44} height={22} />
              </g>
            );
          })}
        </g>

        {/* 핵심 문구의 조판 안내선과 높이 치수선 */}
        <line
          x1={space.frame}
          x2={FRAME.w - space.frame}
          y1={HEAD_TOP + 0.5}
          y2={HEAD_TOP + 0.5}
          stroke={color.line}
          strokeWidth={stroke.hair}
          strokeDasharray="2 10"
        />
        <DimLine from={[84, HEAD_TOP + 34]} to={[84, HEAD_TOP + 258]} />

        {/* 계단 단면 */}
        <path d={`${profile} V ${FLOOR} H ${space.frame} Z`} fill="url(#a-s3-hatch)" />
        <path d={profile} fill="none" stroke={color.inkSoft} strokeWidth={stroke.trace} />

        {/* 세 번째 단에서 핵심 문구로 올라가는 trace */}
        <Trace
          pts={[
            [STEP_X[2], TREAD_Y[2]],
            [RISE_X, TREAD_Y[2]],
            [RISE_X, UNDER_Y],
            [UNDER_X0, UNDER_Y],
          ]}
          stroke={color.agent}
          width={stroke.bold}
          chamfer={14}
        />
        <Pad x={UNDER_X0} y={UNDER_Y} fill={color.agent} s={12} />

        {/* 각 단의 노드. 첫 단이 지금 있는 자리 */}
        <circle cx={STEP_X[0]} cy={TREAD_Y[0]} r={17} fill="none" stroke={color.ink} strokeWidth={stroke.thin} />
        <circle cx={STEP_X[0]} cy={TREAD_Y[0]} r={9} fill={color.ink} />
        <Via x={STEP_X[1]} y={TREAD_Y[1]} r={8} />
        <Via x={STEP_X[2]} y={TREAD_Y[2]} r={8} stroke={color.agent} />
      </svg>

      {/* 도입 문구 */}
      <div
        style={{
          position: "absolute",
          left: 136,
          top: 100,
          ...sans(size.sub, 500),
          color: color.inkSoft,
        }}
      >
        {content.lead}
      </div>

      {/* 핵심 문구 */}
      <div
        style={{
          position: "absolute",
          left: HEAD_X,
          top: HEAD_TOP,
          ...sans(HEAD_SIZE, 800),
          lineHeight: 1,
          letterSpacing: "-0.03em",
          whiteSpace: "nowrap",
        }}
      >
        {content.headline}
      </div>

      {/* 3단계 */}
      {content.ladder.map((label, i) => {
        const top = TREAD_Y[i] - 26 - 70;
        return (
          <div
            key={label}
            style={{ position: "absolute", left: STEP_X[i] + 28, top, display: "flex", alignItems: "center", gap: 22 }}
          >
            <div style={{ position: "absolute", left: 0, top: -30, ...mono(size.label, 500), color: color.inkDim }}>
              STEP {pad2(i + 1)}
            </div>
            <div
              style={{
                ...sans(size.head, 700),
                lineHeight: "70px",
                whiteSpace: "nowrap",
                color: color.ink,
              }}
            >
              {label}
            </div>
            {i === 0 ? (
              <div
                style={{
                  ...sans(size.small, 700),
                  lineHeight: "44px",
                  padding: "0 14px",
                  color: color.bg,
                  backgroundColor: color.ink,
                  whiteSpace: "nowrap",
                }}
              >
                {content.nowLabel}
              </div>
            ) : null}
          </div>
        );
      })}
    </Sheet>
  );
};
