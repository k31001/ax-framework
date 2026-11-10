import React from "react";
import { enter, ease, lerp, progress } from "../../anim";
import { DimLine, Pad, Trace } from "../../components";
import { S9 as content } from "../../content";
import { FRAME, color, fullSvg, safe, sans, size, space, stroke } from "../../theme";
import { AT, HEAD_TOP, HEAD_X, UNDER_X0, UNDER_Y } from "./layout";

// 핵심 문구 "AI 중심 재설계". S3 과 같은 글자 처리(size.hero, 굵기 800, 조판 안내선과 높이 치수선, "재설계" 밑의 청록 trace)이고,
// 나오는 움직임도 S3 과 같다(낱말이 왼쪽부터 2프레임 시차로 36px 올라와 자리 잡는다).
// S3 에서는 청록 trace 가 "재설계" 밑에서 계단으로 내려갔다. 여기서는 "재설계" 밑에서 시작해 오른쪽으로 나아간다.

const words = content.headline.text.split(" ");
const WORD_STEP = 2; // 낱말 사이 시차 (S3 과 같다)

export const Hero: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < AT.guide) return null;
  const guide = progress(frame, AT.guide, 14, ease.inOut);
  const dim = progress(frame, AT.headline + 4, 18);
  const pad = progress(frame, AT.underline, 8);

  return (
    <>
      <svg {...fullSvg}>
        {/* 조판 안내선: 왼쪽에서 오른쪽으로 */}
        <line
          x1={space.frame}
          x2={lerp(space.frame, FRAME.w - space.frame, guide)}
          y1={HEAD_TOP + 0.5}
          y2={HEAD_TOP + 0.5}
          stroke={color.line}
          strokeWidth={stroke.hair}
          strokeDasharray="2 10"
        />
        <DimLine from={[84, HEAD_TOP + 34]} to={[84, HEAD_TOP + 258]} p={dim} />

        {/* "재설계" 밑줄 */}
        <Trace
          pts={[
            [UNDER_X0, UNDER_Y],
            [safe.right, UNDER_Y],
          ]}
          stroke={color.agent}
          width={stroke.bold}
          arrow
          at={AT.underline}
          duration={28}
        />
        <Pad x={UNDER_X0} y={UNDER_Y} fill={color.agent} s={12} p={pad} />
      </svg>

      <div
        style={{
          position: "absolute",
          left: HEAD_X,
          top: HEAD_TOP,
          ...sans(size.hero, 800),
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
              ...enter(frame, AT.headline + i * WORD_STEP, { distance: 36, duration: 18 }),
            }}
          >
            {i < words.length - 1 ? `${word} ` : word}
          </span>
        ))}
      </div>
    </>
  );
};
