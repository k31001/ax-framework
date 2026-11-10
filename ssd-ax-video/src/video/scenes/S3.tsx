import React from "react";
import { DraftScene } from "../components/DraftScene";
import { S3 as content } from "../content";

// S3 전환 선언 — 임시 씬. 씬 제작자가 통째로 다시 만든다.

export const S3: React.FC = () => (
  <DraftScene
    id="S3"
    lines={[
      { at: content.lead.at, text: content.lead.text, minor: true },
      { at: content.headline.at, text: content.headline.text },
      ...content.ladder.steps.map((step, i) => ({
        at: content.ladder.at + i * 0.5,
        text: i === 0 ? `${step} (${content.ladder.nowLabel})` : step,
        minor: true,
      })),
    ]}
  />
);
