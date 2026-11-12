import { CONTEXT_HEIGHT } from "../../components";
import type { Illustration, IllustrationBeat } from "../../stage/StageScene";
import { BODY, stageLayout } from "../../stage/layout";
import { AreaByCommit } from "./AreaByCommit";
import { ContractFanout } from "./ContractFanout";
import { DesignerChoice } from "./DesignerChoice";
import { Handoff } from "./Handoff";

// S5-3 IP 설계 · PPA 의 그림 (576×616).
//   배경 RTL 설계자가 받는 것: 블록별 지연 예산과 interface 계약 (본문 전체. Handoff)
//   위   API 문서 → 계약 → RTL · C++ header · assertion
//   아래 commit 마다 갱신되는 ECC 면적 막대와 예산선. 넘으면 구조 모델에 다녀온 뒤 줄어든다.
//   강조 예산을 지키는 방법은 설계자의 결정 (원칙 띠 자리. DesignerChoice)

const beatOf = (beats: readonly IllustrationBeat[], kind: IllustrationBeat["kind"]): IllustrationBeat | undefined =>
  beats.filter((b) => b.kind === kind)[0];

export const ContractAndPpa: Illustration = ({ stage, width, height, origin, beats, frames }) => {
  const agentAt = beatOf(beats, "agent")?.frame ?? 0;
  const humanAt = beatOf(beats, "human")?.frame ?? 0;
  const note = beatOf(beats, "note");
  const strip = stageLayout(stage.id).strip;
  const figureH = BODY.h - CONTEXT_HEIGHT;
  const hasContext = frames.context !== null && frames.contextOut !== null;
  return (
    <>
      {frames.context !== null && frames.contextOut !== null ? (
        <svg
          width={BODY.w}
          height={figureH}
          viewBox={`0 0 ${BODY.w} ${figureH}`}
          style={{
            position: "absolute",
            left: BODY.x - origin.x,
            top: BODY.y - origin.y + CONTEXT_HEIGHT,
            overflow: "visible",
          }}
        >
          <Handoff at={frames.context} out={frames.contextOut} />
        </svg>
      ) : null}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
      >
        <ContractFanout
          before={frames.before}
          humanAt={humanAt}
          agentAt={agentAt}
          away={hasContext && frames.context !== null ? [frames.context - 10, frames.flowStart] : undefined}
        />
        <AreaByCommit
          agentAt={agentAt}
          problemAt={frames.problem ?? frames.end}
          resolvedAt={frames.resolved ?? frames.end}
        />
      </svg>
      {note && strip ? (
        <DesignerChoice
          text={note.text}
          x={strip.x - origin.x}
          y={strip.y - origin.y}
          w={strip.w}
          h={strip.h}
          at={note.frame}
          out={(frames.principle ?? frames.end) - 14}
        />
      ) : null}
    </>
  );
};
