import React from "react";
import { interpolateColors, useCurrentFrame } from "remotion";
import { clamp01, ease, progress } from "../../anim";
import { pointOnTrace } from "../../components/Trace";
import type { Pt } from "../../components/Trace";
import { color, fullSvg, mono, pad2, size, stroke, withAlpha } from "../../theme";
import { JAMS, PIECE, PIECES, ROW, T, landedCount, pileCenterX, pileTop } from "./layout";

// 앞 단계가 쏟아낸 작업 조각. 흐름을 따라 가다가 검증과 통합 앞에서 위로 쌓인다.
// 더미 위에는 쌓인 수가 올라간다(장식 라벨).

export const Pieces: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < T.emit) return null;
  const counts = JAMS.map((_, i) => landedCount(frame, i));

  return (
    <>
      <svg {...fullSvg}>
        {PIECES.map((piece, k) => {
          if (frame < piece.start) return null;
          const t = clamp01((frame - piece.start) / piece.duration);
          const pts: Pt[] = [
            [piece.from, ROW.y],
            [piece.x, ROW.y],
            [piece.x, piece.y],
          ];
          const length = piece.x - piece.from + (ROW.y - piece.y);
          const at = pointOnTrace(pts, ease.inOut(t) * length, 0);
          const pop = progress(frame, piece.start, 5);
          // 놓이면 속이 비고 테두리만 남는다.
          const settled = progress(frame, piece.start + piece.duration - 2, 8);
          const s = PIECE * (0.4 + 0.6 * pop);
          return (
            <rect
              key={k}
              x={at.x - s / 2}
              y={at.y - s / 2}
              width={s}
              height={s}
              fill={withAlpha(color.agent, 1 - 0.72 * settled)}
              stroke={color.agent}
              strokeWidth={stroke.hair}
              opacity={pop}
            />
          );
        })}
      </svg>

      {JAMS.map((jam, i) => {
        const count = counts[i];
        const show = clamp01((count - 3) / 3);
        if (show <= 0) return null;
        const level = clamp01((count - 4) / (jam.count * 0.5));
        const tone = interpolateColors(level, [0, 1], [color.inkSoft, color.problem]);
        return (
          <div
            key={jam.stage}
            style={{
              position: "absolute",
              left: pileCenterX(i) - 100,
              width: 200,
              top: pileTop(frame, i) - 40,
              textAlign: "center",
              ...mono(size.label, 700),
              color: tone,
              opacity: show,
            }}
          >
            QUEUE {pad2(Math.round(count))}
          </div>
        );
      })}
    </>
  );
};
