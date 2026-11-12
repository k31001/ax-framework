import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, ease, progress } from "../../../video/anim";
import { Trace, Via } from "../../../video/components/Trace";
import { color, fullSvg, mono, stroke, withAlpha } from "../../../video/theme";
import { ShiftSheet, ShiftTitle } from "../../lib";
import { At, BlockRow, Box, MiniReqCard, REQ_CARD, TrackRow, tx, useCues } from "./kitA";

// S1 제목과 질문: 요구사항이 바뀌면 구조가 흔들리고, 길이 둘로 갈린다.

const CX = 1340;
const CARD_Y = 96;
const ROW = { y: 276, bw: 96, bh: 52, gap: 36 } as const;
const ROW_W = 4 * ROW.bw + 3 * ROW.gap;
const FORK = { y: 420, w: 300, h: 150, lx: 1010, rx: 1370 } as const;
export const TRACKS = { x: 324, pitch: 250, cellW: 226, h: 56, y1: 664, y2: 746 } as const;
export const TX1 = { rtl: "RTL 먼저", model: "모델 먼저" } as const;

export const S1: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, within } = useCues();
  const c2 = cue("s1.2");
  const c3 = cue("s1.3");
  const c4 = cue("s1.4");

  const breakAt = within("s1.2", 0.5);
  const broken = progress(frame, breakAt, 12);
  // 흔들림: 잠깐 떨리다 가라앉는다
  const t = frame - breakAt;
  const shake = t < 0 ? 0 : Math.sin(t * 1.5) * 7 * Math.max(0, 1 - t / 40);

  const leftAt = within("s1.3", 0.12);
  const rightAt = within("s1.3", 0.55);
  const askAt = within("s1.3", 0.86);
  const lp = progress(frame, leftAt + 8, DUR.enter);
  const rp = progress(frame, rightAt + 8, DUR.enter);
  const midY = ROW.y + ROW.bh + 46;

  return (
    <ShiftSheet>
      <ShiftTitle />

      {/* 요구사항 카드와 그 아래의 구조 */}
      <MiniReqCard x={CX - REQ_CARD.w / 2} y={CARD_Y} p={progress(frame, c2, DUR.enter)} />
      <svg {...fullSvg}>
        <Trace pts={[[CX, CARD_Y + REQ_CARD.h], [CX, ROW.y]]} stroke={broken > 0.5 ? color.problem : color.inkSoft} dash={broken > 0.5 ? "6 6" : undefined} at={c2 + 10} />
        {/* 갈림길 */}
        <Trace pts={[[CX, ROW.y + ROW.bh], [CX, midY]]} stroke={color.inkSoft} at={c3} duration={10} />
        <Trace pts={[[CX, midY], [FORK.lx + FORK.w / 2, midY], [FORK.lx + FORK.w / 2, FORK.y]]} stroke={color.inkDim} arrow at={leftAt} />
        <Trace pts={[[CX, midY], [FORK.rx + FORK.w / 2, midY], [FORK.rx + FORK.w / 2, FORK.y]]} stroke={color.agent} arrow at={rightAt} />
        <Via x={CX} y={midY} p={progress(frame, c3 + 8, 10)} />
      </svg>
      <BlockRow x={CX - ROW_W / 2} y={ROW.y} bw={ROW.bw} bh={ROW.bh} gap={ROW.gap} p={progress(frame, c2 + 18, 20)} broken={broken} shake={shake} />

      {/* 왼쪽: RTL 먼저 (코드 줄 무늬) */}
      <Box x={FORK.lx} y={FORK.y} w={FORK.w} h={FORK.h} c={color.inkDim} p={lp} style={{ justifyContent: "flex-end", paddingBottom: 12 }}>
        <svg width={FORK.w - 4} height={78} style={{ position: "absolute", left: 0, top: 14 }}>
          {[150, 208, 176, 120, 190].map((w, i) => (
            <line key={i} x1={36 + (i === 1 || i === 2 || i === 3 ? 22 : 0)} x2={36 + (i === 1 || i === 2 || i === 3 ? 22 : 0) + w * progress(frame, leftAt + 12 + i * 3, 12)} y1={8 + i * 15} y2={8 + i * 15} stroke={color.inkDim} strokeWidth={stroke.bold} />
          ))}
        </svg>
        <div style={tx(36, 700, color.inkDim)}>{TX1.rtl}</div>
      </Box>
      {/* 오른쪽: 모델 먼저 (분포 곡선 무늬) */}
      <Box x={FORK.rx} y={FORK.y} w={FORK.w} h={FORK.h} c={color.agent} bg={withAlpha(color.agent, 0.08)} p={rp} style={{ justifyContent: "flex-end", paddingBottom: 12 }}>
        <svg width={FORK.w - 4} height={84} style={{ position: "absolute", left: 0, top: 10 }}>
          <line x1={30} x2={266} y1={76} y2={76} stroke={color.lineStrong} strokeWidth={stroke.hair} />
          <path
            d="M 30 74 C 60 74 66 12 92 12 C 122 12 128 56 160 66 C 200 73 236 74 266 75"
            fill="none"
            stroke={color.agent}
            strokeWidth={stroke.trace}
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - progress(frame, rightAt + 12, 20, ease.inOut)}
          />
        </svg>
        <div style={tx(36, 700, color.agent)}>{TX1.model}</div>
      </Box>
      <At x={CX} y={FORK.y + 24} center p={progress(frame, askAt, DUR.enter)} style={{ ...mono(88, 700), color: color.ink }}>
        ?
      </At>

      {/* 같은 길이의 빈 타임라인 두 줄 */}
      <At x={96} y={TRACKS.y1 + 8} p={progress(frame, c4, DUR.enter)} style={tx(32, 700, color.inkDim)}>
        {TX1.rtl}
      </At>
      <At x={96} y={TRACKS.y2 + 8} p={progress(frame, c4 + 14, DUR.enter)} style={tx(32, 700, color.agent)}>
        {TX1.model}
      </At>
      <TrackRow x={TRACKS.x} y={TRACKS.y1} h={TRACKS.h} pitch={TRACKS.pitch} cellW={TRACKS.cellW} cells={Array.from({ length: 6 }, () => ({ c: color.inkDim, lit: 0.7 }))} p={progress(frame, c4 + 4, 40, ease.inOut)} dashEmpty />
      <TrackRow
        x={TRACKS.x}
        y={TRACKS.y2}
        h={TRACKS.h}
        pitch={TRACKS.pitch}
        cellW={TRACKS.cellW}
        cells={Array.from({ length: 6 }, () => ({ c: color.agent, lit: 0.7 }))}
        p={progress(frame, c4 + 18, 40, ease.inOut)}
        dashEmpty
      />
    </ShiftSheet>
  );
};
