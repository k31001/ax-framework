import React from "react";
import { DUR } from "../anim";
import { Sheet } from "../components/Sheet";
import { Caption, Stat } from "../components/Text";
import { S2 as content, STAGES } from "../content";
import { color, size } from "../theme";
import { Pieces } from "./s2/Pieces";
import { Share } from "./s2/Share";
import { Speedup } from "./s2/Speedup";
import { StageRow } from "./s2/StageRow";
import { CAPTION, STAT, T } from "./s2/layout";

// S2 문제.
//
//   0.3s  자막 1. 7단계 흐름이 그려지고, 몇몇 단계 위에서 개인 작업의 점이 점점 빨리 깜빡인다.
//         작업 하나의 치수선은 줄지만 흐름 아래의 전체 치수선은 그대로다
//   4.2s  자막 2. 앞 단계가 쏟아낸 조각이 흐름을 따라 가 검증과 통합 앞에 쌓인다
//   8.0s  수치. 검증 쪽 두 단계에서 내려온 선이 전체 길이의 60~70% 띠로 벌어진다

const SHARE_COLOR = color.human;

export const S2: React.FC = () => (
  <Sheet id="S2">
    <StageRow stages={STAGES} />
    <Speedup />
    <Share tint={SHARE_COLOR} />
    <Pieces />

    {content.captions.map((caption, i) => (
      <Caption
        key={caption.text}
        text={caption.text}
        x={CAPTION.x}
        y={CAPTION.y}
        align="left"
        px={size.title}
        at={T.caption[i]}
        out={(i === 0 ? T.caption[1] : T.stat) - DUR.exit}
      />
    ))}

    <Stat
      value={content.stat.value}
      text={content.stat.text}
      source={content.stat.source}
      x={STAT.x}
      y={STAT.y}
      at={T.stat}
      color={SHARE_COLOR}
    />
  </Sheet>
);
