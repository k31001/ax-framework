import React from "react";
import { useCurrentFrame } from "remotion";
import { enter } from "../anim";
import { Sheet, Title } from "../components";
import { S8 as content } from "../content";
import { FRAME, color, fullSvg, mono, pad2, sans, size, stroke } from "../theme";
import { Stairs } from "./s8/Stairs";
import { AT, NODE_X, SEED, TEXT_DX, TREAD_Y, stepAt } from "./s8/layout";

// S8 로드맵.
// S3 의 3단 계단과 호응하는 올라가는 계단형 trace 위에 세 단계가 차례로 놓인다.
// 마지막에 S1 의 열매가 다시 나와 1단계 아래에 심기고, 거기서 trace 가 자라 2단계로 올라간다.
// 시선의 중심: 새로 놓이는 단계 → 마지막에는 왼쪽 아래의 열매와 문구.

// 단면(빗금) 위에 놓이는 글자의 바탕
const plate = { backgroundColor: color.bg, padding: "0 12px" } as const;

export const S8: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <Sheet id="S8">
      <svg {...fullSvg}>
        <Stairs frame={frame} />
      </svg>

      <Title text={content.title} label="ROADMAP" x={136} y={96} at={AT.title} />

      {/* 3단계: 이름과 세부 */}
      {content.steps.map((step, i) => {
        const at = stepAt(i);
        return (
          <div
            key={step.name}
            style={{
              position: "absolute",
              left: NODE_X[i] + TEXT_DX,
              bottom: FRAME.h - (TREAD_Y[i] - 24),
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <div style={{ ...mono(size.label, 500), color: color.inkDim, ...enter(frame, at, { distance: 0 }) }}>
              STEP {pad2(i + 1)}
            </div>
            <div
              style={{
                ...sans(size.head, 700),
                lineHeight: "72px",
                whiteSpace: "nowrap",
                ...enter(frame, at + 2),
              }}
            >
              {step.name}
            </div>
            <div
              style={{
                ...sans(size.body, 500),
                lineHeight: "46px",
                color: color.inkSoft,
                whiteSpace: "nowrap",
                ...enter(frame, at + 6),
              }}
            >
              {step.detail}
            </div>
          </div>
        );
      })}

      {/* 참고 자막: 2단계의 디딤판 바로 아래 */}
      <div
        style={{
          position: "absolute",
          left: NODE_X[1] + TEXT_DX,
          top: TREAD_Y[1] + 24,
          display: "flex",
          alignItems: "center",
          gap: 14,
          ...plate,
          ...enter(frame, AT.reference, { distance: 8 }),
        }}
      >
        <div
          style={{
            ...mono(size.label, 500),
            color: color.inkDim,
            padding: "2px 8px",
            border: `${stroke.hair}px solid ${color.lineStrong}`,
          }}
        >
          REF
        </div>
        <div style={{ ...sans(size.small, 500), lineHeight: "44px", color: color.inkSoft, whiteSpace: "nowrap" }}>
          {content.reference.text}
        </div>
      </div>

      {/* 마지막 자막: 심긴 열매 바로 아래 */}
      <div
        style={{
          position: "absolute",
          left: SEED.x - 22,
          top: SEED.y1 + 26,
          ...sans(size.sub, 700),
          lineHeight: "60px",
          whiteSpace: "nowrap",
          ...plate,
          ...enter(frame, AT.closing),
        }}
      >
        {content.closing.text}
      </div>
    </Sheet>
  );
};
