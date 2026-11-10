import React from "react";
import { useCurrentFrame } from "remotion";
import { ease, lerp, progress } from "../../anim";
import { CARD_HEIGHT, CARD_WIDTH, RequirementCard } from "../../components/RequirementCard";
import { CARD, S5 } from "../../content";
import { color, fullSvg, mono, size, stroke } from "../../theme";
import { CARD_BOX, CARD_SCALE, T } from "./layout";

// 요구사항 카드가 만들어진다.
// 카드 자리의 보조선(네 변의 연장선)이 먼저 그려지고, 그 안에서 카드의 테두리가 한 바퀴 그려지며 칸이 차례로 나타난다.
// 다 만들어지면 보조선은 모서리의 짧은 표시만 남기고 물러난다.
// 카드는 사례 구간과 같은 부품(RequirementCard)이다. 기록 슬롯은 모두 비어 있다.

const RECORDS = S5.map((s) => s.record);
const REACH = 56; // 보조선이 카드 바깥으로 나가는 길이
const MARK = 16; // 남는 모서리 표시의 길이

export const CardBuild: React.FC = () => {
  const frame = useCurrentFrame();
  const guides = progress(frame, T.guides, 16, ease.inOut);
  if (guides <= 0) return null;
  const appear = progress(frame, T.card, T.cardDur, ease.inOut);
  // 보조선이 모서리 표시로 줄어든다.
  const settle = progress(frame, T.card + T.cardDur - 6, 18, ease.inOut);
  const reach = lerp(REACH, MARK, settle);

  const { x, y, w, h } = CARD_BOX;
  const cx = x + w / 2;
  const cy = y + h / 2;
  // 가운데에서 양쪽으로 펴지는 선. 카드가 만들어진 뒤에는 변 위의 부분을 지우고 바깥 표시만 남긴다.
  const hx = (w / 2 + reach) * guides;
  const hy = (h / 2 + reach) * guides;
  const gapX = (w / 2 + 6) * settle;
  const gapY = (h / 2 + 6) * settle;
  const guideColor = color.lineStrong;

  return (
    <>
      <svg {...fullSvg}>
        <g stroke={guideColor} strokeWidth={stroke.hair} opacity={lerp(1, 0.8, settle)}>
          {[y, y + h].map((gy) => (
            <React.Fragment key={gy}>
              <line x1={cx - hx} x2={cx - gapX} y1={gy} y2={gy} />
              <line x1={cx + gapX} x2={cx + hx} y1={gy} y2={gy} />
            </React.Fragment>
          ))}
          {[x, x + w].map((gx) => (
            <React.Fragment key={gx}>
              <line x1={gx} x2={gx} y1={cy - hy} y2={cy - gapY} />
              <line x1={gx} x2={gx} y1={cy + gapY} y2={cy + hy} />
            </React.Fragment>
          ))}
        </g>
      </svg>

      <div style={{ position: "absolute", left: x, top: y - 36, ...mono(size.label, 700), color: color.agent, opacity: appear }}>
        REQUIREMENT
      </div>

      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          transform: `scale(${CARD_SCALE})`,
          transformOrigin: "0 0",
        }}
      >
        <RequirementCard card={CARD} left={0} top={0} records={RECORDS} attached={0} appear={appear} />
      </div>
    </>
  );
};
