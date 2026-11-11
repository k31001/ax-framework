import React from "react";
import { useCurrentFrame } from "remotion";
import { ease, progress } from "../../../video/anim";
import { color, size, stroke } from "../../../video/theme";
import { ShiftSheet, ShiftTitle, useScene } from "../../lib";
import { DocShape, Svg, Txt, slotHome, useAt } from "./kit";

// s1 제목과 질문: 제목 블록, 이름 없는 빈 틀 넷, 눈금 없는 게이지와 질문.
export const S1: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue } = useScene();
  const at = useAt();
  const q = cue("s1.3");
  const GX = 1410;
  const GY = 400;
  const R = 170;
  const arc = progress(frame, q + 4, 22, ease.inOut);
  const needleIn = progress(frame, q + 18, 16);
  // 바늘은 가리킬 눈금이 없어 천천히 흔들린다
  const swing = -90 + 38 * Math.sin((frame - q) / 21) * needleIn;
  const rad = (swing * Math.PI) / 180;
  return (
    <ShiftSheet>
      <ShiftTitle />
      <Svg>
        {[0, 1, 2, 3].map((i) => {
          const s = slotHome(i);
          return <DocShape key={i} {...s} c={color.inkDim} dash="10 8" o={progress(frame, at("s1.2", 0.3 + i * 0.14), 14)} />;
        })}
        {/* 눈금 없는 게이지 */}
        <path
          d={`M ${GX - R} ${GY} A ${R} ${R} 0 0 1 ${GX + R} ${GY}`}
          fill="none"
          stroke={color.inkSoft}
          strokeWidth={stroke.trace}
          pathLength={1}
          strokeDasharray={`${arc} 1`}
        />
        <line x1={GX - R - 16} y1={GY} x2={GX - R - 16 + (2 * R + 32) * arc} y2={GY} stroke={color.lineStrong} strokeWidth={stroke.thin} />
        {needleIn > 0 ? (
          <g opacity={needleIn}>
            <line x1={GX} y1={GY} x2={GX + (R - 26) * Math.cos(rad)} y2={GY + (R - 26) * Math.sin(rad)} stroke={color.human} strokeWidth={stroke.bold} />
            <circle cx={GX} cy={GY} r={9} fill={color.bg} stroke={color.human} strokeWidth={stroke.trace} />
          </g>
        ) : null}
      </Svg>
      <Txt x={GX} y={GY + 44} at={at("s1.3", 0.3)} px={size.head} weight={800} c={color.human} align="center">
        나아졌는지, 무엇으로 아는가?
      </Txt>
    </ShiftSheet>
  );
};
