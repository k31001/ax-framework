import { useCurrentFrame } from "remotion";
import type { Illustration } from "../../stage/StageScene";
import { LongRun } from "./LongRun";
import { Zoom } from "./Zoom";
import { ZOOM } from "./layout";

// S5-5 Emulation · FPGA 의 그림. 흐름도 위쪽 띠(1012×280), 붉은 깃발의 오른쪽.
//
//   매일 구동     HW 파형과 FW trace 두 줄이 같은 시간축 위에서 그려지고, 매일 구동의 눈금이 찍힌다
//   문제          FW trace 의 command 한 칸이 닫히지 않다가 timeout 에서 끊긴다
//   교차 분석     그 시점에 두 줄을 관통하는 세로선이 그어지고 오른쪽에 확대 창이 열린다
//   원인 가설     완료 펄스 두 개가 status 비트 하나에 겹쳐 한 건만 FW 에 전달된다 ("1건 유실")
//   사람의 결정   비트 하나가 큐 여러 칸으로 바뀐다
//   해결          두 완료가 각자의 칸에 들어가 둘 다 전달되고, 붉은색이 빠진다
//
// 왼쪽(장시간 구동)은 LongRun, 오른쪽(확대 창)은 Zoom 이 그린다.

export const S55Illustration: Illustration = ({ width, height, beats, frames }) => {
  const frame = useCurrentFrame();

  // 시점: 매일 구동 → 문제 → 교차 분석 → 가설 → 결정 → 해결
  const pi = beats.findIndex((b) => b.kind === "problem");
  if (pi < 1 || beats.length < pi + 5) {
    throw new Error("S5-5: 문제 앞에 항목 1개(매일 구동), 뒤에 4개(교차 분석, 가설, 결정, 해결)가 필요하다");
  }
  const runAt = beats[pi - 1].frame;
  const problemAt = beats[pi].frame;
  const crossAt = beats[pi + 1].frame;
  const hypothesisAt = beats[pi + 2].frame;
  const decisionAt = beats[pi + 3].frame;
  const resolvedAt = frames.resolved ?? beats[pi + 4].frame;
  if (frame < runAt) return null;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <LongRun
        width={width}
        height={height}
        runAt={runAt}
        problemAt={problemAt}
        crossAt={crossAt}
        resolvedAt={resolvedAt}
      />
      <Zoom
        x={width - ZOOM.w}
        crossAt={crossAt}
        hypothesisAt={hypothesisAt}
        decisionAt={decisionAt}
        resolvedAt={resolvedAt}
      />
    </div>
  );
};
