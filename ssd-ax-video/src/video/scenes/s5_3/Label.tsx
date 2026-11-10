import React from "react";
import { color, mono, sans, size } from "../../theme";

/** <svg> 안의 이름표. 읽는 글자는 30px(sans), 영문 장식은 22px(mono). y 는 글자의 세로 중심이다. */
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
}> = ({ x, y, text, fill, weight, anchor = "start", opacity, deco }) => {
  const font = deco ? mono(size.label, weight ?? 500) : sans(size.small, weight ?? 600);
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
