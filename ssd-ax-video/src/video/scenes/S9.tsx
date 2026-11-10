import React from "react";
import { DraftScene } from "../components/DraftScene";
import { S9 as content } from "../content";

// S9 Closing — 임시 씬. 씬 제작자가 통째로 다시 만든다.

export const S9: React.FC = () => (
  <DraftScene
    id="S9"
    lines={[
      ...content.roles.map((row, i) => ({
        at: content.rolesAt + i * content.roleGap,
        text: `${row.role}: ${row.before} → ${row.after}`,
        minor: true,
      })),
      { at: content.shift.at, text: content.shift.text },
      { at: content.headline.at, text: content.headline.text },
      { at: content.endCard.at, text: content.endCard.text, minor: true },
    ]}
  />
);
