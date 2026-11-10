import type { FC } from "react";
import { S5_4 } from "../../shared/content";
import { DotClusters } from "../components/DotClusters";
import { FLOW, Flow, layoutFlow } from "../components/Flow";
import { Frame } from "../components/Frame";
import { PrincipleMark } from "../components/PrincipleMark";
import { RequirementCard } from "../components/RequirementCard";
import { VRule } from "../components/Rule";
import { StageTitle } from "../components/StageTitle";
import { StageTrack, stageSlot } from "../components/StageTrack";
import { GRID, RULE, colEnd, colSpan, colX } from "../theme";

const CARD_Y = 186;
const BODY_Y = 366;

// 실패 312건이 원인 4개로 모인 모습. 묶음별 건수는 그림을 위한 예시다(합 312).
const CLUSTER_COUNTS = [141, 86, 53, 32];
const CLUSTER_PITCH = 5.6;
const CLUSTER_GAP = 24;

// S5-4 시뮬레이션 검증. 시선의 첫 자리는 흐름을 가로지르는 주홍 띠(실패 312건)와 그 아래의 점 묶음이다.
// 움직임: 굵은 괘선이 4번 칸까지 그어지고 카드가 깃대를 따라 밀려온다 → "현재" 줄이 나왔다가 흐려진다
//        → 흐름도의 행이 위에서부터 올라온다. 주홍 띠는 옆에서 밀고 들어와 멈추고, 흩어진 점 312개가 네 묶음으로 모인다
//        → 먹색 띠가 닫히면 오른쪽 단에 원칙 표식이 올라온다.
export const S54Scene: FC = () => {
  const slot = stageSlot(
    S5_4.stageIndex,
    S5_4.stages.length,
    GRID.left,
    GRID.width,
  );
  const flowRight = colEnd(8);
  const side = colX(9);

  // 점 묶음은 주홍 띠 바로 아래, 사람 줄의 빈칸에 놓는다(분류·가설 행과 같은 높이).
  const rows = layoutFlow(S5_4.steps, BODY_Y);
  const problem = rows.filter((r) => r.kind === "problem")[0];
  const afterProblem = rows[rows.indexOf(problem) + 3];
  const zoneTop = problem.top + problem.height;
  const zoneBottom = afterProblem.top;
  const radii = CLUSTER_COUNTS.map((n) => CLUSTER_PITCH * Math.sqrt(n));
  const clustersWidth =
    radii.reduce((sum, r) => sum + r * 2, 0) + CLUSTER_GAP * (radii.length - 1);
  let cx = 0;
  const clusters = CLUSTER_COUNTS.map((count, i) => {
    cx += radii[i];
    const cluster = { count, cx, cy: (zoneBottom - zoneTop) / 2 };
    cx += radii[i] + CLUSTER_GAP;
    return cluster;
  });

  return (
    <Frame>
      <StageTrack
        stages={S5_4.stages}
        current={S5_4.stageIndex}
        x={GRID.left}
        y={GRID.top}
        width={GRID.width}
        poleLength={CARD_Y - GRID.top + RULE.mid}
      />

      <StageTitle
        number={S5_4.stageIndex + 1}
        title={S5_4.stageTitle}
        before={S5_4.before}
        x={GRID.left}
        top={196}
      />

      <RequirementCard
        id={S5_4.card.id}
        title={S5_4.card.title}
        criterion={S5_4.card.criterion}
        records={S5_4.card.records}
        x={slot.x}
        y={CARD_Y}
        bodyWidth={410}
        tabWidth={212}
      />

      <Flow
        steps={S5_4.steps}
        lanes={S5_4.lanes}
        x={GRID.left}
        y={BODY_Y}
        width={flowRight - GRID.left}
        humanX={colX(4)}
      />

      <DotClusters
        x={flowRight - clustersWidth - 12}
        y={zoneTop}
        width={clustersWidth}
        height={zoneBottom - zoneTop}
        clusters={clusters}
        pitch={CLUSTER_PITCH}
        dotRadius={3.1}
      />

      {/* 오른쪽 곁단: 원칙 표식 */}
      <VRule
        x={side - GRID.gutter / 2 - 1}
        y={BODY_Y + FLOW.header}
        length={GRID.bottom - BODY_Y - FLOW.header}
      />
      <PrincipleMark
        name={S5_4.principle.name}
        stat={S5_4.principle.stat}
        from={S5_4.principle.from}
        to={S5_4.principle.to}
        source={S5_4.principle.source}
        x={side}
        y={BODY_Y + FLOW.header}
        width={colSpan(3)}
        height={GRID.bottom - BODY_Y - FLOW.header}
      />
    </Frame>
  );
};
