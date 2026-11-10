import React from "react";
import { f } from "../anim";
import { color, mono, safe, size } from "../theme";
import type { SceneId } from "../timeline";
import { SCENES } from "../timeline";
import { Sheet } from "./Sheet";
import { Caption } from "./Text";

// 임시 씬. Sheet 위에 그 씬의 문구가 at 시점에 차례로 나온다.
// 영상 전체가 처음부터 끝까지 돌아가는지 확인하는 용도다. 씬 제작자가 씬을 통째로 다시 만들면 쓰이지 않는다.

export type DraftLine = {
  /** 씬 시작 후 초 */
  at: number;
  text: string;
  /** 보조 문구(작고 흐리게) */
  minor?: boolean;
};

const TOP = 200;

export const DraftScene: React.FC<{
  id: SceneId;
  lines: readonly DraftLine[];
  children?: React.ReactNode;
}> = ({ id, lines, children }) => {
  const scene = SCENES.filter((s) => s.id === id)[0];
  const pitch = Math.min(104, (safe.bottom - TOP) / Math.max(1, lines.length));
  return (
    <Sheet id={id}>
      <div style={{ position: "absolute", left: safe.left, top: 96, ...mono(size.label, 700), color: color.agent }}>
        DRAFT · {scene.id} · {scene.name}
      </div>
      {lines.map((line, i) => (
        <Caption
          key={i}
          text={line.text}
          x={safe.left}
          y={TOP + i * pitch}
          align="left"
          at={f(line.at)}
          px={line.minor ? size.body : size.head}
          weight={line.minor ? 500 : 700}
          color={line.minor ? color.inkSoft : color.ink}
        />
      ))}
      {children}
    </Sheet>
  );
};
