import React from "react";
import { useCurrentFrame } from "remotion";
import { f, progress } from "../anim";
import { DraftScene } from "../components/DraftScene";
import { RequirementCard } from "../components/RequirementCard";
import { CARD, S4 as content, S5 } from "../content";

// S4 사례 소개 — 임시 씬. 씬 제작자가 통째로 다시 만든다.
// 요구사항 카드는 공통 컴포넌트(RequirementCard)를 쓴다. 기록이 하나도 붙지 않은 상태(attached=0)다.

export const S4: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <DraftScene
      id="S4"
      lines={[
        { at: content.title.at, text: content.title.text },
        { at: content.setting.at, text: content.setting.text, minor: true },
        ...content.recovery.steps.map((step, i) => ({ at: content.recovery.at + i * 0.6, text: step, minor: true })),
      ]}
    >
      <RequirementCard
        card={CARD}
        left={1100}
        top={440}
        records={S5.map((s) => s.record)}
        attached={0}
        appear={progress(frame, f(content.cardAt), 26)}
      />
    </DraftScene>
  );
};
