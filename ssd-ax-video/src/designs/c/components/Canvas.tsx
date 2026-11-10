// 장면 바탕: 밝고 서늘한 회색 작업대와 옅은 점 격자.

import { AbsoluteFill } from "remotion";
import { C, KR } from "../theme";

export const Canvas: React.FC<{ children: React.ReactNode; grid?: boolean }> = ({ children, grid = true }) => (
  <AbsoluteFill style={{ ...KR, backgroundColor: C.bg, color: C.ink, overflow: "hidden" }}>
    {grid ? (
      <AbsoluteFill
        style={{
          backgroundImage: "radial-gradient(circle, rgba(23,32,58,0.075) 1.5px, transparent 1.6px)",
          backgroundSize: "32px 32px",
          backgroundPosition: "16px 12px",
        }}
      />
    ) : null}
    {children}
  </AbsoluteFill>
);
