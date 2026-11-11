import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, ease, progress } from "../../../video/anim";
import { CheckIcon, HumanIcon } from "../../../video/components/Icons";
import { DimLine, Trace } from "../../../video/components/Trace";
import { color, mono, stroke, withAlpha } from "../../../video/theme";
import { CodePanel, ShiftSheet, useScene } from "../../lib";
import { AXIS_X, At, DayAxis, Gate, Glyph, Header, Layer, MiniLoop, T, TICK, fade } from "./kit";
import { GATES, LOOP_STAGES } from "./S3";

// s6 예제 3: 13:30 FW build 실패 → FW 변경안과 가상 플랫폼 → 16:10 block gate → 밤 전체 regression → 매일 통합.

const PX = 310;
const G = { x: 430, y: 500 };
const SCROLL = 510;
const DAYS = ["D+1", "D+2", "D+3"];
const dayY = (i: number) => TICK.night + 140 * (i + 1);

export const S6: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue } = useScene();
  const c1 = cue("s6.1");
  const c2 = cue("s6.2");
  const c3 = cue("s6.3");
  const c4 = cue("s6.4");
  const c5 = cue("s6.5");

  const outA = c3 - 8;
  const goneA = 1 - progress(frame, outA, DUR.exit, ease.in);
  const outB = c5 - 2;
  const goneB = 1 - progress(frame, outB, DUR.exit, ease.in);
  const scroll = SCROLL * progress(frame, c5, 34, ease.inOut);
  const vpAt = c2 + 112;
  const vp = progress(frame, vpAt, DUR.draw);
  const gateAt = c3 + 60;
  const stampAt = c3 + 116;
  const stamp = progress(frame, stampAt, 10);
  const barY = TICK.night - scroll;
  const bar = progress(frame, c4 + 8, 30, ease.inOut);
  const dayAt = (i: number) => c5 + 30 + i * 16;

  return (
    <ShiftSheet>
      <Header label="EXAMPLE 03" />
      <MiniLoop names={LOOP_STAGES} lit={[0, 0, 0, c1]} />
      <DayAxis
        note="시각은 예시"
        scroll={scroll}
        marks={[
          { label: "10:12", y: TICK["10:12"], tone: "human" },
          { label: "10:16", y: TICK["10:16"], tone: "agent" },
          { label: "10:20", y: TICK["10:20"], tone: "agent" },
          { label: "11:20", y: TICK["11:20"], tone: "problem" },
          { label: "11:45", y: TICK["11:45"], tone: "agent" },
          { label: "13:30", y: TICK["13:30"], tone: "problem", at: c1 },
          { label: "16:10", y: TICK["16:10"], tone: "human", at: c3 },
          { label: "밤", y: TICK.night, tone: "plain", sans: true, at: c4 },
          ...DAYS.map((label, i) => ({ label, y: dayY(i), tone: "agent" as const, at: dayAt(i) })),
        ]}
      />

      {/* s6.1 ~ s6.2 */}
      <Layer opacity={goneA}>
        <Trace pts={[[AXIS_X + 14, TICK["13:30"]], [278, TICK["13:30"]], [278, 300], [PX, 300]]} stroke={color.problem} at={c1 + 2} />
        <Trace pts={[[1240, 580], [1290, 580]]} stroke={color.agent} arrow at={vpAt - 6} duration={10} />
        {vp > 0 ? (
          <g opacity={vp}>
            <rect x={1290} y={500} width={534 * vp} height={160} fill={withAlpha(color.panel, 0.92)} stroke={color.agent} strokeWidth={stroke.thin} />
          </g>
        ) : null}
      </Layer>
      <div style={{ opacity: goneA }}>
        <CodePanel
          x={PX}
          y={205}
          w={800}
          title="fw build · main"
          at={c1 + 4}
          dimAt={c2}
          step={6}
          lines={[
            { text: "fw/rcv_isr.cpp:57: error:", tone: "problem" },
            { text: "  'RCV_INT_STATUS_RCV_DONE' was not declared", tone: "problem", mark: c1 + 96, markTone: "problem" },
            { text: "  (rcv_ctrl_regs.h regenerated from MR !2291)", tone: "dim" },
          ]}
        />
        <T x={PX} y={430} at={c2 + 2} weight={700} color={color.agent}>
          FW 변경안 · 에이전트 작성 · FW 담당 리뷰 대기
        </T>
        <CodePanel
          x={PX}
          y={478}
          w={930}
          title="fw/rcv_isr.cpp"
          owner="agent"
          at={c2 + 6}
          step={8}
          lines={[
            { text: "-  if (st & RCV_INT_STATUS_RCV_DONE) complete_one();", tone: "del" },
            { text: "+  while ((cpl = reg_read(RCV_CPL_POP)) & CPL_VALID)", tone: "add" },
            { text: "+      complete(cpl_tag(cpl), cpl_result(cpl));", tone: "add" },
          ]}
        />
        <T x={1314} y={520} at={vpAt + 4} weight={700}>
          VP: 계약에서 재생성한 모델 + FW
        </T>
        <At x={1334} y={610} opacity={fade(frame, vpAt + 40)}>
          <CheckIcon size={36} color={color.agent} />
        </At>
        <T x={1364} y={590} at={vpAt + 40} weight={600} color={color.agent}>
          boot OK · 복구 I/O 시나리오 OK
        </T>
      </div>

      {/* s6.3 ~ s6.4 */}
      <Layer opacity={goneB}>
        <Trace pts={[[AXIS_X + 14, TICK["16:10"]], [278, TICK["16:10"]], [278, 232], [PX, 232]]} stroke={color.human} at={c3 + 2} />
        <Trace pts={[[G.x, 314], [G.x, G.y - 46]]} stroke={color.human} arrow at={gateAt - 14} />
        <Gate x={G.x} y={G.y} r={40} p={progress(frame, gateAt, 18)} lit={progress(frame, stampAt - 8, 14)} />
        <Trace pts={[[G.x + 44, G.y], [560, G.y]]} stroke={color.human} at={gateAt + 10} duration={10} />
        <Trace pts={[[1390, G.y], [1450, G.y]]} stroke={color.agent} arrow at={stampAt - 12} duration={10} />
        {/* 판정 뒤 central 로 */}
        <Trace pts={[[1630, 566], [1630, 668]]} stroke={color.agent} arrow at={c4 + 2} />
        <Trace pts={[[1630, 728], [1630, TICK.night - 14]]} stroke={color.inkSoft} arrow at={c4 + 26} />
      </Layer>
      <div style={{ opacity: goneB }}>
        <At x={PX + 22} y={234} opacity={fade(frame, c3 + 2)}>
          <HumanIcon size={40} color={color.human} />
        </At>
        <T x={PX + 56} y={212} at={c3 + 2} px={34} weight={700} color={color.human}>
          설계자: 가설 확인 · 수정 승인
        </T>
        <T x={PX + 56} y={262} at={c3 + 26} px={34} weight={700} color={color.human}>
          FW 담당: 변경안 검토
        </T>
        <T x={G.x} y={G.y + 58} at={gateAt + 4} align="center" weight={700} color={color.human}>
          {GATES[0]}
        </T>
        <CodePanel
          x={560}
          y={336}
          w={830}
          title="gating/block.yaml"
          owner="human"
          at={gateAt + 12}
          step={4}
          lines={[
            { text: "# gating/block.yaml   소유자: 검증 리드", tone: "dim" },
            "policy_version: v2.1",
            { text: "min_pass_rate: 0.95", mark: stampAt - 20 },
            { text: "contract_assertions: must_pass", mark: stampAt - 14 },
            { text: "allow_known_issues: true   # 티켓 연결분만" },
            { text: "agent_may_edit: false" },
          ]}
        />
        {stamp > 0 ? (
          <div
            style={{
              position: "absolute",
              left: 1450,
              top: 434,
              width: 360,
              height: 132,
              boxSizing: "border-box",
              border: `${stroke.bold}px solid ${color.agent}`,
              backgroundColor: withAlpha(color.agent, 0.1),
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              opacity: stamp,
              rotate: "-4deg",
              scale: `${1.25 - 0.25 * stamp}`,
            }}
          >
            <div style={{ ...mono(56, 700), color: color.agent, letterSpacing: "0.04em" }}>PROMOTE</div>
            <div style={{ ...mono(30, 500), color: color.agent, letterSpacing: "0" }}>policy v2.1</div>
          </div>
        ) : null}
        <T x={1630} y={678} at={c4 + 14} align="center" weight={700} code>
          <span style={{ display: "inline-block", padding: "4px 22px", border: `${stroke.thin}px solid ${color.inkSoft}`, backgroundColor: color.bg }}>central</span>
        </T>
      </div>

      {/* 밤: 전체 regression (지금과 같은 자리). 이후 시간축이 다음 날들로 넘어간다 */}
      <Layer>
        {bar > 0 ? (
          <rect x={PX} y={barY - 11} width={1420 * bar} height={22} fill={withAlpha(color.inkSoft, 0.7)} stroke={color.inkSoft} strokeWidth={stroke.thin} />
        ) : null}
        <Trace pts={[[AXIS_X + 14, barY], [PX, barY]]} stroke={color.inkSoft} progress={progress(frame, c4 + 2, 10)} />

        {/* 일일 smoke: emulator 에서 RTL 과 FW 가 매일 짧게 만난다 */}
        {DAYS.map((_, i) => {
          const y = dayY(i) - scroll;
          const at = dayAt(i);
          return (
            <g key={i}>
              <Trace pts={[[AXIS_X + 14, y], [PX, y]]} stroke={color.agent} at={at} duration={8} />
              <Trace pts={[[640, y - 28], [800, y - 28], [836, y - 28], [836, y - 2]]} stroke={color.inkSoft} at={at + 6} duration={18} />
              <Trace pts={[[640, y + 28], [800, y + 28], [836, y + 28], [836, y + 2]]} stroke={color.inkSoft} at={at + 6} duration={18} />
              {progress(frame, at + 20) > 0 ? (
                <rect x={836 - 34} y={y - 34} width={68} height={68} fill={color.bg} stroke={color.agent} strokeWidth={stroke.thin} opacity={progress(frame, at + 20)} />
              ) : null}
            </g>
          );
        })}
        <DimLine from={[960, dayY(0) - SCROLL - 34]} to={[960, dayY(2) - SCROLL + 34]} p={progress(frame, c5 + 86, 20)} />
      </Layer>
      <T x={PX} y={barY - 62} at={c4 + 10} weight={700}>
        전체 regression
      </T>
      {DAYS.map((_, i) => {
        const y = dayY(i) - scroll;
        const at = dayAt(i);
        return (
          <React.Fragment key={i}>
            <T x={PX + 16} y={y - 20} at={at + 2} weight={700} color={color.agent}>
              일일 smoke
            </T>
            <T x={624} y={y - 46} at={at + 6} px={26} align="right" weight={700} color={color.inkSoft} code>
              RTL
            </T>
            <T x={624} y={y + 10} at={at + 6} px={26} align="right" weight={700} color={color.inkSoft} code>
              FW
            </T>
            <At x={836} y={y} opacity={fade(frame, at + 22)}>
              <Glyph kind="emu" size={44} color={color.agent} />
            </At>
          </React.Fragment>
        );
      })}
      <T x={996} y={dayY(1) - SCROLL - 20} at={c5 + 90} weight={600} code>
        budget: slots 2 · 90m
      </T>
    </ShiftSheet>
  );
};
