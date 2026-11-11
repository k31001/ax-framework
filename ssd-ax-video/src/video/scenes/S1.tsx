import React from "react";
import { Sheet } from "../components/Sheet";
import { Caption } from "../components/Text";
import { S1 as content } from "../content";
import { size } from "../theme";
import { CodeFigure, LogFigure, ScriptFigure, TaskPanel } from "./s1/TaskPanel";
import type { TaskFigure } from "./s1/TaskPanel";
import { Tree } from "./s1/Tree";
import { CAPTION, PANEL, T, panelX } from "./s1/layout";

// S1 Hook.
//
//   0.3s  자막 1. 작업 세 가지의 도면 조각이 하나씩 켜지고, 안에서 작업이 진행된다
//   2.6s  자막 2. 세 작업이 차례로 끝난다: 이름과 완료 표시
//   4.4s  조각들이 물러나고 나무가 자란다. 가지 끝마다 열매
//   5.2s  자막 3. 손이 닿는 높이 아래의 열매 셋만 수확되어 빈 고리가 되고, 위쪽은 그대로 남는다

const FIGURES: readonly TaskFigure[] = [CodeFigure, LogFigure, ScriptFigure];

export const S1: React.FC = () => (
  <Sheet id="S1">
    {content.tasks.map((name, i) => (
      <TaskPanel
        key={name}
        index={i}
        name={name}
        x={panelX(i)}
        y={PANEL.y}
        on={T.on(i)}
        done={T.done(i)}
        out={T.panelsOut + i * 3}
        Figure={FIGURES[i]}
      />
    ))}

    <Tree />

    {content.captions.map((caption, i) => (
      <Caption
        key={caption.text}
        text={caption.text}
        x={CAPTION.x}
        y={CAPTION.y}
        align="left"
        px={size.title}
        at={T.caption[i]}
        out={i < T.captionOut.length ? T.captionOut[i] : undefined}
      />
    ))}
  </Sheet>
);
