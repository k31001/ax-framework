import React from "react";
import { interpolateColors, useCurrentFrame } from "remotion";
import { DUR, ease, lerp, progress } from "../anim";
import { color, safe, sans, size, stroke } from "../theme";
import { Lines } from "./Flow";

// "현재" 한 줄: 전환 전의 방식.
// 씬 초반에 본문 자리에서 크고 또렷하게 나왔다가, 흐름도가 그려지기 직전에
// 작아지고 흐려지며 머리 쪽(오른쪽 위) 자리로 물러난다. 물러난 뒤에도 씬이 끝날 때까지 남는다.
//
// 본문 자리의 모습은 머리 쪽 모습을 그대로 키운 것이다(같은 줄바꿈). 그래서 물러나는 움직임이 끊기지 않는다.
// 글자 폭을 재지 않으므로 블록의 폭(w)은 배치 설정에서 준다. 글자보다 조금 넓게 잡는다.

export const BEFORE_HEAD_TOP = 96;
const TAG_H = 42;
const GAP = 14;
const LINE_H = 38;

/** 블록의 높이(머리 쪽 크기 기준) */
export const beforeHeight = (lines: 1 | 2): number => TAG_H + GAP + LINE_H * lines;

export const BeforeLine: React.FC<{
  /** 꼬리표 글자. content.ts 의 BEFORE_LABEL */
  label: string;
  text: string;
  /** 둘째 줄이 시작하는 낱말의 순서. 없으면 한 줄 */
  br?: number;
  /** 블록의 폭(머리 쪽 크기 기준, px) */
  w: number;
  /** 본문 자리: 키운 블록의 왼쪽 위 */
  body: { x: number; y: number };
  /** 본문 자리에서의 배율 */
  scale?: number;
  /** 나타나는 프레임 */
  at: number;
  /** 머리 쪽으로 물러나기 시작하는 프레임 */
  retreatAt: number;
  retreatDuration?: number;
}> = ({ label, text, br, w, body, scale = 1.8, at, retreatAt, retreatDuration = 16 }) => {
  const frame = useCurrentFrame();
  const appear = progress(frame, at, DUR.enter, ease.out);
  if (appear <= 0) return null;
  const r = progress(frame, retreatAt, retreatDuration, ease.inOut);

  const headLeft = safe.right - w;
  const k = lerp(scale, 1, r);
  const tx = lerp(body.x - headLeft, 0, r);
  const ty = lerp(body.y - BEFORE_HEAD_TOP, 0, r) + (1 - appear) * 14;
  const textColor = interpolateColors(r, [0, 1], [color.ink, color.inkDim]);
  const tagColor = interpolateColors(r, [0, 1], [color.inkSoft, color.inkDim]);
  // 선 굵기는 화면에서 같은 굵기로 보이게 배율로 나눈다.
  const line = stroke.thin / k;

  return (
    <div
      style={{
        position: "absolute",
        left: headLeft,
        top: BEFORE_HEAD_TOP,
        width: w,
        transformOrigin: "0 0",
        translate: `${tx}px ${ty}px`,
        scale: `${k}`,
        // 옮겨 가는 동안에는 흐려져서 진행 표시와 카드 위를 조용히 지나간다.
        opacity: appear * (1 - 0.65 * Math.sin(Math.PI * r)),
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: GAP, height: TAG_H }}>
        <div
          style={{
            ...sans(size.small, 600),
            lineHeight: `${TAG_H - 2 * line}px`,
            padding: "0 14px",
            color: tagColor,
            border: `${line}px dashed ${tagColor}`,
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </div>
        {/* 점선: 꼬리표에서 오른쪽으로 그려진다 */}
        <div style={{ flex: 1, height: 0, position: "relative" }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: -line / 2,
              width: `${appear * 100}%`,
              borderTop: `${line}px dashed ${color.lineStrong}`,
            }}
          />
        </div>
      </div>
      <div
        style={{
          ...sans(size.small, Math.round(lerp(600, 500, r))),
          lineHeight: `${LINE_H}px`,
          marginTop: GAP,
          color: textColor,
        }}
      >
        <Lines text={text} br={br} />
      </div>
    </div>
  );
};
