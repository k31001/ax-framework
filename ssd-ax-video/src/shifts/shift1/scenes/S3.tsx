import React from "react";
import { DUR, draw, ease, enter, progress } from "../../../video/anim";
import { Trace, Via } from "../../../video/components/Trace";
import type { Pt } from "../../../video/components/Trace";
import { color, mono, sans, size, stroke, withAlpha } from "../../../video/theme";
import { ShiftSheet } from "../../lib";
import { Box, DOC_2, DOC_LABEL, Group, Layer, NoLig, Paper, SceneHead, useT } from "./kit";

// s3 전환 후: 문장이 ID 가 붙은 계약 카드가 되고, 거기서 세 파생물이 나온다.

export const CONTRACT_ID = "HSI-RCV-012";
export const DERIVED = ["assertion (SVA)", "driver 테스트", "API 문서"] as const;
export const GENERATED = "생성";

const C = { x: 96, y: 340, w: 840, h: 380 };
const BX = 1220;
const BW = 604;
const BH = 130;
const BY = [295, 465, 635];
const MID = C.y + C.h / 2;
const FORK = 1076;

export const S3: React.FC = () => {
  const { frame, t } = useT();
  const a1 = t("s3.1");
  const card = progress(frame, a1, 20, ease.inOut);
  const stamp = progress(frame, t("s3.1", 0.45), 10, ease.out);
  const verify = progress(frame, t("s3.2"), DUR.enter, ease.out);
  const diff = progress(frame, t("s3.4"), DUR.enter, ease.out);
  const flash = t("s3.4", 0.5);
  const wave = progress(frame, t("s3.4", 0.22), flash - t("s3.4", 0.22), ease.inOut);
  const routes: Pt[][] = BY.map((y) => {
    const cy = y + BH / 2;
    return cy === MID ? [[C.x + C.w, MID], [BX, cy]] : [[C.x + C.w, MID], [FORK, MID], [FORK, cy], [BX, cy]];
  });
  const starts = [t("s3.3", 0.02), t("s3.3", 0.24), t("s3.3", 0.48)];
  return (
    <ShiftSheet>
      <NoLig>
      <SceneHead />

      {/* 종이 윤곽선은 카드가 되며 사라진다 */}
      <Group out={a1 + 6}>
        <Paper x={C.x} y={C.y} w={C.w} h={C.h} at={0} lines={[]} above={2} below={3} label={false} />
        <div style={{ position: "absolute", left: C.x + 36, top: C.y + 14, ...sans(size.small, 600), color: color.inkDim }}>{DOC_LABEL}</div>
      </Group>

      {/* 계약 카드: 테두리는 호박색(사람 소유) */}
      <Layer>
        <rect x={C.x} y={C.y} width={C.w} height={C.h} fill={withAlpha(color.panel, 0.92 * card)} stroke={color.human} strokeWidth={stroke.trace} pathLength={1} {...draw(card)} />
        <rect x={C.x} y={C.y} width={C.w * card} height={72} fill={withAlpha(color.human, 0.12)} />
        <line x1={C.x} x2={C.x + C.w * card} y1={C.y + 72} y2={C.y + 72} stroke={color.human} strokeWidth={stroke.hair} />
        <line x1={C.x + 28} x2={C.x + 28 + (C.w - 56) * verify} y1={C.y + 262} y2={C.y + 262} stroke={color.line} strokeWidth={stroke.hair} />
      </Layer>
      <div style={{ position: "absolute", left: C.x + 28, top: C.y + 12, ...mono(40, 700), color: color.human, opacity: stamp, scale: `${1.25 - 0.25 * stamp}`, transformOrigin: "left center" }}>{CONTRACT_ID}</div>
      <div style={{ position: "absolute", right: 1920 - (C.x + C.w) + 24, top: C.y + 24, ...mono(size.label, 700), color: color.human, opacity: card }}>CONTRACT</div>

      {/* 문장: 종이에서 카드로 그대로 남는다 */}
      {DOC_2.map((s, i) => (
        <div key={i} style={{ position: "absolute", left: C.x + 20, top: C.y + 108 + i * 58, width: C.w - 40, height: 58 }}>
          {i === 1 && diff > 0 ? <div style={{ position: "absolute", inset: "2px 0", backgroundColor: withAlpha(color.human, 0.18 * diff), borderLeft: `3px solid ${color.human}` }} /> : null}
          <div style={{ position: "absolute", left: 16, top: 0, ...sans(36, 700), lineHeight: "58px", whiteSpace: "nowrap", ...enter(frame, 4 + i * 3) }}>{s}</div>
        </div>
      ))}
      <div style={{ position: "absolute", right: 1920 - (C.x + C.w) + 24, top: C.y + 232, ...mono(size.label, 700), color: color.human, opacity: diff }}>DIFF −1 +1</div>

      {/* [s3.2] verify: 칸 */}
      <div style={{ position: "absolute", left: C.x + 36, top: C.y + 288, height: 60, display: "flex", alignItems: "center", gap: 18, opacity: verify }}>
        <div style={{ ...mono(34, 700), color: color.ink }}>verify:</div>
        {["sva", "fw_test"].map((s, i) => (
          <div key={s} style={{ height: 48, padding: "0 16px", display: "flex", alignItems: "center", border: `${stroke.thin}px solid ${color.agent}`, backgroundColor: withAlpha(color.agent, 0.1), ...mono(30, 500), color: color.agent, ...enter(frame, t("s3.2", 0.35) + i * 8, { from: "left" }) }}>
            {s}
          </div>
        ))}
      </div>
      <Layer>
        <rect x={C.x + 16} y={C.y + 278} width={C.w - 32} height={80} fill="none" stroke={color.agent} strokeWidth={stroke.thin} opacity={verify * (1 - progress(frame, t("s3.3"), 14))} />
      </Layer>

      {/* [s3.3] 세 갈래 */}
      <Layer>
        {routes.map((pts, i) => (
          <Trace key={i} pts={pts} stroke={color.agent} at={starts[i]} duration={20} arrow />
        ))}
        <Via x={FORK} y={MID} stroke={color.agent} p={progress(frame, starts[0] + 4)} />
        {/* [s3.4] 바뀐 줄이 세 갈래로 함께 퍼진다 */}
        {wave > 0 && wave < 1
          ? routes.map((pts, i) => <Trace key={i} pts={pts} stroke={color.ink} width={stroke.bold + 1.5} progress={wave} opacity={0.9} />)
          : null}
      </Layer>
      {DERIVED.map((name, i) => (
        <Box key={name} x={BX} y={BY[i]} w={BW} h={BH} at={starts[i] + 12} text={name} sub={GENERATED} tone="agent" px={40} flashAt={flash} />
      ))}
      </NoLig>
    </ShiftSheet>
  );
};
