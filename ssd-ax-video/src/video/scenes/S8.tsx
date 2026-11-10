import React from "react";
import { DraftScene } from "../components/DraftScene";
import { S8 as content } from "../content";

// S8 로드맵 — 임시 씬. 씬 제작자가 통째로 다시 만든다.

export const S8: React.FC = () => (
  <DraftScene
    id="S8"
    lines={[
      { at: 0.3, text: content.title },
      ...content.steps.map((step, i) => ({
        at: content.stepsAt + i * content.stepGap,
        text: `${i + 1}. ${step.name}: ${step.detail}`,
        minor: true,
      })),
      { at: content.reference.at, text: content.reference.text, minor: true },
      { at: content.closing.at, text: content.closing.text },
    ]}
  />
);
