import React from "react";
import { color, mono, sans, size } from "../../theme";

/** <svg> 안의 이름표. 읽는 글자는 30px(sans) 이상, 영문 장식은 22px(mono). y 는 글자의 세로 중심이다. */
export const Label: React.FC<{
  x: number;
  y: number;
  text: string;
  fill?: string;
  weight?: number;
  anchor?: "start" | "middle" | "end";
  opacity?: number;
  /** 영문 장식 라벨 */
  deco?: boolean;
  /** 글자 크기. 기본 size.small. ID·수치는 code 로 mono 를 쓴다. */
  px?: number;
  code?: boolean;
}> = ({ x, y, text, fill, weight, anchor = "start", opacity, deco, px = size.small, code }) => {
  const font = deco ? mono(size.label, weight ?? 500) : code ? mono(px, weight ?? 500) : sans(px, weight ?? 600);
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      dominantBaseline="central"
      fill={fill ?? (deco ? color.inkDim : color.inkSoft)}
      opacity={opacity}
      style={{
        fontFamily: font.fontFamily,
        fontSize: font.fontSize,
        fontWeight: font.fontWeight,
        letterSpacing: font.letterSpacing,
      }}
    >
      {text}
    </text>
  );
};
