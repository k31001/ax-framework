import React from "react";
import { enter, progress } from "../../../video/anim";
import { CheckIcon, WarnIcon } from "../../../video/components/Icons";
import { Trace } from "../../../video/components/Trace";
import { color, sans, size, stroke, withAlpha } from "../../../video/theme";
import { CodePanel, ShiftSheet } from "../../lib";
import { Box, DOC_2, Group, Layer, NoLig, Paper, Person, SceneHead, useT, Wave } from "./kit";

// s2 지금의 문제: register 는 SystemRDL, 동작 규약은 문장.

export const RDL_V1 = ["reg {", "  default sw = rw; default hw = w;", "  field { level intr; woclr; } RCV_DONE[0:0] = 0;", "} IRQ_STATUS @ 0x40;"];

const LX = 96;
const RX = 1010;
const TOP = 236;
const PANEL_H = 248;
const PEOPLE = [
  { role: "RTL 설계자", memo: "sticky 1비트" },
  { role: "검증 엔지니어", memo: "다음 cycle에 clear" },
  { role: "FW 엔지니어", memo: "다른 일 끝내고 clear" },
];
const ROW_Y = [552, 624, 696];

const ColLabel: React.FC<{ x: number; text: string; at: number; tone: string }> = ({ x, text, at, tone }) => {
  const { frame } = useT();
  return (
    <div style={{ position: "absolute", left: x, top: 184, display: "flex", alignItems: "center", gap: 14, ...enter(frame, at) }}>
      <div style={{ width: 12, height: 12, backgroundColor: tone }} />
      <div style={{ ...sans(size.small, 700), color: color.inkSoft }}>{text}</div>
    </div>
  );
};

export const S2: React.FC = () => {
  const { frame, t } = useT();
  const a2 = t("s2.2");
  const a4 = t("s2.4");
  const a5 = t("s2.5");
  return (
    <ShiftSheet>
      <NoLig>
      <SceneHead />

      {/* 왼쪽: register (SystemRDL) */}
      <Group dimAt={t("s2.3")} dimTo={0.45}>
        <ColLabel x={LX} text="register (SystemRDL)" at={t("s2.1")} tone={color.agent} />
        <CodePanel x={LX} y={TOP} w={870} title="rcv_ctrl.rdl" lines={RDL_V1} at={t("s2.1")} px={28} owner="human" step={6} />
        <Layer>
          <Trace pts={[[298, TOP + PANEL_H], [298, 590]]} at={a2} arrow />
          <Trace pts={[[764, TOP + PANEL_H], [764, 590]]} at={a2 + 4} arrow />
          <Trace pts={[[298, 670], [298, 722], [352, 722]]} stroke={color.agent} at={t("s2.2", 0.5)} />
          <Trace pts={[[764, 670], [764, 722], [710, 722]]} stroke={color.agent} at={t("s2.2", 0.5)} />
        </Layer>
        <Box x={96} y={590} w={404} h={80} at={a2 + 10} text="HW: register RTL" />
        <Box x={562} y={590} w={404} h={80} at={a2 + 14} text="FW: C++ header" />
        <div style={{ position: "absolute", left: 352, top: 700, width: 358, height: 44, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, ...enter(frame, t("s2.2", 0.5) + 8) }}>
          <CheckIcon size={30} color={color.agent} />
          <div style={{ ...sans(32, 700), whiteSpace: "nowrap" }}>주소 · field 일치</div>
        </div>
      </Group>

      {/* 오른쪽: 동작 규약 (API 문서) */}
      <ColLabel x={RX} text="동작 규약 (API 문서)" at={t("s2.3")} tone={color.human} />
      <Paper x={RX} y={TOP} w={814} h={PANEL_H} at={t("s2.3")} lines={DOC_2} px={34} above={1} below={1} label={false} />

      {/* [s2.4] 같은 문장, 해석 셋 */}
      <Layer>
        {ROW_Y.map((y, i) => (
          <React.Fragment key={i}>
            <Trace pts={[[1050, TOP + PANEL_H], [1050, y + 28], [1082, y + 28]]} stroke={color.human} dash="3 8" at={a4 + i * 5} duration={20} />
            <Trace pts={[[1340, y + 28], [1396, y + 28]]} stroke={color.inkDim} dash="3 8" at={t("s2.4", 0.62) + i * 8} />
          </React.Fragment>
        ))}
        {/* [s2.5] 해석이 갈린 자리에서 유실이 난다 */}
        <rect
          x={1390}
          y={ROW_Y[0] - 10}
          width={444}
          height={(ROW_Y[2] + 66 - ROW_Y[0] + 10) * progress(frame, a5)}
          fill="none"
          stroke={color.problem}
          strokeWidth={stroke.thin}
          strokeDasharray="9 7"
          opacity={progress(frame, a5)}
        />
        <Trace pts={[[1612, ROW_Y[2] + 68], [1612, 840], [1580, 840]]} stroke={color.problem} at={a5 + 10} arrow />
      </Layer>
      {PEOPLE.map((p, i) => (
        <React.Fragment key={p.role}>
          <Person x={1092} y={ROW_Y[i] + 8} label={p.role} at={t("s2.4", 0.22 + i * 0.14)} />
          <div
            style={{
              position: "absolute",
              left: 1400,
              top: ROW_Y[i],
              width: 424,
              height: 56,
              display: "flex",
              alignItems: "center",
              paddingLeft: 20,
              boxSizing: "border-box",
              border: `${stroke.hair}px solid ${color.human}`,
              backgroundColor: withAlpha(color.human, 0.08),
              ...sans(size.small, 600),
              whiteSpace: "nowrap",
              ...enter(frame, t("s2.4", 0.62) + i * 8 + 6, { from: "left" }),
            }}
          >
            {p.memo}
          </div>
        </React.Fragment>
      ))}

      {/* [s2.5] 본편 S5-5 의 파형: done 은 두 번, RCV_DONE 은 한 번 */}
      <Wave
        x={520}
        y={790}
        nameW={200}
        w={620}
        rowH={50}
        at={a5 + 6}
        duration={40}
        signals={[
          { name: "done", levels: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0] },
          { name: "RCV_DONE", levels: [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
        ]}
        fail={{ from: 6, to: 7, at: t("s2.5", 0.45) }}
      />
      <div style={{ position: "absolute", left: 1372, top: 816, display: "flex", alignItems: "center", gap: 12, ...enter(frame, t("s2.5", 0.45) + 6) }}>
        <WarnIcon size={34} color={color.problem} />
        <div style={{ ...sans(36, 800), color: color.problem, whiteSpace: "nowrap" }}>1건 유실</div>
      </div>
      </NoLig>
    </ShiftSheet>
  );
};
