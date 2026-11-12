import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, draw, ease, progress } from "../anim";
import { color, mono, sans, size, stroke } from "../theme";

// 배경 문구(context): 흐름도가 그려지기 전에 본문 위쪽에 크게 나오는 한 줄.
// 도면의 주석처럼 왼쪽에 짧은 꺾쇠가 그려지고 글자가 들어온다. 아래쪽은 그 단계의 그림이 쓴다.

/** 문구가 차지하는 높이. 그림은 이 아래부터 그린다. */
export const CONTEXT_HEIGHT = 112;

export const ContextLine: React.FC<{
  text: string;
  x: number;
  y: number;
  /** 나타나는 프레임 */
  at: number;
  /** 사라지는 프레임 */
  out: number;
}> = ({ text, x, y, at, out }) => {
  const frame = useCurrentFrame();
  const open = progress(frame, at, DUR.draw, ease.out);
  if (open <= 0) return null;
  const gone = progress(frame, out, DUR.exit, ease.in);
  if (gone >= 1) return null;
  const textP = progress(frame, at + 4, DUR.enter, ease.out);
  const h = CONTEXT_HEIGHT - 12;

  return (
    <div style={{ position: "absolute", left: x, top: y, height: CONTEXT_HEIGHT, opacity: 1 - gone }}>
      <svg width={24} height={h} viewBox={`0 0 24 ${h}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <path
          d={`M 22 ${stroke.trace / 2} H ${stroke.trace / 2} V ${h - stroke.trace / 2} H 22`}
          fill="none"
          stroke={color.ink}
          strokeWidth={stroke.trace}
          pathLength={1}
          {...draw(open)}
        />
      </svg>
      <div style={{ position: "absolute", left: 30, top: 0, ...mono(size.label, 700), color: color.inkDim, opacity: textP }}>
        CONTEXT
      </div>
      <div
        style={{
          position: "absolute",
          left: 30,
          top: 28,
          ...sans(size.head, 700),
          lineHeight: "72px",
          whiteSpace: "nowrap",
          opacity: textP,
          translate: `${(1 - textP) * 12}px 0px`,
        }}
      >
        {text}
      </div>
    </div>
  );
};
