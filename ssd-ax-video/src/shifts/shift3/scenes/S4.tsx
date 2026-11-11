import React from "react";
import { useCurrentFrame } from "remotion";
import { ease, enter, enterExit, progress } from "../../../video/anim";
import { AgentIcon } from "../../../video/components/Icons";
import { Trace } from "../../../video/components/Trace";
import { CARD as requirement } from "../../../video/content";
import { color, fullSvg, mono, sans, size, stroke, withAlpha } from "../../../video/theme";
import { ShiftSheet, useScene } from "../../lib";
import { CodeRow, LockIcon, Pane, StatusChip, Steps, TB_CODE, Tag, mix, paneH, split } from "./kit";

// s4 예제 ①: 작업 지시서.
//   s4.1  요구사항 카드 · 블록 이름 · 예시 표지
//   s4.2  호박색 파일 창 tasks/VER-REC-012.yaml (옆에 예전의 testbench 가 흐리게)
//   s4.3  intent   s4.4  pass   s4.5  forbid (+자물쇠)   s4.6  stop
//   s4.7  Jira Test Plan VER-510 을 dv-agent 에 할당 → 지시됨

const PX = 30;
const PANE = { x: 96, y: 164, w: 1130 };

const ISSUE = { x: 1262, y: 470, w: 562 };
const BLOCK = "rcv_ctrl · 오류 복구 제어";

const YAML = [
  "task: VER-REC-012        # 예시",
  "intent: 복구 완료는 유실·중복 없이 FW에 전달된다",
  "pass:                    # 사람이 소유",
  "  - 모든 요청은 성공 또는 실패로 한 번만 종료",
  "  - host 요청이 GC 요청보다 먼저 처리",
  "  - 큐가 차면 backpressure, 완료 유실 0",
  "  - 심어 둔 bug: 미검출 전건에 사유",
  "forbid:",
  "  - ref_model/, 통과 기준, bug 세트 수정",
  "  - assertion 삭제·완화, 신규 waiver",
  "tools: [sim, formal, coverage, mutation]",
  "stop: 스펙이 모호하면 멈추고 질문",
];

export const S4: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, end } = useScene();
  const c1 = cue("s4.1");
  const c2 = cue("s4.2");
  const c3 = cue("s4.3");
  const c4 = cue("s4.4");
  const c5 = cue("s4.5");
  const c6 = cue("s4.6");
  const e1 = end("s4.1");
  const e4 = end("s4.4");
  const e5 = end("s4.5");
  const bug = split(c4, e4, 2, 5);
  const c7 = cue("s4.7");
  const assign = split(c7, end("s4.7"), 1, 2);
  const assigned = progress(frame, assign, 12, ease.out);

  // 줄마다: 나타나는 프레임, 강조 띠가 켜지는 구간
  const show = [c2 + 14, c3, c4, c4 + 6, c4 + 12, c4 + 18, bug, c5, c5 + 6, split(c5, e5, 1, 2), split(c5, e5, 3, 4), c6];
  const band: Record<number, [number, number]> = {
    1: [c3, c4 - 8],
    6: [bug, c5 - 8],
    8: [c5 + 6, c6 - 8],
    11: [c6, c7 - 8],
  };

  return (
    <ShiftSheet>
      <Steps active={0} />
      {/* 본편의 요구사항 카드(축약) */}
      <div style={{ position: "absolute", left: 96, top: 76, height: 56, display: "flex", alignItems: "stretch", border: `${stroke.thin}px solid ${color.lineStrong}`, backgroundColor: withAlpha(color.panel, 0.9), ...enter(frame, c1) }}>
        <div style={{ display: "flex", alignItems: "center", padding: "0 16px", borderRight: `${stroke.hair}px solid ${color.line}`, ...mono(size.small, 700), color: color.inkSoft }}>REQ-207</div>
        <div style={{ display: "flex", alignItems: "center", padding: "0 16px", borderRight: `${stroke.hair}px solid ${color.line}`, ...mono(size.small, 700), color: color.ink }}>{requirement.id}</div>
        <div style={{ display: "flex", alignItems: "center", padding: "0 16px", ...sans(size.small, 700), whiteSpace: "nowrap" }}>{requirement.title}</div>
      </div>
      <Tag text="완료 큐 변경 후 재검증 (예시)" c={color.inkSoft} x={880} y={80} at={split(c1, e1, 2, 3)} dashed />

      {/* s4.1: 본편의 그 블록 */}
      <svg {...fullSvg}>
        <Trace pts={[[330, 134], [330, 420], [660, 420]]} stroke={color.inkSoft} arrow at={c1 + 8} duration={20} opacity={1 - progress(frame, c2 - 12, 8)} />
      </svg>
      <div style={{ position: "absolute", left: 664, top: 300, width: 620, height: 240, boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, border: `${stroke.trace}px solid ${color.inkSoft}`, backgroundColor: withAlpha(color.panel, 0.92), ...enterExit(frame, split(c1, e1, 1, 3), c2 - 12) }}>
        <div style={{ ...mono(size.title, 700), color: color.ink }}>{BLOCK.split(" · ")[0]}</div>
        <div style={{ ...sans(size.body, 600), color: color.inkSoft }}>{BLOCK.split(" · ")[1]}</div>
      </div>

      {/* 전에는 이것을 썼다 */}
      <div style={{ position: "absolute", left: 1262, top: 170, ...mono(size.label, 700), color: color.inkDim, ...enter(frame, c2, { distance: 0 }) }}>BEFORE</div>
      <Pane x={1262} y={206} w={936} h={paneH(8, 28)} title="tb/rec_done_q_seq.sv" edge={color.lineStrong} at={c2} opacity={0.5} scale={0.6}>
        {TB_CODE.map((l, i) => (
          <CodeRow key={i} i={i} px={28} c={color.inkSoft}>
            {l}
          </CodeRow>
        ))}
      </Pane>

      <Pane x={PANE.x} y={PANE.y} w={PANE.w} h={paneH(YAML.length, PX)} title="tasks/VER-REC-012.yaml" edge={color.human} border={withAlpha(color.human, 0.55)} at={c2 + 8}>
        {YAML.map((l, i) => {
          const [code, note] = l.split("#");
          const b = band[i];
          const mark = b ? progress(frame, b[0], 10, ease.out) * (1 - progress(frame, b[1], 10, ease.in)) : 0;
          return (
            <CodeRow key={i} i={i} px={PX} c={i === 6 ? color.human : i === 10 ? color.inkSoft : color.ink} o={progress(frame, show[i], 10)} mark={mark} markColor={color.human}>
              {code}
              {note !== undefined ? <span style={{ color: color.inkDim }}>{`#${note}`}</span> : null}
              {i === 8 ? (
                <span style={{ display: "inline-block", verticalAlign: "middle", marginLeft: 20, marginTop: -6, opacity: progress(frame, c5 + 18, 12) }}>
                  <LockIcon size={36} color={color.human} />
                </span>
              ) : null}
            </CodeRow>
          );
        })}
      </Pane>

      {/* Jira: Test Plan 을 에이전트 계정에 할당한다 (원본은 git, 카드에는 경로만) */}
      <Pane x={ISSUE.x} y={ISSUE.y} w={ISSUE.w} h={paneH(4, 26)} title="JIRA · XRAY TEST PLAN" edge={color.human} border={withAlpha(color.human, 0.55)} at={c7}>
        <CodeRow i={0} px={26} o={progress(frame, c7 + 6, 10)}>
          <span style={{ fontWeight: 700 }}>VER-510</span>
        </CodeRow>
        <CodeRow i={1} px={26} o={progress(frame, c7 + 10, 10)}>
          rcv_ctrl 완료 큐 재검증
        </CodeRow>
        <CodeRow i={2} px={26} c={color.inkSoft} o={progress(frame, c7 + 14, 10)} mark={assigned} markColor={color.human}>
          {"담당: "}
          <span style={{ color: color.agent, fontWeight: 700, opacity: assigned }}>dv-agent</span>
        </CodeRow>
        <CodeRow i={3} px={26} c={color.inkSoft} o={progress(frame, c7 + 18, 10)}>
          지시서: tasks/VER-REC-012.yaml
        </CodeRow>
        <div style={{ position: "absolute", right: 16, top: 56, opacity: progress(frame, c7 + 6, 10) }}>
          <StatusChip text={assigned > 0.5 ? "지시됨" : "정의 중"} c={mix(assigned, color.inkDim, color.human)} />
        </div>
      </Pane>
      <svg {...fullSvg}>
        <Trace pts={[[ISSUE.x + 120, ISSUE.y + paneH(4, 26)], [ISSUE.x + 120, ISSUE.y + paneH(4, 26) + 74], [ISSUE.x + 190, ISSUE.y + paneH(4, 26) + 74]]} stroke={color.agent} width={stroke.bold} arrow at={assign + 8} duration={18} />
      </svg>
      <div style={{ position: "absolute", left: ISSUE.x + 204, top: ISSUE.y + paneH(4, 26) + 30, display: "flex", alignItems: "center", gap: 16, ...enter(frame, assign + 20, { from: "right" }) }}>
        <AgentIcon size={88} color={color.agent} />
        <div style={{ ...mono(size.small, 700), color: color.agent }}>dv-agent</div>
      </div>
    </ShiftSheet>
  );
};
