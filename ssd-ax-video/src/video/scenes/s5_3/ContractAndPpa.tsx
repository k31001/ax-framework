import type { Illustration, IllustrationBeat } from "../../stage/StageScene";
import { AreaByCommit } from "./AreaByCommit";
import { ContractFanout } from "./ContractFanout";

// S5-3 IP 설계 · PPA 의 그림 (576×616).
//   위   API 문서 → 계약 → RTL · C++ header · assertion
//   아래 commit 마다 갱신되는 ECC 면적 막대와 예산선. 넘으면 구조 모델에 다녀온 뒤 줄어든다.

const frameOf = (beats: readonly IllustrationBeat[], kind: IllustrationBeat["kind"]): number => {
  const hit = beats.filter((b) => b.kind === kind)[0];
  return hit ? hit.frame : 0;
};

export const ContractAndPpa: Illustration = ({ width, height, beats, frames }) => {
  const agentAt = frameOf(beats, "agent");
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ position: "absolute", inset: 0, overflow: "visible" }}
    >
      <ContractFanout before={frames.before} humanAt={frameOf(beats, "human")} agentAt={agentAt} />
      <AreaByCommit
        agentAt={agentAt}
        problemAt={frames.problem ?? frames.end}
        resolvedAt={frames.resolved ?? frames.end}
      />
    </svg>
  );
};
