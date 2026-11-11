import React from "react";
import { ease, enter, lerp, progress } from "../../../video/anim";
import { Trace, Via } from "../../../video/components/Trace";
import { color, mono } from "../../../video/theme";
import { CodePanel, ShiftSheet } from "../../lib";
import { Box, codeLineY, Layer, NoLig, SceneHead, useT } from "./kit";

// s6 그 밖의 산출물: 요구사항 카드 → 계약 → assertion · 테스트 → 결과, 그리고 bug 기록.

const PX = 26;
const REQ = { x: 96, y: 180, w: 640 };
const ROW = codeLineY(REQ.y, 0, PX) + 19;
const HSI = { x: 820, w: 230, h: 70 };
const TEST = { x: 1200, w: 250, h: 60 };
const RES = { x: 1540, w: 284, h: 100 };
const BUG = { x: 1064, y: 420, w: 760 };
const UP = ROW - 50;
const DN = ROW + 50;

const REQ_LINES = [
  "id: REQ-QOS-07",
  "title: 수명 말기 read 지연 보장",
  "acceptance:",
  "  - id: AC-1",
  "    metric: P99.99 read latency",
  '    limit: "<= 2 ms"   # 예시',
  "    judged_at: [구조 모델, emulation,",
  "                제품 테스트]",
];
const BUG_LINES = [
  "id: BUG-2291             # 예시",
  "signature: cmd_timeout / rcv_ctrl / 완료 병합",
  "repro: tests/rcv/two_done_b2b (sim)",
  "waveform: emu_run_118, 완료 2건 구간",
  "root_cause: 완료 2건이 한 비트에 겹침",
  "contract: HSI-RCV-012 (on_overlap 미정의)",
  "fix: [contract v2, rdl, rtl, fw]",
];

type IconKind = "table" | "doc" | "bug";
const OldIcon: React.FC<{ kind: IconKind; x0: number; to: [number, number]; at: number; moveAt: number; goneAt: number }> = ({ kind, x0, to, at, moveAt, goneAt }) => {
  const { frame } = useT();
  const a = progress(frame, at);
  const m = progress(frame, moveAt, 26, ease.inOut);
  const g = progress(frame, goneAt, 10, ease.in);
  const op = a * lerp(0.75, 0.4, m) * (1 - g);
  if (op <= 0) return null;
  const s = 180;
  return (
    <svg width={s} height={s} viewBox="0 0 100 100" style={{ position: "absolute", left: lerp(x0, to[0], m) - s / 2, top: lerp(330, to[1], m) - s / 2, opacity: op, scale: `${lerp(1, 0.5, m)}` }}>
      <g fill="none" stroke={color.inkDim} strokeWidth={2.4}>
        {kind === "table" ? (
          <>
            <rect x={8} y={18} width={84} height={64} />
            <path d="M 8 34 H 92 M 8 50 H 92 M 8 66 H 92 M 36 18 V 82 M 64 18 V 82" />
          </>
        ) : kind === "doc" ? (
          <>
            <path d="M 20 8 H 66 L 80 22 V 92 H 20 Z M 66 8 V 22 H 80" />
            <path d="M 32 38 H 68 M 32 52 H 68 M 32 66 H 56" />
          </>
        ) : (
          <>
            <path d="M 10 14 H 90 V 72 H 44 L 28 90 V 72 H 10 Z" />
            <path d="M 22 32 q 7 -9 14 0 t 14 0 t 14 0 t 14 0 M 22 52 q 7 -9 14 0 t 14 0 t 14 0" />
          </>
        )}
      </g>
    </svg>
  );
};

export const S6: React.FC = () => {
  const { frame, t } = useT();
  const a1 = t("s6.1");
  const a2 = t("s6.2");
  const a4 = t("s6.4");
  const k = [t("s6.3"), t("s6.3", 0.18), t("s6.3", 0.4), t("s6.3", 0.56), t("s6.3", 0.78)];
  const moveAt = t("s6.1", 0.45);
  const contractY = codeLineY(BUG.y, 5, PX) + 19;
  const hsiCx = HSI.x + HSI.w / 2;
  const label = (text: string, x: number, at: number) => (
    <div style={{ position: "absolute", left: x, top: ROW - 40, ...mono(PX, 500), letterSpacing: "0", color: color.inkDim, ...enter(frame, at, { distance: 0 }) }}>{text}</div>
  );
  return (
    <ShiftSheet>
      <NoLig>
      <SceneHead />

      {/* [s6.1] 지금의 산출물: 엑셀 표, 문서, 자유 서술 bug report */}
      <OldIcon kind="table" x0={560} to={[REQ.x + REQ.w / 2, 376]} at={a1} moveAt={moveAt} goneAt={a2} />
      <OldIcon kind="doc" x0={960} to={[hsiCx, ROW]} at={a1 + 5} moveAt={moveAt + 4} goneAt={k[1]} />
      <OldIcon kind="bug" x0={1360} to={[BUG.x + BUG.w / 2, 596]} at={a1 + 10} moveAt={moveAt + 8} goneAt={a4} />

      {/* [s6.2] 요구사항 카드 */}
      <CodePanel
        x={REQ.x}
        y={REQ.y}
        w={REQ.w}
        title="REQ-QOS-07.yaml"
        px={PX}
        owner="human"
        at={a2}
        lines={REQ_LINES.map((text, i) => (i === 0 ? { text, mark: t("s6.2", 0.22), unmark: t("s6.2", 0.5) } : i >= 2 ? { text, mark: t("s6.2", 0.5), unmark: k[0] } : text))}
      />

      {/* [s6.3] 링크: req: → verify: → 최근 실행 결과 */}
      <Layer>
        <Trace pts={[[REQ.x + REQ.w, ROW], [HSI.x, ROW]]} stroke={color.agent} at={k[0]} arrow />
        <Trace pts={[[HSI.x + HSI.w, ROW], [1180, ROW], [1180, UP], [TEST.x, UP]]} stroke={color.agent} at={k[2] - 10} arrow />
        <Trace pts={[[1180, ROW], [1180, DN], [TEST.x, DN]]} stroke={color.agent} at={k[3] - 10} arrow />
        <Via x={1180} y={ROW} stroke={color.agent} p={progress(frame, k[2] - 4)} />
        <Trace pts={[[TEST.x + TEST.w, UP], [1495, UP], [1495, ROW], [RES.x, ROW]]} stroke={color.agent} at={k[4] - 10} arrow />
        <Trace pts={[[TEST.x + TEST.w, DN], [1495, DN], [1495, ROW]]} stroke={color.agent} at={k[4] - 10} />
        {/* [s6.4] bug 기록의 contract 줄에서 계약으로 */}
        <Trace pts={[[BUG.x, contractY], [hsiCx, contractY], [hsiCx, ROW + HSI.h / 2 + 2]]} stroke={color.problem} dash="9 7" at={t("s6.4", 0.8)} duration={24} arrow />
      </Layer>
      {label("req:", REQ.x + REQ.w + 10, k[0] + 4)}
      {label("verify:", HSI.x + HSI.w + 8, k[2] - 6)}
      <Box x={HSI.x} y={ROW - HSI.h / 2} w={HSI.w} h={HSI.h} at={k[1]} text="HSI-RCV-012" tone="human" px={30} mono align="center" />
      <Box x={TEST.x} y={UP - TEST.h / 2} w={TEST.w} h={TEST.h} at={k[2]} text="a_no_drop" tone="agent" px={30} mono align="center" />
      <Box x={TEST.x} y={DN - TEST.h / 2} w={TEST.w} h={TEST.h} at={k[3]} text="two_done_b2b" tone="agent" px={30} mono align="center" />
      <Box x={RES.x} y={ROW - RES.h / 2} w={RES.w} h={RES.h} at={k[4]} text="최근 실행 결과" sub="PASS" tone="agent" px={32} />

      {/* [s6.4] bug 기록 */}
      <CodePanel
        x={BUG.x}
        y={BUG.y}
        w={BUG.w}
        title="BUG-2291.yaml"
        px={PX}
        owner="human"
        at={a4}
        lines={BUG_LINES.map((text, i) =>
          i === 2 ? { text, mark: t("s6.4", 0.28) } : i === 4 ? { text, mark: t("s6.4", 0.48) } : i === 6 ? { text, mark: t("s6.4", 0.62) } : i === 5 ? { text, mark: t("s6.4", 0.8), markTone: "problem" as const } : text,
        )}
      />
      </NoLig>
    </ShiftSheet>
  );
};
