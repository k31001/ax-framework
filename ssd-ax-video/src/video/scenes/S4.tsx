import React from "react";
import { Sheet } from "../components/Sheet";
import { Caption, Title } from "../components/Text";
import { S4 as content } from "../content";
import { color, size } from "../theme";
import { CardBuild } from "./s4/CardBuild";
import { Recovery } from "./s4/Recovery";
import { SETTING, T, TITLE } from "./s4/layout";

// S4 사례 소개.
//
//   0.3s  제목
//   1.2s  과제 설정 (작은 글자)
//   3.0s  요구사항 카드가 만들어진다. 이어서 카드의 수용 기준 칸에서 기준선이 뻗어 나온다
//   6.0s  오류 복구 3단계가 차례로 내려가며 지연 막대가 길어진다. 마지막 막대가 기준선을 넘는다

export const S4: React.FC = () => (
  <Sheet id="S4">
    <Title text={content.title.text} label="CASE STUDY" x={TITLE.x} y={TITLE.y} at={T.title} />
    <Caption
      text={content.setting.text}
      x={SETTING.x}
      y={SETTING.y}
      align="left"
      at={T.setting}
      px={size.body}
      weight={500}
      color={color.inkSoft}
    />
    <CardBuild />
    <Recovery steps={content.recovery.steps} />
  </Sheet>
);
