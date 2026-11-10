import React from "react";
import { interpolateColors, useCurrentFrame } from "remotion";
import { enter } from "../anim";
import { Sheet } from "../components";
import { S6 as content } from "../content";
import { FRAME, color, fullSvg, mono, sans, size } from "../theme";
import { Package, RowWires } from "./s6/Wires";
import {
  AFTER_LEFT,
  AT,
  BEFORE_RIGHT,
  CHIP,
  CHIP_RIGHT,
  HEADER_CY,
  HEADER_H,
  T,
  rowAt,
  rowState,
  rowY,
} from "./s6/layout";

// S6 5대 전환.
// 표 대신 회로 기호 하나로 그린다. 가운데 IC 패키지의 이름이 "5대 전환"이고 다섯 축이 핀 이름이다.
// 줄마다 왼쪽 점선으로 "현재"가 들어와 흐려지고, 칩을 지나 오른쪽 청록 실선으로 "전환 후"가 나간다.
// 시선의 중심은 그때그때 새로 나오는 오른쪽의 큰 글자. 다섯 줄이 다 나온 뒤 약 2초는 그대로 둔다.

const rows = content.rows;

export const S6: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <Sheet id="S6">
      <svg {...fullSvg}>
        <Package frame={frame} />
        {rows.map((row, i) => (
          <RowWires key={row.axis} frame={frame} index={i} />
        ))}
      </svg>

      {/* 패키지 이름 = 씬 제목 */}
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
        }}
      >
        <div
          style={{
            ...sans(size.display, 800),
            lineHeight: 1,
            whiteSpace: "nowrap",
            ...enter(frame, AT.title, { duration: 16, distance: 16 }),
          }}
        >
          {content.title}
        </div>
      </div>

      {/* 열 이름 */}
      <div
        style={{
          position: "absolute",
          right: FRAME.w - BEFORE_RIGHT,
          top: HEADER_CY - 14,
          ...sans(size.sub, 600),
          lineHeight: "56px",
          color: color.inkDim,
          whiteSpace: "nowrap",
          ...enter(frame, AT.columnBefore, { distance: 8 }),
        }}
      >
        {content.columns.before}
      </div>
      <div
        style={{
          position: "absolute",
          left: AFTER_LEFT,
          top: HEADER_CY - 14,
          ...sans(size.sub, 700),
          lineHeight: "56px",
          color: color.agent,
          whiteSpace: "nowrap",
          ...enter(frame, rowAt(0) + T.wireOut, { distance: 8 }),
        }}
      >
        {content.columns.after}
      </div>

      {rows.map((row, i) => {
        const y = rowY(i);
        const t0 = rowAt(i);
        const s = rowState(frame, i);
        return (
          <React.Fragment key={row.axis}>
            {/* 현재: 또렷하게 나왔다가 흐려진다 */}
            <div
              style={{
                position: "absolute",
                right: FRAME.w - BEFORE_RIGHT,
                top: y - 14 - 48,
                ...sans(size.body, 500),
                lineHeight: "48px",
                color: interpolateColors(s.dim, [0, 1], [color.ink, color.inkDim]),
                whiteSpace: "nowrap",
                ...enter(frame, t0 + T.before, { from: "right" }),
              }}
            >
              {row.before}
            </div>

            {/* 축 = 핀 이름. 꺼져 있다가 제 차례에 켜진다 */}
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
                opacity: s.base,
              }}
            >
              <div
                style={{
                  ...sans(size.sub, 700),
                  lineHeight: "68px",
                  padding: "0 18px",
                  backgroundColor: color.panel,
                  whiteSpace: "nowrap",
                  color: interpolateColors(s.lit, [0, 1], [color.lineStrong, color.ink]),
                }}
              >
                {row.axis}
              </div>
            </div>
            <div
              style={{
                position: "absolute",
                left: CHIP.x + 22,
                top: y - 36,
                ...mono(size.label),
                color: color.inkDim,
                opacity: s.base,
              }}
            >
              {i + 1}
            </div>
            <div
              style={{
                position: "absolute",
                right: FRAME.w - CHIP_RIGHT + 22,
                top: y - 36,
                ...mono(size.label),
                color: color.inkDim,
                opacity: s.base,
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
                ...enter(frame, t0 + T.after, { from: "right", distance: 16 }),
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
