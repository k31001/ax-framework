import React from "react";
import { f } from "../anim";
import { DraftScene } from "../components/DraftScene";
import { Source, Title } from "../components/Text";
import { S7 as content } from "../content";
import { safe, size } from "../theme";

// S7 책임 — 임시 씬. 씬 제작자가 통째로 다시 만든다.
// 공통 부품 Title(큰 제목)과 Source(출처 표기)를 썼다.

export const S7: React.FC = () => (
  <DraftScene id="S7" lines={[{ at: content.stat.at, text: content.stat.text, minor: true }]}>
    <Title text={content.headline.text} x={safe.left} y={420} at={f(content.headline.at)} px={size.display} />
    <Source text={content.stat.source} x={safe.left} y={290} at={f(content.stat.at) + 9} />
  </DraftScene>
);
