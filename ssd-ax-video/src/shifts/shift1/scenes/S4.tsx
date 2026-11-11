import React from "react";
import { DUR, ease, enter, enterExit, lerp, progress } from "../../../video/anim";
import { Trace } from "../../../video/components/Trace";
import { STAGES } from "../../../video/content";
import { color, mono, sans, size, stroke, withAlpha } from "../../../video/theme";
import { CodePanel, ShiftSheet } from "../../lib";
import type { CodeLine } from "../../lib";
import { CH, codeLineY, DOC_2, Group, Layer, NoLig, Paper, SceneHead, Status, useT, Wave } from "./kit";
import { RDL_V1 } from "./S2";

// s4 예제 1: 문장을 계약 양식에 옮기면 빈 필수 칸이 드러난다. 영상의 중심 씬.

const CRUMBS = ["REQ-QOS-07", "rcv_ctrl", "복구 완료 interrupt"];
export const CONTRACT_V1 = [
  "id: HSI-RCV-012",
  "req: REQ-QOS-07",
  "target: rcv_ctrl.IRQ_STATUS.RCV_DONE",
  "event: 복구 한 건 완료",
  "clear: W1C",
  "order: [read IRQ_STATUS,",
  "        read RCV_RESULT, clear]",
  "fw_latency: unbounded",
];
const SVA = [
  "// HSI-RCV-012.on_overlap = never 에서 생성",
  "a_no_overlap: assert property (",
  "  @(posedge clk) disable iff (!rst_n)",
  "  rcv_done_set |-> !irq_status_rcv_done);",
];

const PX = 28;
const CARD = { x: 96, y: 180, w: 660 };
const LAST = codeLineY(CARD.y, CONTRACT_V1.length, PX);
const LINE_H = Math.round(PX * 1.5);
const RX = 1000;
const TL_Y = 846;
const nodeX = (i: number): number => 96 + 123 + 247 * i;

export const S4: React.FC = () => {
  const { frame, t } = useT();
  const a2 = t("s4.2");
  const a3 = t("s4.3");
  const a4 = t("s4.4");
  const a5 = t("s4.5");
  const a6 = t("s4.6");
  const a7 = t("s4.7");

  const cardLines: CodeLine[] = [
    ...CONTRACT_V1.map((text, i) => ({ text, at: t("s4.3", 0.06 * i) + 6 })),
    { text: "" },
  ];
  const lastAt = t("s4.3", 0.62);
  const lastIn = progress(frame, lastAt, DUR.enter, ease.out);
  const filled = progress(frame, a6, 12, ease.inOut);
  const blink = frame < lastAt ? 0 : 0.55 + 0.45 * Math.cos(((frame - lastAt) / 24) * Math.PI * 2);

  // RDL 밑줄 자리
  const ulY = codeLineY(CARD.y, 2, PX) + LINE_H - 3;
  const chx = (i: number): number => CARD.x + 24 + i * PX * CH;
  const ul = progress(frame, t("s4.2", 0.3), DUR.draw, ease.out);
  const ul2 = progress(frame, t("s4.2", 0.5), DUR.draw, ease.out);

  // 발견 시점의 이동
  const move = progress(frame, t("s4.7", 0.35), 30, ease.inOut);
  const mx = lerp(nodeX(4), nodeX(2), move);
  const tl = progress(frame, a7, 20, ease.out);

  return (
    <ShiftSheet>
      <NoLig>
      <SceneHead />

      {/* [s4.1] 요구사항 표지 */}
      <div style={{ position: "absolute", right: 96, top: 92, height: 52, display: "flex", alignItems: "center", gap: 14 }}>
        {CRUMBS.map((c, i) => (
          <React.Fragment key={c}>
            {i > 0 ? <div style={{ ...mono(size.small, 500), color: color.inkDim, ...enter(frame, t("s4.1", 0.25 * i), { distance: 0 }) }}>›</div> : null}
            <div style={{ ...mono(size.small, 700), color: i === 2 ? color.ink : color.inkSoft, ...enter(frame, t("s4.1", 0.25 * i), { from: "left" }) }}>{c}</div>
          </React.Fragment>
        ))}
      </div>

      {/* API 문서의 문장: 처음엔 또렷하고, s4.5 에서 '답 없음' */}
      <Group dimAt={a6} dimTo={0.4}>
        <Group dimAt={a2} undimAt={a5} dimTo={0.4}>
          <Paper x={RX} y={180} w={824} h={140} at={t("s4.1")} lines={DOC_2} px={30} above={0} below={0} label={false} edge={frame >= a5 ? color.problem : color.lineStrong} />
        </Group>
        <Status x={1824 - 16} y={228} right text="답 없음" at={t("s4.5", 0.3)} tone="problem" />
      </Group>

      {/* [s4.2] SystemRDL 은 위치와 지우는 방식까지 */}
      <CodePanel
        x={CARD.x}
        y={CARD.y}
        w={870}
        title="rcv_ctrl.rdl"
        px={PX}
        owner="human"
        at={a2}
        out={a3 - 6}
        lines={RDL_V1.map((text, i) => (i === 2 ? { text, mark: t("s4.2", 0.25) } : { text, tone: "dim" as const }))}
      />
      <Group out={a3 - 6}>
        <Layer>
          <line x1={chx(31)} x2={chx(31) + 13 * PX * CH * ul} y1={ulY} y2={ulY} stroke={color.agent} strokeWidth={stroke.bold} />
          <line x1={chx(22)} x2={chx(22) + 5 * PX * CH * ul2} y1={ulY} y2={ulY} stroke={color.agent} strokeWidth={stroke.bold} />
          <Trace pts={[[chx(37.5), ulY + 4], [chx(37.5), 474]]} stroke={color.lineStrong} at={t("s4.2", 0.3) + 8} />
          <Trace pts={[[chx(24.5), ulY + 4], [chx(24.5), 474], [chx(37.5) + 40, 474]]} stroke={color.lineStrong} at={t("s4.2", 0.5) + 8} />
        </Layer>
        <div style={{ position: "absolute", left: chx(37.5) + 54, top: 454, ...sans(size.small, 600), color: color.inkDim, whiteSpace: "nowrap", ...enter(frame, t("s4.2", 0.3) + 14, { from: "left" }) }}>위치 · 지우는 방식</div>
      </Group>

      {/* [s4.3] 계약 카드: 마지막 필수 칸이 비어 있다 */}
      <CodePanel x={CARD.x} y={CARD.y} w={CARD.w} title="HSI-RCV-012.yaml" px={PX} owner="human" at={a3} lines={cardLines} />
      {lastIn > 0 ? (
        <>
          <div style={{ position: "absolute", left: CARD.x + 8, top: LAST, width: CARD.w - 12, height: LINE_H, backgroundColor: withAlpha(color.problem, 0.16 * lastIn * (1 - filled)) }} />
          <Layer>
            <rect
              x={CARD.x + 8}
              y={LAST - 2}
              width={CARD.w - 12}
              height={LINE_H + 4}
              fill="none"
              stroke={filled > 0.5 ? color.inkSoft : color.problem}
              strokeWidth={stroke.trace}
              strokeDasharray="10 7"
              opacity={lastIn * lerp(blink, 0.8, filled)}
            />
          </Layer>
          <div style={{ position: "absolute", left: CARD.x + 24, top: LAST, height: LINE_H, ...mono(PX, 500), lineHeight: `${LINE_H}px`, letterSpacing: "0", whiteSpace: "pre", color: color.ink, opacity: lastIn }}>
            {"on_overlap: "}
            <span style={{ position: "relative" }}>
              <span style={{ color: color.problem, fontWeight: 700, opacity: 1 - filled }}>???</span>
              <span style={{ position: "absolute", left: 0, top: 0, fontWeight: 700, opacity: filled }}>never</span>
            </span>
            <span style={{ color: frame >= lastAt + 6 && filled < 0.5 ? color.problem : color.inkDim }}>{"     # 필수 칸"}</span>
          </div>
        </>
      ) : null}

      {/* [s4.4] 양식이 묻는 질문 */}
      <Layer>
        <Trace pts={[[CARD.x + CARD.w + 2, LAST + LINE_H / 2], [806, LAST + LINE_H / 2]]} stroke={color.problem} at={a4} opacity={1 - progress(frame, a6, DUR.exit)} />
        {/* [s4.5] 문서로 올라가 보지만 답이 없다 */}
        <Trace pts={[[1100, LAST - 14], [1100, 324]]} stroke={color.problem} dash="8 7" at={a5} duration={22} opacity={1 - progress(frame, a6, DUR.exit)} />
      </Layer>
      <div
        style={{
          position: "absolute",
          left: 806,
          top: LAST - 14,
          height: LINE_H + 28,
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          border: `${stroke.thin}px solid ${color.problem}`,
          backgroundColor: withAlpha(color.bg, 0.95),
          ...sans(34, 700),
          whiteSpace: "nowrap",
          ...enterExit(frame, a4 + 6, a6, { from: "left" }),
        }}
      >
        처리 전에 완료가 또 오면?
      </div>

      {/* [s4.6] 이 칸에서 assertion 이 생성되고, 곧바로 반례가 나온다 */}
      <Layer>
        <Trace pts={[[CARD.x + CARD.w + 2, LAST + LINE_H / 2], [880, LAST + LINE_H / 2], [880, 464], [RX, 464]]} stroke={color.agent} at={t("s4.6", 0.08)} duration={20} arrow />
      </Layer>
      <CodePanel x={RX} y={340} w={824} title="rcv_ctrl_hsi_sva.sv" px={28} owner="agent" at={t("s4.6", 0.14)} lines={[{ text: SVA[0], tone: "dim" }, SVA[1], SVA[2], { text: SVA[3], mark: t("s4.6", 0.6), markTone: "problem" }]} />
      <Wave
        x={RX}
        y={606}
        nameW={320}
        w={504}
        rowH={50}
        at={t("s4.6", 0.42)}
        duration={30}
        signals={[
          { name: "clk", levels: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0], tone: "dim" },
          { name: "rcv_done_set", levels: [0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0] },
          { name: "irq_status_rcv_done", levels: [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
        ]}
        fail={{ from: 8, to: 10, at: t("s4.6", 0.68) }}
      />
      <div style={{ position: "absolute", left: 1320 + (504 * 8) / 16 - 4, top: 764, ...sans(size.small, 800), color: color.problem, whiteSpace: "nowrap", ...enter(frame, t("s4.6", 0.68) + 6) }}>FAIL · 반례</div>

      {/* [s4.7] 발견 시점이 Emulation 에서 IP 설계로 옮겨 간다 */}
      {tl > 0 ? (
        <>
          <Layer>
            <line x1={96} x2={96 + 1728 * tl} y1={TL_Y} y2={TL_Y} stroke={color.lineStrong} strokeWidth={stroke.thin} />
            {STAGES.map((_, i) => (
              <circle key={i} cx={nodeX(i)} cy={TL_Y} r={6} fill={color.bg} stroke={color.inkSoft} strokeWidth={stroke.thin} opacity={progress(frame, a7 + 4 + i * 2)} />
            ))}
            {move > 0 ? <Trace pts={[[nodeX(4) - 16, TL_Y - 26], [mx, TL_Y - 26]]} stroke={color.problem} dash="8 7" /> : null}
            <g opacity={progress(frame, a7 + 10)}>
              <rect x={mx - 12} y={TL_Y - 12} width={24} height={24} transform={`rotate(45 ${mx} ${TL_Y})`} fill={color.problem} stroke={color.bg} strokeWidth={stroke.thin} />
              {move >= 1 ? <path d={`M ${mx + 2} ${TL_Y - 34} L ${mx - 12} ${TL_Y - 26} L ${mx + 2} ${TL_Y - 18} Z`} fill={color.problem} /> : null}
            </g>
          </Layer>
          {STAGES.map((name, i) => {
            const hot = i === 4 ? 1 - move : i === 2 ? move : 0;
            return (
              <div key={name} style={{ position: "absolute", left: nodeX(i) - 140, width: 280, top: TL_Y + 14, textAlign: "center", ...sans(size.small, hot > 0.5 ? 800 : 500), color: hot > 0.5 ? color.problem : i === 4 ? color.inkSoft : color.inkDim, whiteSpace: "nowrap", ...enter(frame, a7 + 4 + i * 2, { distance: 6 }) }}>
                {name}
              </div>
            );
          })}
        </>
      ) : null}
      </NoLig>
    </ShiftSheet>
  );
};
