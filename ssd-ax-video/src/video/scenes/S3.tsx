import React from "react";
import { useCurrentFrame } from "remotion";
import { ease, enter, lerp, progress } from "../anim";
import { Sheet } from "../components/Sheet";
import { DimLine } from "../components/Trace";
import { S3 as content } from "../content";
import { color, fullSvg, sans, size, stroke } from "../theme";
import { GhostFlow } from "./s3/GhostFlow";
import { Ladder } from "./s3/Ladder";
import { HEAD, LEAD, LEFT, RIGHT, T } from "./s3/layout";

// S3 전환 선언. 마지막 모습은 승인 스틸(design/a/s3.png)이다.
//
//   0.3s  도입 문구. 옆에 지금의 흐름이 그려지고, 덧붙인 조각 셋이 청록 점선으로 붙는다
//   1.7s  흐름과 조각의 색이 빠진다. 조판 안내선이 그려진다
//   2.2s  핵심 문구 (영상에서 가장 큰 순간. 음악도 여기서 열린다)
//   5.2s  "재설계" 밑에서 청록 trace 가 내려가고, 3단 계단이 왼쪽부터 올라온다. 첫 단에 "현재"

const WORD_STEP = 3; // 핵심 문구의 낱말 사이 시차

export const S3: React.FC = () => {
  const frame = useCurrentFrame();
  const words = content.headline.text.split(" ");
  const guide = progress(frame, T.guide, 14, ease.inOut);

  return (
    <Sheet id="S3">
      <svg {...fullSvg}>
        <GhostFlow />

        {/* 핵심 문구의 조판 안내선과 높이 치수선 */}
        {guide > 0 ? (
          <line
            x1={LEFT}
            x2={lerp(LEFT, RIGHT, guide)}
            y1={HEAD.top + 0.5}
            y2={HEAD.top + 0.5}
            stroke={color.line}
            strokeWidth={stroke.hair}
            strokeDasharray="2 10"
          />
        ) : null}
        <DimLine from={[84, HEAD.top + 34]} to={[84, HEAD.top + 258]} p={progress(frame, T.headline + 4, 18)} />
      </svg>

      {/* 도입 문구 */}
      <div
        style={{
          position: "absolute",
          left: LEAD.x,
          top: LEAD.y,
          ...sans(size.sub, 500),
          color: color.inkSoft,
          whiteSpace: "nowrap",
          ...enter(frame, T.lead),
        }}
      >
        {content.lead.text}
      </div>

      {/* 핵심 문구: 낱말이 왼쪽부터 짧은 시차로 올라와 자리 잡는다 */}
      <div
        style={{
          position: "absolute",
          left: HEAD.x,
          top: HEAD.top,
          ...sans(HEAD.px, 800),
          lineHeight: 1,
          letterSpacing: "-0.03em",
          whiteSpace: "pre",
        }}
      >
        {words.map((word, i) => (
          <span
            key={i}
            style={{
              display: "inline-block",
              ...enter(frame, T.headline + i * WORD_STEP, { distance: 36, duration: 18 }),
            }}
          >
            {i < words.length - 1 ? `${word} ` : word}
          </span>
        ))}
      </div>

      <Ladder steps={content.ladder.steps} nowLabel={content.ladder.nowLabel} />
    </Sheet>
  );
};
