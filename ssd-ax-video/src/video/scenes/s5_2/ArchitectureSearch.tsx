import { CONTEXT_HEIGHT } from "../../components";
import type { Illustration, IllustrationBeat } from "../../stage/StageScene";
import { BODY } from "../../stage/layout";
import { ChangeAndBreak } from "./ChangeAndBreak";
import { MODELS_HEIGHT, ModelViews } from "./ModelViews";
import { ParetoPlot } from "./ParetoPlot";
import { DETAIL, QueueDetail } from "./QueueDetail";
import { RtlFirst } from "./RtlFirst";

// S5-2 아키텍처 설계의 그림 (680×616). 문장마다 화면이 한 번 바뀐다.
//   배경   요구사항이 바뀐 것과 이전 구조가 기준을 넘는 모습 (본문 전체. ChangeAndBreak)
//   현재   RTL 먼저: 구조의 문제는 emulation 에서야 보인다 (RtlFirst)
//   에이전트 목적별 모델 넷이 구조 기술 하나에서 파생 → 후보 수백 개 → 여섯 관점 (ModelViews, ParetoPlot)
//   사람   Pareto 경계에서 하나를 고른다
//   문제·해결 고른 구조의 상세도: soft decoder 앞의 큐. host read 가 밀리고, 우선 큐로 풀린다 (QueueDetail)
//
// 상세도는 문제 항목이 나오기 조금 전에 그려진다(구조 검증을 돌리는 중). 그 직전에 목적별 모델과 관점이 물러나고
// 산점도가 위로 올라가 자리를 내준다. 문제의 순간에 큐가 차고 지연이 기준선을 넘는다.

const SETUP_LEAD = 36;
/** 상세도가 그려지기 전에 위쪽을 정리하는 데 쓰는 프레임 */
const CLEAR_LEAD = 26;
/** 에이전트 항목이 나온 뒤: 모델 파생 → 축 → 관점 */
const AXES_AFTER = 50;
const VIEWS_AFTER = 110;

const frameOf = (beats: readonly IllustrationBeat[], kind: IllustrationBeat["kind"]): number => {
  const hit = beats.filter((b) => b.kind === kind)[0];
  return hit ? hit.frame : 0;
};

export const ArchitectureSearch: Illustration = ({ width, height, origin, beats, frames }) => {
  const agentAt = frameOf(beats, "agent");
  const problemAt = frames.problem ?? frames.end;
  const resolvedAt = frames.resolved ?? frames.end;
  const setupAt = problemAt - SETUP_LEAD;
  const clearAt = setupAt - CLEAR_LEAD;
  const figureH = BODY.h - CONTEXT_HEIGHT;
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
          <ChangeAndBreak at={frames.context} out={frames.contextOut} />
        </svg>
      ) : null}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
      >
        <RtlFirst at={frames.before} out={frames.flowStart - 6} />
        <ModelViews at={agentAt + 4} viewsAt={agentAt + VIEWS_AFTER} out={clearAt} />
        <ParetoPlot
          axesAt={agentAt + AXES_AFTER}
          humanAt={frameOf(beats, "human")}
          drop={MODELS_HEIGHT}
          riseAt={clearAt + 6}
          detailAt={setupAt}
          detailY={DETAIL.y}
        />
        <QueueDetail setupAt={setupAt} problemAt={problemAt} resolvedAt={resolvedAt} />
      </svg>
    </>
  );
};
