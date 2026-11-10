import type { FC } from "react";
import { S3 } from "../../shared/content";
import { Frame } from "../components/Frame";
import { HRule } from "../components/Rule";
import { StepLadder } from "../components/StepLadder";
import { COLOR, GRID, RULE, SIZE, WEIGHT, colX, sans } from "../theme";

// S3 전환 선언. 시선의 첫 자리는 지면 폭을 꽉 채운 한 줄 제목이다.
// 움직임: 도입 문구가 올라오고 흐려진다 → 굵은 괘선이 그어진다 → 제목이 가림막 뒤에서 올라온다
//        → 계단 세 단이 아래에서 차례로 밀고 올라와 멈춘다 → "현재" 꼬리표가 첫 단에 붙는다.
export const S3Scene: FC = () => {
  // "AI 중심 재설계"의 마지막 낱말만 강조색으로 쓴다. 문구는 그대로다.
  const cut = S3.headline.lastIndexOf(" ");
  const head = S3.headline.slice(0, cut);
  const tail = S3.headline.slice(cut + 1);

  return (
    <Frame>
      <HRule
        x={GRID.left}
        y={GRID.top}
        length={GRID.width}
        weight={RULE.heavy}
      />

      {/* 도입 문구: 이미 지나간 말이므로 가볍고 흐리게 */}
      <div
        style={{
          position: "absolute",
          left: GRID.left,
          top: 104,
          ...sans(SIZE.lead, WEIGHT.light, { lineHeight: 1 }),
          color: COLOR.inkSoft,
        }}
      >
        {S3.lead}
      </div>

      {/* 핵심 문구: 12단 전체 폭 */}
      <div
        style={{
          position: "absolute",
          left: GRID.left - 6,
          top: 172,
          whiteSpace: "nowrap",
          ...sans(SIZE.hero, WEIGHT.black, { lineHeight: 1 }),
        }}
      >
        {head} <span style={{ color: COLOR.vermilion }}>{tail}</span>
      </div>

      <StepLadder
        labels={S3.ladder}
        tones={["outline", "teal", "vermilion"]}
        nowIndex={0}
        nowLabel={S3.nowLabel}
        edges={[colX(0), colX(5), colX(9), GRID.right]}
        bottom={GRID.bottom}
        baseHeight={110}
        rise={110}
      />
    </Frame>
  );
};
