import React from "react";
import { f } from "../anim";
import { DraftScene } from "../components/DraftScene";
import { Stat } from "../components/Text";
import { S2 as content } from "../content";
import { safe } from "../theme";

// S2 문제 — 임시 씬. 씬 제작자가 통째로 다시 만든다.
// 수치는 공통 부품 Stat 으로 놓았다(큰 수치 + 설명 + 출처).

export const S2: React.FC = () => (
  <DraftScene id="S2" lines={content.captions}>
    <Stat
      value={content.stat.value}
      text={content.stat.text}
      source={content.stat.source}
      x={safe.left}
      y={520}
      at={f(content.stat.at)}
    />
  </DraftScene>
);
