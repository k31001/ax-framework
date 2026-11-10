import React from "react";
import { S6 as content } from "../../shared/content";
import { Sheet } from "../components/Sheet";
import { Trace } from "../components/Trace";
import { FRAME, color, mono, safe, sans, size, stroke } from "../theme";

// S6 5대 전환.
// 표 대신 회로 기호 하나로 그린다. 가운데 소자의 이름이 "5대 전환"이고 다섯 축이 핀 이름이다.
// 왼쪽 점선으로 "현재"가 들어가고, 오른쪽 청록 실선으로 "전환 후"가 나온다.
// 시선의 중심은 오른쪽의 밝고 큰 다섯 줄.

const CHIP = { x: 440, y: 96, w: 400, h: 904 } as const;
const HEADER_H = 172;
const ROW_Y0 = 358; // 첫 줄의 선 높이
const ROW_PITCH = 138;
const BEFORE_RIGHT = CHIP.x - 40;
const AFTER_LEFT = CHIP.x + CHIP.w + 56;
const PIN = 14;

const rowY = (i: number) => ROW_Y0 + ROW_PITCH * i;

export const S6: React.FC = () => {
  const rows = content.rows;
  const chipRight = CHIP.x + CHIP.w;
  const headerCy = CHIP.y + HEADER_H / 2;

  return (
    <Sheet sheet="SHEET 13 / 15">
      <svg
        width={FRAME.w}
        height={FRAME.h}
        viewBox={`0 0 ${FRAME.w} ${FRAME.h}`}
        style={{ position: "absolute", inset: 0 }}
      >
        {/* 소자 몸통 */}
        <rect
          x={CHIP.x}
          y={CHIP.y}
          width={CHIP.w}
          height={CHIP.h}
          fill={color.panel}
          stroke={color.inkSoft}
          strokeWidth={stroke.trace}
        />
        <path
          d={`M ${CHIP.x + CHIP.w / 2 - 18} ${CHIP.y} a 18 18 0 0 0 36 0`}
          fill={color.bg}
          stroke={color.inkSoft}
          strokeWidth={stroke.trace}
        />
        <line
          x1={CHIP.x}
          x2={chipRight}
          y1={CHIP.y + HEADER_H}
          y2={CHIP.y + HEADER_H}
          stroke={color.line}
          strokeWidth={stroke.hair}
        />

        {rows.map((row, i) => {
          const y = rowY(i);
          return (
            <g key={row.axis}>
              {/* 현재: 흐린 점선 */}
              <line
                x1={safe.left + 8}
                x2={CHIP.x}
                y1={y}
                y2={y}
                stroke={color.lineStrong}
                strokeWidth={stroke.trace}
                strokeDasharray="3 9"
              />
              <circle cx={safe.left + 8} cy={y} r={6} fill={color.bg} stroke={color.lineStrong} strokeWidth={stroke.trace} />
              {/* 소자 안쪽: 핀에서 핀까지 */}
              <line
                x1={CHIP.x}
                x2={chipRight}
                y1={y}
                y2={y}
                stroke={color.line}
                strokeWidth={stroke.hair}
              />
              {/* 전환 후: 청록 실선 */}
              <Trace
                pts={[
                  [chipRight, y],
                  [safe.right, y],
                ]}
                stroke={color.agent}
                width={stroke.bold}
                arrow
              />
              {/* 핀 */}
              <rect
                x={CHIP.x - PIN / 2}
                y={y - PIN / 2}
                width={PIN}
                height={PIN}
                fill={color.bg}
                stroke={color.inkSoft}
                strokeWidth={stroke.trace}
              />
              <rect x={chipRight - PIN / 2} y={y - PIN / 2} width={PIN} height={PIN} fill={color.agent} />
            </g>
          );
        })}
      </svg>

      {/* 소자 이름 = 씬 제목 */}
      <div
        style={{
          position: "absolute",
          left: CHIP.x,
          width: CHIP.w,
          top: CHIP.y + 18,
          height: HEADER_H - 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...sans(size.display, 800),
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        {content.title}
      </div>

      {/* 열 이름 */}
      <div
        style={{
          position: "absolute",
          right: FRAME.w - BEFORE_RIGHT,
          top: headerCy - 14,
          ...sans(size.sub, 600),
          lineHeight: "56px",
          color: color.inkDim,
          whiteSpace: "nowrap",
        }}
      >
        {content.columns.before}
      </div>
      <div
        style={{
          position: "absolute",
          left: AFTER_LEFT,
          top: headerCy - 14,
          ...sans(size.sub, 700),
          lineHeight: "56px",
          color: color.agent,
          whiteSpace: "nowrap",
        }}
      >
        {content.columns.after}
      </div>

      {rows.map((row, i) => {
        const y = rowY(i);
        return (
          <React.Fragment key={row.axis}>
            {/* 현재 */}
            <div
              style={{
                position: "absolute",
                right: FRAME.w - BEFORE_RIGHT,
                top: y - 14 - 48,
                ...sans(size.body, 500),
                lineHeight: "48px",
                color: color.inkDim,
                whiteSpace: "nowrap",
              }}
            >
              {row.before}
            </div>

            {/* 축 = 핀 이름 */}
            <div
              style={{
                position: "absolute",
                left: CHIP.x,
                width: CHIP.w,
                top: y - 34,
                height: 68,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  ...sans(size.sub, 700),
                  lineHeight: "68px",
                  padding: "0 18px",
                  backgroundColor: color.panel,
                  whiteSpace: "nowrap",
                }}
              >
                {row.axis}
              </div>
            </div>
            <div style={{ position: "absolute", left: CHIP.x + 22, top: y - 36, ...mono(size.label), color: color.inkDim }}>
              {i + 1}
            </div>
            <div
              style={{
                position: "absolute",
                right: FRAME.w - (CHIP.x + CHIP.w) + 22,
                top: y - 36,
                ...mono(size.label),
                color: color.inkDim,
              }}
            >
              {rows.length * 2 - i}
            </div>

            {/* 전환 후 */}
            <div
              style={{
                position: "absolute",
                left: AFTER_LEFT,
                top: y - 14 - 88,
                ...sans(size.title, 700),
                lineHeight: "88px",
                whiteSpace: "nowrap",
              }}
            >
              {row.after}
            </div>
          </React.Fragment>
        );
      })}
    </Sheet>
  );
};
