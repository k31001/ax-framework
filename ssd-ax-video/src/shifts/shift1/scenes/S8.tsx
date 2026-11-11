import React from "react";
import { DUR, draw, ease, enter, lerp, progress } from "../../../video/anim";
import { CheckIcon, HumanIcon } from "../../../video/components/Icons";
import { Trace, Via } from "../../../video/components/Trace";
import type { Pt } from "../../../video/components/Trace";
import { color, mono, sans, size, stroke, withAlpha } from "../../../video/theme";
import { ShiftSheet, useScene } from "../../lib";
import { Box, Group, Layer, NoLig, SceneHead, useT } from "./kit";
import { CONTRACT_ID, DERIVED } from "./S3";

// s8 지키는 선과 마무리: 계약은 사람 소유, 파생은 interface 층까지.

const C = { x: 96, y: 330, w: 420, h: 240 };
const MID = C.y + C.h / 2;
const BX = 660;
const BW = 400;
const BH = 90;
const BY = [255, 405, 555];
const FORK = 588;
const DIV = 1130;

export const S8: React.FC = () => {
  const { frame, t } = useT();
  const { script } = useScene();
  const a1 = t("s8.1");
  const a2 = t("s8.2");
  const a3 = t("s8.3");
  const a4 = t("s8.4");
  const own = progress(frame, t("s8.1", 0.45), 16, ease.out);
  const sign = progress(frame, t("s8.1", 0.55), 26, ease.inOut);
  const caught = (i: number): number => progress(frame, t("s8.2", 0.55) + i * 6, 10, ease.out);
  const div = progress(frame, a3, 22, ease.inOut);
  const right = t("s8.3", 0.55);
  const judge = t("s8.3", 0.72);
  const routes: Pt[][] = BY.map((y) => {
    const cy = y + BH / 2;
    return cy === MID ? [[C.x + C.w, MID], [BX, cy]] : [[C.x + C.w, MID], [FORK, MID], [FORK, cy], [BX, cy]];
  });
  const arrow2 = progress(frame, t("s8.4", 0.6) + 8, DUR.draw, ease.inOut);
  const arrow1 = progress(frame, a4 + 12, DUR.draw, ease.inOut);
  return (
    <ShiftSheet hold>
      <NoLig>
      <SceneHead />

      <Group dimAt={a4} dimTo={0.3}>
        {/* 계약 카드와 세 파생물 (s3 의 구도) */}
        <Layer>
          <rect x={C.x} y={C.y} width={C.w} height={C.h} fill={withAlpha(color.panel, 0.92)} stroke={color.human} strokeWidth={lerp(stroke.trace, 6, own)} />
          <rect x={C.x} y={C.y} width={C.w} height={66} fill={withAlpha(color.human, 0.12 + 0.1 * own)} />
          <line x1={C.x} x2={C.x + C.w} y1={C.y + 66} y2={C.y + 66} stroke={color.human} strokeWidth={stroke.hair} />
          {[0, 1, 2].map((i) => (
            <rect key={i} x={C.x + 28} y={C.y + 92 + i * 26} width={[300, 220, 340][i]} height={8} fill={color.line} />
          ))}
          {routes.map((pts, i) => (
            <Trace key={i} pts={pts} stroke={color.agent} at={6 + i * 4} duration={18} arrow />
          ))}
          <Via x={FORK} y={MID} stroke={color.agent} p={progress(frame, 10)} />
          {/* [s8.1] 서명 */}
          <path d="M 170 300 c 14 -34 30 -34 26 -6 c -4 22 14 -26 30 -22 c 14 4 -8 30 10 24 c 16 -6 22 -26 36 -18 c 10 6 -2 22 18 16 l 36 -10" fill="none" stroke={color.human} strokeWidth={stroke.trace} pathLength={1} {...draw(sign)} opacity={sign > 0 ? 1 : 0} />
        </Layer>
        <div style={{ position: "absolute", left: C.x + 26, top: C.y + 12, ...mono(34, 700), color: color.human }}>{CONTRACT_ID}</div>
        <div style={{ position: "absolute", left: C.x + 28, top: C.y + 176, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ ...mono(size.small, 700), color: color.ink }}>verify:</div>
          <div style={{ width: 56, height: 14, backgroundColor: withAlpha(color.agent, 0.5) }} />
          <div style={{ width: 84, height: 14, backgroundColor: withAlpha(color.agent, 0.5) }} />
        </div>
        <div style={{ position: "absolute", left: C.x + 8, top: 264, ...enter(frame, a1) }}>
          <HumanIcon size={48} color={color.human} />
        </div>
        <div style={{ position: "absolute", left: C.x + 344, top: 270, opacity: progress(frame, t("s8.1", 0.55) + 24), scale: `${1.3 - 0.3 * progress(frame, t("s8.1", 0.55) + 24)}` }}>
          <CheckIcon size={40} color={color.human} />
        </div>
        {DERIVED.map((name, i) => (
          <Box key={name} x={BX} y={BY[i]} w={BW} h={BH} at={16 + i * 4} text={name} tone="agent" px={34} flashAt={i === 0 ? t("s8.2", 0.55) + 18 : undefined} />
        ))}

        {/* [s8.2] 심어 둔 bug 가 assertion 에 잡힌다 */}
        <Group out={a3 - 4}>
          {[0, 1, 2, 3].map((i) => {
            const inP = progress(frame, a2 + i * 7, 16, ease.out);
            const c = caught(i);
            const x = BX + BW + 30 + i * 52 + (1 - inP) * 160;
            return (
              <div key={i} style={{ position: "absolute", left: x, top: BY[0] + 2, width: 40, height: 40, opacity: inP }}>
                <div style={{ position: "absolute", inset: 8, borderRadius: 20, backgroundColor: color.problem, opacity: 1 - c }} />
                <div style={{ position: "absolute", inset: 0, opacity: c, border: `${stroke.thin}px solid ${color.agent}`, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CheckIcon size={24} color={color.agent} />
                </div>
              </div>
            );
          })}
          <div style={{ position: "absolute", left: BX + BW + 30, top: BY[0] + 52, ...sans(size.small, 600), color: color.inkSoft, whiteSpace: "nowrap", ...enter(frame, t("s8.2", 0.55)) }}>심어 둔 위반 검출</div>
        </Group>

        {/* [s8.3] 선: 파생은 interface 층까지 */}
        <Layer>
          <line x1={DIV} x2={DIV} y1={176} y2={176 + 500 * div} stroke={color.ink} strokeWidth={stroke.thin} strokeDasharray="12 9" />
          <Trace pts={[[C.x + 210, C.y + C.h], [C.x + 210, 652], [1532, 652], [1532, 504]]} stroke={color.inkSoft} dash="10 8" at={judge} duration={30} arrow />
        </Layer>
        <div style={{ position: "absolute", left: 96, top: 186, ...sans(size.small, 700), color: color.agent, whiteSpace: "nowrap", ...enter(frame, a3 + 6) }}>interface 층: register · 규약 checker · header · 문서 = 파생</div>
        <Box x={1240} y={400} w={584} h={100} at={right} text="로직 RTL · FW 정책 = 설계" px={36} />
        <div style={{ position: "absolute", left: 1170, top: 606, ...sans(size.small, 700), whiteSpace: "nowrap", padding: "0 10px", ...enter(frame, judge + 14) }}>판정</div>
      </Group>

      {/* [s8.4] 마무리 */}
      <div style={{ position: "absolute", left: 96, top: 700, height: 80, display: "flex", alignItems: "center", gap: 28 }}>
        <div style={{ ...sans(size.sub, 500), color: color.inkDim, whiteSpace: "nowrap", ...enter(frame, a4) }}>문서를 읽고 맞추는 일</div>
        <svg width={120} height={24} style={{ flex: "none" }}>
          <line x1={0} y1={12} x2={104 * arrow1} y2={12} stroke={color.agent} strokeWidth={stroke.bold} />
          <path d="M 104 4 L 118 12 L 104 20 Z" fill={color.agent} opacity={arrow1 >= 1 ? 1 : 0} />
        </svg>
        <div style={{ ...sans(size.head, 800), whiteSpace: "nowrap", ...enter(frame, t("s8.4", 0.42)) }}>계약을 정하는 일</div>
      </div>
      <div style={{ position: "absolute", left: 96, top: 808, height: 70, display: "flex", alignItems: "center", gap: 24 }}>
        <div style={{ ...sans(40, 500), color: color.inkDim, whiteSpace: "nowrap", ...enter(frame, t("s8.4", 0.6)) }}>{script.from}</div>
        <svg width={120} height={24} style={{ flex: "none" }}>
          <line x1={0} y1={12} x2={104 * arrow2} y2={12} stroke={color.agent} strokeWidth={stroke.bold} />
          <path d="M 104 4 L 118 12 L 104 20 Z" fill={color.agent} opacity={arrow2 >= 1 ? 1 : 0} />
        </svg>
        <div style={{ ...sans(40, 700), color: color.agent, whiteSpace: "nowrap", ...enter(frame, t("s8.4", 0.6) + 20) }}>{script.to}</div>
      </div>
      </NoLig>
    </ShiftSheet>
  );
};
