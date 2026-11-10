import type { FC } from "react";
import {
  COLOR,
  METRIC,
  RULE,
  SIZE,
  WEIGHT,
  pad2,
  sans,
  topForBaseline,
} from "../theme";

type StageTitleProps = {
  /** 단계 번호(1부터) */
  number: number;
  title: string;
  /** 전환 전의 방식. 흐름도가 나오면 흐려진 채 제목 아래에 남는다. */
  before: { label: string; text: string };
  x: number;
  /** 큰 번호의 머리 높이(y) */
  top: number;
};

// 사례 구간의 단계 제목. 큰 번호가 두 줄(제목, 전환 전 한 줄)의 높이를 차지한다.
// 영상에서는 번호가 가림막 뒤에서 올라오고, "현재" 줄이 먹색으로 나왔다가 흐려진다.
export const StageTitle: FC<StageTitleProps> = ({
  number,
  title,
  before,
  x,
  top,
}) => {
  const capHeight = METRIC.cap * SIZE.numeral;
  const baseline = top + capHeight;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x - 8,
          top: topForBaseline(baseline, SIZE.numeral),
          ...sans(SIZE.numeral, WEIGHT.thin, { lineHeight: 1 }),
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {pad2(number)}
      </div>
      <div
        style={{
          position: "absolute",
          left: x + 236,
          top: top - 10,
          whiteSpace: "nowrap",
          ...sans(SIZE.title, WEIGHT.black, { lineHeight: 1 }),
        }}
      >
        {title}
      </div>
      <div
        style={{
          position: "absolute",
          left: x + 240,
          top: baseline - 38,
          display: "flex",
          alignItems: "center",
          gap: 14,
          whiteSpace: "nowrap",
          color: COLOR.inkFaint,
        }}
      >
        <span
          style={{
            padding: "1px 9px 2px",
            border: `${RULE.hair}px solid ${COLOR.inkFaint}`,
            ...sans(SIZE.note, WEIGHT.bold, { lineHeight: 1.15 }),
          }}
        >
          {before.label}
        </span>
        <span style={sans(SIZE.note, WEIGHT.medium, { lineHeight: 1.15 })}>
          {before.text}
        </span>
      </div>
    </>
  );
};
