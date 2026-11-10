import type { Illustration, IllustrationBeat } from "../../stage/StageScene";
import { ParetoPlot } from "./ParetoPlot";
import { DETAIL, QueueDetail } from "./QueueDetail";

// S5-2 아키텍처 설계의 그림 (680×616).
//   위   구성 탐색: 후보 수백 개 → Pareto 경계 → 사람이 하나를 고른다
//   아래 고른 구조의 상세도: soft decoder 앞의 큐. 문제(host read 가 밀림)와 해결(우선 큐)
//
// 상세도는 문제 항목이 나오기 조금 전에 그려진다(구조 검증을 돌리는 중). 문제의 순간에 큐가 차고 지연이 기준선을 넘는다.

const SETUP_LEAD = 36;

const frameOf = (beats: readonly IllustrationBeat[], kind: IllustrationBeat["kind"]): number => {
  const hit = beats.filter((b) => b.kind === kind)[0];
  return hit ? hit.frame : 0;
};

export const ArchitectureSearch: Illustration = ({ width, height, beats, frames }) => {
  const problemAt = frames.problem ?? frames.end;
  const resolvedAt = frames.resolved ?? frames.end;
  const setupAt = problemAt - SETUP_LEAD;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ position: "absolute", inset: 0, overflow: "visible" }}
    >
      <ParetoPlot
        before={frames.before}
        agentAt={frameOf(beats, "agent")}
        humanAt={frameOf(beats, "human")}
        detailAt={setupAt}
        detailY={DETAIL.y}
      />
      <QueueDetail setupAt={setupAt} problemAt={problemAt} resolvedAt={resolvedAt} />
    </svg>
  );
};
