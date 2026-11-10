import type { FC } from "react";
import { S6 } from "../../shared/content";
import { Frame } from "../components/Frame";
import { HRule } from "../components/Rule";
import { ShiftPair, ShiftRow } from "../components/ShiftRow";
import {
  COLOR,
  GRID,
  RULE,
  SIZE,
  WEIGHT,
  colSpan,
  colX,
  sans,
  topForBaseline,
} from "../theme";

const ROWS_TOP = GRID.top + RULE.heavy;

// S6 5대 전환. 시선의 첫 자리는 왼쪽의 큰 "5"이고, 거기서 오른쪽 다섯 줄의 굵은 글자로 넘어간다.
// 움직임: 굵은 괘선이 그어지고 "5"가 왼쪽에서 밀고 들어와 멈춘다 → 가는 괘선 다섯 개가 차례로 그어진다
//        → 줄마다 "현재"가 올라오고, 화살표가 꺾이며 "전환 후"가 가림막 뒤에서 올라온다.
export const S6Scene: FC = () => {
  // "5대 전환"을 숫자, 단위, 낱말로 나눠 크기만 달리한다. 문구는 그대로다.
  const match = /^(\d+)(\S*)\s+(.+)$/.exec(S6.title);
  const digit = match ? match[1] : "";
  const unit = match ? match[2] : "";
  const word = match ? match[3] : S6.title;

  const rowsX = colX(4);
  const rowH = (GRID.bottom - ROWS_TOP) / S6.rows.length;
  const digitBaseline = 548;

  return (
    <Frame>
      <HRule
        x={GRID.left}
        y={GRID.top}
        length={GRID.width}
        weight={RULE.heavy}
      />

      {/* 제목: 큰 숫자 + 단위, 그 아래 낱말 */}
      <div
        style={{
          position: "absolute",
          left: GRID.left - 31,
          top: topForBaseline(digitBaseline, SIZE.giant),
          color: COLOR.vermilion,
          ...sans(SIZE.giant, WEIGHT.black, { lineHeight: 1 }),
        }}
      >
        {digit}
      </div>
      <div
        style={{
          position: "absolute",
          left: GRID.left + 338,
          top: topForBaseline(digitBaseline - 12, 180),
          ...sans(180, WEIGHT.black, { lineHeight: 1 }),
        }}
      >
        {unit}
      </div>
      <div
        style={{
          position: "absolute",
          left: GRID.left - 3,
          top: 574,
          whiteSpace: "nowrap",
          ...sans(270, WEIGHT.black, { lineHeight: 1 }),
        }}
      >
        {word}
      </div>

      {/* 읽는 법: 가벼운 윗줄이 "현재", 굵은 아랫줄이 "전환 후" */}
      <ShiftPair
        before={S6.columns.before}
        after={S6.columns.after}
        x={GRID.left}
        y={892}
        scale={0.78}
      />

      {/* 다섯 줄 */}
      {S6.rows.map((row, i) => {
        const top = ROWS_TOP + rowH * i;
        return (
          <div key={row.axis}>
            {i > 0 ? (
              <HRule x={rowsX} y={top} length={GRID.right - rowsX} />
            ) : null}
            <ShiftRow
              number={i + 1}
              axis={row.axis}
              before={row.before}
              after={row.after}
              x={rowsX}
              y={top + 30}
              labelWidth={colSpan(2) + GRID.gutter}
            />
          </div>
        );
      })}
    </Frame>
  );
};
