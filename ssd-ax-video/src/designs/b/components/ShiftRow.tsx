import type { FC } from "react";
import { COLOR, SIZE, WEIGHT, pad2, sans, topForBaseline } from "../theme";
import { ArrowElbow } from "./Arrow";

export const SHIFT = {
  before: 40, // "현재" 줄의 글자 크기
  after: SIZE.title, // "전환 후" 줄의 글자 크기
  arrow: 50, // 꺾인 화살표의 너비
  indent: 72, // "전환 후" 줄의 들여쓰기
} as const;

// "현재 → 전환 후" 한 쌍. 가볍고 흐린 윗줄에서 꺾여 내려와 굵고 큰 아랫줄이 된다.
// 영상에서는 윗줄이 먼저 올라오고, 화살표가 꺾여 그어진 뒤 아랫줄이 가림막 뒤에서 올라온다.
export const ShiftPair: FC<{
  before: string;
  after: string;
  x: number;
  y: number;
  /** 글자 크기 배율. 범례처럼 작게 쓸 때 줄인다. */
  scale?: number;
}> = ({ before, after, x, y, scale = 1 }) => (
  <div style={{ position: "absolute", left: x, top: y, whiteSpace: "nowrap" }}>
    <div
      style={{
        color: COLOR.inkSoft,
        ...sans(SHIFT.before * scale, WEIGHT.light, { lineHeight: 1 }),
      }}
    >
      {before}
    </div>
    <div
      style={{
        marginTop: 14 * scale,
        display: "flex",
        alignItems: "flex-start",
      }}
    >
      <div style={{ width: SHIFT.indent * scale, paddingLeft: 3 }}>
        <ArrowElbow
          width={SHIFT.arrow * scale}
          height={SHIFT.after * scale * 0.72}
          weight={6 * Math.sqrt(scale)}
        />
      </div>
      <div style={sans(SHIFT.after * scale, WEIGHT.black, { lineHeight: 1 })}>
        {after}
      </div>
    </div>
  </div>
);

type ShiftRowProps = {
  /** 순번(1부터) */
  number: number;
  axis: string;
  before: string;
  after: string;
  x: number;
  y: number;
  /** 축 이름 단의 너비. 그 오른쪽에서 "현재 → 전환 후"가 시작한다. */
  labelWidth: number;
};

// 전환 한 줄: 왼쪽에 번호와 축 이름, 오른쪽에 "현재 → 전환 후".
export const ShiftRow: FC<ShiftRowProps> = ({
  number,
  axis,
  before,
  after,
  x,
  y,
  labelWidth,
}) => (
  <>
    <div
      style={{
        position: "absolute",
        left: x - 4,
        top: topForBaseline(y + 62, 88),
        ...sans(88, WEIGHT.thin, { lineHeight: 1 }),
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {pad2(number)}
    </div>
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + 78,
        whiteSpace: "nowrap",
        ...sans(SIZE.body + 4, WEIGHT.heavy, { lineHeight: 1 }),
      }}
    >
      {axis}
    </div>
    <ShiftPair before={before} after={after} x={x + labelWidth} y={y} />
  </>
);
