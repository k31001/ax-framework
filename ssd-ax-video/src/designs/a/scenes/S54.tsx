import React from "react";
import { S5_4 as content } from "../../shared/content";
import { ClusterField, clusterRadius, layoutClusters } from "../components/ClusterField";
import { FLAG_HEIGHT, FlowStep, LaneLabel, ProblemFlag, ResolvedGate } from "../components/Flow";
import type { Box } from "../components/Flow";
import { PrincipleStrip } from "../components/PrincipleStrip";
import { RequirementCard } from "../components/RequirementCard";
import { Sheet } from "../components/Sheet";
import { StageTrack, stageX } from "../components/StageTrack";
import { Trace } from "../components/Trace";
import { Waveform } from "../components/Waveform";
import { FRAME, color, mono, pad2, safe, sans, size, stroke, withAlpha } from "../theme";

// S5-4 시뮬레이션 검증. 모든 항목이 다 나타난 마지막 상태.
// 시선의 중심은 흐름 한가운데의 붉은 깃발(실패 312건)과 그 옆의 점 묶음.
// 거기서 trace를 따라 왼쪽(시작)과 오른쪽(해결)으로 읽힌다.

// ── 위쪽: 진행 표시와 요구사항 카드 ──────────────────────────────────
const TRACK_Y = 292;
const CARD_W = 630;
const CARD_TOP = safe.top;
const STAGE_X = stageX(content.stageIndex, content.stages.length);

// ── 본문: 두 줄 흐름도 ───────────────────────────────────────────────
const ROW_H = 120;
const AGENT_Y = 528; // 에이전트 줄 상자의 위쪽
const HUMAN_Y = 700; // 사람 줄 상자의 위쪽
const AGENT_CY = AGENT_Y + ROW_H / 2;
const HUMAN_CY = HUMAN_Y + ROW_H / 2;
const LANE_SPLIT = (AGENT_Y + ROW_H + HUMAN_Y) / 2;
const LANE_TOP = 392;
const LANE_BOTTOM = 834;

// steps의 순서대로 놓이는 자리. 문제(3번째)는 trace 위의 마름모와 그 위 깃발로 놓인다.
const BOXES: (Box | null)[] = [
  { x: 244, y: HUMAN_Y, w: 384, h: ROW_H },
  { x: 414, y: AGENT_Y, w: 284, h: ROW_H },
  null,
  { x: 814, y: AGENT_Y, w: 272, h: ROW_H },
  { x: 1122, y: AGENT_Y, w: 362, h: ROW_H },
  { x: 1148, y: HUMAN_Y, w: 336, h: ROW_H },
  { x: 1524, y: AGENT_Y, w: 300, h: HUMAN_Y + ROW_H - AGENT_Y },
];
const box = (i: number): Box => BOXES[i] as Box;
// 위아래로 놓인 두 상자가 가로로 겹치는 구간의 가운데
const overlapMid = (a: Box, b: Box): number =>
  (Math.max(a.x, b.x) + Math.min(a.x + a.w, b.x + b.w)) / 2;

const PROBLEM_X = 756; // 문제 마름모의 중심
const DIAMOND = 28;
const FLAG_Y = 420;
const FLAG_X = 244; // 깃발의 왼쪽 끝. 사람 줄 첫 상자와 맞춘다.
const STRIP_CY = FLAG_Y + FLAG_HEIGHT / 2;

// 실패 312건이 원인 4개로 모인 묶음. 마지막(가장 큰) 묶음이 원인 가설로 이어진다.
const CLUSTER_SPACING = 4.6;
const CLUSTERS = layoutClusters([87, 40, 64, 121], PROBLEM_X + 70, STRIP_CY, 40, CLUSTER_SPACING);
const SUSPECT = CLUSTERS[CLUSTERS.length - 1];
const SUSPECT_R = clusterRadius(SUSPECT.count, CLUSTER_SPACING) + 9;

// 강조한 묶음을 열어 본 모습: 복구 요청과 완료 신호가 같은 cycle에 겹친다.
const WAVE = { x: 1326, y: 404, w: 478, h: 96 } as const;

const LOOP_Y = 848; // 해결에서 문제로 되돌아가는 폐루프 trace의 아래쪽 변
const STRIP_Y = 874;

export const S54: React.FC = () => {
  const h1 = box(0);
  const a2 = box(1);
  const a4 = box(3);
  const a5 = box(4);
  const h6 = box(5);
  const r7 = box(6);
  const up = overlapMid(h1, a2); // 사람 → 에이전트로 올라가는 자리
  const down = overlapMid(a5, h6); // 에이전트 → 사람으로 내려가는 자리

  return (
    <Sheet sheet="SHEET 08 / 15">
      {/* 단계 제목: 단계가 시작될 때 크게 나왔다가, 흐름이 그려지는 동안 이 크기로 물러나 있다 */}
      <div style={{ position: "absolute", left: safe.left, top: 96 }}>
        <div style={{ ...mono(size.label, 700), color: color.agent }}>
          STAGE {pad2(content.stageIndex + 1)} / {pad2(content.stages.length)}
        </div>
        <div style={{ ...sans(size.head, 800), lineHeight: "72px", marginTop: 4, whiteSpace: "nowrap" }}>
          {content.stageTitle}
        </div>
      </div>

      {/* 전환 전의 방식: 흐려진 채로 작게 남는다 */}
      <div
        style={{
          position: "absolute",
          right: FRAME.w - safe.right,
          top: 96,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              ...sans(size.small, 600),
              lineHeight: "42px",
              padding: "0 14px",
              color: color.inkDim,
              border: `${stroke.thin}px dashed ${color.inkDim}`,
            }}
          >
            {content.before.label}
          </div>
          <div style={{ flex: 1, height: 0, borderTop: `${stroke.trace}px dashed ${color.lineStrong}` }} />
        </div>
        <div style={{ ...sans(size.small, 500), color: color.inkDim, whiteSpace: "nowrap" }}>
          {content.before.text}
        </div>
      </div>

      <StageTrack stages={content.stages} current={content.stageIndex} y={TRACK_Y} />
      <RequirementCard
        card={content.card}
        left={STAGE_X - CARD_W / 2}
        top={CARD_TOP}
        width={CARD_W}
        anchor={{ x: STAGE_X, y: TRACK_Y - 14 }}
      />

      {/* 줄의 바탕과 연결선 */}
      <svg
        width={FRAME.w}
        height={FRAME.h}
        viewBox={`0 0 ${FRAME.w} ${FRAME.h}`}
        style={{ position: "absolute", inset: 0 }}
      >
        <path
          d={`M ${safe.left} ${LANE_TOP} H ${safe.right} V ${AGENT_Y - 14} H ${r7.x - 20} V ${LANE_SPLIT} H ${safe.left} Z`}
          fill={withAlpha(color.agent, 0.035)}
        />
        <rect
          x={safe.left}
          y={LANE_SPLIT}
          width={r7.x - 20 - safe.left}
          height={LANE_BOTTOM - LANE_SPLIT}
          fill={withAlpha(color.human, 0.035)}
        />
        <line x1={safe.left} x2={safe.left} y1={LANE_TOP} y2={LANE_SPLIT} stroke={color.agent} strokeWidth={stroke.bold} />
        <line x1={safe.left} x2={safe.left} y1={LANE_SPLIT} y2={LANE_BOTTOM} stroke={color.human} strokeWidth={stroke.bold} />
        <line
          x1={safe.left}
          x2={r7.x - 20}
          y1={LANE_SPLIT}
          y2={LANE_SPLIT}
          stroke={color.lineStrong}
          strokeWidth={stroke.hair}
          strokeDasharray="18 6 3 6"
        />

        {/* 흐름: 01 → 02 → 문제 → 04 → 05 → 06 → 해결 */}
        <Trace pts={[[up, h1.y], [up, a2.y + a2.h]]} arrow />
        <Trace pts={[[a2.x + a2.w, AGENT_CY], [PROBLEM_X - DIAMOND, AGENT_CY]]} />
        <Trace pts={[[PROBLEM_X + DIAMOND, AGENT_CY], [a4.x, AGENT_CY]]} arrow />
        <Trace pts={[[a4.x + a4.w, AGENT_CY], [a5.x, AGENT_CY]]} arrow />
        <Trace pts={[[down, a5.y + a5.h], [down, h6.y]]} arrow />
        <Trace pts={[[h6.x + h6.w, HUMAN_CY], [r7.x, HUMAN_CY]]} arrow />

        {/* 폐루프: 해결 뒤 전체 regression으로 되돌아간다 */}
        <Trace
          pts={[
            [r7.x + r7.w / 2, r7.y + r7.h],
            [r7.x + r7.w / 2, LOOP_Y],
            [PROBLEM_X, LOOP_Y],
            [PROBLEM_X, AGENT_CY + DIAMOND],
          ]}
          stroke={color.agent}
          dash="10 8"
          chamfer={12}
          arrow
        />

        {/* 문제 표식: trace 위의 마름모와 깃대 */}
        <line
          x1={PROBLEM_X}
          x2={PROBLEM_X}
          y1={FLAG_Y + FLAG_HEIGHT}
          y2={AGENT_CY - DIAMOND}
          stroke={color.problem}
          strokeWidth={stroke.trace}
        />
        <path
          d={`M ${PROBLEM_X} ${AGENT_CY - DIAMOND} L ${PROBLEM_X + DIAMOND} ${AGENT_CY} L ${PROBLEM_X} ${
            AGENT_CY + DIAMOND
          } L ${PROBLEM_X - DIAMOND} ${AGENT_CY} Z`}
          fill={color.problem}
        />
        <path
          d={`M ${PROBLEM_X} ${AGENT_CY - 12} V ${AGENT_CY + 4} M ${PROBLEM_X} ${AGENT_CY + 10} V ${AGENT_CY + 13}`}
          stroke={color.bg}
          strokeWidth={4}
          fill="none"
        />

        {/* 실패 312건 → 원인 4개 묶음 → 가장 큰 묶음이 원인 가설로 */}
        <line
          x1={PROBLEM_X + DIAMOND}
          x2={SUSPECT.cx}
          y1={STRIP_CY}
          y2={STRIP_CY}
          stroke={withAlpha(color.problem, 0.45)}
          strokeWidth={stroke.hair}
        />
        <ClusterField clusters={CLUSTERS} spacing={CLUSTER_SPACING} highlight={CLUSTERS.length - 1} />
        <line
          x1={SUSPECT.cx}
          x2={SUSPECT.cx}
          y1={STRIP_CY + SUSPECT_R}
          y2={a5.y}
          stroke={color.ink}
          strokeWidth={stroke.thin}
        />
        <line
          x1={SUSPECT.cx + SUSPECT_R}
          x2={WAVE.x - 10}
          y1={STRIP_CY}
          y2={STRIP_CY}
          stroke={color.ink}
          strokeWidth={stroke.thin}
        />
      </svg>

      <Waveform
        {...WAVE}
        cycles={9}
        overlap={6}
        signals={[
          { name: "REQ", high: [1, 6] },
          { name: "DONE", high: [3, 6] },
        ]}
      />

      <LaneLabel kind="agent" name={content.lanes.agent} tag="AGENT" x={safe.left + 20} cy={AGENT_CY} />
      <LaneLabel kind="human" name={content.lanes.human} tag="HUMAN" x={safe.left + 20} cy={HUMAN_CY} />

      {content.steps.map((step, i) => {
        if (step.kind === "problem") {
          return (
            <ProblemFlag
              key={i}
              index={i + 1}
              text={step.text}
              x={FLAG_X}
              y={FLAG_Y}
              w={PROBLEM_X + DIAMOND - FLAG_X}
            />
          );
        }
        if (step.kind === "resolved") {
          return <ResolvedGate key={i} index={i + 1} text={step.text} {...box(i)} />;
        }
        return <FlowStep key={i} kind={step.kind} index={i + 1} text={step.text} {...box(i)} />;
      })}

      <PrincipleStrip
        principle={content.principle}
        x={safe.left}
        y={STRIP_Y}
        w={safe.right - safe.left}
        h={safe.bottom - STRIP_Y}
      />
    </Sheet>
  );
};
