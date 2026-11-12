import React from "react";
import { useCurrentFrame } from "remotion";
import { progress } from "../../../video/anim";
import { HumanIcon } from "../../../video/components/Icons";
import { Trace } from "../../../video/components/Trace";
import type { Pt } from "../../../video/components/Trace";
import { color, fullSvg, stroke, withAlpha } from "../../../video/theme";
import { ShiftSheet } from "../../lib";
import { At, Box, CAND_INFO, CAND_W, CandidateDiagram, blend, tx, useCues } from "./kitA";

// S6 후보 구조 세우기: 2×2 로 놓인 블록도 넷. 뼈대는 같고 다른 부분만 청록이다.

const KINDS = ["A", "B", "C", "D"] as const;
const CELL = { x: [96, 972], y: [72, 458], h: 374 } as const;
const TAG = { w: 372, h: 40, dy: 334 } as const;
const INPUT = { x: 850, y: 848, w: 220, h: 50 } as const;
const MID_X = 960;

export const S6: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, within } = useCues();
  const c1 = cue("s6.1");
  const starts = [cue("s6.2"), cue("s6.3"), cue("s6.4"), cue("s6.5")];
  const accents = [within("s6.2", 0.5), within("s6.3", 0.6), within("s6.4", 0.55), within("s6.5", 0.5)];
  const c6 = cue("s6.6");
  const c7 = cue("s6.7");
  const all = progress(frame, c6 - 6, 14);

  return (
    <ShiftSheet>
      {/* 칸을 가르는 가는 선 */}
      <svg {...fullSvg}>
        <line x1={MID_X} x2={MID_X} y1={72} y2={72 + 760 * progress(frame, c1, 20)} stroke={color.line} strokeWidth={stroke.hair} />
        <line x1={96} x2={96 + 1728 * progress(frame, c1, 20)} y1={452} y2={452} stroke={color.line} strokeWidth={stroke.hair} />
      </svg>

      {KINDS.map((k, i) => {
        const x = CELL.x[i % 2];
        const y = CELL.y[Math.floor(i / 2)];
        const on = progress(frame, starts[i], 12);
        // 지금 말하는 칸만 또렷하다. 지나간 칸은 조금 물러난다.
        const next = i < 3 ? progress(frame, starts[i + 1], 12) : 0;
        const focus = Math.max(all, on * (1 - next));
        const opacity = 0.42 + 0.58 * Math.max(focus, 1 - progress(frame, starts[0], 12));
        const info = CAND_INFO[k];
        const tagP = progress(frame, c6 + 8 + i * 8, 14);
        return (
          <React.Fragment key={k}>
            <div style={{ opacity }}>
              <At x={x} y={y - 6} p={progress(frame, c1 + i * 3, 14)} style={{ ...tx(42, 800, blend(color.ink, color.agent, on)), lineHeight: "46px" }}>
                {k}
              </At>
              <At x={x + 52} y={y + 3} p={on} style={tx(30, 600, color.inkSoft)}>
                {info.note}
              </At>
              <CandidateDiagram kind={k} x={x} y={y + 48} at={c1 + 4 + i * 3} diffAt={starts[i] + 4} accentAt={accents[i]} />
            </div>
            {/* RTL 설계자의 추정 */}
            <Box x={x + CAND_W - TAG.w} y={y + TAG.dy} w={TAG.w} h={TAG.h} c={color.human} bg={withAlpha(color.human, 0.1)} p={tagP} style={{ flexDirection: "row", gap: 14 }}>
              <HumanIcon size={26} color={color.human} />
              <div style={tx(30, 700, color.human)}>{info.area}</div>
              <div style={tx(30, 700, color.human)}>{info.reuse}</div>
            </Box>
          </React.Fragment>
        );
      })}

      <At x={96} y={854} p={progress(frame, c6, 14)} style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <HumanIcon size={32} color={color.human} />
        <div style={tx(30, 700, color.human)}>RTL 설계자 추정</div>
      </At>

      {/* 추정 → 모델 입력 */}
      <svg {...fullSvg}>
        {KINDS.map((k, i) => {
          const x = CELL.x[i % 2];
          const y = CELL.y[Math.floor(i / 2)] + TAG.dy + TAG.h / 2;
          const left = i % 2 === 0;
          const pts: Pt[] = left
            ? [[x + CAND_W, y], [MID_X - 6, y], [MID_X - 6, INPUT.y]]
            : [[x + CAND_W - TAG.w, y], [MID_X + 6, y], [MID_X + 6, INPUT.y]];
          return <Trace key={k} pts={pts} stroke={color.agent} arrow={i >= 2} at={c7 + i * 3} duration={22} />;
        })}
      </svg>
      <Box x={INPUT.x} y={INPUT.y} w={INPUT.w} h={INPUT.h} c={color.agent} bg={withAlpha(color.agent, 0.12)} bw={stroke.trace} p={progress(frame, c7 + 14, 14)}>
        <div style={tx(32, 800, color.agent)}>모델 입력</div>
      </Box>
    </ShiftSheet>
  );
};
