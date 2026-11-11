import React from "react";
import { DUR, ease, enter, progress } from "../../../video/anim";
import { Pad, Trace } from "../../../video/components/Trace";
import { color, mono, sans, size, stroke, withAlpha } from "../../../video/theme";
import { ShiftSheet, ShiftTitle, useScene } from "../../lib";
import { DOC, Group, Layer, NoLig, Paper, useT } from "./kit";

// s1 제목과 질문: '5대 전환' 칩의 1번 핀 → API 문서의 문장 하나.

const CHIP = { x: 1300, y: 130, w: 300, h: 360 };
const ROW0 = 250;
const ROW_GAP = 50;

export const S1: React.FC = () => {
  const { frame, t } = useT();
  const { script } = useScene();
  const on = progress(frame, t("s1.1"), DUR.enter, ease.out);
  const chip = progress(frame, 8, DUR.draw, ease.out);
  const pinY = ROW0;
  return (
    <ShiftSheet>
      <NoLig>
      <ShiftTitle />

      {/* 5대 전환 칩: 1번 핀만 켜진다 */}
      <Group dimAt={t("s1.3")} dimTo={0.3}>
        <Layer>
          <rect x={CHIP.x} y={CHIP.y} width={CHIP.w} height={CHIP.h * chip} fill={withAlpha(color.panel, 0.9)} stroke={color.inkSoft} strokeWidth={stroke.thin} />
          <path d={`M ${CHIP.x + CHIP.w / 2 - 16} ${CHIP.y} a 16 16 0 0 0 32 0`} fill="none" stroke={color.inkSoft} strokeWidth={stroke.hair} opacity={chip} />
          <line x1={CHIP.x} x2={CHIP.x + CHIP.w * chip} y1={CHIP.y + 86} y2={CHIP.y + 86} stroke={color.line} strokeWidth={stroke.hair} />
          {[0, 1, 2, 3, 4].map((i) => {
            const y = ROW0 + i * ROW_GAP;
            const lit = i === 0 ? on : 0;
            return (
              <g key={i} opacity={chip}>
                <rect x={CHIP.x - 7} y={y - 7} width={14} height={14} fill={color.bg} stroke={i === 0 ? color.inkSoft : color.lineStrong} strokeWidth={stroke.thin} />
                <rect x={CHIP.x + CHIP.w - 7} y={y - 7} width={14} height={14} fill={lit > 0 ? color.agent : color.bg} stroke={lit > 0 ? color.agent : color.lineStrong} strokeWidth={stroke.thin} />
                {i > 0 ? <line x1={CHIP.x + 70} x2={CHIP.x + CHIP.w - 70} y1={y} y2={y} stroke={color.line} strokeWidth={8} /> : null}
              </g>
            );
          })}
          {/* [s1.2] 왼쪽은 점선, 오른쪽은 청록 화살표 */}
          <Trace pts={[[CHIP.x - 10, pinY], [CHIP.x - 150, pinY]]} stroke={color.inkDim} dash="2 9" at={t("s1.2")} />
          <Pad x={CHIP.x - 156} y={pinY} fill={color.inkDim} p={progress(frame, t("s1.2") + 12)} />
          <Trace pts={[[CHIP.x + CHIP.w + 10, pinY], [1824, pinY]]} stroke={color.agent} width={stroke.bold} arrow at={t("s1.2", 0.3)} duration={22} />
        </Layer>
        <div style={{ position: "absolute", left: CHIP.x, top: CHIP.y + 22, width: CHIP.w, textAlign: "center", ...sans(size.sub, 800), opacity: chip }}>5대 전환</div>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{ position: "absolute", left: CHIP.x + 22, top: ROW0 + i * ROW_GAP - 14, ...mono(size.label, 500), color: i === 0 ? color.agent : color.inkDim, opacity: chip * (i === 0 ? 0.4 + 0.6 * on : 1) }}>
            {i + 1}
          </div>
        ))}
        <div style={{ position: "absolute", left: CHIP.x, top: ROW0 - 22, width: CHIP.w, textAlign: "center", ...sans(34, 700), color: color.ink, opacity: chip * (0.45 + 0.55 * on) }}>
          {script.axis}
        </div>
      </Group>

      {/* [s1.2] 제목 블록의 '현재 → 전환 후' 줄 아래에 밑줄이 그어진다 */}
      <Layer>
        <Trace pts={[[96, 506], [990, 506]]} stroke={color.agent} width={stroke.hair} at={t("s1.2")} duration={26} opacity={0.8} />
      </Layer>

      {/* [s1.3] API 문서 한 쪽, 문장 하나만 밝다 */}
      <Paper x={96} y={560} w={1728} h={320} at={t("s1.3")} litAt={t("s1.3", 0.35)} lines={[DOC]} px={50} above={2} below={2} />
      <div style={{ position: "absolute", right: 96 + 60, top: 572, ...mono(size.label, 500), color: color.inkDim, ...enter(frame, t("s1.3") + 8, { distance: 0 }) }}>RCV_CTRL · API DOC</div>
      </NoLig>
    </ShiftSheet>
  );
};
