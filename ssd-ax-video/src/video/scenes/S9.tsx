import React from "react";
import { interpolateColors, useCurrentFrame } from "remotion";
import { DUR, ease, enter, lerp, progress } from "../anim";
import { Sheet } from "../components";
import { S9 as content } from "../content";
import { color, sans, size } from "../theme";
import { Hero } from "./s9/Hero";
import { Roles } from "./s9/Roles";
import { AT, END_TOP, LEAD_TOP, TEXT_X } from "./s9/layout";

// S9 Closing.
// 1) 역할 네 줄: before → after (S6 과 같은 문법)
// 2) 네 줄이 물러나고 "작성자에서 설계자로"가 화면 가운데에 크게 나온다
// 3) 그 문구가 위로 올라가 도입 문구가 되고, 핵심 문구 "AI 중심 재설계"가 S3 과 같은 글자 처리로 나온다
// 4) 엔드 카드. 마지막 씬이므로 내용물이 사라지지 않고 마지막 1초는 정지 화면이다.

const SHIFT_BIG = size.display / size.sub; // 가운데에 있을 때의 배율
const SHIFT_BIG_TOP = 475; // 가운데에 있을 때의 위쪽 y

export const S9: React.FC = () => {
  const frame = useCurrentFrame();

  const shiftIn = progress(frame, AT.shift, 16);
  const move = progress(frame, AT.shiftMove, DUR.move, ease.inOut);

  return (
    <Sheet id="S9" fade={{ out: false }}>
      <Roles frame={frame} />

      {/* "작성자에서 설계자로": 가운데에 크게 나왔다가 핵심 문구 위의 자리로 올라간다 */}
      {frame >= AT.shift ? (
        <div
          style={{
            position: "absolute",
            left: TEXT_X,
            top: LEAD_TOP,
            transformOrigin: "0 0",
            translate: `0px ${lerp(SHIFT_BIG_TOP - LEAD_TOP, 0, move) + (1 - shiftIn) * 16}px`,
            scale: `${lerp(SHIFT_BIG, 1, move)}`,
            opacity: shiftIn,
            ...sans(size.sub, Math.round(lerp(800, 500, move))),
            letterSpacing: `${lerp(-0.03, -0.012, move)}em`,
            color: interpolateColors(move, [0, 1], [color.ink, color.inkSoft]),
            whiteSpace: "nowrap",
          }}
        >
          {content.shift.text}
        </div>
      ) : null}

      <Hero frame={frame} />

      {/* 엔드 카드 */}
      <div
        style={{
          position: "absolute",
          left: TEXT_X,
          top: END_TOP,
          display: "flex",
          alignItems: "center",
          gap: 20,
          ...enter(frame, AT.endCard),
        }}
      >
        <div style={{ width: 12, height: 12, backgroundColor: color.inkSoft }} />
        <div style={{ ...sans(size.sub, 600), lineHeight: "56px", whiteSpace: "nowrap" }}>{content.endCard.text}</div>
      </div>
    </Sheet>
  );
};
