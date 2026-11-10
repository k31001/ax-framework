import React from "react";
import { interpolateColors } from "remotion";
import { DUR, ease, enter, progress } from "../../anim";
import { HumanIcon, Trace } from "../../components";
import { S9 as content } from "../../content";
import { FRAME, color, fullSvg, safe, sans, size, stroke } from "../../theme";
import { AFTER_LEFT, AT, BEFORE_RIGHT, BLOCK, BLOCK_RIGHT, PIN, T, WIRE_X0, rowAt, rowY } from "./layout";

// 역할 네 줄. S6 과 같은 문법: 왼쪽 흐린 점선으로 before 가 들어오고, 오른쪽 실선 화살표로 after 가 나간다.
// 가운데는 역할마다 작은 소자 하나. 사람의 역할이므로 강조색은 사람의 색(호박)이다.

const ACCENT = color.human;

export const Roles: React.FC<{ frame: number }> = ({ frame }) => {
  const gone = progress(frame, AT.rolesOut, DUR.exit, ease.in);
  if (gone >= 1) return null;

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - gone }}>
      <svg {...fullSvg}>
        {content.roles.map((row, i) => {
          const y = rowY(i);
          const t0 = rowAt(i);
          const block = progress(frame, t0, 12);
          if (block <= 0) return null;
          const dim = progress(frame, t0 + T.dim, 12, ease.inOut);
          const wireIn = progress(frame, t0 + T.wireIn, 12);
          const wireColor = interpolateColors(dim, [0, 1], [color.inkSoft, color.lineStrong]);
          return (
            <g key={row.role}>
              {/* before: 흐린 점선 */}
              <Trace
                pts={[
                  [WIRE_X0, y],
                  [BLOCK.x, y],
                ]}
                stroke={wireColor}
                dash="3 9"
                progress={wireIn}
              />
              <circle
                cx={WIRE_X0}
                cy={y}
                r={6}
                fill={color.bg}
                stroke={wireColor}
                strokeWidth={stroke.trace}
                opacity={Math.min(1, wireIn * 4)}
              />

              {/* after: 실선 화살표 */}
              <Trace
                pts={[
                  [BLOCK_RIGHT, y],
                  [safe.right, y],
                ]}
                stroke={ACCENT}
                width={stroke.bold}
                arrow
                at={t0 + T.wireOut}
                duration={20}
              />

              {/* 역할 소자 */}
              <g opacity={block}>
                <rect
                  x={BLOCK.x}
                  y={y - BLOCK.h / 2}
                  width={BLOCK.w}
                  height={BLOCK.h}
                  fill={color.panel}
                  stroke={color.inkSoft}
                  strokeWidth={stroke.trace}
                />
                <rect
                  x={BLOCK.x - PIN / 2}
                  y={y - PIN / 2}
                  width={PIN}
                  height={PIN}
                  fill={color.bg}
                  stroke={color.inkSoft}
                  strokeWidth={stroke.trace}
                />
                <rect x={BLOCK_RIGHT - PIN / 2} y={y - PIN / 2} width={PIN} height={PIN} fill={ACCENT} />
              </g>
            </g>
          );
        })}
      </svg>

      {content.roles.map((row, i) => {
        const y = rowY(i);
        const t0 = rowAt(i);
        const dim = progress(frame, t0 + T.dim, 12, ease.inOut);
        return (
          <React.Fragment key={row.role}>
            <div
              style={{
                position: "absolute",
                right: FRAME.w - BEFORE_RIGHT,
                top: y - 14 - 48,
                ...sans(size.body, 500),
                lineHeight: "48px",
                color: interpolateColors(dim, [0, 1], [color.ink, color.inkDim]),
                whiteSpace: "nowrap",
                ...enter(frame, t0 + T.before, { from: "right", duration: 12 }),
              }}
            >
              {row.before}
            </div>

            <div
              style={{
                position: "absolute",
                left: BLOCK.x,
                width: BLOCK.w,
                top: y - BLOCK.h / 2,
                height: BLOCK.h,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 14,
                opacity: progress(frame, t0, 12),
              }}
            >
              <HumanIcon size={30} color={ACCENT} />
              <div style={{ ...sans(size.sub, 700), lineHeight: "56px", whiteSpace: "nowrap" }}>{row.role}</div>
            </div>

            <div
              style={{
                position: "absolute",
                left: AFTER_LEFT,
                top: y - 14 - 72,
                ...sans(size.head, 700),
                lineHeight: "72px",
                whiteSpace: "nowrap",
                ...enter(frame, t0 + T.after, { from: "right", distance: 16, duration: 12 }),
              }}
            >
              {row.after}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};
