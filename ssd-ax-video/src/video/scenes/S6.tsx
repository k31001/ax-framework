import React from "react";
import { DraftScene } from "../components/DraftScene";
import { S6 as content } from "../content";

// S6 5대 전환 — 임시 씬. 씬 제작자가 통째로 다시 만든다.

export const S6: React.FC = () => (
  <DraftScene
    id="S6"
    lines={[
      { at: 0.3, text: content.title },
      ...content.rows.map((row, i) => ({
        at: content.rowsAt + i * content.rowStep,
        text: `${row.axis}: ${row.before} → ${row.after}`,
        minor: true,
      })),
    ]}
  />
);
