import React from "react";
import { DUR, ease, enter, progress } from "../../../video/anim";
import { CheckIcon } from "../../../video/components/Icons";
import { Trace, Via } from "../../../video/components/Trace";
import { color, sans, size, stroke, withAlpha } from "../../../video/theme";
import { CodePanel, ShiftSheet } from "../../lib";
import type { CodeLine } from "../../lib";
import { Group, Layer, NoLig, Paper, Person, SceneHead, Status, useT } from "./kit";
import { CONTRACT_V1 } from "./S4";

// s5 예제 2: 고친 계약(v2)에서 SystemRDL · SVA · C++ header · driver 테스트 · 문서가 함께 나온다.

const PX = 26;
const CARD = { x: 96, y: 250, w: 620 };
const RX = 816;
const RW = 1008;
const BUS = 766;
const MID = 420;
const TILE_Y = 724;
const TILE_H = 64;
const TILE_W = 240;
const tileX = (i: number): number => RX + i * 256;

const RDL = [
  "reg { field { sw=r; hw=w; } CNT[4:0]; } CPL_STATUS @ 0x40;",
  "reg {",
  "  field { sw=r; hw=w; swacc; } TAG[15:0];  // 읽으면 pop",
  "  field { sw=r; hw=w; } RESULT[19:16];",
  "} CPL_POP @ 0x44;",
];
const SVA = [
  "// HSI-RCV-012 에서 생성",
  "a_no_drop: assert property (",
  "  @(posedge clk) disable iff (!rst_n)",
  "  cpl_push |-> !cpl_full);",
  "c_overlap: cover property (@(posedge clk)",
  "  cpl_push && cpl_cnt != 0);",
];
const HPP = [
  "// HSI-RCV-012 에서 생성",
  "inline constexpr uint32_t CPL_STATUS = 0x40;",
  "inline constexpr uint32_t CPL_POP    = 0x44;",
  "template <class Bus, class Fn>",
  "void drain_completions(Bus& bus, Fn&& handle) {",
  "  while (bus.read(CPL_STATUS) & 0x1F)",
  "    handle(decode(bus.read(CPL_POP)));",
  "}",
];
const TEST = [
  "TEST(RcvDriver, two_done_b2b) {   // HSI-RCV-012",
  "  HsiModel hw;",
  "  hw.push_completion({.tag = 7});",
  "  hw.push_completion({.tag = 9});  // 첫 건 처리 전",
  "  std::vector<uint16_t> seen;",
  "  rcv_isr(hw, [&](auto c) { seen.push_back(c.tag); });",
  "  EXPECT_EQ(seen, (std::vector<uint16_t>{7, 9}));",
  "}",
];
const TILES = ["SystemRDL", "SVA", "C++ header", "driver 테스트"];
const DOC_GEN = "API 문서 (생성)";

const Tile: React.FC<{ i: number; at: number }> = ({ i, at }) => {
  const { frame } = useT();
  const p = progress(frame, at, DUR.enter, ease.out);
  if (p <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: tileX(i),
        top: TILE_Y,
        width: TILE_W,
        height: TILE_H,
        boxSizing: "border-box",
        border: `${stroke.thin}px solid ${color.agent}`,
        backgroundColor: withAlpha(color.panel, 0.95),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        opacity: p,
        translate: `0px ${(1 - p) * -24}px`,
      }}
    >
      <CheckIcon size={24} color={color.agent} />
      <div style={{ ...sans(size.small, 700), whiteSpace: "nowrap" }}>{TILES[i]}</div>
    </div>
  );
};

export const S5: React.FC = () => {
  const { frame, t } = useT();
  const a2 = t("s5.2");
  const a4 = t("s5.4");
  const a5 = t("s5.5");
  const a6 = t("s5.6");
  const p1 = t("s5.3", 0.08);
  const p2 = t("s5.3", 0.5);

  const v1: CodeLine[] = [...CONTRACT_V1.map((text) => ({ text, tone: "dim" as const })), { text: "on_overlap: ???     # 필수 칸", tone: "problem" }];
  const mk = (frac: number) => ({ mark: t("s5.2", frac), markTone: "agent" as const });
  const v2: CodeLine[] = [
    "id: HSI-RCV-012   # v2",
    { text: "deliver: queue(depth=16)", ...mk(0.3) },
    "irq: level, CNT != 0 인 동안 유지",
    "order: [read CPL_STATUS,",
    "        read CPL_POP until CNT == 0]",
    { text: "on_overlap: enqueue", ...mk(0.45) },
    { text: "on_full: backpressure  # 유실 금지", ...mk(0.66) },
    "verify: {sva: [a_no_drop],",
    "         fw_test: two_done_b2b}",
  ];
  const approve = progress(frame, t("s5.1", 0.62), DUR.enter, ease.out);
  const fade3 = 1 - progress(frame, a4 - 6, DUR.exit, ease.in);
  const pen = progress(frame, t("s5.6", 0.45), DUR.enter, ease.out);

  return (
    <ShiftSheet>
      <NoLig>
      <SceneHead />

      {/* [s5.1] HW · FW 담당이 함께 고친다 */}
      <Person x={CARD.x} y={192} label="HW 담당" at={t("s5.1")} />
      <Person x={CARD.x + 210} y={192} label="FW 담당" at={t("s5.1") + 6} />
      <div style={{ position: "absolute", left: CARD.x + 430, top: 188, width: 44, height: 44, boxSizing: "border-box", border: `${stroke.thin}px solid ${color.human}`, backgroundColor: withAlpha(color.human, 0.14), display: "flex", alignItems: "center", justifyContent: "center", opacity: approve, scale: `${1.3 - 0.3 * approve}` }}>
        <CheckIcon size={26} color={color.human} />
      </div>
      <Layer>
        <Trace pts={[[CARD.x + 60, 236], [CARD.x + 60, CARD.y]]} stroke={color.human} at={t("s5.1", 0.3)} />
        <Trace pts={[[CARD.x + 270, 236], [CARD.x + 270, CARD.y]]} stroke={color.human} at={t("s5.1", 0.3) + 4} />
      </Layer>

      {/* [s5.2] 계약 v1 → v2 */}
      <CodePanel x={CARD.x} y={CARD.y} w={CARD.w} title="HSI-RCV-012.yaml" px={PX} owner="human" at={0} out={a2} lines={v1} step={0} />
      <CodePanel x={CARD.x} y={CARD.y} w={CARD.w} title="HSI-RCV-012.yaml" px={PX} owner="human" at={a2} lines={v2} step={4} />

      {/* 계약에서 파생물로 가는 trace */}
      <Layer>
        <Trace pts={[[CARD.x + CARD.w, MID], [BUS, MID]]} stroke={color.agent} at={p1 - 6} duration={8} />
        <Via x={BUS} y={MID} stroke={color.agent} p={progress(frame, p1)} />
        <g opacity={fade3}>
          <Trace pts={[[BUS, MID], [BUS, 318], [RX, 318]]} stroke={color.agent} at={p1} arrow />
          <Trace pts={[[BUS, MID], [BUS, 632], [RX, 632]]} stroke={color.agent} at={p2} arrow />
        </g>
        <Trace pts={[[BUS, MID], [RX, MID]]} stroke={color.agent} at={a4} arrow />
        <Trace pts={[[BUS, MID], [BUS, TILE_Y + TILE_H / 2], [RX, TILE_Y + TILE_H / 2]]} stroke={color.agent} at={a4 - 4} />
        <Trace pts={[[tileX(0) + TILE_W, TILE_Y + TILE_H / 2], [tileX(1), TILE_Y + TILE_H / 2]]} stroke={color.agent} at={a4 + 2} />
        <Trace pts={[[tileX(1) + TILE_W, TILE_Y + TILE_H / 2], [tileX(2), TILE_Y + TILE_H / 2]]} stroke={color.agent} at={a5 - 2} />
        <Trace pts={[[tileX(2) + TILE_W, TILE_Y + TILE_H / 2], [tileX(3), TILE_Y + TILE_H / 2]]} stroke={color.agent} at={a6 - 2} />
      </Layer>

      {/* [s5.3] register 정의와 assertion */}
      <CodePanel x={RX} y={180} w={RW} title="rcv_ctrl.rdl" px={PX} owner="human" at={p1} out={a4 - 6} lines={RDL} />
      <CodePanel x={RX} y={475} w={RW} title="rcv_ctrl_hsi_sva.sv" px={PX} owner="agent" at={p2} out={a4 - 6} lines={[{ text: SVA[0], tone: "dim" }, ...SVA.slice(1)]} />
      <Group out={a4 - 6}>
        <Status x={RX + RW - 14} y={731} right text="PASS" at={t("s5.3", 0.85)} />
      </Group>
      <Tile i={0} at={a4 - 2} />
      <Tile i={1} at={a4 + 2} />

      {/* [s5.4] C++ header */}
      <CodePanel
        x={RX}
        y={180}
        w={RW}
        title="rcv_ctrl_hsi.hpp"
        px={PX}
        owner="agent"
        at={a4 + 4}
        out={a5 - 6}
        lines={HPP.map((text, i) => (i === 0 ? { text, tone: "dim" as const } : i >= 4 && i <= 6 ? { text, mark: t("s5.4", 0.42) } : text))}
      />
      <Tile i={2} at={a5 - 2} />

      {/* [s5.5] driver 테스트 */}
      <CodePanel
        x={RX}
        y={180}
        w={RW}
        title="rcv_driver_test.cpp"
        px={PX}
        owner="agent"
        at={a5 + 4}
        out={a6 - 6}
        lines={TEST.map((text, i) => (i === 2 || i === 3 ? { text, mark: t("s5.5", 0.4) + (i - 2) * 10 } : text))}
      />
      <Group out={a6 - 6}>
        <Status x={RX + RW - 14} y={516} right text="PASS · 보드 없이 실행" at={t("s5.5", 0.82)} />
      </Group>
      <Tile i={3} at={a6 - 2} />

      {/* [s5.6] API 문서도 같은 계약에서 */}
      <Paper x={RX} y={196} w={640} h={448} at={a6 + 4} lines={[]} above={4} below={5} edge={color.agent} label={false} />
      <div style={{ position: "absolute", left: RX + 38, top: 212, ...sans(36, 700), color: color.agent, whiteSpace: "nowrap", ...enter(frame, a6 + 10) }}>{DOC_GEN}</div>
      {pen > 0 ? (
        <svg width={200} height={200} viewBox="0 0 100 100" style={{ position: "absolute", left: 1560, top: 320, opacity: pen, overflow: "visible" }}>
          <g fill="none" stroke={color.human} strokeWidth={2.2} strokeLinejoin="miter">
            <path d="M 22 78 L 28 60 L 66 22 L 78 34 L 40 72 Z" />
            <path d="M 28 60 L 40 72 M 58 30 L 70 42" />
          </g>
          <circle cx={50} cy={50} r={46} fill="none" stroke={color.inkDim} strokeWidth={1.6} />
          <line x1={17.5} y1={17.5} x2={17.5 + 65 * pen} y2={17.5 + 65 * pen} stroke={color.inkSoft} strokeWidth={1.6} />
        </svg>
      ) : null}
      </NoLig>
    </ShiftSheet>
  );
};
