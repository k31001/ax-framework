import React from "react";

/** 0~1 의 결정적 난수(사인 기반 해시). 흩어진 배치에 쓴다. */
export const hash = (n: number): number => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** 점 (x, y) 를 기준으로 글자를 놓는다. 세로는 가운데 정렬. */
export const At: React.FC<{
  x: number;
  y: number;
  align?: "left" | "center" | "right";
  opacity?: number;
  dx?: number;
  dy?: number;
  children: React.ReactNode;
}> = ({ x, y, align = "center", opacity = 1, dx = 0, dy = 0, children }) =>
  opacity <= 0 ? null : (
    <div
      style={{
        position: "absolute",
        left: x + dx,
        top: y + dy,
        transform: `translate(${align === "center" ? "-50%" : align === "right" ? "-100%" : "0"}, -50%)`,
        whiteSpace: "nowrap",
        opacity,
      }}
    >
      {children}
    </div>
  );
