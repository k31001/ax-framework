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
  // 보조선은 왼쪽에서 오른쪽으로, 위에서 아래로 그려진다.
  // 카드가 만들어진 뒤에는 변 위의 부분이 지워지고 모서리 바깥의 짧은 표시만 남는다.
  const x0 = x - reach;
  const x1 = x + w + reach;
  const y0 = y - reach;
  const y1 = y + h + reach;
  const headX = lerp(x0, x1, guides);
  const headY = lerp(y0, y1, guides);
  const cutX = (w / 2 + 6) * settle; // 가운데에서 양쪽으로 지워지는 길이
  const cutY = (h / 2 + 6) * settle;
  const cx = x + w / 2;
  const cy = y + h / 2;

  return (
    <>
      <svg {...fullSvg}>
        <g stroke={color.lineStrong} strokeWidth={stroke.hair} opacity={lerp(1, 0.8, settle)}>
          {[y, y + h].map((gy) => (
            <React.Fragment key={gy}>
              <line x1={x0} x2={Math.min(headX, cx - cutX)} y1={gy} y2={gy} />
              {headX > cx + cutX ? <line x1={cx + cutX} x2={headX} y1={gy} y2={gy} /> : null}
            </React.Fragment>
          ))}
          {[x, x + w].map((gx) => (
            <React.Fragment key={gx}>
              <line x1={gx} x2={gx} y1={y0} y2={Math.min(headY, cy - cutY)} />
              {headY > cy + cutY ? <line x1={gx} x2={gx} y1={cy + cutY} y2={headY} /> : null}
            </React.Fragment>
          ))}
        </g>
      </svg>

      <div
        style={{
          position: "absolute",
          left: x,
          top: y - 36,
          ...mono(size.label, 700),
          color: color.agent,
          opacity: appear,
        }}
      >
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
