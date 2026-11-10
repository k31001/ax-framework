import { useCurrentFrame } from "remotion";
import { progress } from "../anim";
import { color, kindColor, mono, size, stroke, withAlpha } from "../theme";
import type { Illustration } from "./StageScene";

// 임시 그림. 씬 제작자가 자기 그림으로 바꾼다.
// 그림 자리의 크기를 보여 주고, 각 beat 의 등장 프레임에 작은 칸이 하나씩 켜진다(인터페이스 확인용).

export const PlaceholderIllustration: Illustration = ({ stage, width, height, beats, frames }) => {
  const frame = useCurrentFrame();
  const show = progress(frame, frames.before, 14);
  const cell = 18;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: show }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: "absolute", inset: 0 }}>
        <rect
          x={1}
          y={1}
          width={width - 2}
          height={height - 2}
          fill={withAlpha(color.ink, 0.02)}
          stroke={color.lineStrong}
          strokeWidth={stroke.hair}
          strokeDasharray="8 8"
        />
        <path
          d={`M 1 1 L ${width - 1} ${height - 1} M ${width - 1} 1 L 1 ${height - 1}`}
          stroke={color.line}
          strokeWidth={stroke.grid}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        }}
      >
        <div style={{ ...mono(size.label, 700), color: color.inkDim, backgroundColor: color.bg, padding: "2px 10px" }}>
          ILLUSTRATION · {stage.id} · {width}×{height}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {beats.map((beat, i) => {
            const on = progress(frame, beat.frame, 10);
            const tint =
              beat.kind === "before" ? color.inkDim : beat.kind === "note" ? color.ink : kindColor[beat.kind];
            return (
              <div
                key={i}
                style={{
                  width: cell,
                  height: cell,
                  boxSizing: "border-box",
                  border: `${stroke.hair}px solid ${tint}`,
                  backgroundColor: withAlpha(tint, on),
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
