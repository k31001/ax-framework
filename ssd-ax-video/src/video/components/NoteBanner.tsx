import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, ease, lerp, progress } from "../anim";
import { color, mono, sans, size, stroke, withAlpha } from "../theme";

// 강조 문구(note): 흐름과 별개로 크게 나오는 한 줄.
// 도면의 주석 상자처럼 네 귀퉁이의 꺾쇠가 가운데에서 바깥으로 벌어지며 자리를 잡고, 글자가 들어온다.

const CORNER = 22;

export const NoteBanner: React.FC<{
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** 나타나는 프레임 */
  at: number;
  /** 사라지는 프레임. 없으면 씬 끝까지 남는다. */
  out?: number;
  /** 글자 크기. 기본 size.head */
  px?: number;
}> = ({ text, x, y, w, h, at, out, px = size.head }) => {
  const frame = useCurrentFrame();
  const open = progress(frame, at, DUR.draw + 2, ease.out);
  if (open <= 0) return null;
  const gone = out === undefined ? 0 : progress(frame, out, DUR.exit, ease.in);
  if (gone >= 1) return null;
  const textP = progress(frame, at + 6, DUR.enter, ease.out);

  // 꺾쇠: 가운데 쪽에서 귀퉁이로
  const inset = lerp(w * 0.18, 0, open);
  const left = inset + stroke.trace / 2;
  const right = w - inset - stroke.trace / 2;
  const top = stroke.trace / 2;
  const bottom = h - stroke.trace / 2;

  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, opacity: 1 - gone }}>
      <div
        style={{
          position: "absolute",
          left: inset,
          right: inset,
          top: 0,
          bottom: 0,
          backgroundColor: withAlpha(color.ink, 0.045),
          opacity: open,
        }}
      />
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", inset: 0 }}>
        <g fill="none" stroke={color.ink} strokeWidth={stroke.trace} opacity={open}>
          <path d={`M ${left + CORNER} ${top} H ${left} V ${top + CORNER}`} />
          <path d={`M ${right - CORNER} ${top} H ${right} V ${top + CORNER}`} />
          <path d={`M ${left + CORNER} ${bottom} H ${left} V ${bottom - CORNER}`} />
          <path d={`M ${right - CORNER} ${bottom} H ${right} V ${bottom - CORNER}`} />
        </g>
      </svg>
      <div style={{ position: "absolute", left: 28, top: 14, ...mono(size.label, 700), color: color.inkDim, opacity: textP }}>
        NOTE
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: 10,
        }}
      >
        <div
          style={{
            ...sans(px, 700),
            whiteSpace: "nowrap",
            opacity: textP,
            translate: `0px ${(1 - textP) * 12}px`,
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
};
